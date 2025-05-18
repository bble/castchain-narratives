import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add account association
    frame: {
      version: "1",
      name: "CastChain Narratives",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "故事", "叙事", "协作创作"],
      primaryCategory: "social",
      buttonTitle: "探索链上叙事",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#282c34",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
