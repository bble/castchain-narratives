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

  // 从路径中提取叙事ID
  const paths = event.path.split('/');
  const narrativeIndex = paths.indexOf('narratives');

  if (narrativeIndex === -1 || narrativeIndex + 1 >= paths.length) {
    return error('Narrative ID is required');
  }

  const narrativeId = paths[narrativeIndex + 1];

  // 关注叙事
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

      // 检查是否已经关注
      const existingFollows = await supabase.query(supabase.tables.followers, {
        filters: { user_fid: userFid, narrative_id: narrativeId },
        limit: 1
      });

      if (existingFollows.length > 0) {
        return success({
          success: true,
          already_following: true,
          message: '您已经关注了这个叙事'
        });
      }

      // 创建关注记录
      const followRecord = {
        user_fid: userFid,
        narrative_id: narrativeId,
        followed_at: new Date().toISOString()
      };

      const createdFollow = await supabase.create(supabase.tables.followers, followRecord);

      // 创建通知给叙事创建者（如果不是自己关注自己的叙事）
      if (narrative.creator_fid !== userFid) {
        const notificationId = generateId();
        const notification = {
          notification_id: notificationId,
          user_fid: narrative.creator_fid,
          type: 'NEW_FOLLOWER',
          title: '新的关注者',
          message: `有人关注了您的叙事"${narrative.title}"`,
          narrative_id: narrativeId,
          metadata: {
            follower_fid: userFid,
            narrative_title: narrative.title
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
        follow: createdFollow,
        message: '关注成功'
      }, 201);
    } catch (err: any) {
      console.error(`Error following narrative ${narrativeId}:`, err);
      return error(`Error following narrative: ${err.message}`);
    }
  }
  // 取消关注叙事
  else if (event.httpMethod === 'DELETE') {
    try {
      // 验证用户认证
      if (!validateAuth(event.headers)) {
        return error('Authentication required', 401);
      }

      const userFid = getUserFid(event.headers);
      if (!userFid) {
        return error('User FID required', 401);
      }

      // 查找关注记录
      const existingFollows = await supabase.query(supabase.tables.followers, {
        filters: { user_fid: userFid, narrative_id: narrativeId },
        limit: 1
      });

      if (existingFollows.length === 0) {
        return success({
          success: true,
          not_following: true,
          message: '您没有关注这个叙事'
        });
      }

      // 删除关注记录
      const followRecord = existingFollows[0];
      await supabase.remove(supabase.tables.followers, followRecord.id);

      return success({
        success: true,
        message: '取消关注成功'
      });
    } catch (err: any) {
      console.error(`Error unfollowing narrative ${narrativeId}:`, err);
      return error(`Error unfollowing narrative: ${err.message}`);
    }
  }
  // 检查关注状态
  else if (event.httpMethod === 'GET') {
    try {
      // 验证用户认证
      if (!validateAuth(event.headers)) {
        return error('Authentication required', 401);
      }

      const userFid = getUserFid(event.headers);
      if (!userFid) {
        return error('User FID required', 401);
      }

      // 查找关注记录
      const existingFollows = await supabase.query(supabase.tables.followers, {
        filters: { user_fid: userFid, narrative_id: narrativeId },
        limit: 1
      });

      const isFollowing = existingFollows.length > 0;

      // 获取总关注数
      const allFollowers = await supabase.query(supabase.tables.followers, {
        filters: { narrative_id: narrativeId }
      });

      return success({
        is_following: isFollowing,
        follower_count: allFollowers.length,
        followed_at: isFollowing ? existingFollows[0].followed_at : null
      });
    } catch (err: any) {
      console.error(`Error checking follow status for narrative ${narrativeId}:`, err);
      return error(`Error checking follow status: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }

  return error(`Method ${event.httpMethod} not allowed`, 405);
};
