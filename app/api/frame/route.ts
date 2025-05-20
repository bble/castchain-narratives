import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体获取Frame数据
    const requestData = await req.json();
    console.log("Frame请求数据:", requestData);

    // 构建响应 - 确保按照Farcaster Frame规范格式
    return NextResponse.json({
      version: "vNext",
      image: `${APP_URL}/images/feed.png`,
      buttons: [
        {
          label: "浏览故事",
          action: "post_redirect",
          target: `${APP_URL}/narratives`
        },
        {
          label: "创建新叙事",
          action: "post_redirect",
          target: `${APP_URL}/narratives/create`
        }
      ]
    });
  } catch (error) {
    console.error("Frame处理错误:", error);
    return NextResponse.json({
      version: "vNext",
      image: `${APP_URL}/images/error.png`,
      buttons: [
        {
          label: "重试",
          action: "post"
        }
      ]
    }, { status: 200 }); // 即使出错也返回200状态码和有效的Frame
  }
} 