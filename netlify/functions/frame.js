// 极简化的Netlify Frame处理函数
exports.handler = async (event, context) => {
  console.log("🔄 Frame函数被调用");
  
  const APP_URL = 'https://castchain-narratives.netlify.app';
  
  // 通用响应头
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'no-store, no-cache'
  };

  // 验证响应格式
  const validateResponse = (response) => {
    const required = ['version', 'image', 'buttons', 'post_url'];
    const missing = required.filter(field => !response[field]);
    
    if (missing.length > 0) {
      console.error(`❌ 响应缺少必需字段: ${missing.join(', ')}`);
      return false;
    }

    if (!response.buttons.every(button => button.label && button.action)) {
      console.error('❌ 按钮缺少必需属性');
      return false;
    }

    return true;
  };

  // 创建Frame响应
  const createFrameResponse = (image, buttons) => {
    const response = {
      version: 'vNext',
      image: `${APP_URL}/images/${image}`,
      buttons,
      post_url: `${APP_URL}/.netlify/functions/frame`
    };

    console.log('📤 发送响应:', JSON.stringify(response));
    
    if (!validateResponse(response)) {
      throw new Error('Invalid frame response format');
    }

    return response;
  };

  try {
    // 处理POST请求（按钮点击）
    if (event.httpMethod === 'POST' && event.body) {
      const data = JSON.parse(event.body);
      console.log("📥 请求数据:", JSON.stringify(data));

      if (data.untrustedData?.buttonIndex) {
        const buttonIndex = parseInt(data.untrustedData.buttonIndex);
        console.log(`🔢 按钮索引: ${buttonIndex}`);

        // 根据按钮索引返回不同的响应
        if (buttonIndex === 1) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(createFrameResponse('narrative_preview.png', [
              {
                label: '返回',
                action: 'post'
              }
            ]))
          };
        } else if (buttonIndex === 2) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(createFrameResponse('achievement.png', [
              {
                label: '返回',
                action: 'post'
              }
            ]))
          };
        }
      }
    }

    // 返回初始Frame
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(createFrameResponse('feed.png', [
        {
          label: '浏览故事',
          action: 'post'
        },
        {
          label: '创建新叙事',
          action: 'post'
        }
      ]))
    };
  } catch (error) {
    console.error("❌ 处理错误:", error);
    
    // 错误时返回基础Frame
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(createFrameResponse('error.png', [
        {
          label: '重试',
          action: 'post'
        }
      ]))
    };
  }
}; 