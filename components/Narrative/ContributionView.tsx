"use client";

import { useState } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { NarrativeContribution } from "@/types/narrative";
import { formatDistanceToNow } from "@/lib/utils";
import { api } from "@/lib/api";

interface ContributionViewProps {
  contribution: NarrativeContribution;
}

export default function ContributionView({ contribution }: ContributionViewProps) {
  const { actions, context } = useMiniAppContext();
  const [upvotes, setUpvotes] = useState(contribution.upvotes);
  const [isLiking, setIsLiking] = useState(false);

  const formattedTime = formatDistanceToNow(new Date(contribution.createdAt));

  // 处理点赞按钮点击
  const handleLikeClick = async () => {
    if (!context?.user?.fid) {
      // 用户未登录
      alert("请先登录Farcaster账号");
      return;
    }

    try {
      setIsLiking(true);
      const result = await api.likeContribution(
        contribution.narrativeId,
        contribution.contributionId
      );

      if (result.success) {
        setUpvotes(result.upvotes);
      }
    } catch (error) {
      console.error("点赞失败", error);
    } finally {
      setIsLiking(false);
    }
  };

  // 处理回复按钮点击
  const handleReplyClick = () => {
    if (actions) {
      // 使用Farcaster的回复功能
      actions.composeCast({
        text: `回复故事片段：\n\n"${contribution.textContent.substring(0, 50)}${contribution.textContent.length > 50 ? "..." : ""}"`,
        embeds: [`https://farcaster.xyz/${contribution.contributorUsername || contribution.contributorFid}/casts/${contribution.castHash}`],
      });
    }
  };

  // 处理查看原Cast点击
  const handleViewCastClick = () => {
    if (actions?.openUrl) {
      // 在Mini App中使用Farcaster的openUrl
      actions.openUrl(`https://farcaster.xyz/${contribution.contributorUsername || contribution.contributorFid}/casts/${contribution.castHash}`);
    } else {
      // 降级到复制链接
      const castUrl = `https://farcaster.xyz/${contribution.contributorUsername || contribution.contributorFid}/casts/${contribution.castHash}`;
      navigator.clipboard.writeText(castUrl);
      alert('Cast链接已复制到剪贴板');
    }
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-[#262836] p-4">
      {/* 顶部信息 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {contribution.contributorPfp ? (
            <img
              src={contribution.contributorPfp}
              alt="贡献者头像"
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-xs">{contribution.contributorDisplayName?.slice(0, 1) || "?"}</span>
            </div>
          )}
          <div>
            <div className="font-medium">
              {contribution.contributorDisplayName || contribution.contributorUsername || `FID: ${contribution.contributorFid}`}
            </div>
            <button
              className="text-xs text-purple-400 hover:text-purple-300"
              onClick={handleViewCastClick}
            >
              查看原Cast
            </button>
          </div>
        </div>
        <span className="text-xs text-gray-400">{formattedTime}</span>
      </div>

      {/* 分支标记 */}
      {contribution.isBranchStart && (
        <div className="mb-3 inline-block rounded-full bg-purple-900 px-2 py-1 text-xs">
          新分支起点
        </div>
      )}

      {/* 内容 */}
      <div className="prose prose-invert max-w-none">
        <p className="mb-6 whitespace-pre-wrap text-gray-200">{contribution.textContent}</p>
      </div>

      {/* 底部交互按钮 */}
      <div className="mt-4 flex items-center justify-between text-gray-400">
        <div className="flex items-center space-x-4">
          <button
            className={`flex items-center space-x-1 hover:text-purple-400 ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleLikeClick}
            disabled={isLiking}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{isLiking ? '处理中...' : '点赞'}</span>
          </button>
          <button
            className="flex items-center space-x-1 hover:text-purple-400"
            onClick={handleReplyClick}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>回复</span>
          </button>
        </div>
        <div className="text-sm">
          {upvotes > 0 && (
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {upvotes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}