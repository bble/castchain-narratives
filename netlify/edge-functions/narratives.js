// 模拟叙事数据的Edge Function
export default async (request) => {
  // 解析查询参数
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // 生成模拟数据
  const mockNarratives = Array.from({ length: 10 }).map((_, index) => ({
    id: `narrative-${index + 1}`,
    title: `示例叙事 ${index + 1}`,
    description: `这是一个示例叙事描述，用于演示应用功能。`,
    castHash: `0x${Array.from({ length: 64 }).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    creatorFid: 1234,
    creatorUsername: "demo_user",
    creatorDisplayName: "演示用户",
    creatorPfp: "https://castchain-narratives.netlify.app/images/avatar-placeholder.png",
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["科幻", "冒险"],
    status: "active",
    contributionsCount: Math.floor(Math.random() * 50) + 1,
    branchesCount: Math.floor(Math.random() * 5),
    upvotesCount: Math.floor(Math.random() * 100),
    viewsCount: Math.floor(Math.random() * 1000),
    followersCount: Math.floor(Math.random() * 50),
    collaborationRules: {
      allowBranches: true,
      requireApproval: false,
      maxContributionLength: 500
    },
    featuredImageUrl: `https://castchain-narratives.netlify.app/images/narrative-${(index % 5) + 1}.jpg`
  }));

  // 返回JSON响应
  return new Response(JSON.stringify(mockNarratives), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}; 