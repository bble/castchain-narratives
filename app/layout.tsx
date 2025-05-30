import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FrameProvider } from "@/components/farcaster-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CastChain Narratives",
  description: "协作式故事创作平台 - 在区块链上创建和分享协作式叙事故事",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  other: {
    "fc:frame": "vNext",
    "fc:frame:name": "CastChain Narratives",
    "fc:frame:icon": "https://castchain-narratives.netlify.app/images/icon.png",
    "fc:frame:home_url": "https://castchain-narratives.netlify.app",
    "fc:frame:image": "https://castchain-narratives.netlify.app/images/feed.png",
    "fc:frame:button:1": "启动应用",
    "fc:frame:splash:image_url": "https://castchain-narratives.netlify.app/images/feed.png",
    "fc:frame:splash:background_color": "#1A1B23"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:name" content="CastChain Narratives" />
        <meta name="fc:frame:icon" content="https://castchain-narratives.netlify.app/images/icon.png" />
        <meta name="fc:frame:home_url" content="https://castchain-narratives.netlify.app" />
        <meta name="fc:frame:image" content="https://castchain-narratives.netlify.app/images/feed.png" />
        <meta name="fc:frame:button:1" content="启动应用" />
        <meta name="fc:frame:splash:image_url" content="https://castchain-narratives.netlify.app/images/feed.png" />
        <meta name="fc:frame:splash:background_color" content="#1A1B23" />
      </head>
      <body className={inter.className}>
        <FrameProvider>{children}</FrameProvider>
      </body>
    </html>
  );
}
