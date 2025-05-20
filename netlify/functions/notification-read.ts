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

  // 从路径中提取通知ID
  const paths = event.path.split('/');
  const notificationIndex = paths.indexOf('notifications');
  
  if (notificationIndex === -1 || notificationIndex + 1 >= paths.length) {
    return error('Notification ID is required');
  }
  
  const notificationId = paths[notificationIndex + 1];

  // 标记单个通知为已读
  if (event.httpMethod === 'POST') {
    try {
      // 验证用户认证
      if (!validateAuth(event.headers)) {
        return error('Authentication required', 401);
      }
      
      const userFid = getUserFid(event.headers);
      if (!userFid) {
        return error('User authentication required', 401);
      }
      
      // 获取通知
      const notification = await db.get(db.collections.notifications, notificationId);
      
      if (!notification) {
        return notFound('Notification not found');
      }
      
      // 确保用户只能标记自己的通知
      if (notification.userFid !== userFid) {
        return error('Unauthorized to mark notification as read', 403);
      }
      
      // 已经标记为已读
      if (notification.isRead) {
        return success({ success: true, already_read: true });
      }
      
      // 更新通知为已读
      await db.update(db.collections.notifications, notificationId, {
        ...notification,
        isRead: true
      });
      
      return success({ success: true });
    } catch (err: any) {
      console.error(`Error marking notification ${notificationId} as read:`, err);
      return error(`Error marking notification as read: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }
  
  return error(`Method ${event.httpMethod} not allowed`, 405);
}; 