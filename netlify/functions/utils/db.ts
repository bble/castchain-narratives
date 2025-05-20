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

// 检查环境变量并输出日志
const faunaSecretKey = process.env.FAUNA_SECRET_KEY;
if (!faunaSecretKey) {
  logError('FAUNA_SECRET_KEY环境变量未设置或为空！');
}

// 创建新的Fauna v10客户端
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

// 创建记录
export async function create(collection: string, data: any): Promise<any> {
  return retry(async () => {
    try {
      const result = await client.query(
        fql`Collection(${collection}).create(${data})`
      );
      
      const createdData = { 
        id: result.data.id, 
        ...data 
      };
      
      // 添加到缓存
      const cacheKey = `${collection}:${createdData.id}`;
      cache.set(cacheKey, createdData);
      
      // 清除查询缓存，因为创建可能影响查询结果
      cache.clear();
      
      return createdData;
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
        fql`Collection(${collection}).byId(${id})`
      );
      
      if (!result.data) {
        return null;
      }
      
      const data = { 
        id: result.data.id, 
        ...result.data 
      };
      
      // 缓存结果
      cache.set(cacheKey, data);
      
      return data;
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
        fql`Collection(${collection}).byId(${id})!.update(${data})`
      );
      
      const updatedData = { 
        id, 
        ...result.data 
      };
      
      // 更新缓存
      const cacheKey = `${collection}:${id}`;
      cache.set(cacheKey, updatedData);
      
      // 清除可能受影响的查询缓存
      // 简单方法：清除所有以query:开头的缓存
      cache.clear(); // 简单起见，清除所有缓存
      
      return updatedData;
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
        fql`Collection(${collection}).byId(${id})!.delete()`
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
export async function query(indexName: string, terms: any[] = [], options: { limit?: number } = {}) {
  const limit = options.limit || 10;
  
  // 生成缓存键
  const termsString = terms.join(',');
  const optionsString = JSON.stringify(options);
  const cacheKey = `query:${indexName}:${termsString}:${optionsString}`;
  
  // 尝试从缓存获取
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    logInfo(`从缓存获取查询结果: ${cacheKey}`);
    return cachedData;
  }
  
  return retry(async () => {
    try {
      logInfo(`执行索引查询: ${indexName}，条件:`, terms, '，选项:', options);
      
      const result = await client.query(
        fql`
          let index = Index.byName(${indexName})
          let docs = if (${terms.length > 0}) {
            index.first(${limit}).where(doc => Match.and([${terms.map(t => `doc.${t}`)}]))
          } else {
            index.first(${limit})
          }
          docs.map(doc => {
            doc
          })
        `
      );
      
      logInfo(`查询结果数量: ${result.data ? result.data.length : 0}`);
      
      // 缓存结果 - 通常查询结果缓存时间较短
      cache.set(cacheKey, result.data, 30 * 1000); // 30秒缓存
      
      return result.data;
    } catch (err) {
      logError(`执行索引查询失败: ${indexName}`, err);
      throw err;
    }
  }, DB_RETRY_ATTEMPTS, DB_RETRY_DELAY, `索引查询[${indexName}]`);
}

// 复合查询：多条件过滤
export async function complexQuery(collection: string, filterFn: any, options: { limit?: number } = {}): Promise<any[]> {
  try {
    // 在FQL v10中，我们可以直接使用where条件进行过滤
    const fqlQuery = fql`
      Collection.byName(${collection})
        .where(${filterFn})
        .order(.ts, "desc")
        .pageSize(${options.limit || 20})
        { data }
    `;
    
    const result = await client.query(fqlQuery);
    
    if (!result.data || !Array.isArray(result.data)) {
      return [];
    }
    
    return result.data.map((item: any) => ({
      id: item.id,
      ...item.data
    }));
  } catch (error) {
    console.error(`Error performing complex query on ${collection}:`, error);
    throw error;
  }
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
      
      // 创建必要的索引
      try {
        // 叙事按创建者索引
        await client.query(fql`
          if (Index.byName("narratives_by_creator") == null) {
            Collection("narratives").createIndex({
              name: "narratives_by_creator",
              terms: [{ field: "creatorFid" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: narratives_by_creator');
        
        // 叙事按标签索引
        await client.query(fql`
          if (Index.byName("narratives_by_tag") == null) {
            Collection("narratives").createIndex({
              name: "narratives_by_tag",
              terms: [{ field: "tags" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: narratives_by_tag');
        
        // 叙事按流行度索引
        await client.query(fql`
          if (Index.byName("narratives_by_popularity") == null) {
            Collection("narratives").createIndex({
              name: "narratives_by_popularity",
              values: [
                { field: "contributionCount", reverse: true },
                { field: "id" }
              ]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: narratives_by_popularity');
        
        // 叙事按时间戳索引
        await client.query(fql`
          if (Index.byName("narratives_by_timestamp") == null) {
            Collection("narratives").createIndex({
              name: "narratives_by_timestamp",
              values: [
                { field: "updatedAt", reverse: true },
                { field: "id" }
              ]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: narratives_by_timestamp');
        
        // 贡献按叙事ID索引
        await client.query(fql`
          if (Index.byName("contributions_by_narrative") == null) {
            Collection("contributions").createIndex({
              name: "contributions_by_narrative",
              terms: [{ field: "narrativeId" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: contributions_by_narrative');
        
        // 贡献按贡献者索引
        await client.query(fql`
          if (Index.byName("contributions_by_contributor") == null) {
            Collection("contributions").createIndex({
              name: "contributions_by_contributor",
              terms: [{ field: "contributorFid" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: contributions_by_contributor');
        
        // 分支按叙事索引
        await client.query(fql`
          if (Index.byName("branches_by_narrative") == null) {
            Collection("branches").createIndex({
              name: "branches_by_narrative",
              terms: [{ field: "narrativeId" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: branches_by_narrative');
        
        // 分支按父分支索引
        await client.query(fql`
          if (Index.byName("branches_by_branch_parent") == null) {
            Collection("branches").createIndex({
              name: "branches_by_branch_parent",
              terms: [{ field: "parentBranchId" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: branches_by_branch_parent');
        
        // 成就按用户索引
        await client.query(fql`
          if (Index.byName("achievements_by_user") == null) {
            Collection("achievements").createIndex({
              name: "achievements_by_user",
              terms: [{ field: "userFid" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: achievements_by_user');
        
        // 关注者按叙事索引
        await client.query(fql`
          if (Index.byName("followers_by_narrative") == null) {
            Collection("followers").createIndex({
              name: "followers_by_narrative",
              terms: [{ field: "narrativeId" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: followers_by_narrative');
        
        // 关注者按用户索引
        await client.query(fql`
          if (Index.byName("followers_by_user") == null) {
            Collection("followers").createIndex({
              name: "followers_by_user",
              terms: [{ field: "userFid" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: followers_by_user');
        
        // 通知按用户索引
        await client.query(fql`
          if (Index.byName("notifications_by_user") == null) {
            Collection("notifications").createIndex({
              name: "notifications_by_user",
              terms: [{ field: "userFid" }]
            })
          } else {
            null
          }
        `);
        logInfo('确保索引存在: notifications_by_user');
        
        logInfo('数据库初始化完成');
        return true;
      } catch (err) {
        logError('创建索引失败:', err);
        throw err;
      }
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