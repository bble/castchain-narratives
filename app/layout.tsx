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
    "fc:frame": JSON.stringify({
      "version": "1",
      "imageUrl": "https://castchain-narratives.netlify.app/images/feed.png",
      "button": {
        "title": "启动应用",
        "action": {
          "type": "launch_frame",
          "name": "CastChain Narratives",
          "url": "https://castchain-narratives.netlify.app",
          "splashImageUrl": "https://castchain-narratives.netlify.app/images/icon.png",
          "splashBackgroundColor": "#1A1B23"
        }
      }
    })
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FrameProvider>{children}</FrameProvider>
      </body>
    </html>
  );
}
