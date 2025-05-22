import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

// CORS头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json"
};

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // 确保URL没有尾部斜杠
    const baseUrl = APP_URL.replace(/\/+$/, '');
    
    // 重定向到Netlify函数
    const netlifyFunctionUrl = `${baseUrl}/.netlify/functions/frame`;
    
    // 将请求转发到Netlify函数
    const requestData = await req.json();
    const response = await fetch(netlifyFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    // 获取Netlify函数的响应
    const responseData = await response.json();
    
    return NextResponse.json(responseData, { headers: corsHeaders });
  } catch (error) {
    console.error("Frame处理错误:", error);
    
    // 确保URL没有尾部斜杠
    const baseUrl = APP_URL.replace(/\/+$/, '');
    
    // 出错时的响应
    return NextResponse.json({
      version: "vNext",
      image: `${baseUrl}/images/error.png`,
      buttons: [
        { 
          label: "重试",
          action: "post"
        }
      ]
    }, { headers: corsHeaders });
  }
} 