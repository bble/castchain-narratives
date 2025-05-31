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

  // 从查询参数中获取叙事ID
  const narrativeId = event.queryStringParameters?.id;

  if (!narrativeId) {
    return error('需要提供叙事ID参数');
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

      // 映射数据库字段到前端字段
      const mappedNarrative = {
        narrativeId: narrative.narrative_id,
        title: narrative.title,
        description: narrative.description,
        creatorFid: narrative.creator_fid,
        creatorUsername: narrative.creator_username,
        creatorDisplayName: narrative.creator_display_name,
        creatorPfp: narrative.creator_pfp,
        createdAt: narrative.created_at,
        updatedAt: narrative.updated_at,
        status: narrative.status,
        collaborationRules: narrative.collaboration_rules,
        tags: narrative.tags || [],
        branchCount: narrative.branch_count || 1,
        contributionCount: narrative.contribution_count || 1,
        contributorCount: narrative.contributor_count || 1,
        featuredImageUrl: narrative.featured_image_url
      };

      return success(mappedNarrative);
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