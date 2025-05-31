import { Handler } from '@netlify/functions';
import supabase from './utils/supabase';
import { success, error, notFound, validateAuth, getUserFid } from './utils/response';
import { AchievementType } from '../../types/narrative';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await supabase.setupDatabase();
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  if (event.httpMethod === 'POST') {
    try {
      // 验证用户认证
      if (!validateAuth(event.headers)) {
        return error('Authentication required', 401);
      }

      const userFid = getUserFid(event.headers);
      if (!userFid) {
        return error('User FID required', 401);
      }

      // 解析请求体
      if (!event.body) {
        return error('Request body is required');
      }

      const requestData = JSON.parse(event.body);
      const {
        recipientFid,
        achievementType,
        narrativeId,
        contributionId,
        title,
        description,
        metadata
      } = requestData;

      if (!recipientFid || !achievementType) {
        return error('Recipient FID and achievement type are required');
      }

      // 验证用户是否有权限铸造成就
      // 这里应该包含实际的智能合约交互逻辑

      // 目前返回错误，因为智能合约功能尚未完全实现
      return error('成就铸造功能正在开发中，请稍后再试', 501);
    } catch (err: any) {
      console.error(`Error preparing mint:`, err);
      return error(`Error preparing mint: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }

  return error(`Method ${event.httpMethod} not allowed`, 405);
};