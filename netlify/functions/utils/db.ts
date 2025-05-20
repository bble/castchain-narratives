import * as faunadb from 'faunadb';
import {
  Narrative,
  NarrativeContribution,
  NarrativeBranch,
  UserAchievement,
  Notification
} from '../../../types/narrative';

const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY || '',
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
  try {
    // 检查是否已经设置了集合
    const collectionsExist = await client.query(
      q.Exists(q.Collection(collections.narratives))
    ).catch(() => false);
    
    if (collectionsExist) {
      console.log('Database already setup');
      return;
    }
    
    // 创建集合
    await Promise.all(Object.values(collections).map(collection => 
      client.query(q.CreateCollection({ name: collection }))
    ));
    
    // 创建索引
    await Promise.all([
      client.query(q.CreateIndex({
        name: indexes.narrativesByCreator,
        source: q.Collection(collections.narratives),
        terms: [{ field: ['data', 'creatorFid'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.narrativesByTag,
        source: q.Collection(collections.narratives),
        terms: [{ field: ['data', 'tags'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.narrativesByPopularity,
        source: q.Collection(collections.narratives),
        values: [
          { field: ['data', 'contributionCount'], reverse: true },
          { field: ['ref'] }
        ]
      })),
      client.query(q.CreateIndex({
        name: indexes.narrativesByTimestamp,
        source: q.Collection(collections.narratives),
        values: [
          { field: ['data', 'updatedAt'], reverse: true },
          { field: ['ref'] }
        ]
      })),
      client.query(q.CreateIndex({
        name: indexes.contributionsByNarrative,
        source: q.Collection(collections.contributions),
        terms: [{ field: ['data', 'narrativeId'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.contributionsByContributor,
        source: q.Collection(collections.contributions),
        terms: [{ field: ['data', 'contributorFid'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.branchesByNarrative,
        source: q.Collection(collections.branches),
        terms: [{ field: ['data', 'narrativeId'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.branchesByCreator,
        source: q.Collection(collections.branches),
        terms: [{ field: ['data', 'creatorFid'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.achievementsByOwner,
        source: q.Collection(collections.achievements),
        terms: [{ field: ['data', 'ownerFid'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.achievementsByType,
        source: q.Collection(collections.achievements),
        terms: [
          { field: ['data', 'ownerFid'] },
          { field: ['data', 'type'] }
        ]
      })),
      client.query(q.CreateIndex({
        name: indexes.followersByNarrative,
        source: q.Collection(collections.followers),
        terms: [{ field: ['data', 'narrativeId'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.followersByUser,
        source: q.Collection(collections.followers),
        terms: [{ field: ['data', 'userFid'] }]
      })),
      client.query(q.CreateIndex({
        name: indexes.notificationsByUser,
        source: q.Collection(collections.notifications),
        terms: [{ field: ['data', 'userFid'] }],
        values: [
          { field: ['data', 'createdAt'], reverse: true },
          { field: ['ref'] }
        ]
      })),
      client.query(q.CreateIndex({
        name: indexes.notificationsByUserAndReadStatus,
        source: q.Collection(collections.notifications),
        terms: [
          { field: ['data', 'userFid'] },
          { field: ['data', 'isRead'] }
        ],
        values: [
          { field: ['data', 'createdAt'], reverse: true },
          { field: ['ref'] }
        ]
      }))
    ]);
    
    console.log('Database setup complete');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
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