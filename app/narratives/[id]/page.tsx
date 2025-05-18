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
  // 获取叙事数据 (服务器端渲染)
  const narrative = await api.getNarrative(params.id);
  
  if (!narrative) {
    return {
      title: "故事不存在 | CastChain Narratives",
    };
  }
  
  // 构建 Farcaster Frame
  const frame = {
    version: "next",
    image: `${APP_URL}/images/feed.png`,
    title: narrative.title,
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
    title: `${narrative.title} | CastChain Narratives`,
    description: narrative.description,
    openGraph: {
      title: narrative.title,
      description: narrative.description,
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