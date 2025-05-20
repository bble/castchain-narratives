// Netlify函数处理Frame请求
exports.handler = async (event) => {
  try {
    // 处理OPTIONS请求 (CORS预检)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
      };
    }

    // 只处理POST请求
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: '仅支持POST请求' })
      };
    }

    // 分析请求数据
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
        console.log('Frame请求数据:', requestData);
      } catch (e) {
        console.error('解析请求数据失败:', e);
      }
    }

    // 构建Frame响应 - 严格遵循Farcaster vNext格式
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
      ]
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Frame处理出错:', error);
    
    // 返回错误Frame - 同样严格遵循规范
    return {
      statusCode: 200, // 即使有错误也返回200
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
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