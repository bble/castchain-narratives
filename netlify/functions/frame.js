// 独立的轻量级Frame处理函数
exports.handler = async (event) => {
  // 简单的Frame响应
  const response = {
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

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(response)
  };
}; 