import { Metadata } from "next";
import { APP_URL } from "@/lib/constants";
import Home from "@/components/Home";

export function generateMetadata(): Metadata {
  return {
    title: "CastChain Narratives",
    description: "协作式故事创作平台，记录在链上",
    openGraph: {
      title: "CastChain Narratives",
      description: "协作式故事创作平台，记录在链上",
      images: [`${APP_URL}/images/feed.png`],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${APP_URL}/images/feed.png`,
      "fc:frame:post_url": `${APP_URL}/.netlify/functions/frame`,
      "fc:frame:button:1": "浏览故事",
      "fc:frame:button:1:action": "post",
      "og:image": `${APP_URL}/images/feed.png`
    },
  };
}

export default function HomePage() {
  return <Home />;
}
