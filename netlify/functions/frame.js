// 极简化的Netlify Frame处理函数
exports.handler = async (event, context) => {
  console.log("🔄 Frame函数被调用");
  
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'vNext',
        image: `${APP_URL}/images/feed.png`,
        buttons: [
          {
            label: '浏览故事',
            action: 'post_redirect'
          },
          {
            label: '创建新叙事',
            action: 'post_redirect'
          }
        ]
      })
    };
  } catch (error) {
    console.error("❌ 处理错误:", error);
    
    // 错误时返回基础Frame
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'vNext',
        image: `${APP_URL}/images/feed.png`,
        buttons: [
          {
            label: '重试',
            action: 'post'
          }
        ]
      })
    };
  }
}; 