import { Handler } from '@netlify/functions';
import supabase from './utils/supabase';
import { success, error, notFound, validateAuth, getUserFid } from './utils/response';
import { generateId } from '../../lib/utils';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await supabase.setupDatabase();
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  // 从路径中提取叙事ID和贡献ID
  // 路径格式: /.netlify/functions/contribution-like/narrativeId/contributionId
  const paths = event.path.split('/').filter(p => p);

  if (paths.length < 4) {
    return error('Invalid path format. Expected: /contribution-like/narrativeId/contributionId');
  }

  const narrativeId = paths[paths.length - 2];
  const contributionId = paths[paths.length - 1];

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
      const narratives = await supabase.query(supabase.tables.narratives, {
        filters: { narrative_id: narrativeId },
        limit: 1
      });
      const narrative = narratives.length > 0 ? narratives[0] : null;

      if (!narrative) {
        return notFound('Narrative not found');
      }

      // 验证贡献是否存在
      const contributions = await supabase.query(supabase.tables.contributions, {
        filters: { contribution_id: contributionId },
        limit: 1
      });
      const contribution = contributions.length > 0 ? contributions[0] : null;

      if (!contribution) {
        return notFound('Contribution not found');
      }

      // 检查贡献是否属于该叙事
      if (contribution.narrative_id !== narrativeId) {
        return error('Contribution does not belong to this narrative', 400);
      }

      // 更新贡献的点赞计数
      const updatedContribution = await supabase.update(supabase.tables.contributions, contribution.id, {
        like_count: contribution.like_count + 1
      });

      // 如果点赞者不是贡献者本人，创建通知
      if (contribution.contributor_fid !== userFid) {
        const notificationId = generateId();
        const notification = {
          notification_id: notificationId,
          user_fid: contribution.contributor_fid,
          type: 'CONTRIBUTION_LIKED',
          title: '贡献获得点赞',
          message: `您在叙事"${narrative.title}"中的贡献获得了点赞`,
          narrative_id: narrativeId,
          contribution_id: contributionId,
          metadata: {
            liker_fid: userFid,
            narrative_title: narrative.title,
            contribution_preview: contribution.content.substring(0, 100) + '...'
          }
        };

        try {
          await supabase.create(supabase.tables.notifications, notification);
        } catch (notifErr) {
          // 不影响主要功能，继续执行
        }
      }

      return success({
        success: true,
        like_count: updatedContribution.like_count,
        message: '点赞成功'
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