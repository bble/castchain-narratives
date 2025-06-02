"use client";

import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { Narrative } from "@/types/narrative";
import { formatDistanceToNow } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

interface NarrativeCardProps {
  narrative: Narrative;
}

export function NarrativeCard({ narrative }: NarrativeCardProps) {
  const { actions, context } = useMiniAppContext();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // 检查关注状态
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!context?.user?.fid) return;

      try {
        const result = await api.checkFollowStatus(narrative.narrativeId, context.user.fid);
        setIsFollowing(result.is_following || false);
      } catch (error) {
        console.error('检查关注状态失败:', error);
        // 不显示错误，静默失败
      }
    };

    checkFollowStatus();
  }, [narrative.narrativeId, context?.user?.fid]);

  // 安全检查
  if (!narrative) {
    console.warn('NarrativeCard: narrative is null or undefined');
    return null;
  }

  function handleViewNarrative(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      // 在Mini App环境中使用客户端路由导航
      router.push(`/narratives/${narrative.narrativeId}`);
    } catch (error) {
      console.error('导航到叙事详情失败:', error);
      // 降级到普通页面跳转
      window.location.href = `/narratives/${narrative.narrativeId}`;
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    // 如果点击的是按钮，不触发卡片点击
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    handleViewNarrative(e);
  }

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

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
      console.error('关注操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : "操作失败";
      alert(`操作失败: ${errorMessage}`);
    } finally {
      setIsFollowLoading(false);
    }
  }

  function handleShare() {
    try {
      // 使用Farcaster的composeCast功能分享叙事
      if (actions?.composeCast) {
        actions.composeCast({
          text: `探索这个精彩的故事: "${narrative.title}"\n\n${narrative.description}`,
          embeds: [`${window.location.origin}/narratives/${narrative.narrativeId}`],
        });
      } else {
        // 如果Farcaster API不可用，使用Web Share API或复制链接
        if (navigator.share) {
          navigator.share({
            title: narrative.title,
            text: narrative.description,
            url: `${window.location.origin}/narratives/${narrative.narrativeId}`
          });
        } else {
          // 复制链接到剪贴板
          navigator.clipboard.writeText(`${window.location.origin}/narratives/${narrative.narrativeId}`);
          alert('链接已复制到剪贴板');
        }
      }
    } catch (error) {
      console.error('分享叙事失败:', error);
    }
  }

  // 计算最后更新时间的文本
  const lastUpdatedText = (() => {
    try {
      return formatDistanceToNow(narrative.updatedAt);
    } catch (error) {
      console.warn('格式化时间失败:', error, narrative.updatedAt);
      return '时间未知';
    }
  })();

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-lg border border-gray-800 bg-[#262836] transition-transform hover:scale-[1.02]"
      onClick={handleCardClick}
    >
        {/* 封面图片 */}
        {narrative.featuredImageUrl && (
          <div className="h-40 w-full overflow-hidden bg-gray-800">
            <img
              src={narrative.featuredImageUrl}
              alt={narrative.title}
              className="h-full w-full object-cover transition-opacity duration-300"
              loading="lazy"
              onLoad={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              style={{ opacity: 0 }}
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
                  loading="lazy"
                  onError={(e) => {
                    // 如果头像加载失败，显示默认头像
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center"
                style={{ display: narrative.creatorPfp ? 'none' : 'flex' }}
              >
                <span className="text-xs">
                  {narrative.creatorDisplayName?.slice(0, 1) || narrative.creatorUsername?.slice(0, 1) || "?"}
                </span>
              </div>
              <span className="text-sm text-gray-300">
                {narrative.creatorDisplayName || narrative.creatorUsername || `FID: ${narrative.creatorFid || 'unknown'}`}
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
            {(narrative.tags || []).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300"
              >
                {tag || '未知标签'}
              </span>
            ))}
          </div>

          {/* 统计数据 */}
          <div className="mb-3 flex items-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{narrative.contributionCount || 0} 贡献</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>{narrative.branchCount || 0} 分支</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{narrative.contributorCount || 0} 贡献者</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex items-center space-x-2">
            <button
              className="flex-1 rounded-md bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700"
              onClick={handleViewNarrative}
            >
              阅读
            </button>
            <button
              className={`rounded-md px-3 py-2 text-xs font-medium text-white transition ${
                isFollowing
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-gray-800 hover:bg-gray-700"
              } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? "..." : isFollowing ? "已关注" : "关注"}
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
  );
}