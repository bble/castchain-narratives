import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  // 添加CORS头
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  // 修改Frame验证配置，使用Netlify函数URL
  return NextResponse.json({
    name: "CastChain Narratives",
    description: "去中心化、可分支的协作式故事创作平台",
    image: `${APP_URL}/images/logo.png`,
    external_url: APP_URL,
    frames: {
      version: "vNext",
      image: `${APP_URL}/images/feed.png`,
      post_url: `${APP_URL}/.netlify/functions/frame`,
      buttons: [
        {
          label: "浏览故事",
          action: "post"
        },
        {
          label: "创建新叙事", 
          action: "post"
        }
      ]
    }
  }, { headers });
}
