// Netlify函数处理Frame请求 - 轻量级版本
exports.handler = async (event) => {
  try {
    // 只处理POST请求
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: '仅支持POST请求' })
      };
    }

    // 构建最小的Frame响应
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
  } catch (error) {
    console.error('Frame处理出错:', error);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        version: "vNext",
        image: "https://castchain-narratives.netlify.app/images/error.png",
        buttons: [
          {
            label: "重试",
            action: "post"
          }
        ]
      })
    };
  }
}; 