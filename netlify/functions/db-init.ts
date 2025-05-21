import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { success, error } from './utils/response';

// 定义索引类型接口
interface IndexDefinition {
  collection: string;
  name: string;
  terms?: Array<{ field: string }>;
  values?: Array<{ field: string, reverse?: boolean }>;
}

// 数据库初始化函数：创建所有需要的集合和索引
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
      // 初始化Fauna客户端
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
          collectionsResult.push({
            name: collection,
            error: collErr.message || JSON.stringify(collErr)
          });
          // 继续创建其他集合，不中断
        }
      }
      
      // 定义要创建的索引列表
      const indexesToCreate: IndexDefinition[] = [
        // narratives集合的索引
        {
          collection: 'narratives',
          name: 'narratives_by_creator',
          terms: [{ field: 'creatorFid' }]
        },
        {
          collection: 'narratives',
          name: 'narratives_by_tag',
          terms: [{ field: 'tags' }]
        },
        {
          collection: 'narratives',
          name: 'narratives_by_popularity',
          values: [
            { field: 'contributionCount', reverse: true },
            { field: 'id' }
          ]
        },
        {
          collection: 'narratives',
          name: 'narratives_by_timestamp',
          values: [
            { field: 'updatedAt', reverse: true },
            { field: 'id' }
          ]
        },
        
        // contributions集合的索引
        {
          collection: 'contributions',
          name: 'contributions_by_narrative',
          terms: [{ field: 'narrativeId' }]
        },
        {
          collection: 'contributions',
          name: 'contributions_by_contributor',
          terms: [{ field: 'contributorFid' }]
        },
        
        // branches集合的索引
        {
          collection: 'branches',
          name: 'branches_by_narrative',
          terms: [{ field: 'narrativeId' }]
        },
        {
          collection: 'branches',
          name: 'branches_by_branch_parent',
          terms: [{ field: 'parentBranchId' }]
        },
        
        // achievements集合的索引
        {
          collection: 'achievements',
          name: 'achievements_by_user',
          terms: [{ field: 'userFid' }]
        },
        
        // followers集合的索引
        {
          collection: 'followers',
          name: 'followers_by_narrative',
          terms: [{ field: 'narrativeId' }]
        },
        {
          collection: 'followers',
          name: 'followers_by_user',
          terms: [{ field: 'userFid' }]
        },
        
        // notifications集合的索引
        {
          collection: 'notifications',
          name: 'notifications_by_user',
          terms: [{ field: 'userFid' }]
        }
      ];
      
      // 创建所有索引
      const indexResults = [];
      for (const indexDef of indexesToCreate) {
        try {
          console.log(`🔄 正在创建/检查索引: ${indexDef.name}`);
          
          // 检查索引是否存在
          const indexExists = await client.query(
            fql`Index.byName(${indexDef.name}) != null`
          );
          
          if (!indexExists.data) {
            // 索引不存在，创建新索引
            let result;
            if (indexDef.terms && !indexDef.values) {
              // 只有terms的索引
              result = await client.query(
                fql`
                  Collection.byName(${indexDef.collection}).createIndex({
                    name: ${indexDef.name},
                    terms: ${indexDef.terms}
                  })
                `
              );
            } else if (!indexDef.terms && indexDef.values) {
              // 只有values的索引
              result = await client.query(
                fql`
                  Collection.byName(${indexDef.collection}).createIndex({
                    name: ${indexDef.name},
                    values: ${indexDef.values}
                  })
                `
              );
            } else if (indexDef.terms && indexDef.values) {
              // 同时有terms和values的索引
              result = await client.query(
                fql`
                  Collection.byName(${indexDef.collection}).createIndex({
                    name: ${indexDef.name},
                    terms: ${indexDef.terms},
                    values: ${indexDef.values}
                  })
                `
              );
            } else {
              // 最简单的索引
              result = await client.query(
                fql`
                  Collection.byName(${indexDef.collection}).createIndex({
                    name: ${indexDef.name}
                  })
                `
              );
            }
            
            indexResults.push({
              name: indexDef.name,
              collection: indexDef.collection,
              success: true,
              result: result.data
            });
            console.log(`✅ 索引 ${indexDef.name} 创建成功`);
          } else {
            indexResults.push({
              name: indexDef.name,
              collection: indexDef.collection,
              success: true,
              result: "索引已存在"
            });
            console.log(`✅ 索引 ${indexDef.name} 已存在`);
          }
        } catch (indexErr: any) {
          console.error(`❌ 创建索引 ${indexDef.name} 失败:`, indexErr);
          indexResults.push({
            name: indexDef.name,
            collection: indexDef.collection,
            success: false,
            error: indexErr.message || JSON.stringify(indexErr)
          });
          // 继续创建其他索引，不中断
        }
      }
      
      // 创建FQL脚本供用户直接在FaunaDB控制台运行
      const fqlScript = `
// 创建集合
${collections.map(c => `Collection.create({ name: "${c}" })`).join('\n')}

// 创建索引
${indexesToCreate.map(idx => {
  if (idx.terms && !idx.values) {
    return `Collection.byName("${idx.collection}").createIndex({
  name: "${idx.name}",
  terms: ${JSON.stringify(idx.terms)}
})`;
  } else if (!idx.terms && idx.values) {
    return `Collection.byName("${idx.collection}").createIndex({
  name: "${idx.name}",
  values: ${JSON.stringify(idx.values)}
})`;
  } else if (idx.terms && idx.values) {
    return `Collection.byName("${idx.collection}").createIndex({
  name: "${idx.name}",
  terms: ${JSON.stringify(idx.terms)},
  values: ${JSON.stringify(idx.values)}
})`;
  } else {
    return `Collection.byName("${idx.collection}").createIndex({
  name: "${idx.name}"
})`;
  }
}).join('\n\n')}
      `;
      
      return success({
        message: '数据库初始化完成',
        environmentInfo,
        collections: collectionsResult,
        indexes: indexResults,
        manualFQLScript: fqlScript
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