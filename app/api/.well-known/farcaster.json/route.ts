import { NextResponse } from "next/server";
import { APP_URL } from "../../../../lib/constants";

export async function GET() {
  // 添加CORS头
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  // 确保URL没有尾部斜杠
  const baseUrl = APP_URL.replace(/\/+$/, '');

  // 使用简化格式
  return NextResponse.json({
    name: "CastChain Narratives",
    description: "去中心化、可分支的协作式故事创作平台",
    image: `${baseUrl}/images/logo.png`,
    external_url: baseUrl,
    frames: {
              version: "vNext",
      image: `${baseUrl}/images/feed.png`,
      post_url: `${baseUrl}/.netlify/functions/frame`,
              buttons: [
                {
          label: "浏览故事"
                },
                {
          label: "创建新叙事"
                }
              ]
    }
  }, { headers });
} 