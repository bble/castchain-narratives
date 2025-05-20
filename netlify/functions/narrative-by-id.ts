import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound } from './utils/response';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  await db.setupDatabase().catch((err) => console.error('DB setup error:', err));

  // 从路径中提取叙事ID
  const path = event.path;
  const narrativeId = path.split('/').pop();
  
  if (!narrativeId) {
    return error('Narrative ID is required');
  }

  if (event.httpMethod === 'GET') {
    try {
      // 查询叙事数据
      const narrative = await db.get(db.collections.narratives, narrativeId);
      
      if (!narrative) {
        return notFound('Narrative not found');
      }
      
      return success(narrative);
    } catch (err: any) {
      console.error(`Error fetching narrative ${narrativeId}:`, err);
      return error(`Error fetching narrative: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }
  
  return error(`Method ${event.httpMethod} not allowed`, 405);
}; 