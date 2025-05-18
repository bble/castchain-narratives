import { Metadata } from "next";
import App from "@/components/pages/app";
import { APP_URL } from "@/lib/constants";

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: "探索链上叙事",
    action: {
      type: "launch_frame",
      name: "CastChain Narratives",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#282c34",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "CastChain Narratives | 链上叙事",
    openGraph: {
      title: "CastChain Narratives | 链上叙事",
      description: "参与去中心化的、可分支的、协作式故事创作，让你的创作永存于链上",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
