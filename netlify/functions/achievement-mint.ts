import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound, validateAuth, getUserFid } from './utils/response';
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
      
      // 在真实环境中，这里应该包含更多的逻辑，比如验证用户是否有权限铸造成就
      // 并准备智能合约交互的参数
      
      // 简化示例：返回交易参数
      const mockTransactionParams = {
        to: "0x1234567890abcdef1234567890abcdef12345678", 
        data: "0x...", // 实际上这应该是编码过的合约调用数据
        value: "0",
        gasLimit: "300000"
      };
      
      return success({
        success: true,
        transactionParams: mockTransactionParams
      });
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