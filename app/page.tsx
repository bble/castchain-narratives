import { Metadata } from "next";
import { APP_URL } from "@/lib/constants";
import Home from "@/components/Home";

// Farcaster Mini App 和传统 Frame 的混合配置

export function generateMetadata(): Metadata {
  return {
    title: "CastChain Narratives",
    description: "协作式故事创作平台，记录在链上",
    openGraph: {
      title: "CastChain Narratives",
      description: "协作式故事创作平台，记录在链上",
      images: [`${APP_URL}/images/feed.png`],
      url: APP_URL,
    },
    other: {
      // Farcaster Mini App 配置 - 2025年最新格式
      "fc:frame": JSON.stringify({
        "version": "next",
        "imageUrl": `${APP_URL}/images/farcaster-cover.svg`,
        "button": {
          "title": "立即加入",
          "action": {
            "type": "launch_frame",
            "name": "CastChain Narratives",
            "url": APP_URL,
            "splashImageUrl": `${APP_URL}/images/icon.png`,
            "splashBackgroundColor": "#1A1B23"
          }
        }
      })
    },
  };
}

export default function HomePage() {
  return (
    <div className="w-full min-h-screen">
      {/* 主页面现在直接是 Mini App 体验 */}
      <Home />
    </div>
  );
}
