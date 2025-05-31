"use client";

import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { Narrative } from "@/types/narrative";
import { formatDistanceToNow } from "@/lib/utils";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

interface NarrativeHeaderProps {
  narrative: Narrative;
}

export default function NarrativeHeader({ narrative }: NarrativeHeaderProps) {
  const { actions, context } = useMiniAppContext();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // 检查本地存储中的收藏状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const favorites = localStorage.getItem('castchain-favorites');
      if (favorites) {
        try {
          const favoritesArray = JSON.parse(favorites);
          setIsFavorited(favoritesArray.includes(narrative.narrativeId));
        } catch (error) {
          console.error('解析收藏列表失败:', error);
        }
      }
    }
  }, [narrative.narrativeId]);

  // 保存收藏状态到本地存储
  const saveFavoriteToLocal = (favorited: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        const favorites = localStorage.getItem('castchain-favorites');
        let favoritesArray: string[] = [];

        if (favorites) {
          favoritesArray = JSON.parse(favorites);
        }

        if (favorited && !favoritesArray.includes(narrative.narrativeId)) {
          favoritesArray.push(narrative.narrativeId);
        } else if (!favorited) {
          favoritesArray = favoritesArray.filter(id => id !== narrative.narrativeId);
        }

        localStorage.setItem('castchain-favorites', JSON.stringify(favoritesArray));
      } catch (error) {
        console.error('保存收藏状态失败:', error);
      }
    }
  };

  const handleFollowClick = async () => {
    if (!context?.user?.fid) {
      alert("请在Farcaster中打开应用以使用关注功能");
      return;
    }

    if (isFollowLoading) return;

    try {
      setIsFollowLoading(true);

      if (isFollowing) {
        // 取消关注
        const result = await api.unfollowNarrative(narrative.narrativeId, context.user.fid);
        if (result.success) {
          setIsFollowing(false);
          alert("取消关注成功!");
        }
      } else {
        // 关注
        const result = await api.followNarrative(narrative.narrativeId, context.user.fid);
        if (result.success) {
          setIsFollowing(true);
          alert("关注成功!");
        }
      }
    } catch (error) {
      console.error("关注操作失败", error);
      const errorMessage = error instanceof Error ? error.message : "操作失败";
      alert(`操作失败: ${errorMessage}`);
    } finally {
      setIsFollowLoading(false);
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
              {narrative.creatorDisplayName || narrative.creatorUsername || `FID: ${narrative.creatorFid || 'unknown'}`}
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
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition ${
            isFollowing
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-700 hover:bg-gray-600"
          } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleFollowClick}
          disabled={isFollowLoading}
        >
          {isFollowLoading ? "..." : isFollowing ? "已关注" : "关注"}
        </button>
        <button
          className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"
          onClick={handleShareClick}
        >
          分享
        </button>
        <button
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition ${
            isFavorited
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-purple-600 hover:bg-purple-700"
          } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={async () => {
            if (isFavoriteLoading) return;

            try {
              setIsFavoriteLoading(true);

              const newFavoriteState = !isFavorited;

              // 先更新本地状态和存储
              setIsFavorited(newFavoriteState);
              saveFavoriteToLocal(newFavoriteState);

              // 尝试调用Farcaster的addFrame（如果可用）
              if (actions?.addFrame && newFavoriteState) {
                try {
                  // 检查是否在Farcaster环境中
                  if (typeof window !== 'undefined' && window.parent !== window) {
                    await actions.addFrame();
                    alert("已添加到Farcaster收藏！");
                  } else {
                    alert("已添加到本地收藏！（在Farcaster中打开可同步到Farcaster收藏）");
                  }
                } catch (frameError) {
                  console.error("Farcaster addFrame失败:", frameError);
                  alert("已添加到本地收藏！（Farcaster同步失败）");
                }
              } else {
                // 没有Farcaster actions或者是取消收藏
                if (newFavoriteState) {
                  alert("已添加到本地收藏！（在Farcaster中打开可同步到Farcaster收藏）");
                } else {
                  alert("已从收藏中移除！");
                }
              }
            } catch (error) {
              console.error("添加收藏失败:", error);
              alert(`添加收藏失败: ${error instanceof Error ? error.message : "未知错误"}`);
            } finally {
              setIsFavoriteLoading(false);
            }
          }}
          disabled={isFavoriteLoading}
        >
          {isFavoriteLoading ? "..." : isFavorited ? "已收藏" : "添加收藏"}
        </button>
      </div>
    </div>
  );
}