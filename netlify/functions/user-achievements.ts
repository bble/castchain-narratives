import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound } from './utils/response';
import { AchievementType } from '../../types/narrative';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await db.setupDatabase();
    console.log('数据库初始化成功');
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  // 从路径中提取用户FID
  const paths = event.path.split('/');
  const userIndex = paths.indexOf('users');
  
  if (userIndex === -1 || userIndex + 1 >= paths.length) {
    return error('User FID is required');
  }
  
  const userFid = parseInt(paths[userIndex + 1], 10);
  
  if (isNaN(userFid)) {
    return error('Invalid user FID');
  }

  if (event.httpMethod === 'GET') {
    try {
      // 解析查询参数
      const queryParams = event.queryStringParameters || {};
      const achievementType = queryParams.type as AchievementType | undefined;
      
      let achievements;
      
      if (achievementType) {
        // 查询特定类型的成就
        achievements = await db.query(
          db.indexes.achievementsByType, 
          [userFid, achievementType]
        );
      } else {
        // 查询所有成就
        achievements = await db.query(
          db.indexes.achievementsByOwner, 
          userFid
        );
      }
      
      return success(achievements);
    } catch (err: any) {
      console.error(`Error fetching achievements for user ${userFid}:`, err);
      return error(`Error fetching achievements: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }
  
  return error(`Method ${event.httpMethod} not allowed`, 405);
}; 