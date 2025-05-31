import { Handler } from '@netlify/functions';
import supabase from './utils/supabase';
import { success, error } from './utils/response';

// 生成ID的函数
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const handler: Handler = async (event) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return error(`不允许使用${event.httpMethod}方法`, 405);
  }

  try {
    console.log('开始创建测试数据...');

    // 确保数据库连接
    await supabase.setupDatabase();

    // 测试数据
    const testNarratives = [
      {
        narrative_id: generateId(),
        title: "数字世界的冒险",
        description: "在一个充满AI和虚拟现实的未来世界中，主人公发现了一个隐藏的秘密...",
        creator_fid: 12345,
        creator_username: "storyteller",
        creator_display_name: "故事大师",
        creator_pfp: "https://i.imgur.com/placeholder1.jpg",
        status: "active",
        collaboration_rules: "open",
        tags: ["科幻", "冒险", "AI"],
        branch_count: 1,
        contribution_count: 1,
        contributor_count: 1,
        featured_image_url: "https://i.imgur.com/scifi1.jpg",
        cast_hash: "0x" + Math.random().toString(16).substring(2, 42)
      },
      {
        narrative_id: generateId(),
        title: "古老森林的传说",
        description: "在一片古老的森林深处，隐藏着一个被遗忘的文明的秘密...",
        creator_fid: 67890,
        creator_username: "forestkeeper",
        creator_display_name: "森林守护者",
        creator_pfp: "https://i.imgur.com/placeholder2.jpg",
        status: "active",
        collaboration_rules: "moderated",
        tags: ["奇幻", "神秘", "自然"],
        branch_count: 2,
        contribution_count: 5,
        contributor_count: 3,
        featured_image_url: "https://i.imgur.com/forest1.jpg",
        cast_hash: "0x" + Math.random().toString(16).substring(2, 42)
      },
      {
        narrative_id: generateId(),
        title: "时空旅行者的日记",
        description: "一位意外获得时空旅行能力的普通人，记录下了他在不同时代的见闻...",
        creator_fid: 11111,
        creator_username: "timekeeper",
        creator_display_name: "时间守护者",
        creator_pfp: "https://i.imgur.com/placeholder3.jpg",
        status: "active",
        collaboration_rules: "open",
        tags: ["科幻", "时间旅行", "历史"],
        branch_count: 3,
        contribution_count: 8,
        contributor_count: 5,
        featured_image_url: "https://i.imgur.com/time1.jpg",
        cast_hash: "0x" + Math.random().toString(16).substring(2, 42)
      }
    ];

    const createdNarratives = [];

    // 创建每个叙事
    for (const narrative of testNarratives) {
      try {
        console.log(`创建叙事: ${narrative.title}`);

        // 创建叙事
        const createdNarrative = await supabase.create(supabase.tables.narratives, narrative);
        createdNarratives.push(createdNarrative);

        // 创建初始贡献
        const contribution = {
          contribution_id: generateId(),
          narrative_id: narrative.narrative_id,
          contributor_fid: narrative.creator_fid,
          contributor_username: narrative.creator_username,
          contributor_display_name: narrative.creator_display_name,
          contributor_pfp: narrative.creator_pfp,
          parent_contribution_id: null,
          branch_id: 'main',
          content: `这是《${narrative.title}》的开篇。${narrative.description}`,
          cast_hash: narrative.cast_hash,
          like_count: Math.floor(Math.random() * 10)
        };

        await supabase.create(supabase.tables.contributions, contribution);
        console.log(`✓ 创建初始贡献: ${narrative.title}`);

        // 创建主分支
        const branch = {
          branch_id: 'main',
          narrative_id: narrative.narrative_id,
          name: '主线故事',
          description: '故事的主要发展线',
          creator_fid: narrative.creator_fid,
          root_contribution_id: contribution.contribution_id,
          parent_branch_id: null,
          contribution_count: 1
        };

        await supabase.create(supabase.tables.branches, branch);
        console.log(`✓ 创建主分支: ${narrative.title}`);

      } catch (err) {
        console.error(`创建叙事失败: ${narrative.title}`, err);
      }
    }

    console.log('✅ 测试数据创建完成！');

    return success({
      message: '测试数据创建成功',
      created: createdNarratives.length,
      narratives: createdNarratives
    });

  } catch (err: any) {
    console.error('创建测试数据失败:', err);
    return error(`创建测试数据失败: ${err.message || JSON.stringify(err)}`);
  }
};
