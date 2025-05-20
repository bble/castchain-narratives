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
  const paths = event.path.split('/');
  const narrativeId = paths[paths.indexOf('narratives') + 1];
  
  if (!narrativeId) {
    return error('Narrative ID is required');
  }

  if (event.httpMethod === 'GET') {
    try {
      // 验证叙事是否存在
      const narrative = await db.get(db.collections.narratives, narrativeId);
      if (!narrative) {
        return notFound('Narrative not found');
      }
      
      // 查询该叙事的所有分支
      const branches = await db.query(
        db.indexes.branchesByNarrative, 
        narrativeId
      );
      
      return success(branches);
    } catch (err: any) {
      console.error(`Error fetching branches for narrative ${narrativeId}:`, err);
      return error(`Error fetching branches: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }
  
  return error(`Method ${event.httpMethod} not allowed`, 405);
}; 