import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { success, error } from './utils/response';

// 手动创建集合和索引的函数
export const handler: Handler = async (event, context) => {
  const faunaSecret = process.env.FAUNA_SECRET_KEY || '';
  
  // 检测环境变量
  const environmentInfo = {
    hasFaunaSecret: !!faunaSecret,
    faunaSecretLength: faunaSecret.length,
    maskedFaunaSecret: faunaSecret ? 
      faunaSecret.substring(0, 4) + '...' + faunaSecret.substring(faunaSecret.length - 4) : 
      '',
    netlifyEnvironment: process.env.CONTEXT || '未知',
    isProduction: process.env.CONTEXT === 'production'
  };

  if (event.httpMethod === 'GET') {
    try {
      // 尝试连接FaunaDB
      console.log('🔄 正在初始化Fauna客户端...');
      const client = new Client({
        secret: faunaSecret
      });

      // 测试连接
      try {
        await client.query(fql`"测试连接成功"`);
        console.log('✅ 连接测试成功');
      } catch (connErr: any) {
        console.error('❌ 连接测试失败:', connErr);
        return error(`连接测试失败: ${connErr.message || JSON.stringify(connErr)}`);
      }
      
      // 集合列表
      const collections = [
        'narratives',
        'contributions',
        'branches',
        'achievements',
        'followers',
        'notifications'
      ];
      
      // 创建所有集合
      const collectionsResult = [];
      for (const collection of collections) {
        try {
          console.log(`🔄 正在创建/检查集合: ${collection}`);
          const result = await client.query(
            fql`
              if (Collection.byName(${collection}) == null) {
                Collection.create({ name: ${collection} })
              } else {
                { "exists": true, "name": ${collection} }
              }
            `
          );
          collectionsResult.push({
            name: collection,
            result: result.data
          });
          console.log(`✅ 集合 ${collection} 检查/创建成功`);
        } catch (collErr: any) {
          console.error(`❌ 创建集合 ${collection} 失败:`, collErr);
          return error(`创建集合 ${collection} 失败: ${collErr.message || JSON.stringify(collErr)}`);
        }
      }
      
      // 索引列表
      const indexes = [
        {
          name: 'narratives_by_creator',
          collection: 'narratives',
          terms: [{ field: ['data', 'creatorFid'] }]
        },
        {
          name: 'narratives_by_tag',
          collection: 'narratives',
          terms: [{ field: ['data', 'tags'] }]
        },
        {
          name: 'narratives_by_popularity',
          collection: 'narratives',
          values: [
            { field: ['data', 'contributionCount'], reverse: true },
            { field: ['ref'] }
          ]
        },
        {
          name: 'narratives_by_timestamp',
          collection: 'narratives',
          values: [
            { field: ['data', 'updatedAt'], reverse: true },
            { field: ['ref'] }
          ]
        },
        {
          name: 'contributions_by_narrative',
          collection: 'contributions',
          terms: [{ field: ['data', 'narrativeId'] }]
        },
        {
          name: 'contributions_by_contributor',
          collection: 'contributions',
          terms: [{ field: ['data', 'contributorFid'] }]
        },
        {
          name: 'branches_by_narrative',
          collection: 'branches',
          terms: [{ field: ['data', 'narrativeId'] }]
        },
        {
          name: 'branches_by_branch_parent',
          collection: 'branches',
          terms: [{ field: ['data', 'parentBranchId'] }]
        },
        {
          name: 'achievements_by_user',
          collection: 'achievements',
          terms: [{ field: ['data', 'userFid'] }]
        },
        {
          name: 'followers_by_narrative',
          collection: 'followers',
          terms: [{ field: ['data', 'narrativeId'] }]
        },
        {
          name: 'followers_by_user',
          collection: 'followers',
          terms: [{ field: ['data', 'userFid'] }]
        },
        {
          name: 'notifications_by_user',
          collection: 'notifications',
          terms: [{ field: ['data', 'userFid'] }]
        }
      ];
      
      // 创建所有索引
      const indexesResult = [];
      for (const index of indexes) {
        try {
          console.log(`🔄 正在检查索引: ${index.name}`);
          
          // 查询索引是否存在
          const exists = await client.query(
            fql`
              Index.byName(${index.name}) != null
            `
          );
          
          if (!exists.data) {
            // 索引不存在，创建它
            console.log(`🔄 正在创建索引: ${index.name}`);
            let createResult;
            
            try {
              // 为不同类型的索引创建不同的查询
              if (index.terms) {
                createResult = await client.query(
                  fql`
                    Index.create({
                      name: ${index.name},
                      source: Collection.byName(${index.collection}),
                      terms: ${index.terms}
                    })
                  `
                );
              } else if (index.values) {
                createResult = await client.query(
                  fql`
                    Index.create({
                      name: ${index.name},
                      source: Collection.byName(${index.collection}),
                      values: ${index.values}
                    })
                  `
                );
              } else {
                // 兜底处理，防止createResult未定义
                createResult = { data: { name: index.name, status: 'unknown type' } as any };
              }
              console.log(`✅ 索引 ${index.name} 创建成功`);
              indexesResult.push({
                name: index.name,
                result: createResult.data,
                status: 'created'
              });
            } catch (createErr) {
              console.error(`❌ 创建索引失败 ${index.name}:`, createErr);
              throw createErr;
            }
          } else {
            // 索引已存在
            console.log(`✅ 索引 ${index.name} 已存在`);
            indexesResult.push({
              name: index.name,
              status: 'exists'
            });
          }
        } catch (indexErr: any) {
          console.error(`❌ 索引操作失败 ${index.name}:`, indexErr);
          return error(`创建索引 ${index.name} 失败: ${indexErr.message || JSON.stringify(indexErr)}`);
        }
      }
      
      return success({
        message: '数据库初始化成功',
        environmentInfo,
        collections: collectionsResult,
        indexes: indexesResult
      });
    } catch (err: any) {
      console.error('❌ 数据库初始化失败:', err);
      return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    return success({});
  }
  
  return error(`不允许使用${event.httpMethod}方法`, 405);
}; 