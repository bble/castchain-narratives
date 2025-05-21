// Netlify函数 - Frame处理器
const { Handler } = require('@netlify/functions');

// Frame处理函数
exports.handler = async (event, context) => {
  console.log("Netlify函数执行: frame.js");
  console.log(`请求方法: ${event.httpMethod}`);
  console.log(`请求路径: ${event.path}`);
  
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // 选项请求的处理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  }
  
  try {
    // 解析请求主体
    let requestData = {};
    try {
      if (event.body) {
        requestData = JSON.parse(event.body);
        console.log("Frame请求数据:", JSON.stringify(requestData, null, 2));
      } else {
        console.log("警告: 请求体为空");
      }
    } catch (parseError) {
      console.error("解析请求数据错误:", parseError);
      console.log("原始请求体:", event.body);
    }
    
    // 获取按钮索引 - 兼容多种Frame格式
    let buttonIndex = 0;
    if (requestData.untrustedData && requestData.untrustedData.buttonIndex) {
      buttonIndex = parseInt(requestData.untrustedData.buttonIndex);
    } else if (requestData.buttonIndex) {
      buttonIndex = parseInt(requestData.buttonIndex);
    }
    
    console.log(`处理按钮点击, 索引: ${buttonIndex}`);
    
    // 站点URL
    const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://castchain-narratives.netlify.app';
    console.log(`使用APP_URL: ${APP_URL}`);
    
    // 根据按钮索引返回不同的响应
    if (buttonIndex === 1) {
      // 浏览故事 - 使用post.redirect代替link
      const response = {
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        post_url: null,
        redirect: `${APP_URL}/narratives`
      };
      console.log("响应内容:", JSON.stringify(response, null, 2));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    } else if (buttonIndex === 2) {
      // 创建新叙事 - 使用post.redirect代替link
      const response = {
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        post_url: null,
        redirect: `${APP_URL}/narratives/create`
      };
      console.log("响应内容:", JSON.stringify(response, null, 2));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    } else {
      // 默认响应
      const response = {
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        buttons: [
          { label: "浏览故事", action: "post" },
          { label: "创建新叙事", action: "post" }
        ]
      };
      console.log("响应内容:", JSON.stringify(response, null, 2));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    }
  } catch (error) {
    console.error("Frame处理错误:", error);
    
    // 站点URL
    const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://castchain-narratives.netlify.app';
    
    // 错误响应
    const errorResponse = {
      version: "vNext",
      image: `${APP_URL}/images/feed.png`,
      text: "处理请求时出错，请重试"
    };
    console.log("错误响应:", JSON.stringify(errorResponse, null, 2));
    
    return {
      statusCode: 200, // 即使有错误也返回200，避免Frame显示错误
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
}; 