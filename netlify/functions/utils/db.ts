import { Client, fql } from 'fauna';
import {
  Narrative,
  NarrativeContribution,
  NarrativeBranch,
  UserAchievement,
  Notification
} from '../../../types/narrative';

// 简单的内存缓存实现
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Record<string, CacheEntry<any>> = {};
  private readonly DEFAULT_TTL = 60 * 1000; // 默认缓存60秒

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  get<T>(key: string): T | null {
    const entry = this.cache[key];
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      // 缓存过期
      delete this.cache[key];
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    delete this.cache[key];
  }

  clear(): void {
    this.cache = {};
  }
}

const cache = new MemoryCache();

// 重试配置
const DB_RETRY_ATTEMPTS = 3;
const DB_RETRY_DELAY = 1000; // 毫秒

// 日志函数，确保所有日志都附加时间戳
function logInfo(message: string, ...args: any[]) {
  console.log(`[DB:INFO ${new Date().toISOString()}] ${message}`, ...args);
}

function logError(message: string, ...args: any[]) {
  console.error(`[DB:ERROR ${new Date().toISOString()}] ${message}`, ...args);
}

// 检查环境变量并输出日志
const faunaSecretKey = process.env.FAUNA_SECRET_KEY;
if (!faunaSecretKey) {
  logError('FAUNA_SECRET_KEY环境变量未设置或为空！');
}

// 创建FaunaDB客户端
const client = new Client({
  secret: faunaSecretKey || '',
});

logInfo('FaunaDB客户端已初始化');

// 定义集合名
export const collections: {[key: string]: string} = {
  narratives: 'narratives',
  contributions: 'contributions',
  branches: 'branches',
  achievements: 'achievements',
  followers: 'followers',
  notifications: 'notifications',
};

// 定义索引名
export const indexes = {
  narrativesByCreator: 'narratives_by_creator',
  narrativesByTag: 'narratives_by_tag',
  narrativesByPopularity: 'narratives_by_popularity',
  narrativesByTimestamp: 'narratives_by_timestamp',
  contributionsByNarrative: 'contributions_by_narrative',
  contributionsByContributor: 'contributions_by_contributor',
  branchesByNarrative: 'branches_by_narrative',
  branchesByBranchParent: 'branches_by_branch_parent',
  achievementsByUser: 'achievements_by_user',
  followersByNarrative: 'followers_by_narrative',
  followersByUser: 'followers_by_user',
  notificationsByUser: 'notifications_by_user',
};

/**
 * 规范化实体ID - 确保数据库记录映射到正确的实体ID字段
 * @param collection 集合名称
 * @param record 数据库记录
 * @returns 修正后的记录
 */
function normalizeEntityId(collection: string, record: any): any {
  if (!record) return record;

  // 确保记录有id字段
  if (!record.id) return record;

  const result = { ...record };

  // 根据集合类型映射ID字段
  switch (collection) {
    case collections.narratives:
      if (!result.narrativeId) {
        result.narrativeId = result.id;
      }
      break;
    case collections.contributions:
      if (!result.contributionId) {
        result.contributionId = result.id;
      }
      break;
    case collections.branches:
      if (!result.branchId) {
        result.branchId = result.id;
      }
      break;
    case collections.achievements:
      if (!result.achievementId) {
        result.achievementId = result.id;
      }
      break;
    // 其他集合类型可以在这里添加
  }

  return result;
}

/**
 * 规范化实体ID集合 - 处理数组类型的记录
 * @param collection 集合名称
 * @param records 数据库记录数组
 * @returns 修正后的记录数组
 */
function normalizeEntityIds(collection: string, records: any[]): any[] {
  if (!records || !Array.isArray(records)) return [];
  return records.map(record => normalizeEntityId(collection, record));
}

/**
 * 重试函数 - 用于数据库操作重试
 * @param fn 需要重试的异步函数
 * @param retries 重试次数
 * @param delay 重试延迟（毫秒）
 * @param label 操作标签（用于日志）
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries = DB_RETRY_ATTEMPTS,
  delay = DB_RETRY_DELAY,
  label = 'db操作'
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) {
      logError(`${label}失败，已达到最大重试次数:`, error);
      throw error;
    }

    logInfo(`${label}失败，${retries}次重试剩余，将在${delay}ms后重试`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 1.5, label); // 指数退避
  }
}

// 创建记录
export async function create(collection: string, data: any): Promise<any> {
  return retry(async () => {
    try {
      const result = await client.query(
        fql`Collection.byName(${collection}).create(${data})`
      );

      // 构建返回数据
      const createdData = {
        id: result.data.id,
        ...data
      };

      // 规范化ID字段
      const normalizedData = normalizeEntityId(collection, createdData);

      // 添加到缓存
      const cacheKey = `${collection}:${createdData.id}`;
      cache.set(cacheKey, normalizedData);

      // 清除查询缓存，因为创建可能影响查询结果
      cache.clear();

      return normalizedData;
    } catch (error) {
      logError(`创建记录失败 [${collection}]:`, error);
      throw error;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, `创建记录[${collection}]`);
}

// 获取单个记录
export async function get(collection: string, id: string): Promise<any> {
  // 尝试从缓存获取
  const cacheKey = `${collection}:${id}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    logInfo(`从缓存获取记录: ${cacheKey}`);
    return cachedData;
  }

  return retry(async () => {
    try {
      const result = await client.query(
        fql`Collection.byName(${collection}).byId(${id})`
      );

      if (!result.data) {
        return null;
      }

      // 构建返回数据
      const data = {
        id: result.data.id,
        ...result.data
      };

      // 规范化ID字段
      const normalizedData = normalizeEntityId(collection, data);

      // 缓存结果
      cache.set(cacheKey, normalizedData);

      return normalizedData;
    } catch (error) {
      logError(`获取记录失败 [${collection}:${id}]:`, error);
      throw error;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, `获取记录[${collection}:${id}]`);
}

// 更新记录
export async function update(collection: string, id: string, data: any): Promise<any> {
  return retry(async () => {
    try {
      const result = await client.query(
        fql`Collection.byName(${collection}).byId(${id})!.update(${data})`
      );

      // 构建返回数据
      const updatedData = {
        id,
        ...result.data
      };

      // 规范化ID字段
      const normalizedData = normalizeEntityId(collection, updatedData);

      // 更新缓存
      const cacheKey = `${collection}:${id}`;
      cache.set(cacheKey, normalizedData);

      // 清除可能受影响的查询缓存
      // 简单方法：清除所有以query:开头的缓存
      cache.clear(); // 简单起见，清除所有缓存

      return normalizedData;
    } catch (error) {
      logError(`更新记录失败 [${collection}:${id}]:`, error);
      throw error;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, `更新记录[${collection}:${id}]`);
}

// 删除记录
export async function remove(collection: string, id: string): Promise<boolean> {
  return retry(async () => {
    try {
      await client.query(
        fql`Collection.byName(${collection}).byId(${id})!.delete()`
      );

      // 从缓存中移除
      const cacheKey = `${collection}:${id}`;
      cache.invalidate(cacheKey);

      // 清除可能受影响的查询缓存
      cache.clear(); // 简单起见，清除所有缓存

      return true;
    } catch (error) {
      logError(`删除记录失败 [${collection}:${id}]:`, error);
      throw error;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, `删除记录[${collection}:${id}]`);
}

// 执行索引查询
export async function query(indexName: string, terms: any[] = [], options: { limit?: number } = {}): Promise<any[]> {
  const limit = options.limit || 10;

  // 生成缓存键
  const termsString = terms.join(',');
  const optionsString = JSON.stringify(options);
  const cacheKey = `query:${indexName}:${termsString}:${optionsString}`;

  // 尝试从缓存获取
  const cachedData = cache.get<any[]>(cacheKey);
  if (cachedData) {
    logInfo(`从缓存获取查询结果: ${cacheKey}`);
    return cachedData;
  }

  return retry(async () => {
    try {
      logInfo(`执行索引查询: ${indexName}，条件:`, terms, '，选项:', options);

      // FaunaDB V10索引查询语法
      let fqlQuery;
      if (terms.length > 0) {
        // 如果是单一条件
        if (terms.length === 1) {
          fqlQuery = fql`
            Collection.byName(${indexName.split('_')[0]}).where(.${indexName.split('_by_')[1]} == ${terms[0]}).pageSize(${limit})
          `;
        } else {
          // 多条件查询 - 暂时简化为第一个条件
          fqlQuery = fql`
            Collection.byName(${indexName.split('_')[0]}).where(.${indexName.split('_by_')[1]} == ${terms[0]}).pageSize(${limit})
          `;
        }
      } else {
        // 无条件查询，获取所有记录
        fqlQuery = fql`
          Collection.byName(${indexName.split('_')[0]}).pageSize(${limit})
        `;
      }

      const result = await client.query(fqlQuery);

      // 确保返回数组
      const resultData = Array.isArray(result.data) ? result.data : [];

      // 尝试确定查询的集合类型
      let collectionName = '';
      if (indexName.includes('narratives')) collectionName = collections.narratives;
      else if (indexName.includes('contributions')) collectionName = collections.contributions;
      else if (indexName.includes('branches')) collectionName = collections.branches;
      else if (indexName.includes('achievements')) collectionName = collections.achievements;
      else if (indexName.includes('followers')) collectionName = collections.followers;
      else if (indexName.includes('notifications')) collectionName = collections.notifications;

      // 规范化返回数据中的ID
      const normalizedData = collectionName ?
        normalizeEntityIds(collectionName, resultData) :
        resultData;

      logInfo(`查询结果数量: ${normalizedData.length}`);

      // 缓存结果 - 通常查询结果缓存时间较短
      cache.set(cacheKey, normalizedData, 30 * 1000); // 30秒缓存

      return normalizedData;
    } catch (err) {
      logError(`执行索引查询失败: ${indexName}`, err);
      throw err;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, `索引查询[${indexName}]`);
}

// 复合查询：多条件过滤
export async function complexQuery(collection: string, filterFn: any, options: { limit?: number } = {}): Promise<any[]> {
  // 生成缓存键 - 仅基于集合和限制，因为filterFn可能是函数
  const cacheKey = `complexQuery:${collection}:${options.limit || 20}`;

  // 尝试从缓存获取 - 复杂查询可能缓存命中率低，但仍可提升性能
  const cachedData = cache.get<any[]>(cacheKey);
  if (cachedData) {
    logInfo(`从缓存获取复合查询结果: ${cacheKey}`);
    return cachedData;
  }

  return retry(async () => {
    try {
      // FaunaDB V10复合查询语法
      const fqlQuery = fql`
        Collection.byName(${collection})
          .where(${filterFn})
          .pageSize(${options.limit || 20})
      `;

      logInfo(`执行复合查询: ${collection}`);
      const result = await client.query(fqlQuery);

      if (!result.data) {
        return [];
      }

      // 确保返回数组
      const resultArray = Array.isArray(result.data) ? result.data : [];

      // 处理数据以保持一致的格式
      const data = resultArray.map((item: any) => ({
        id: item.id,
        ...item.data
      }));

      // 规范化ID字段
      const normalizedData = normalizeEntityIds(collection, data);

      // 缓存结果 - 使用较短的缓存时间
      cache.set(cacheKey, normalizedData, 15 * 1000); // 15秒缓存

      return normalizedData;
    } catch (error) {
      logError(`复合查询失败 [${collection}]:`, error);
      throw error;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, `复合查询[${collection}]`);
}

// 初始化数据库
export async function setupDatabase() {
  if (!faunaSecretKey) {
    throw new Error('FAUNA_SECRET_KEY环境变量未设置，无法连接到数据库');
  }

  return retry(async () => {
    try {
      // 首先测试连接
      await client.query(fql`true`);
      logInfo('数据库连接测试成功');

      // 创建所有必要的集合（如果不存在）
      for (const collection of Object.values(collections)) {
        try {
          await client.query(fql`
            if (Collection.byName(${collection}) == null) {
              Collection.create({ name: ${collection} })
            } else {
              null
            }
          `);
          logInfo(`确保集合存在: ${collection}`);
        } catch (err) {
          logError(`创建集合失败: ${collection}`, err);
          throw err;
        }
      }

      // 跳过索引创建，因为索引已在FaunaDB控制台中手动创建
      logInfo('跳过索引创建 - 索引已在FaunaDB控制台中创建');
      return true;
    } catch (error) {
      logError('数据库初始化出错:', error);
      throw error;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, '数据库初始化');
}

export default {
  client,
  create,
  get,
  update,
  remove,
  query,
  complexQuery,
  setupDatabase,
  collections,
  indexes
};