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
      // Farcaster Mini App 配置
      "fc:frame": "vNext",
      "fc:frame:image": `${APP_URL}/images/feed.png`,
      "fc:frame:button:1": "启动应用",
      "fc:frame:button:1:action": "launch_frame",
      "fc:frame:button:1:target": `${APP_URL}`,
    },
  };
}

export default function HomePage() {
  return (
    <div>
      {/* 主页面现在直接是 Mini App 体验 */}
      <Home />
    </div>
  );
}
