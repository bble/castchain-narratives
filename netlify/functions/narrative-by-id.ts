import { Handler } from '@netlify/functions';
import supabase from './utils/supabase';
import { success, error, notFound } from './utils/response';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await supabase.setupDatabase();
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  // 从路径中提取叙事ID
  const path = event.path;
  const narrativeId = path.split('/').pop();

  if (!narrativeId) {
    return error('需要提供叙事ID');
  }

  if (event.httpMethod === 'GET') {
    try {
      // 查询叙事数据
      const narratives = await supabase.query(supabase.tables.narratives, {
        filters: { narrative_id: narrativeId },
        limit: 1
      });

      const narrative = narratives.length > 0 ? narratives[0] : null;

      if (!narrative) {
        return notFound('未找到该叙事');
      }

      return success(narrative);
    } catch (err: any) {
      console.error(`获取叙事${narrativeId}失败:`, err);
      return error(`获取叙事失败: ${err.message || JSON.stringify(err)}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }

  return error(`不允许使用${event.httpMethod}方法`, 405);
};