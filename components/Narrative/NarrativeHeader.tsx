"use client";

import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { Narrative } from "@/types/narrative";
import { formatDistanceToNow } from "@/lib/utils";
import { api } from "@/lib/api";

interface NarrativeHeaderProps {
  narrative: Narrative;
}

export default function NarrativeHeader({ narrative }: NarrativeHeaderProps) {
  const { actions, context } = useMiniAppContext();

  const handleFollowClick = async () => {
    if (!context?.user?.fid) {
      alert("请先登录Farcaster账号以关注叙事");
      return;
    }
    
    try {
      const result = await api.followNarrative(narrative.narrativeId, context.user.fid);
      if (result.success) {
        alert("关注成功!");
      }
    } catch (error) {
      console.error("关注失败", error);
      alert("关注失败，请重试");
    }
  };

  const handleShareClick = () => {
    if (actions) {
      actions.composeCast({
        text: `我正在阅读"${narrative.title}"\n\n${narrative.description}`,
        embeds: [`${window.location.origin}/narratives/${narrative.narrativeId}`],
      });
    }
  };

  const lastUpdatedText = formatDistanceToNow(new Date(narrative.updatedAt));

  return (
    <div className="border-b border-gray-800 bg-[#262836] p-4">
      <div className="mb-4">
        {narrative.featuredImageUrl && (
          <div className="mb-4 h-32 w-full overflow-hidden rounded-lg sm:h-48">
            <img
              src={narrative.featuredImageUrl}
              alt={narrative.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mb-4 flex items-center">
          {narrative.creatorPfp ? (
            <img 
              src={narrative.creatorPfp} 
              alt="创作者头像" 
              className="h-10 w-10 rounded-full mr-3"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
              <span className="text-lg">
                {narrative.creatorDisplayName?.slice(0, 1) || narrative.creatorUsername?.slice(0, 1) || "?"}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium">
              {narrative.creatorDisplayName || narrative.creatorUsername || `FID: ${narrative.creatorFid}`}
            </div>
            <div className="text-xs text-gray-400">
              最后更新: {lastUpdatedText}
            </div>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">{narrative.title}</h1>
        <p className="mb-4 text-gray-300">{narrative.description}</p>

        <div className="mb-3 flex flex-wrap gap-1">
          {narrative.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{narrative.contributionCount} 贡献</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>{narrative.branchCount} 分支</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{narrative.contributorCount} 贡献者</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"
          onClick={handleFollowClick}
        >
          关注
        </button>
        <button
          className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"
          onClick={handleShareClick}
        >
          分享
        </button>
        <button
          className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          onClick={() => actions?.addFrame()}
        >
          添加收藏
        </button>
      </div>
    </div>
  );
} 