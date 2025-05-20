import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound, getUserFid } from './utils/response';
import { generateId } from '../../lib/utils';
import { NotificationType } from '../../types/narrative';

export const handler: Handler = async (event, context) => {
  // 确保初始化数据库
  try {
    await db.setupDatabase();
    console.log('数据库初始化成功');
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  // 从路径中提取叙事ID
  const paths = event.path.split('/');
  const narrativeId = paths[paths.indexOf('narratives') + 1];
  
  if (!narrativeId) {
    return error('Narrative ID is required');
  }

  // 获取叙事贡献
  if (event.httpMethod === 'GET') {
    try {
      // 验证叙事是否存在
      const narrative = await db.get(db.collections.narratives, narrativeId);
      if (!narrative) {
        return notFound('Narrative not found');
      }
      
      // 查询该叙事的所有贡献
      const contributions = await db.query(
        db.indexes.contributionsByNarrative, 
        narrativeId
      );
      
      return success(contributions);
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
      if (!data.contributorFid || !data.textContent || !data.parentContributionId || !data.castHash) {
        return error('Missing required fields');
      }
      
      // 验证叙事是否存在
      const narrative = await db.get(db.collections.narratives, narrativeId);
      if (!narrative) {
        return notFound('Narrative not found');
      }
      
      // 验证父贡献是否存在
      const parentContribution = await db.get(db.collections.contributions, data.parentContributionId);
      if (!parentContribution) {
        return notFound('Parent contribution not found');
      }
      
      const now = new Date().toISOString();
      const contributionId = generateId();
      
      // 确定分支信息
      let branchId = parentContribution.branchId;
      let newBranch = null;
      
      // 如果是新分支
      if (data.isBranchStart) {
        // 创建新分支
        branchId = generateId();
        
        newBranch = {
          branchId,
          narrativeId,
          name: data.branchName || `Branch from ${parentContribution.contributionId}`,
          description: data.branchDescription,
          creatorFid: data.contributorFid,
          createdAt: now,
          rootContributionId: contributionId,
          parentBranchId: parentContribution.branchId,
          contributionCount: 1
        };
        
        await db.create(db.collections.branches, newBranch);
        
        // 更新叙事分支计数
        await db.update(db.collections.narratives, narrativeId, {
          ...narrative,
          branchCount: narrative.branchCount + 1,
          updatedAt: now
        });
      } else {
        // 如果是在现有分支添加贡献，更新分支贡献计数
        const branch = await db.get(db.collections.branches, branchId);
        if (branch) {
          await db.update(db.collections.branches, branchId, {
            ...branch,
            contributionCount: branch.contributionCount + 1
          });
        }
      }
      
      // 创建新贡献
      const contribution = {
        contributionId,
        narrativeId,
        contributorFid: data.contributorFid,
        contributorUsername: data.contributorUsername,
        contributorDisplayName: data.contributorDisplayName,
        contributorPfp: data.contributorPfp,
        parentContributionId: data.parentContributionId,
        branchId,
        textContent: data.textContent,
        castHash: data.castHash,
        createdAt: now,
        upvotes: 0,
        isBranchStart: !!data.isBranchStart
      };
      
      const createdContribution = await db.create(db.collections.contributions, contribution);
      
      // 检查这是否是新贡献者
      const contributorContributions = await db.query(
        db.indexes.contributionsByContributor,
        data.contributorFid
      );
      
      let isNewContributor = contributorContributions.length <= 1;
      
      // 更新叙事
      await db.update(db.collections.narratives, narrativeId, {
        ...narrative,
        contributionCount: narrative.contributionCount + 1,
        contributorCount: isNewContributor ? narrative.contributorCount + 1 : narrative.contributorCount,
        updatedAt: now
      });
      
      // 创建通知 - 通知叙事创建者有新贡献
      if (narrative.creatorFid !== data.contributorFid) {
        const notificationId = generateId();
        const notification = {
          notificationId,
          userFid: narrative.creatorFid,
          notificationType: NotificationType.NEW_CONTRIBUTION,
          message: `${data.contributorDisplayName || data.contributorUsername || 'Someone'} 为您的叙事 "${narrative.title}" 添加了新贡献`,
          relatedEntityType: 'contribution',
          relatedEntityId: contributionId,
          isRead: false,
          createdAt: now
        };
        
        await db.create(db.collections.notifications, notification);
      }
      
      return success({
        contribution: createdContribution,
        branch: newBranch
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