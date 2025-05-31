import { Metadata } from "next";
import NarrativeDetail from "@/components/pages/NarrativeDetail";
import { APP_URL } from "@/lib/constants";
import { api } from "@/lib/api";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // 暂时移除服务器端API调用，避免部署问题
  const narrativeId = params.id;

  // 构建默认的 Farcaster Frame
  const frame = {
    version: "next",
    image: `${APP_URL}/images/feed.png`,
    title: `叙事 ${narrativeId}`,
    buttons: [
      {
        label: "阅读故事",
        action: "post",
      },
      {
        label: "贡献内容",
        action: "post_redirect",
      },
    ],
  };

  return {
    title: `叙事 ${narrativeId} | CastChain Narratives`,
    description: "探索协作叙事的无限可能",
    openGraph: {
      title: `叙事 ${narrativeId}`,
      description: "探索协作叙事的无限可能",
      type: "article",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function NarrativePage({ params }: PageProps) {
  return <NarrativeDetail narrativeId={params.id} />;
}