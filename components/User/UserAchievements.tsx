"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { AchievementType, UserAchievement } from "@/types/narrative";
import { api } from "@/lib/api";
import AchievementMinter from "./AchievementMinter";

export function UserAchievements() {
  const { context } = useMiniAppContext();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<AchievementType | null>(null);
  const [showMinter, setShowMinter] = useState(false);

  // 加载用户成就
  useEffect(() => {
    async function loadAchievements() {
      if (!context?.user?.fid) return;

      try {
        setLoading(true);
        const data = await api.getUserAchievements(context.user.fid);
        setAchievements(data);
      } catch (error) {
        console.error("加载成就失败", error);
      } finally {
        setLoading(false);
      }
    }

    loadAchievements();
  }, [context?.user?.fid]);

  // 处理铸造按钮点击
  const handleMintClick = (type: AchievementType) => {
    setSelectedType(type);
    setShowMinter(true);
  };

  // 处理成功铸造
  const handleMintSuccess = (newAchievement: UserAchievement) => {
    setAchievements([...achievements, newAchievement]);
  };

  // 关闭铸造界面
  const handleCloseMinter = () => {
    setShowMinter(false);
  };

  // 成就类型信息
  const achievementTypes = [
    {
      type: AchievementType.CREATOR,
      title: "创作者成就",
      description: "创建原创叙事的杰出创作者",
      imgUrl: "/images/creator-badge.png",
    },
    {
      type: AchievementType.CONTRIBUTOR,
      title: "贡献者徽章",
      description: "积极参与并创作高质量故事内容的贡献者",
      imgUrl: "/images/contributor-badge.png",
    },
    {
      type: AchievementType.POPULAR_BRANCH,
      title: "分支先锋成就",
      description: "创建受欢迎分支的开创者",
      imgUrl: "/images/branch-pioneer.png",
    },
    {
      type: AchievementType.COMPLETED_NARRATIVE,
      title: "完成叙事成就",
      description: "参与并完成一个叙事的成就",
      imgUrl: "/images/completed-narrative.png",
    }
  ];

  if (!context?.user?.fid) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-lg font-medium">请连接 Farcaster 账号</p>
        <p className="mt-2 text-sm text-gray-400">
          你需要连接你的 Farcaster 账号来查看成就
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">我的成就</h2>

      {/* 加载中状态 */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {/* 铸造成就界面 */}
      {showMinter && selectedType && context?.user?.fid && (
        <AchievementMinter
          userFid={context.user.fid}
          achievementType={selectedType}
          onMintSuccess={handleMintSuccess}
          onClose={handleCloseMinter}
        />
      )}

      {/* 成就列表 */}
      {!loading && (
        <>
          {/* 展示已获得的成就 */}
          {achievements.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.achievementId}
                  className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden"
                >
                  <div className="h-40 bg-gray-800 flex items-center justify-center">
                    <img
                      src={achievement.imageUrl || "/images/achievement-placeholder.png"}
                      alt={achievement.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{achievement.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-purple-400">
                        Token #{achievement.tokenId}
                      </span>
                      {achievement.transactionHash && (
                        <a
                          href={`https://explorer.monad.xyz/tx/${achievement.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:underline"
                        >
                          查看详情
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center">
              <p className="text-lg font-medium">还没有成就</p>
              <p className="mt-2 text-sm text-gray-400">
                参与故事创作，获得链上成就
              </p>
            </div>
          )}

          {/* 可铸造的成就 */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">可铸造的成就</h3>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {achievementTypes.map((achievement) => (
                <div
                  key={achievement.type}
                  className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden"
                >
                  <div className="h-40 bg-gray-800 flex items-center justify-center">
                    {achievement.imgUrl ? (
                      <img
                        src={achievement.imgUrl}
                        alt={achievement.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-600">成就图片</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{achievement.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {achievement.description}
                    </p>
                    <button
                      onClick={() => handleMintClick(achievement.type)}
                      className="mt-4 w-full rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                    >
                      铸造成就
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 