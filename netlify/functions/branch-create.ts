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

  // 只支持POST方法
  if (event.httpMethod !== 'POST') {
    if (event.httpMethod === 'OPTIONS') {
      return success({});
    }
    return error(`Method ${event.httpMethod} not allowed`, 405);
  }

  try {
    // 验证用户认证
    if (!validateAuth(event.headers)) {
      return error('Authentication required', 401);
    }

    const userFid = getUserFid(event.headers);
    if (!userFid) {
      return error('User FID required', 401);
    }

    if (!event.body) {
      return error('Missing request body');
    }

    const data = JSON.parse(event.body);

    // 验证必要参数
    if (!data.narrativeId || !data.name) {
      return error('Missing required fields: narrativeId, name');
    }

    // 验证叙事是否存在
    const narratives = await supabase.query(supabase.tables.narratives, {
      filters: { narrative_id: data.narrativeId },
      limit: 1
    });
    const narrative = narratives.length > 0 ? narratives[0] : null;

    if (!narrative) {
      return notFound('Narrative not found');
    }

    // 如果指定了父分支，验证父分支是否存在
    let parentBranch = null;
    if (data.parentBranchId) {
      const parentBranches = await supabase.query(supabase.tables.branches, {
        filters: { branch_id: data.parentBranchId },
        limit: 1
      });
      parentBranch = parentBranches.length > 0 ? parentBranches[0] : null;

      if (!parentBranch) {
        return notFound('Parent branch not found');
      }

      // 确保父分支属于同一个叙事
      if (parentBranch.narrative_id !== data.narrativeId) {
        return error('Parent branch does not belong to this narrative', 400);
      }
    }

    // 检查分支名称是否已存在于该叙事中
    const existingBranches = await supabase.query(supabase.tables.branches, {
      filters: { narrative_id: data.narrativeId, name: data.name },
      limit: 1
    });

    if (existingBranches.length > 0) {
      return error('Branch name already exists in this narrative', 409);
    }

    const now = new Date().toISOString();
    const branchId = generateId();

    // 创建新分支
    const branch = {
      branch_id: branchId,
      narrative_id: data.narrativeId,
      name: data.name,
      description: data.description || `由 ${data.creatorDisplayName || data.creatorUsername || 'User'} 创建的分支`,
      creator_fid: userFid,
      parent_branch_id: data.parentBranchId || null,
      contribution_count: 0,
      is_main_branch: false
    };

    const createdBranch = await supabase.create(supabase.tables.branches, branch);

    // 更新叙事的分支计数
    await supabase.update(supabase.tables.narratives, narrative.id, {
      branch_count: narrative.branch_count + 1,
      updated_at: now
    });

    // 创建通知给叙事创建者（如果不是创建者自己创建分支）
    if (narrative.creator_fid !== userFid) {
      const notificationId = generateId();
      const notification = {
        notification_id: notificationId,
        user_fid: narrative.creator_fid,
        type: 'NEW_BRANCH',
        title: '新的故事分支',
        message: `${data.creatorDisplayName || data.creatorUsername || 'Someone'} 为您的叙事"${narrative.title}"创建了新分支"${data.name}"`,
        narrative_id: data.narrativeId,
        metadata: {
          branch_id: branchId,
          branch_name: data.name,
          creator_fid: userFid,
          creator_name: data.creatorDisplayName || data.creatorUsername,
          narrative_title: narrative.title
        }
      };

      try {
        await supabase.create(supabase.tables.notifications, notification);
      } catch (notifErr) {
        // 不影响主要功能，继续执行
      }
    }

    // 如果用户是第一次创建分支，给他们一个成就
    const userBranches = await supabase.query(supabase.tables.branches, {
      filters: { creator_fid: userFid },
      limit: 10
    });

    if (userBranches.length === 1) { // 这是他们的第一个分支
      const achievementId = generateId();
      const achievement = {
        achievement_id: achievementId,
        user_fid: userFid,
        achievement_type: 'FIRST_BRANCH',
        title: '分支创造者',
        description: '创建了第一个故事分支',
        narrative_id: data.narrativeId,
        metadata: {
          branch_id: branchId,
          branch_name: data.name,
          narrative_title: narrative.title
        }
      };

      try {
        await supabase.create(supabase.tables.achievements, achievement);

        // 创建成就通知
        const achievementNotificationId = generateId();
        const achievementNotification = {
          notification_id: achievementNotificationId,
          user_fid: userFid,
          type: 'ACHIEVEMENT_EARNED',
          title: '获得新成就',
          message: '恭喜！您获得了"分支创造者"成就',
          achievement_id: achievementId,
          metadata: {
            achievement_title: '分支创造者',
            achievement_description: '创建了第一个故事分支'
          }
        };

        await supabase.create(supabase.tables.notifications, achievementNotification);
      } catch (achievementErr) {
        // 不影响主要功能，继续执行
      }
    }

    return success({
      branch: createdBranch,
      message: '分支创建成功'
    }, 201);

  } catch (err: any) {
    console.error('Error creating branch:', err);
    return error(`Error creating branch: ${err.message}`);
  }
};
