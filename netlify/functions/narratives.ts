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

        // 返回模拟数据作为后备
        return success([
          {
            id: 'demo-1',
            narrative_id: 'demo-1',
            title: '示例叙事：时间旅行者的日记',
            description: '一个关于时间旅行者在不同时代留下足迹的协作故事',
            creator_fid: 12345,
            created_at: new Date().toISOString(),
            status: 'active',
            tags: ['科幻', '时间旅行', '冒险'],
            contribution_count: 5,
            collaboration_rules: 'open'
          },
          {
            id: 'demo-2',
            narrative_id: 'demo-2',
            title: '示例叙事：数字世界的守护者',
            description: '在虚拟现实中保护数据安全的英雄们的故事',
            creator_fid: 67890,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'active',
            tags: ['科技', '虚拟现实', '英雄'],
            contribution_count: 8,
            collaboration_rules: 'moderated'
          }
        ]);
      }

      // 解析查询参数
      const queryParams = event.queryStringParameters || {};
      const page = parseInt(queryParams.page || '1', 10);
      const limit = parseInt(queryParams.limit || '20', 10);
      const searchTerm = queryParams.search || '';
      const tags = queryParams.tags ?
        Array.isArray(queryParams.tags) ?
          queryParams.tags : [queryParams.tags]
        : [];
      const creatorFid = queryParams.creatorFid ? parseInt(queryParams.creatorFid, 10) : undefined;
      const sortBy = queryParams.sortBy === 'popular' ? 'popular' : 'latest';
      const type = queryParams.type;
      const userFid = queryParams.userFid ? parseInt(queryParams.userFid, 10) : undefined;

      try {
        let narratives = [];

        try {
          if (creatorFid) {
            // 按创建者查询
            narratives = await supabase.query(supabase.tables.narratives, {
              filters: { creator_fid: creatorFid },
              orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false },
              limit
            });
          } else if (tags && tags.length > 0) {
            // 按标签查询 - Supabase使用数组包含查询
            narratives = await supabase.query(supabase.tables.narratives, {
              // 注意：这里需要使用PostgreSQL的数组操作，可能需要原生SQL
              orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false },
              limit
            });
            // 在应用层过滤标签
            narratives = narratives.filter((n: any) =>
              n.tags && tags.some(tag => n.tags.includes(tag))
            );
          } else if (type === 'my' && userFid) {
            // 获取用户创建的叙事
            narratives = await supabase.query(supabase.tables.narratives, {
              filters: { creator_fid: userFid },
              orderBy: { column: 'created_at', ascending: false },
              limit
            });
          } else if (type === 'following' && userFid) {
            // 获取用户关注的叙事
            const followedNarratives = await supabase.query(supabase.tables.followers, {
              filters: { user_fid: userFid },
              limit
            });
            const narrativeIds = followedNarratives.map((f: any) => f.narrative_id);

            if (narrativeIds.length === 0) {
              narratives = [];
            } else {
              // 获取每个关注的叙事详情
              narratives = await supabase.query(supabase.tables.narratives, {
                filters: { narrative_id: narrativeIds },
                orderBy: { column: 'created_at', ascending: false },
                limit
              });
            }
          } else {
            // 默认获取所有叙事并排序
            narratives = await supabase.query(supabase.tables.narratives, {
              orderBy: { column: sortBy === 'popular' ? 'contribution_count' : 'created_at', ascending: false },
              limit
            });
          }
        } catch (innerErr: any) {
          console.error('数据库查询内部错误:', JSON.stringify(innerErr));
          return success([]);
        }

        // 如果有搜索词，进行过滤
        if (searchTerm) {
          const lowercaseSearch = searchTerm.toLowerCase();
          narratives = narratives.filter((n: any) =>
            n.title.toLowerCase().includes(lowercaseSearch) ||
            n.description.toLowerCase().includes(lowercaseSearch)
          );
        }

        // 如果数据库返回了空数据，返回空数组
        if (!narratives || narratives.length === 0) {
          console.log('数据库返回为空，返回空数组');
          return success([]);
        }

        return success(narratives);
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