// Netlify函数 - Frame处理器 - 极简版本
const { Handler } = require('@netlify/functions');

// Frame处理函数
exports.handler = async (event, context) => {
  console.log("Frame函数已调用 - 极简版本");
  console.log(`请求方法: ${event.httpMethod}`);
  console.log(`请求路径: ${event.path}`);
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  }
  
  try {
    // 处理APP_URL，确保没有尾部斜杠
    const APP_URL = (process.env.NEXT_PUBLIC_URL || 'https://castchain-narratives.netlify.app').replace(/\/+$/, '');
    console.log(`APP_URL: ${APP_URL}`);
    
    // 函数URL
    const FUNCTION_URL = `${APP_URL}/.netlify/functions/frame`;
    
    // 极简响应 - 只使用link按钮
    const responseData = {
      version: "vNext",
      image: `${APP_URL}/images/feed.png`,
      buttons: [
        {
          label: "进入网站",
          action: "link",
          target: `${APP_URL}`
        }
      ]
    };
    
    console.log("返回极简响应:", JSON.stringify(responseData, null, 2));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error("处理Frame请求时出错:", error);
    
    // 处理APP_URL，确保没有尾部斜杠
    const APP_URL = (process.env.NEXT_PUBLIC_URL || 'https://castchain-narratives.netlify.app').replace(/\/+$/, '');
    
    // 返回错误响应
    const errorResponse = {
      version: "vNext",
      image: `${APP_URL}/images/error.png`,
      buttons: [
        {
          label: "重试",
          action: "link",
          target: `${APP_URL}`
        }
      ]
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
}; 