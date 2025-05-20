// Netlify Edge Function - 处理Frame请求
export default async (request, context) => {
  // 无需任何依赖的简单Frame响应
  const frameData = {
    version: "vNext",
    image: "https://castchain-narratives.netlify.app/images/feed.png",
    buttons: [
      {
        label: "浏览故事",
        action: "post_redirect", 
        target: "https://castchain-narratives.netlify.app/narratives"
      },
      {
        label: "创建新叙事",
        action: "post_redirect",
        target: "https://castchain-narratives.netlify.app/narratives/create"
      }
    ],
    accepts: ["iframe.warpcast.com"]
  };

  // 创建响应
  return new Response(JSON.stringify(frameData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}; 