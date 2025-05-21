import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { success, error } from './utils/response';
import { generateId } from '../../lib/utils';

export const handler: Handler = async (event, context) => {
  // 返回FaunaDB配置信息
  const faunaSecret = process.env.FAUNA_SECRET_KEY || '';
  
  // 检测环境变量
  const environmentInfo = {
    nodeEnv: process.env.NODE_ENV,
    netlifyDev: process.env.NETLIFY_DEV,
    hasFaunaSecret: !!faunaSecret,
    faunaSecretLength: faunaSecret.length,
    maskedFaunaSecret: faunaSecret ? 
      faunaSecret.substring(0, 4) + '...' + faunaSecret.substring(faunaSecret.length - 4) : 
      '',
    netlifyEnvironment: process.env.CONTEXT || '未知',
    isProduction: process.env.CONTEXT === 'production',
    functionName: context.functionName,
    allEnvKeys: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')),
    functionPath: event.path,
    functionMethod: event.httpMethod,
    functionParams: event.queryStringParameters,
    netlifyHeaders: Object.keys(event.headers)
  };

  if (event.httpMethod === 'GET') {
    try {
      // 尝试连接FaunaDB
      console.log('🔄 正在初始化Fauna客户端...');
      const client = new Client({
        secret: faunaSecret
      });

      // 简单的连接测试
      console.log('🔄 正在测试Fauna连接...');
      let result;
      try {
        result = await client.query(
          fql`Time.now()`
        );
        console.log('✅ Fauna查询成功，返回结果:', JSON.stringify(result));
      } catch (queryErr: any) {
        console.error('❌ Fauna查询失败:', JSON.stringify(queryErr));
        const errorDetails = {
          message: queryErr.message,
          description: queryErr.description,
          status: queryErr.httpStatus,
          name: queryErr.name,
          code: queryErr.requestResult?.statusCode,
          responseContent: queryErr.requestResult?.responseContent,
          stack: queryErr.stack
        };
        return error(`Fauna查询失败: ${JSON.stringify(errorDetails)}`);
      }
      
      // 列出集合中的数据
      if (event.queryStringParameters?.action === 'list-data') {
        try {
          const collection = event.queryStringParameters?.collection || 'narratives';
          console.log(`🔄 正在列出集合数据: ${collection}`);
          
          const data = await client.query(
            fql`
              Collection.byName(${collection}).all().map(doc => {
                { id: doc.id, ...doc }
              })
            `
          ).catch(err => {
            console.error(`❌ 获取集合数据失败 [${collection}]:`, JSON.stringify(err));
            throw err;
          });
          
          console.log(`✅ 成功获取集合数据 [${collection}], 记录数:`, data.data?.length || 0);
          
          return success({
            message: `数据库内容 - ${collection}`,
            environmentInfo,
            connectionTest: {
              success: true,
              result
            },
            collectionData: {
              collection,
              count: data.data ? data.data.length : 0,
              items: data.data || []
            }
          });
        } catch (listErr: any) {
          console.error('❌ 获取集合数据失败:', JSON.stringify(listErr));
          return error(`获取集合数据失败: ${listErr.message || JSON.stringify(listErr)}`);
        }
      }

      // 测试索引
      if (event.queryStringParameters?.action === 'test-index') {
        try {
          const indexName = event.queryStringParameters?.index || 'narratives_by_timestamp';
          console.log(`🔄 正在测试索引: ${indexName}`);
          
          const indexResult = await client.query(
            fql`
              Index.byName(${indexName})
                .first(5)
                .all()
            `
          ).catch(err => {
            console.error(`❌ 测试索引失败 [${indexName}]:`, JSON.stringify(err));
            throw err;
          });
          
          console.log(`✅ 成功测试索引 [${indexName}], 记录数:`, indexResult.data?.length || 0);
          
          return success({
            message: `索引测试 - ${indexName}`,
            environmentInfo,
            indexTest: {
              success: true,
              indexName,
              count: indexResult.data?.length || 0,
              items: indexResult.data || []
            }
          });
        } catch (indexErr: any) {
          console.error('❌ 测试索引失败:', JSON.stringify(indexErr));
          return error(`测试索引失败: ${indexErr.message || JSON.stringify(indexErr)}`);
        }
      }

      return success({
        message: '数据库配置测试',
        environmentInfo,
        connectionTest: {
          success: true,
          result
        }
      });
    } catch (err: any) {
      console.error('❌ 测试数据库连接时发生错误:', JSON.stringify(err));
      return error(`测试数据库连接失败: ${err.message || JSON.stringify(err)}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    return success({});
  }
  
  return error(`不允许使用${event.httpMethod}方法`, 405);
}; 