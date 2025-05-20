import { Handler } from '@netlify/functions';
import * as faunadb from 'faunadb';
import { success, error } from './utils/response';

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
  };

  if (event.httpMethod === 'GET') {
    try {
      // 尝试连接FaunaDB
      const q = faunadb.query;
      const client = new faunadb.Client({
        secret: faunaSecret,
        domain: 'db.fauna.com',
        scheme: 'https',
      });

      // 简单的连接测试
      const result = await client.query(
        q.Do(q.Now())
      ).catch(err => {
        return {
          error: true,
          message: err.message,
          description: err.description,
          httpStatus: err.httpStatus
        };
      });

      return success({
        message: '数据库配置测试',
        environmentInfo,
        connectionTest: {
          success: !result.error,
          result
        }
      });
    } catch (err: any) {
      console.error('测试数据库连接时发生错误:', err);
      return error(`测试数据库连接失败: ${err.message || JSON.stringify(err)}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    return success({});
  }
  
  return error(`不允许使用${event.httpMethod}方法`, 405);
}; 