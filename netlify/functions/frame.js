// 极简化的Netlify Frame处理函数
const { Handler } = require('@netlify/functions');

exports.handler = async (event, context) => {
  console.log("🔄 Frame函数被调用");
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  }
  
  const APP_URL = 'https://castchain-narratives.netlify.app';
  
  try {
    // 处理POST请求（按钮点击）
    if (event.httpMethod === 'POST' && event.body) {
      const data = JSON.parse(event.body);
      console.log("📥 请求数据:", JSON.stringify(data));

      if (data.untrustedData?.buttonIndex) {
        const buttonIndex = parseInt(data.untrustedData.buttonIndex);
        console.log(`🔢 按钮索引: ${buttonIndex}`);

        // 返回302重定向响应
        return {
          statusCode: 302,
          headers: {
            ...headers,
            'Location': buttonIndex === 1 
              ? `${APP_URL}/narratives`
              : `${APP_URL}/narratives/create`
          }
        };
      }
    }

    // 返回初始Frame
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        version: 'vNext',
        image: `${APP_URL}/images/feed.png`,
        buttons: [
          { label: '浏览故事' },
          { label: '创建新叙事' }
        ]
      })
    };
  } catch (error) {
    console.error("❌ 处理错误:", error);
    
    // 错误时返回基础Frame
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        version: 'vNext',
        image: `${APP_URL}/images/feed.png`,
        buttons: [
          { label: '重试' }
        ]
      })
    };
  }
}; 