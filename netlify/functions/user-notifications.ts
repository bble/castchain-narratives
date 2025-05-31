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

  // 获取用户通知
  if (event.httpMethod === 'GET') {
    try {
      // 解析查询参数
      const queryParams = event.queryStringParameters || {};
      const onlyUnread = queryParams.onlyUnread === 'true';
      const page = parseInt(queryParams.page || '1', 10);
      const limit = parseInt(queryParams.limit || '20', 10);

      let notifications;

      if (onlyUnread) {
        // 获取未读通知
        notifications = await supabase.query(supabase.tables.notifications, {
          filters: { user_fid: userFid },
          orderBy: { column: 'created_at', ascending: false },
          limit
        });
        // 在应用层过滤未读通知（因为read_at为null表示未读）
        notifications = notifications.filter(n => !n.read_at);
      } else {
        // 获取所有通知
        notifications = await supabase.query(supabase.tables.notifications, {
          filters: { user_fid: userFid },
          orderBy: { column: 'created_at', ascending: false },
          limit
        });
      }

      return success(notifications);
    } catch (err: any) {
      console.error(`Error fetching notifications for user ${userFid}:`, err);
      return error(`Error fetching notifications: ${err.message}`);
    }
  }
  // 标记所有通知为已读
  else if (event.httpMethod === 'POST' && event.path.endsWith('read-all')) {
    try {
      // 验证用户认证
      if (!validateAuth(event.headers)) {
        return error('Authentication required', 401);
      }

      const authUserFid = getUserFid(event.headers);

      // 确保用户只能标记自己的通知
      if (authUserFid !== userFid) {
        return error('Unauthorized to mark notifications as read for another user', 403);
      }

      // 获取用户的所有未读通知
      const unreadNotifications = await supabase.query(supabase.tables.notifications, {
        filters: { user_fid: userFid },
        orderBy: { column: 'created_at', ascending: false }
      });

      // 过滤出真正未读的通知
      const notificationsToUpdate = unreadNotifications.filter(n => !n.read_at);

      if (notificationsToUpdate.length === 0) {
        return success({
          success: true,
          count: 0,
          message: '没有未读通知需要标记'
        });
      }

      // 批量更新通知为已读
      const now = new Date().toISOString();
      const updatePromises = notificationsToUpdate.map(notification =>
        supabase.update(supabase.tables.notifications, notification.id, {
          read_at: now
        })
      );

      await Promise.all(updatePromises);

      return success({
        success: true,
        count: notificationsToUpdate.length,
        message: `成功标记 ${notificationsToUpdate.length} 条通知为已读`
      });
    } catch (err: any) {
      console.error(`Error marking all notifications as read for user ${userFid}:`, err);
      return error(`Error marking notifications as read: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }

  return error(`Method ${event.httpMethod} not allowed`, 405);
};