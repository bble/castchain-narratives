import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  // 添加CORS头
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600"
  };

  // 确保URL没有尾部斜杠
  const baseUrl = APP_URL.replace(/\/+$/, '');

  // Farcaster Mini App Manifest
  const farcasterConfig = {
    // accountAssociation 需要在发布时填写
    accountAssociation: {
      "header": "",
      "payload": "",
      "signature": ""
    },
    frame: {
      version: "1",
      name: "CastChain Narratives",
      iconUrl: `${baseUrl}/images/icon.png`,
      homeUrl: `${baseUrl}`,
      imageUrl: `${baseUrl}/images/farcaster-cover.svg`,
      buttonTitle: "立即加入",
      splashImageUrl: `${baseUrl}/images/feed.png`,
      splashBackgroundColor: "#1A1B23"
    }
  };

  return NextResponse.json(farcasterConfig, { headers });
}
