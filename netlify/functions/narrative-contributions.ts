import { Handler } from '@netlify/functions';
import supabase from './utils/supabase';
import { success, error, notFound, getUserFid } from './utils/response';
import { generateId } from '../../lib/utils';
import { NotificationType } from '../../types/narrative';

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

  // 获取叙事贡献
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

      // 查询该叙事的所有贡献
      const contributions = await supabase.query(supabase.tables.contributions, {
        filters: { narrative_id: narrativeId },
        orderBy: { column: 'created_at', ascending: false }
      });

      // 映射数据库字段到前端字段
      const mappedContributions = contributions.map((c: any) => ({
        contributionId: c.contribution_id,
        narrativeId: c.narrative_id,
        contributorFid: c.contributor_fid,
        contributorUsername: c.contributor_username,
        contributorDisplayName: c.contributor_display_name,
        contributorPfp: c.contributor_pfp,
        parentContributionId: c.parent_contribution_id,
        branchId: c.branch_id,
        textContent: c.content,
        castHash: c.cast_hash,
        createdAt: c.created_at,
        upvotes: c.like_count || 0,
        isBranchStart: c.parent_contribution_id === null || c.branch_id !== 'main'
      }));

      return success(mappedContributions);
    } catch (err: any) {
      console.error(`Error fetching contributions for narrative ${narrativeId}:`, err);
      return error(`Error fetching contributions: ${err.message}`);
    }
  }
  // 添加新贡献
  else if (event.httpMethod === 'POST') {
    try {
      if (!event.body) {
        return error('Missing request body');
      }

      const data = JSON.parse(event.body);

      // 验证必要参数
      if (!data.contributorFid || !data.content || !data.castHash) {
        return error('Missing required fields: contributorFid, content, castHash');
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

      // 如果有父贡献ID，验证父贡献是否存在
      let parentContribution = null;
      if (data.parentContributionId) {
        const parentContributions = await supabase.query(supabase.tables.contributions, {
          filters: { contribution_id: data.parentContributionId },
          limit: 1
        });
        parentContribution = parentContributions.length > 0 ? parentContributions[0] : null;

        if (!parentContribution) {
          return notFound('Parent contribution not found');
        }
      }

      const now = new Date().toISOString();
      const contributionId = generateId();

      // 确定分支信息
      let branchId = data.branchId || 'main-branch';

      // 如果是新分支
      if (data.isBranchStart && data.branchName) {
        branchId = generateId();

        const newBranch = {
          branch_id: branchId,
          narrative_id: narrativeId,
          name: data.branchName,
          description: data.branchDescription || `从贡献 ${data.parentContributionId || 'root'} 创建的分支`,
          creator_fid: data.contributorFid,
          parent_branch_id: parentContribution?.branch_id || null,
          contribution_count: 1
        };

        await supabase.create(supabase.tables.branches, newBranch);

        // 更新叙事分支计数
        await supabase.update(supabase.tables.narratives, narrative.id, {
          branch_count: narrative.branch_count + 1,
          updated_at: now
        });
      } else if (branchId !== 'main-branch') {
        // 如果是在现有分支添加贡献，更新分支贡献计数
        const branches = await supabase.query(supabase.tables.branches, {
          filters: { branch_id: branchId },
          limit: 1
        });

        if (branches.length > 0) {
          const branch = branches[0];
          await supabase.update(supabase.tables.branches, branch.id, {
            contribution_count: branch.contribution_count + 1
          });
        }
      }

      // 创建新贡献
      const contribution = {
        contribution_id: contributionId,
        narrative_id: narrativeId,
        branch_id: branchId,
        contributor_fid: data.contributorFid,
        contributor_username: data.contributorUsername,
        contributor_display_name: data.contributorDisplayName,
        contributor_pfp: data.contributorPfp,
        content: data.content,
        content_type: data.contentType || 'text',
        parent_contribution_id: data.parentContributionId || null,
        order_index: data.orderIndex || 0,
        cast_hash: data.castHash
      };

      const createdContribution = await supabase.create(supabase.tables.contributions, contribution);

      // 检查这是否是新贡献者
      const contributorContributions = await supabase.query(supabase.tables.contributions, {
        filters: { contributor_fid: data.contributorFid },
        limit: 10
      });

      const isNewContributor = contributorContributions.length <= 1;

      // 更新叙事统计
      await supabase.update(supabase.tables.narratives, narrative.id, {
        contribution_count: narrative.contribution_count + 1,
        contributor_count: isNewContributor ? narrative.contributor_count + 1 : narrative.contributor_count,
        updated_at: now
      });

      // 创建通知 - 通知叙事创建者有新贡献
      if (narrative.creator_fid !== data.contributorFid) {
        const notificationId = generateId();
        const notification = {
          notification_id: notificationId,
          user_fid: narrative.creator_fid,
          type: 'NEW_CONTRIBUTION',
          title: '新的故事贡献',
          message: `${data.contributorDisplayName || data.contributorUsername || 'Someone'} 为您的叙事 "${narrative.title}" 添加了新贡献`,
          narrative_id: narrativeId,
          contribution_id: contributionId,
          metadata: {
            contributor_name: data.contributorDisplayName || data.contributorUsername,
            contribution_preview: data.content.substring(0, 100) + '...'
          }
        };

        await supabase.create(supabase.tables.notifications, notification);
      }

      // 映射数据库字段到前端字段
      const mappedContribution = {
        contributionId: createdContribution.contribution_id,
        narrativeId: createdContribution.narrative_id,
        branchId: createdContribution.branch_id,
        contributorFid: createdContribution.contributor_fid,
        contributorUsername: createdContribution.contributor_username,
        contributorDisplayName: createdContribution.contributor_display_name,
        contributorPfp: createdContribution.contributor_pfp,
        textContent: createdContribution.content,
        contentType: createdContribution.content_type,
        parentContributionId: createdContribution.parent_contribution_id,
        orderIndex: createdContribution.order_index,
        castHash: createdContribution.cast_hash,
        createdAt: createdContribution.created_at,
        upvotes: 0,
        downvotes: 0,
        likeCount: 0
      };

      // 如果创建了新分支，也返回分支信息
      let branchInfo = null;
      if (data.isBranchStart && branchId !== 'main-branch') {
        const branches = await supabase.query(supabase.tables.branches, {
          filters: { branch_id: branchId },
          limit: 1
        });

        if (branches.length > 0) {
          const branch = branches[0];
          branchInfo = {
            branchId: branch.branch_id,
            narrativeId: branch.narrative_id,
            name: branch.name,
            description: branch.description,
            creatorFid: branch.creator_fid,
            createdAt: branch.created_at,
            rootContributionId: branch.root_contribution_id || '',
            parentBranchId: branch.parent_branch_id,
            contributionCount: branch.contribution_count || 0
          };
        }
      }

      return success({
        contribution: mappedContribution,
        branch: branchInfo,
        message: '贡献创建成功'
      }, 201);
    } catch (err: any) {
      console.error(`Error adding contribution to narrative ${narrativeId}:`, err);
      return error(`Error adding contribution: ${err.message}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }

  return error(`Method ${event.httpMethod} not allowed`, 405);
};