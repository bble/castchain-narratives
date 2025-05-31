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
  const narrativeId = event.queryStringParameters?.narrativeId;

  if (!narrativeId) {
    return error('Narrative ID is required');
  }

  if (event.httpMethod === 'GET') {
    try {
      // 验证叙事是否存在
      const narratives = await supabase.query(supabase.tables.narratives, {
        filters: { narrative_id: narrativeId },
        limit: 1
      });
      const narrative = narratives.length > 0 ? narratives[0] : null;

      if (!narrative) {
        return notFound('Narrative not found');
      }

      // 查询该叙事的所有分支
      const branches = await supabase.query(supabase.tables.branches, {
        filters: { narrative_id: narrativeId },
        orderBy: { column: 'created_at', ascending: false }
      });

      // 映射数据库字段到前端字段
      const mappedBranches = branches.map((b: any) => ({
        branchId: b.branch_id,
        narrativeId: b.narrative_id,
        name: b.name,
        description: b.description,
        creatorFid: b.creator_fid,
        createdAt: b.created_at,
        rootContributionId: b.root_contribution_id || '',
        parentBranchId: b.parent_branch_id,
        contributionCount: b.contribution_count || 0
      }));

      return success(mappedBranches);
    } catch (err: any) {
      console.error(`Error fetching branches for narrative ${narrativeId}:`, err);
      return error(`Error fetching branches: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }

  return error(`Method ${event.httpMethod} not allowed`, 405);
};