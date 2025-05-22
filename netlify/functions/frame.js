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
  const createFrameResponse = (image, buttons, state = 'initial') => {
    const response = {
      version: 'vNext',
      image: `${APP_URL}/images/${image}`,
      buttons,
      post_url: `${APP_URL}/.netlify/functions/frame`,
      state
    };

    console.log('📤 发送响应:', JSON.stringify(response));
    
    if (!validateResponse(response)) {
      throw new Error('Invalid frame response format');
    }

    return response;
  };

  // 获取初始Frame响应
  const getInitialResponse = () => createFrameResponse('feed.png', [
    {
      label: '浏览故事',
      action: 'post'
    },
    {
      label: '创建新叙事',
      action: 'post'
    }
  ], 'initial');

  try {
    // 处理POST请求（按钮点击）
    if (event.httpMethod === 'POST' && event.body) {
      const data = JSON.parse(event.body);
      console.log("📥 请求数据:", JSON.stringify(data));

      if (data.untrustedData?.buttonIndex) {
        const buttonIndex = parseInt(data.untrustedData.buttonIndex);
        console.log(`🔢 按钮索引: ${buttonIndex}`);

        // 获取当前状态
        const currentState = data.untrustedData.state;
        console.log(`🔄 当前状态: ${currentState || 'initial'}`);

        // 如果当前不是初始状态且点击了返回按钮
        if (currentState && currentState !== 'initial' && buttonIndex === 1) {
          console.log('⬅️ 返回到初始状态');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(getInitialResponse())
          };
        }

        // 根据当前状态和按钮索引返回不同的响应
        if (!currentState || currentState === 'initial') {
          if (buttonIndex === 1) {
            console.log('📖 进入浏览故事状态');
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(createFrameResponse('narrative_preview.png', [
                {
                  label: '返回',
                  action: 'post'
                }
              ], 'preview'))
            };
          } else if (buttonIndex === 2) {
            console.log('✍️ 进入创建新叙事状态');
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(createFrameResponse('achievement.png', [
                {
                  label: '返回',
                  action: 'post'
                }
              ], 'create'))
            };
          }
        } else if (currentState === 'preview') {
          console.log('🔍 处理浏览故事状态的按钮点击');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(getInitialResponse())
          };
        } else if (currentState === 'create') {
          console.log('📝 处理创建新叙事状态的按钮点击');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(getInitialResponse())
          };
        }
      }
    }

    // 返回初始Frame
    console.log('🏠 返回初始状态');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(getInitialResponse())
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
      ], 'error'))
    };
  }
}; 