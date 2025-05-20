import * as faunadb from 'faunadb';
import {
  Narrative,
  NarrativeContribution,
  NarrativeBranch,
  UserAchievement,
  Notification
} from '../../../types/narrative';

const q = faunadb.query;

// 检查环境变量并输出日志
const faunaSecretKey = process.env.FAUNA_SECRET_KEY;
if (!faunaSecretKey) {
  console.error('FAUNA_SECRET_KEY环境变量未设置或为空！');
}

const client = new faunadb.Client({
  secret: faunaSecretKey || '',
  domain: 'db.fauna.com',
  scheme: 'https',
});

export const collections = {
  narratives: 'narratives',
  contributions: 'contributions',
  branches: 'branches',
  achievements: 'achievements',
  followers: 'followers',
  notifications: 'notifications',
};

export const indexes = {
  narrativesByCreator: 'narratives_by_creator',
  narrativesByTag: 'narratives_by_tag',
  narrativesByPopularity: 'narratives_by_popularity',
  narrativesByTimestamp: 'narratives_by_timestamp',
  contributionsByNarrative: 'contributions_by_narrative', 
  contributionsByContributor: 'contributions_by_contributor',
  branchesByNarrative: 'branches_by_narrative',
  branchesByCreator: 'branches_by_creator',
  achievementsByOwner: 'achievements_by_owner',
  achievementsByType: 'achievements_by_type',
  followersByNarrative: 'followers_by_narrative',
  followersByUser: 'followers_by_user',
  notificationsByUser: 'notifications_by_user',
  notificationsByUserAndReadStatus: 'notifications_by_user_and_read_status',
};

// 创建FaunaDB记录
export async function create(collection: string, data: any): Promise<any> {
  try {
    const result = await client.query(
      q.Create(
        q.Collection(collection),
        { data }
      )
    );
    
    return { 
      id: (result as any).ref.id, 
      ...data 
    };
  } catch (error) {
    console.error(`Error creating record in ${collection}:`, error);
    throw error;
  }
}

// 获取单个记录
export async function get(collection: string, id: string): Promise<any> {
  try {
    const result = await client.query(
      q.Get(
        q.Ref(q.Collection(collection), id)
      )
    );
    
    return { 
      id: (result as any).ref.id, 
      ...(result as any).data 
    };
  } catch (error) {
    if ((error as any).description === 'document not found') {
      return null;
    }
    console.error(`Error getting record from ${collection}:`, error);
    throw error;
  }
}

// 更新记录
export async function update(collection: string, id: string, data: any): Promise<any> {
  try {
    const result = await client.query(
      q.Update(
        q.Ref(q.Collection(collection), id),
        { data }
      )
    );
    
    return { 
      id, 
      ...(result as any).data 
    };
  } catch (error) {
    console.error(`Error updating record in ${collection}:`, error);
    throw error;
  }
}

// 删除记录
export async function remove(collection: string, id: string): Promise<boolean> {
  try {
    await client.query(
      q.Delete(
        q.Ref(q.Collection(collection), id)
      )
    );
    
    return true;
  } catch (error) {
    console.error(`Error deleting record from ${collection}:`, error);
    throw error;
  }
}

// 通过索引查询多条记录
export async function query(index: string, terms: any, options: { limit?: number, after?: string } = {}): Promise<any[]> {
  try {
    let queryExpr = q.Match(q.Index(index), terms);
    
    if (options.after) {
      queryExpr = q.Paginate(queryExpr, { 
        size: options.limit || 20,
        after: [options.after]
      });
    } else {
      queryExpr = q.Paginate(queryExpr, { 
        size: options.limit || 20 
      });
    }
    
    const result = await client.query(
      q.Map(
        queryExpr,
        q.Lambda(['ref'], q.Get(q.Var('ref')))
      )
    );
    
    return (result as any).data.map((item: any) => ({
      id: item.ref.id,
      ...item.data
    }));
  } catch (error) {
    console.error(`Error querying records from ${index}:`, error);
    throw error;
  }
}

// 复合查询：多条件过滤
export async function complexQuery(collection: string, filterFn: any, options: { limit?: number } = {}): Promise<any[]> {
  try {
    const result = await client.query(
      q.Map(
        q.Paginate(
          q.Filter(
            q.Documents(q.Collection(collection)),
            q.Lambda('ref', filterFn(q.Get(q.Var('ref'))))
          ),
          { size: options.limit || 20 }
        ),
        q.Lambda(['ref'], q.Get(q.Var('ref')))
      )
    );
    
    return (result as any).data.map((item: any) => ({
      id: item.ref.id,
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

  try {
    // 首先测试连接
    await client.query(q.Do(true));
    console.log('数据库连接测试成功');
    
    // 检查是否已经设置了集合
    const collectionsExist = await client.query(
      q.Exists(q.Collection(collections.narratives))
    ).catch(() => false);
    
    if (collectionsExist) {
      console.log('数据库结构已存在，跳过初始化');
      return;
    }
    
    console.log('开始创建数据库结构...');
    
    // 创建集合
    for (const collection of Object.values(collections)) {
      try {
        await client.query(q.CreateCollection({ name: collection }));
        console.log(`创建集合成功: ${collection}`);
      } catch (err) {
        // 如果集合已存在则忽略错误
        if ((err as any).description?.includes('already exists')) {
          console.log(`集合已存在: ${collection}`);
        } else {
          throw err;
        }
      }
    }
    
    // 创建索引（一个一个创建以便于定位错误）
    const indexCreationPromises = [
      // 为每个索引创建单独的尝试
      createIndexSafely(indexes.narrativesByCreator, {
        source: q.Collection(collections.narratives),
        terms: [{ field: ['data', 'creatorFid'] }]
      }),
      
      createIndexSafely(indexes.narrativesByTag, {
        source: q.Collection(collections.narratives),
        terms: [{ field: ['data', 'tags'] }]
      }),
      
      createIndexSafely(indexes.narrativesByPopularity, {
        source: q.Collection(collections.narratives),
        values: [
          { field: ['data', 'contributionCount'], reverse: true },
          { field: ['ref'] }
        ]
      }),
      
      createIndexSafely(indexes.narrativesByTimestamp, {
        source: q.Collection(collections.narratives),
        values: [
          { field: ['data', 'updatedAt'], reverse: true },
          { field: ['ref'] }
        ]
      }),
      
      // 添加回其余索引
      createIndexSafely(indexes.contributionsByNarrative, {
        source: q.Collection(collections.contributions),
        terms: [{ field: ['data', 'narrativeId'] }]
      }),
      
      createIndexSafely(indexes.contributionsByContributor, {
        source: q.Collection(collections.contributions),
        terms: [{ field: ['data', 'contributorFid'] }]
      }),
      
      createIndexSafely(indexes.branchesByNarrative, {
        source: q.Collection(collections.branches),
        terms: [{ field: ['data', 'narrativeId'] }]
      }),
      
      createIndexSafely(indexes.branchesByCreator, {
        source: q.Collection(collections.branches),
        terms: [{ field: ['data', 'creatorFid'] }]
      }),
      
      createIndexSafely(indexes.achievementsByOwner, {
        source: q.Collection(collections.achievements),
        terms: [{ field: ['data', 'ownerFid'] }]
      }),
      
      createIndexSafely(indexes.achievementsByType, {
        source: q.Collection(collections.achievements),
        terms: [
          { field: ['data', 'ownerFid'] },
          { field: ['data', 'type'] }
        ]
      }),
      
      createIndexSafely(indexes.followersByNarrative, {
        source: q.Collection(collections.followers),
        terms: [{ field: ['data', 'narrativeId'] }]
      }),
      
      createIndexSafely(indexes.followersByUser, {
        source: q.Collection(collections.followers),
        terms: [{ field: ['data', 'userFid'] }]
      }),
      
      createIndexSafely(indexes.notificationsByUser, {
        source: q.Collection(collections.notifications),
        terms: [{ field: ['data', 'userFid'] }],
        values: [
          { field: ['data', 'createdAt'], reverse: true },
          { field: ['ref'] }
        ]
      }),
      
      createIndexSafely(indexes.notificationsByUserAndReadStatus, {
        source: q.Collection(collections.notifications),
        terms: [
          { field: ['data', 'userFid'] },
          { field: ['data', 'isRead'] }
        ],
        values: [
          { field: ['data', 'createdAt'], reverse: true },
          { field: ['ref'] }
        ]
      })
    ];
    
    await Promise.all(indexCreationPromises);
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化出错:', error);
    throw error;
  }
}

// 安全创建索引的辅助函数
async function createIndexSafely(indexName: string, indexDef: any) {
  try {
    await client.query(q.CreateIndex({
      name: indexName,
      ...indexDef
    }));
    console.log(`创建索引成功: ${indexName}`);
    return true;
  } catch (err) {
    // 如果索引已存在则忽略错误
    if ((err as any).description?.includes('already exists')) {
      console.log(`索引已存在: ${indexName}`);
      return true;
    }
    console.error(`创建索引失败: ${indexName}`, err);
    throw err;
  }
}

export default {
  client,
  q,
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