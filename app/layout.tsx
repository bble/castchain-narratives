import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FrameProvider } from "@/components/farcaster-provider";
import { APP_URL } from "@/lib/constants";
import ErrorBoundary from "@/components/ErrorBoundary";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CastChain Narratives",
  description: "协作式故事创作平台 - 在区块链上创建和分享协作式叙事故事",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "CastChain Narratives",
    description: "协作式故事创作平台，记录在链上",
    url: APP_URL,
    images: [`${APP_URL}/images/farcaster-cover.svg`],
  },
  twitter: {
    card: "summary_large_image",
    title: "CastChain Narratives",
    description: "协作式故事创作平台，记录在链上",
    images: [`${APP_URL}/images/farcaster-cover.svg`],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${APP_URL}/images/farcaster-cover.svg`,
    "fc:frame:button:1": "立即加入",
    "fc:frame:button:1:action": "launch_frame",
    "fc:frame:button:1:target": APP_URL,
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
        <ErrorBoundary>
          <FrameProvider>{children}</FrameProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
