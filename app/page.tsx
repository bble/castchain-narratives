import { Metadata } from "next";
import { APP_URL } from "@/lib/constants";
import Home from "@/components/Home";

export function generateMetadata(): Metadata {
  const frame = {
    version: "next",
    image: `${APP_URL}/images/feed.png`,
    title: "CastChain Narratives",
    buttons: [
      {
        label: "浏览故事",
        action: "post_redirect"
      },
      {
        label: "创建故事",
        action: "post"
      }
    ],
  };

  return {
    title: "CastChain Narratives",
    description: "协作式故事创作平台，记录在链上",
    openGraph: {
      title: "CastChain Narratives",
      description: "协作式故事创作平台，记录在链上",
      images: [`${APP_URL}/images/og.png`],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function HomePage() {
  return <Home />;
}
