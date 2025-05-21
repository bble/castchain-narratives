import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

// CORS头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // 解析请求体获取Frame数据
    const requestData = await req.json();
    console.log("Frame请求数据详情:", JSON.stringify(requestData, null, 2));

    // 提取按钮索引 - 适配不同版本的Frame有效负载格式
    let buttonIndex = 0;
    if (requestData?.untrustedData?.buttonIndex) {
      buttonIndex = parseInt(requestData.untrustedData.buttonIndex);
    } else if (requestData?.buttonIndex) {
      buttonIndex = parseInt(requestData.buttonIndex);
    }
    
    console.log(`处理按钮点击，索引: ${buttonIndex}`);
    
    // 简化响应格式 - 只使用必要的字段
    let response;
    
    if (buttonIndex === 1) {
      // 浏览故事
      response = {
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        action: "link",
        target: `${APP_URL}/narratives`
      };
    } else if (buttonIndex === 2) {
      // 创建新叙事
      response = {
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        action: "link",
        target: `${APP_URL}/narratives/create`
      };
    } else {
      // 初始状态或未识别的按钮
      response = {
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        buttons: [
          { label: "浏览故事", action: "post" },
          { label: "创建新叙事", action: "post" }
        ]
      };
    }

    console.log("Frame响应:", JSON.stringify(response, null, 2));
    return NextResponse.json(response, { headers: corsHeaders, status: 200 });
  } catch (error) {
    console.error("Frame处理错误:", error);
    // 出错时的简化响应
    return NextResponse.json({
      version: "vNext",
      image: `${APP_URL}/images/feed.png`,
      text: "处理请求时出错，请重试"
    }, { headers: corsHeaders, status: 200 });
  }
} 