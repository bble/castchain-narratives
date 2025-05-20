import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体获取Frame数据
    const requestData = await req.json();
    console.log("Frame请求数据:", requestData);

    // 构建响应
    const frameResponse = {
      image: `${APP_URL}/images/feed.png`,
      title: "探索CastChain叙事世界",
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
    };

    return NextResponse.json(frameResponse);
  } catch (error) {
    console.error("Frame处理错误:", error);
    return NextResponse.json(
      {
        image: `${APP_URL}/images/error.png`,
        title: "出错了，请稍后再试"
      },
      { status: 500 }
    );
  }
} 