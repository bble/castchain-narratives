import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound, validateAuth, getUserFid } from './utils/response';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await db.setupDatabase();
    console.log('数据库初始化成功');
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  // 从路径中提取叙事ID和贡献ID
  const paths = event.path.split('/');
  const contributionIndex = paths.indexOf('contributions');
  
  if (contributionIndex === -1 || contributionIndex + 1 >= paths.length) {
    return error('Contribution ID is required');
  }
  
  const narrativeId = paths[paths.indexOf('narratives') + 1];
  const contributionId = paths[contributionIndex + 1];
  
  if (!narrativeId || !contributionId) {
    return error('Narrative ID and Contribution ID are required');
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
      
      // 验证叙事是否存在
      const narrative = await db.get(db.collections.narratives, narrativeId);
      if (!narrative) {
        return notFound('Narrative not found');
      }
      
      // 验证贡献是否存在
      const contribution = await db.get(db.collections.contributions, contributionId);
      if (!contribution) {
        return notFound('Contribution not found');
      }
      
      // 检查贡献是否属于该叙事
      if (contribution.narrativeId !== narrativeId) {
        return error('Contribution does not belong to this narrative', 400);
      }
      
      // 更新贡献的点赞计数
      const updatedContribution = await db.update(db.collections.contributions, contributionId, {
        ...contribution,
        upvotes: contribution.upvotes + 1
      });
      
      return success({
        success: true,
        upvotes: updatedContribution.upvotes
      });
    } catch (err: any) {
      console.error(`Error liking contribution ${contributionId}:`, err);
      return error(`Error liking contribution: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }
  
  return error(`Method ${event.httpMethod} not allowed`, 405);
}; 