import { Handler } from '@netlify/functions';
import supabase from './utils/supabase';
import { success, error, notFound } from './utils/response';
import { AchievementType } from '../../types/narrative';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await supabase.setupDatabase();
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  // 从查询参数中获取用户FID
  const userFid = event.queryStringParameters?.userFid;

  if (!userFid) {
    return error('User FID is required');
  }

  const parsedUserFid = parseInt(userFid, 10);

  if (isNaN(parsedUserFid)) {
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
        achievements = await supabase.query(supabase.tables.achievements, {
          filters: { user_fid: parsedUserFid, achievement_type: achievementType },
          orderBy: { column: 'earned_at', ascending: false }
        });
      } else {
        // 查询所有成就
        achievements = await supabase.query(supabase.tables.achievements, {
          filters: { user_fid: parsedUserFid },
          orderBy: { column: 'earned_at', ascending: false }
        });
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