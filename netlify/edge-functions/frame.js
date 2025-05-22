// 极简版Frame处理Edge Function
export default async () => {
  // 基本的Frame响应，确保URL格式正确
  const baseUrl = "https://castchain-narratives.netlify.app";
  const frameData = {
    version: "vNext",
    image: `${baseUrl}/images/feed.png`,
    buttons: [
      {
        label: "浏览故事",
        action: "link", 
        target: `${baseUrl}/narratives`
      },
      {
        label: "创建新叙事",
        action: "link",
        target: `${baseUrl}/narratives/create`
      }
    ]
  };

  // 返回最简单的响应
  return new Response(JSON.stringify(frameData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true"
    }
  });
}; 