import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { success, error } from './utils/response';

// 纯v10 API数据库测试
export const handler: Handler = async (event, context) => {
  // 返回FaunaDB配置信息
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

      // 简单的连接测试
      console.log('🔄 正在测试Fauna v10连接...');
      let result;
      try {
        result = await client.query(
          fql`"测试Fauna v10 API连接成功"`
        );
        console.log('✅ Fauna v10查询成功，返回结果:', JSON.stringify(result));
      } catch (queryErr: any) {
        console.error('❌ Fauna v10查询失败:', JSON.stringify(queryErr));
        const errorDetails = {
          message: queryErr.message,
          description: queryErr.description,
          status: queryErr.httpStatus,
          name: queryErr.name
        };
        return error(`Fauna v10查询失败: ${JSON.stringify(errorDetails)}`);
      }
      
      // 测试创建集合
      let collectionsResult;
      try {
        console.log('🔄 正在测试获取所有集合...');
        collectionsResult = await client.query(
          fql`{
            "collections": Collection.all().map(c => c.name)
          }`
        );
        console.log('✅ 获取集合成功，集合数量:', collectionsResult.data?.collections?.length || 0);
      } catch (collErr: any) {
        console.error('❌ 获取集合失败:', JSON.stringify(collErr));
        return error(`获取集合失败: ${collErr.message || JSON.stringify(collErr)}`);
      }
      
      // 尝试创建集合（如果不存在）
      try {
        console.log('🔄 正在测试集合存在性并尝试创建...');
        const createResult = await client.query(
          fql`
            if (Collection.byName("test_collection") == null) {
              Collection.create({ name: "test_collection" })
            } else {
              { "exists": true, "name": "test_collection" }
            }
          `
        );
        console.log('✅ 测试集合创建成功:', JSON.stringify(createResult.data));
      } catch (createErr: any) {
        console.error('❌ 测试集合创建失败:', JSON.stringify(createErr));
        return error(`创建测试集合失败: ${createErr.message || JSON.stringify(createErr)}`);
      }

      return success({
        message: 'Fauna v10 API测试成功',
        environmentInfo,
        connectionTest: {
          success: true,
          result
        },
        collections: collectionsResult.data?.collections || []
      });
    } catch (err: any) {
      console.error('❌ Fauna v10测试失败:', JSON.stringify(err));
      return error(`Fauna v10测试失败: ${err.message || JSON.stringify(err)}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    return success({});
  }
  
  return error(`不允许使用${event.httpMethod}方法`, 405);
}; 