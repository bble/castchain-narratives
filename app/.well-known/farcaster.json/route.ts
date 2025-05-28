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
      imageUrl: `${baseUrl}/images/feed.png`,
      screenshotUrls: [
        `${baseUrl}/images/screenshot1.png`,
        `${baseUrl}/images/screenshot2.png`
      ],
      tags: ["blockchain", "narratives", "storytelling", "collaboration", "web3"],
      primaryCategory: "social",
      buttonTitle: "启动应用",
      splashImageUrl: `${baseUrl}/images/splash.png`,
      splashBackgroundColor: "#1A1B23",
      subtitle: "协作式故事创作平台",
      description: "在区块链上创建和分享协作式叙事故事，记录每个贡献者的创作历程。支持多人协作、分支叙事、NFT 铸造等功能。",
      heroImageUrl: `${baseUrl}/images/feed.png`,
      tagline: "链上叙事，共创未来",
      ogTitle: "CastChain Narratives - 协作式故事创作平台",
      ogDescription: "在区块链上创建和分享协作式叙事故事，记录每个贡献者的创作历程",
      ogImageUrl: `${baseUrl}/images/feed.png`
    }
  };

  return NextResponse.json(farcasterConfig, { headers });
}
