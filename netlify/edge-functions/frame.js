// 极简版Frame处理Edge Function
export default async () => {
  // 基本的Frame响应
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
    ]
  };

  // 返回最简单的响应
  return new Response(JSON.stringify(frameData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}; 