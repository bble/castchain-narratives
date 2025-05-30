import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 添加CORS头
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    // 使用硬编码的URL避免环境变量问题
    const baseUrl = "https://castchain-narratives.netlify.app";

    // Farcaster Mini App Manifest
    const farcasterConfig = {
      accountAssociation: {
        header: "",
        payload: "",
        signature: ""
      },
      frame: {
        version: "1",
        name: "CastChain Narratives",
        iconUrl: `${baseUrl}/images/icon.png`,
        homeUrl: baseUrl,
        imageUrl: `${baseUrl}/images/feed.png`,
        buttonTitle: "启动应用",
        splashImageUrl: `${baseUrl}/images/feed.png`,
        splashBackgroundColor: "#1A1B23"
      }
    };

    return NextResponse.json(farcasterConfig, { headers });
  } catch (error) {
    console.error('Error in farcaster.json API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}