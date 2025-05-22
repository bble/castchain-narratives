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
  
  try {
    const APP_URL = 'https://castchain-narratives.netlify.app';
    let buttonIndex = 0;
    
    // 检测是否已有state数据
    if (event.body) {
      try {
        const data = JSON.parse(event.body);
        console.log("📥 请求数据:", JSON.stringify(data));
        
        // 从数据中提取信息
        if (data.untrustedData && data.untrustedData.buttonIndex) {
          buttonIndex = parseInt(data.untrustedData.buttonIndex);
        }
    
        console.log(`🔢 按钮索引: ${buttonIndex}`);

        // 根据按钮索引返回Frame响应
        if (buttonIndex === 1) {
          const redirectUrl = `${APP_URL}/narratives`;
          console.log("📤 重定向到:", redirectUrl);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              version: 'vNext',
              action: 'post_redirect',
              redirect: redirectUrl
            })
          };
        } else if (buttonIndex === 2) {
          const redirectUrl = `${APP_URL}/narratives/create`;
          console.log("📤 重定向到:", redirectUrl);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              version: 'vNext',
              action: 'post_redirect',
              redirect: redirectUrl
            })
          };
        }
      } catch (err) {
        console.error("⚠️ 解析请求失败:", err);
      }
    }
    
    // 如果没有按钮点击，返回初始Frame
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        version: 'vNext',
        image: `${APP_URL}/images/feed.png`,
        imageAspectRatio: '1.91:1',
        buttons: [
          {
            label: '浏览故事',
            action: 'post'
          },
          {
            label: '创建新叙事',
            action: 'post'
          }
        ]
      })
    };
  } catch (error) {
    console.error("❌ 处理错误:", error);
    
    // 错误响应
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        version: 'vNext',
        image: `${APP_URL}/images/error.png`,
        imageAspectRatio: '1.91:1',
        buttons: []
      })
    };
  }
}; 