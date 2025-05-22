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

        // 根据按钮索引返回不同的响应
        if (buttonIndex === 1) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Credentials': 'true'
            },
            body: JSON.stringify({
              version: 'vNext',
              image: `${APP_URL}/images/narratives.png`,
              buttons: [
                {
                  label: '返回',
                  action: 'post'
                },
                {
                  label: '在浏览器中打开',
                  action: 'link',
                  target: `${APP_URL}/narratives`
                }
              ]
            })
          };
        } else if (buttonIndex === 2) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Credentials': 'true'
            },
            body: JSON.stringify({
              version: 'vNext',
              image: `${APP_URL}/images/create.png`,
              buttons: [
                {
                  label: '返回',
                  action: 'post'
                },
                {
                  label: '在浏览器中创建',
                  action: 'link',
                  target: `${APP_URL}/narratives/create`
                }
              ]
            })
          };
        }
      }
    }

    // 返回初始Frame
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        version: 'vNext',
        image: `${APP_URL}/images/feed.png`,
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
    
    // 错误时返回基础Frame
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        version: 'vNext',
        image: `${APP_URL}/images/error.png`,
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