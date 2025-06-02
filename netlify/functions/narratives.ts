import { Handler } from '@netlify/functions';
import supabase from './utils/supabase';
import { success, error, notFound } from './utils/response';
import { NarrativeStatus, CollaborationRules } from '../../types/narrative';
import { generateId } from '../../lib/utils';

export const handler: Handler = async (event, context) => {
  // 简化日志记录
  console.log('narratives函数收到请求:', {
    path: event.path,
    httpMethod: event.httpMethod,
    queryParams: event.queryStringParameters
  });

  if (event.httpMethod === 'GET') {
    try {
      // 测试Supabase连接
      try {
        await supabase.setupDatabase();
      } catch (err: any) {
        console.error('Supabase连接失败:', err);
        return error(`数据库连接失败: ${err.message}`, 500);
      }

      // 解析查询参数
      const queryParams = event.queryStringParameters || {};
      const page = parseInt(queryParams.page || '1', 10);
      const limit = parseInt(queryParams.limit || '20', 10);
      const offset = (page - 1) * limit; // 计算偏移量
      const searchTerm = queryParams.search || '';
      const tags = queryParams.tags ?
        Array.isArray(queryParams.tags) ?
          queryParams.tags : [queryParams.tags]
        : [];
      const creatorFid = queryParams.creatorFid ? parseInt(queryParams.creatorFid, 10) : undefined;
      const sortBy = queryParams.sortBy === 'popular' ? 'popular' : 'latest';
      const type = queryParams.type;
      const userFid = queryParams.userFid ? parseInt(queryParams.userFid, 10) : undefined;

      console.log(`分页参数: page=${page}, limit=${limit}, offset=${offset}`);

      try {
        let narratives = [];

        try {
          if (creatorFid) {
            // 按创建者查询
            narratives = await supabase.query(supabase.tables.narratives, {
              filters: { creator_fid: creatorFid },
              orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false },
              limit,
              offset
            });
          } else if (tags && tags.length > 0) {
            // 按标签查询 - 先获取所有数据，然后在应用层分页
            const allNarratives = await supabase.query(supabase.tables.narratives, {
              orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false }
            });
            // 在应用层过滤标签
            const filteredNarratives = allNarratives.filter((n: any) =>
              n.tags && tags.some(tag => n.tags.includes(tag))
            );
            // 应用分页
            narratives = filteredNarratives.slice(offset, offset + limit);
          } else if (type === 'my' && userFid) {
            // 获取用户创建的叙事
            narratives = await supabase.query(supabase.tables.narratives, {
              filters: { creator_fid: userFid },
              orderBy: { column: 'created_at', ascending: false },
              limit,
              offset
            });
          } else if (type === 'following' && userFid) {
            // 获取用户关注的叙事
            const followedNarratives = await supabase.query(supabase.tables.followers, {
              filters: { user_fid: userFid }
            });
            const narrativeIds = followedNarratives.map((f: any) => f.narrative_id);

            if (narrativeIds.length === 0) {
              narratives = [];
            } else {
              // 获取每个关注的叙事详情
              const allFollowedNarratives = await supabase.query(supabase.tables.narratives, {
                filters: { narrative_id: narrativeIds },
                orderBy: { column: 'created_at', ascending: false }
              });
              // 应用分页
              narratives = allFollowedNarratives.slice(offset, offset + limit);
            }
          } else {
            // 默认获取所有叙事并排序
            narratives = await supabase.query(supabase.tables.narratives, {
              orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false },
              limit,
              offset
            });
          }
        } catch (innerErr: any) {
          console.error('数据库查询内部错误:', JSON.stringify(innerErr));
          return success([]);
        }

        // 如果有搜索词，进行过滤
        if (searchTerm) {
          const lowercaseSearch = searchTerm.toLowerCase();
          // 对于搜索，我们需要先获取所有匹配的结果，然后分页
          if (offset > 0) {
            // 如果不是第一页，需要重新获取所有数据进行搜索
            let allNarratives = [];
            if (creatorFid) {
              allNarratives = await supabase.query(supabase.tables.narratives, {
                filters: { creator_fid: creatorFid },
                orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false }
              });
            } else if (type === 'my' && userFid) {
              allNarratives = await supabase.query(supabase.tables.narratives, {
                filters: { creator_fid: userFid },
                orderBy: { column: 'created_at', ascending: false }
              });
            } else {
              allNarratives = await supabase.query(supabase.tables.narratives, {
                orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false }
              });
            }

            // 过滤搜索结果
            const filteredNarratives = allNarratives.filter((n: any) =>
              n.title.toLowerCase().includes(lowercaseSearch) ||
              n.description.toLowerCase().includes(lowercaseSearch)
            );

            // 应用分页
            narratives = filteredNarratives.slice(offset, offset + limit);
          } else {
            // 第一页，直接过滤当前结果
            narratives = narratives.filter((n: any) =>
              n.title.toLowerCase().includes(lowercaseSearch) ||
              n.description.toLowerCase().includes(lowercaseSearch)
            );
          }
        }

        // 如果数据库返回了空数据，返回空数组
        if (!narratives || narratives.length === 0) {
          console.log('数据库返回为空，返回空数组');
          return success([]);
        }

        // 映射数据库字段到前端字段
        const mappedNarratives = narratives.map((n: any) => ({
          narrativeId: n.narrative_id,
          title: n.title,
          description: n.description,
          creatorFid: n.creator_fid,
          creatorUsername: n.creator_username,
          creatorDisplayName: n.creator_display_name,
          creatorPfp: n.creator_pfp,
          createdAt: n.created_at,
          updatedAt: n.updated_at,
          status: n.status,
          collaborationRules: n.collaboration_rules,
          tags: n.tags || [],
          branchCount: n.branch_count || 1,
          contributionCount: n.contribution_count || 1,
          contributorCount: n.contributor_count || 1,
          featuredImageUrl: n.featured_image_url
        }));

        // 获取总数（用于分页显示）
        let totalCount = 0;
        try {
          if (creatorFid) {
            totalCount = await supabase.count(supabase.tables.narratives, {
              filters: { creator_fid: creatorFid }
            });
          } else if (tags && tags.length > 0) {
            // 对于标签过滤，需要获取所有数据来计算总数
            const allNarratives = await supabase.query(supabase.tables.narratives, {});
            const filteredNarratives = allNarratives.filter((n: any) =>
              n.tags && tags.some(tag => n.tags.includes(tag))
            );
            totalCount = filteredNarratives.length;
          } else if (type === 'my' && userFid) {
            totalCount = await supabase.count(supabase.tables.narratives, {
              filters: { creator_fid: userFid }
            });
          } else if (type === 'following' && userFid) {
            const followedNarratives = await supabase.query(supabase.tables.followers, {
              filters: { user_fid: userFid }
            });
            totalCount = followedNarratives.length;
          } else {
            totalCount = await supabase.count(supabase.tables.narratives, {});
          }
        } catch (countErr) {
          console.warn('获取总数失败，使用当前数量:', countErr);
          totalCount = mappedNarratives.length;
        }

        console.log(`成功获取${mappedNarratives.length}个叙事，总数: ${totalCount}`);
        return success({
          narratives: mappedNarratives,
          totalCount,
          currentPage: page,
          hasMore: mappedNarratives.length === limit
        });
      } catch (dbErr: any) {
        console.error('数据库查询失败:', JSON.stringify(dbErr));
        return success([]);
      }
    } catch (err: any) {
      console.error('获取叙事列表失败:', err);
      return success([]);
    }
  } else if (event.httpMethod === 'POST') {
    try {
      // 创建新叙事
      if (!event.body) {
        return error('Missing request body');
      }

      const data = JSON.parse(event.body);

      // 验证必要字段
      if (!data.title || !data.description || !data.creatorFid || !data.castHash) {
        return error('Missing required fields: title, description, creatorFid, castHash');
      }

      const now = new Date().toISOString();
      const narrativeId = generateId();

      const narrative = {
        narrative_id: narrativeId,
        title: data.title,
        description: data.description,
        creator_fid: data.creatorFid,
        creator_username: data.creatorUsername,
        creator_display_name: data.creatorDisplayName,
        creator_pfp: data.creatorPfp,
        status: "active",
        collaboration_rules: data.collaborationRules || "open",
        tags: data.tags || [],
        branch_count: 1, // 主分支
        contribution_count: 1, // 初始贡献
        contributor_count: 1, // 创建者是第一个贡献者
        featured_image_url: data.featuredImageUrl,
        cast_hash: data.castHash
      };

      try {
        // 确保Supabase连接
        try {
          await supabase.setupDatabase();
        } catch (err: any) {
          console.error('Supabase连接失败:', err);
          return error(`数据库连接失败: ${err.message}`, 500);
        }

        // 创建叙事记录
        const createdNarrative = await supabase.create(supabase.tables.narratives, narrative);

        return success(createdNarrative, 201);
      } catch (dbErr: any) {
        console.error('数据库操作失败:', dbErr);
        return error(`数据库操作失败: ${dbErr.message || JSON.stringify(dbErr)}`, 500);
      }
    } catch (err: any) {
      console.error('创建叙事失败:', err);
      return error(`创建叙事失败: ${err.message || JSON.stringify(err)}`);
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // 处理CORS预检请求
    return success({});
  }

  return error(`不允许使用${event.httpMethod}方法`, 405);
};