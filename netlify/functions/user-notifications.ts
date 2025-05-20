import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound, validateAuth, getUserFid } from './utils/response';
import { generateId } from '../../lib/utils';

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
        notifications = await db.query(
          db.indexes.notificationsByUserAndReadStatus, 
          [userFid, false], 
          { limit }
        );
      } else {
        // 获取所有通知
        notifications = await db.query(
          db.indexes.notificationsByUser, 
          userFid,
          { limit }
        );
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
      const unreadNotifications = await db.query(
        db.indexes.notificationsByUserAndReadStatus, 
        [userFid, false]
      );
      
      // 更新每个通知为已读
      await Promise.all(unreadNotifications.map(notification => 
        db.update(db.collections.notifications, notification.id, {
          ...notification,
          isRead: true
        })
      ));
      
      return success({ success: true, count: unreadNotifications.length });
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