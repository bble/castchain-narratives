"use client";

import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { Narrative } from "@/types/narrative";
import { formatDistanceToNow } from "@/lib/utils";
import Link from "next/link";

interface NarrativeCardProps {
  narrative: Narrative;
}

export function NarrativeCard({ narrative }: NarrativeCardProps) {
  const { actions } = useMiniAppContext();

  function handleViewNarrative() {
    // 使用Farcaster Frames的方式打开叙事详情页
    actions?.openUrl(`${window.location.origin}/narratives/${narrative.narrativeId}`);
  }

  function handleFollow() {
    // 在实际应用中，这里应该调用API关注叙事
    console.log(`关注叙事: ${narrative.narrativeId}`);
  }

  function handleShare() {
    // 使用Farcaster的composeCast功能分享叙事
    actions?.composeCast({
      text: `探索这个精彩的故事: "${narrative.title}"\n\n${narrative.description}`,
      embeds: [`${window.location.origin}/narratives/${narrative.narrativeId}`],
    });
  }

  // 计算最后更新时间的文本
  const lastUpdatedText = formatDistanceToNow(new Date(narrative.updatedAt));

  return (
    <Link href={`/narratives/${narrative.narrativeId}`}>
      <div className="cursor-pointer overflow-hidden rounded-lg border border-gray-800 bg-[#262836] transition-transform hover:scale-[1.02]">
        {/* 封面图片 */}
        {narrative.featuredImageUrl && (
          <div className="h-40 w-full overflow-hidden">
            <img
              src={narrative.featuredImageUrl}
              alt={narrative.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* 信息区域 */}
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {narrative.creatorPfp ? (
                <img 
                  src={narrative.creatorPfp} 
                  alt="创作者头像" 
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xs">
                    {narrative.creatorDisplayName?.slice(0, 1) || narrative.creatorUsername?.slice(0, 1) || "?"}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-300">
                {narrative.creatorDisplayName || narrative.creatorUsername || `FID: ${narrative.creatorFid}`}
              </span>
            </div>
            <span className="text-xs text-gray-400">{lastUpdatedText}</span>
          </div>

          <h3 className="mb-2 text-lg font-bold text-white">{narrative.title}</h3>
          <p className="mb-3 line-clamp-2 text-sm text-gray-300">
            {narrative.description}
          </p>

          {/* 标签 */}
          <div className="mb-3 flex flex-wrap gap-1">
            {narrative.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 统计数据 */}
          <div className="mb-3 flex items-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{narrative.contributionCount} 贡献</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>{narrative.branchCount} 分支</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{narrative.contributorCount} 贡献者</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <button 
              className="flex-1 rounded-md bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700"
              onClick={handleViewNarrative}
            >
              阅读
            </button>
            <button 
              className="rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-700"
              onClick={handleFollow}
            >
              关注
            </button>
            <button 
              className="rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-700"
              onClick={handleShare}
            >
              分享
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
} 