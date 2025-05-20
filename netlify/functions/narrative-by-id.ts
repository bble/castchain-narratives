import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound } from './utils/response';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await db.setupDatabase();
    console.log('数据库初始化成功');
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  // 从路径中提取叙事ID
  const path = event.path;
  const narrativeId = path.split('/').pop();
  
  if (!narrativeId) {
    return error('需要提供叙事ID');
  }

  if (event.httpMethod === 'GET') {
    try {
      // 查询叙事数据
      const narrative = await db.get(db.collections.narratives, narrativeId);
      
      if (!narrative) {
        return notFound('未找到该叙事');
      }
      
      return success(narrative);
    } catch (err: any) {
      console.error(`获取叙事${narrativeId}失败:`, err);
      return error(`获取叙事失败: ${err.message || JSON.stringify(err)}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }
  
  return error(`不允许使用${event.httpMethod}方法`, 405);
}; 