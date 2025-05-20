import { Handler } from '@netlify/functions';
import db from './utils/db';
import { success, error, notFound } from './utils/response';
import { NarrativeStatus, CollaborationRules } from '../../types/narrative';
import { generateId } from '../../lib/utils';

export const handler: Handler = async (event, context) => {
  // 添加日志，记录完整的请求信息便于排查
  console.log('narratives函数收到请求:', {
    path: event.path,
    httpMethod: event.httpMethod,
    queryParams: event.queryStringParameters,
    headers: event.headers,
    haveFaunaKey: !!process.env.FAUNA_SECRET_KEY,
    faunaKeyLength: process.env.FAUNA_SECRET_KEY ? process.env.FAUNA_SECRET_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV
  });

  try {
    // 临时解决方案：返回模拟数据
    if (event.httpMethod === 'GET' && event.queryStringParameters) {
      console.log('返回模拟叙事数据用于调试');
      
      const mockNarratives = [
        {
          id: "mock-narrative-1",
          narrativeId: "mock-narrative-1",
          title: "测试叙事 1",
          description: "这是一个测试叙事，用于调试目的",
          creatorFid: 1234,
          creatorUsername: "test_user",
          creatorDisplayName: "测试用户",
          creatorPfp: "https://example.com/avatar.png",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: NarrativeStatus.ACTIVE,
          collaborationRules: CollaborationRules.OPEN,
          tags: ["测试", "调试"],
          branchCount: 1,
          contributionCount: 1,
          contributorCount: 1
        }
      ];
      
      return success(mockNarratives);
    }
  } catch (err: any) {
    console.error("临时解决方案错误:", err);
  }

  // 正常流程继续执行

  // 确保初始化数据库
  try {
    await db.setupDatabase();
    console.log('数据库初始化成功');
  } catch (err: any) {
    console.error('数据库初始化失败:', err);
    return error(`数据库初始化失败: ${err.message || JSON.stringify(err)}`);
  }

  if (event.httpMethod === 'GET') {
    try {
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

      let narratives;

      // 根据排序方式选择索引
      const indexName = sortBy === 'popular' 
        ? db.indexes.narrativesByPopularity 
        : db.indexes.narrativesByTimestamp;
      
      if (creatorFid) {
        // 按创建者查询
        narratives = await db.query(db.indexes.narrativesByCreator, creatorFid, { limit });
      } else if (tags && tags.length > 0) {
        // 按标签查询
        const results = [];
        for (const tag of tags) {
          const tagNarratives = await db.query(db.indexes.narrativesByTag, tag, { limit });
          results.push(...tagNarratives);
        }
        // 合并结果并去重
        const uniqueIds = new Set();
        narratives = results.filter(n => {
          if (uniqueIds.has(n.id)) return false;
          uniqueIds.add(n.id);
          return true;
        });
        
        // 按选择的方式排序
        if (sortBy === 'popular') {
          narratives.sort((a, b) => b.contributionCount - a.contributionCount);
        } else {
          narratives.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
      } else if (type === 'my' && userFid) {
        // 获取用户创建的叙事
        narratives = await db.query(db.indexes.narrativesByCreator, userFid, { limit });
      } else if (type === 'following' && userFid) {
        // 获取用户关注的叙事
        const followedNarratives = await db.query(db.indexes.followersByUser, userFid, { limit });
        const narrativeIds = followedNarratives.map(f => f.narrativeId);
        
        if (narrativeIds.length === 0) {
          narratives = [];
        } else {
          // 获取每个关注的叙事详情
          narratives = await Promise.all(
            narrativeIds.map(id => db.get(db.collections.narratives, id))
          );
          narratives = narratives.filter(Boolean); // 过滤掉可能不存在的叙事
        }
      } else {
        // 默认获取所有叙事并排序
        narratives = await db.query(indexName, [], { limit });
      }
      
      // 如果有搜索词，进行过滤
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        narratives = narratives.filter(n => 
          n.title.toLowerCase().includes(lowercaseSearch) ||
          n.description.toLowerCase().includes(lowercaseSearch)
        );
      }

      return success(narratives);
    } catch (err: any) {
      console.error('获取叙事列表失败:', err);
      return error(`获取叙事列表失败: ${err.message || JSON.stringify(err)}`);
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
        narrativeId,
        title: data.title,
        description: data.description,
        creatorFid: data.creatorFid,
        creatorUsername: data.creatorUsername,
        creatorDisplayName: data.creatorDisplayName,
        creatorPfp: data.creatorPfp,
        createdAt: now,
        updatedAt: now,
        status: NarrativeStatus.ACTIVE,
        collaborationRules: data.collaborationRules || CollaborationRules.OPEN,
        tags: data.tags || [],
        branchCount: 1, // 主分支
        contributionCount: 1, // 初始贡献
        contributorCount: 1, // 创建者是第一个贡献者
        featuredImageUrl: data.featuredImageUrl
      };
      
      // 创建叙事记录
      const createdNarrative = await db.create(db.collections.narratives, narrative);
      
      // 创建第一个贡献
      const contributionId = generateId();
      const contribution = {
        contributionId,
        narrativeId,
        contributorFid: data.creatorFid,
        contributorUsername: data.creatorUsername,
        contributorDisplayName: data.creatorDisplayName,
        contributorPfp: data.creatorPfp,
        parentContributionId: null, // 首个贡献没有父节点
        branchId: null, // 稍后创建分支后更新
        textContent: data.description, // 初始内容
        castHash: data.castHash,
        createdAt: now,
        upvotes: 0,
        isBranchStart: true
      };
      
      await db.create(db.collections.contributions, contribution);
      
      // 创建主分支
      const branchId = generateId();
      const branch = {
        branchId,
        narrativeId,
        name: 'Main Branch', // 主分支
        description: 'The main storyline',
        creatorFid: data.creatorFid,
        createdAt: now,
        rootContributionId: contributionId,
        parentBranchId: null, // 主分支没有父分支
        contributionCount: 1
      };
      
      await db.create(db.collections.branches, branch);
      
      // 更新贡献，添加分支ID
      await db.update(db.collections.contributions, contributionId, {
        ...contribution,
        branchId
      });
      
      return success(createdNarrative, 201);
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