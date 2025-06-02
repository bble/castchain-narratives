"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { AchievementType, UserAchievement } from "@/types/narrative";
import { api } from "@/lib/api";
import { ACHIEVEMENT_CONTRACT_ADDRESS, MONAD_EXPLORER_URL } from "@/lib/constants";

interface AchievementMinterProps {
  userFid: number;
  achievementType: AchievementType;
  narrativeId?: string;
  contributionId?: string;
  onMintSuccess?: (achievement: UserAchievement) => void;
  onClose: () => void;
}

export default function AchievementMinter({
  userFid,
  achievementType,
  narrativeId,
  contributionId,
  onMintSuccess,
  onClose,
}: AchievementMinterProps) {
  const { context, actions } = useMiniAppContext();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);

  // 铸造描述
  const achievementInfo = {
    [AchievementType.CREATOR]: {
      title: "创作者成就",
      description: "创建原创叙事的杰出创作者",
      imgUrl: "/images/creator-achievement.svg",
    },
    [AchievementType.CONTRIBUTOR]: {
      title: "贡献者徽章",
      description: "积极参与并创作高质量故事内容的贡献者",
      imgUrl: "/images/contributor-achievement.svg",
    },
    [AchievementType.POPULAR_BRANCH]: {
      title: "分支先锋成就",
      description: "创建受欢迎分支的开创者",
      imgUrl: "/images/branch-pioneer-achievement.svg",
    },
    [AchievementType.COMPLETED_NARRATIVE]: {
      title: "完成叙事成就",
      description: "参与并完成一个叙事的成就",
      imgUrl: "/images/completed-narrative-achievement.svg",
    }
  };

  const info = achievementInfo[achievementType];

  // 向后端确认铸造完成 - 使用useCallback包装以避免不必要的重新创建
  const confirmMintToBackend = useCallback(async (newTokenId: string) => {
    try {
      // 这里假设我们有一个achievementId
      const achievementId = `${achievementType}-${userFid}-${Date.now()}`;

      await api.confirmAchievementMint(
        achievementId,
        transactionHash!,
        newTokenId
      );

      // 如果有回调，传递成就信息
      if (onMintSuccess) {
        const newAchievement: UserAchievement = {
          achievementId,
          type: achievementType,
          title: info.title,
          description: info.description,
          imageUrl: info.imgUrl || "/images/creator-achievement.svg",
          awardedAt: new Date().toISOString(),
          ownerFid: userFid,
          narrativeId: narrativeId,
          contributionId: contributionId,
          tokenId: newTokenId,
          transactionHash: transactionHash!,
        };

        onMintSuccess(newAchievement);
      }
    } catch (error) {
      console.error("确认铸造完成失败:", error);
      // 此处不阻止用户继续，仅记录错误
    }
  }, [achievementType, userFid, transactionHash, onMintSuccess, info.title, info.description, info.imgUrl, narrativeId, contributionId]);

  // 监听交易状态
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // 如果有交易哈希，并且处于等待确认状态，则轮询交易状态
    if (transactionHash && isPendingConfirmation && publicClient) {
      intervalId = setInterval(async () => {
        try {
          // 检查交易状态
          const receipt = await publicClient.getTransactionReceipt({
            hash: transactionHash as `0x${string}`
          });

          if (receipt && receipt.status === 'success') {
            // 交易成功
            clearInterval(intervalId);

            // 从事件日志中查找tokenId
            const log = receipt.logs.find(log =>
              log.address.toLowerCase() === ACHIEVEMENT_CONTRACT_ADDRESS.toLowerCase()
            );

            if (log && log.topics.length > 1) {
              try {
                // 简单解析tokenId (第一个topic是事件签名，第二个是tokenId)
                const tokenIdHex = log.topics[1];
                if (tokenIdHex) {
                  const newTokenId = BigInt(tokenIdHex).toString();
                  setTokenId(newTokenId);

                  // 通知后端交易已确认
                  await confirmMintToBackend(newTokenId);
                }
              } catch (error) {
                console.error("解析日志失败:", error);
              }
            }

            setIsPendingConfirmation(false);
            setSuccess(true);
          } else if (receipt && receipt.status === 'reverted') {
            // 交易失败
            clearInterval(intervalId);
            setIsPendingConfirmation(false);
            setError("交易失败，请重试");
          }
        } catch (error) {
          console.error("检查交易状态失败:", error);
        }
      }, 5000); // 每5秒检查一次
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transactionHash, isPendingConfirmation, confirmMintToBackend, publicClient]);

  // 准备成就元数据
  const prepareMetadata = () => {
    // 元数据结构
    const metadata = {
      name: info.title,
      description: info.description,
      image: info.imgUrl || "https://picsum.photos/300/300",
      external_url: `${window.location.origin}/narratives/${narrativeId || ""}`,
      attributes: [
        { trait_type: "Type", value: getAchievementTypeValue(achievementType) },
        { trait_type: "Date Awarded", value: new Date().toISOString().split('T')[0] }
      ]
    };

    // 添加叙事相关属性
    if (narrativeId) {
      metadata.attributes.push({ trait_type: "Narrative ID", value: narrativeId });
    }

    // 添加贡献相关属性
    if (contributionId) {
      metadata.attributes.push({ trait_type: "Contribution ID", value: contributionId });
    }

    // 添加FID
    metadata.attributes.push({ trait_type: "Contributor FID", value: userFid.toString() });

    return metadata;
  };

  // 获取成就类型描述
  const getAchievementTypeValue = (type: AchievementType) => {
    switch (type) {
      case AchievementType.CREATOR:
        return "Creator Badge";
      case AchievementType.CONTRIBUTOR:
        return "Contributor Badge";
      case AchievementType.POPULAR_BRANCH:
        return "Branch Pioneer SBT";
      case AchievementType.COMPLETED_NARRATIVE:
        return "Chapter Completion NFT";
      default:
        return "Achievement";
    }
  };

  // 处理铸造请求
  const handleMint = async () => {
    if (!context?.user?.fid) return;

    // 在 Farcaster Mini App 环境中，尝试获取钱包客户端
    // 即使 isConnected 状态可能还没有更新
    try {
      // 首先尝试获取当前的钱包客户端
      const currentWalletClient = walletClient;

      if (!currentWalletClient) {
        // 如果没有钱包客户端，检查是否在 Farcaster 环境中
        if (!actions) {
          setError("请先连接钱包");
          return;
        }

        // 在 Farcaster 环境中，钱包可能需要时间初始化
        // 给一个短暂的延迟让钱包状态更新
        await new Promise(resolve => setTimeout(resolve, 500));

        // 重新检查钱包状态
        if (!isConnected) {
          setError("请先连接钱包");
          return;
        }
      }
    } catch (err) {
      console.error("检查钱包状态失败:", err);
      setError("钱包连接检查失败，请重试");
      return;
    }

    try {
      setIsMinting(true);
      setError(null);

      // 准备成就元数据
      const metadata = prepareMetadata();

      // 请求铸造参数
      const result = await api.requestMint({
        recipientFid: userFid,
        achievementType,
        narrativeId,
        contributionId,
        title: info.title,
        description: info.description,
        metadata: metadata
      });

      if (result.success && result.transactionParams) {
        // 请求用户签名交易
        try {
          // 确保我们有钱包客户端
          const currentWalletClient = walletClient;
          if (!currentWalletClient) {
            throw new Error("钱包客户端不可用");
          }

          // 发送交易
          const hash = await currentWalletClient.sendTransaction({
            to: result.transactionParams.to as `0x${string}`,
            data: result.transactionParams.data as `0x${string}`,
            value: BigInt(result.transactionParams.value || "0"),
            gas: result.transactionParams.gasLimit ? BigInt(result.transactionParams.gasLimit) : undefined
          });

          console.log("交易已发送:", hash);
          setTransactionHash(hash);
          setIsPendingConfirmation(true);

          // 等待交易确认会在useEffect中处理
        } catch (txError: any) {
          if (txError.message?.includes('User rejected')) {
            setError("您取消了交易");
          } else {
            console.error("交易失败:", txError);
            setError("交易失败，请重试");
          }
        }
      } else {
        setError(result.message || "铸造请求失败");
      }
    } catch (err) {
      console.error("铸造失败", err);
      setError("铸造过程发生错误，请重试");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="w-full max-w-md rounded-xl bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{info.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">铸造成功！</h3>
            <p className="text-gray-400 mb-4">
              恭喜！你的 {info.title} 已成功铸造
            </p>
            {transactionHash && (
              <button
                onClick={() => {
                  const url = `${MONAD_EXPLORER_URL}/tx/${transactionHash}`;
                  if (actions?.openUrl) {
                    actions.openUrl(url);
                  } else {
                    navigator.clipboard.writeText(url);
                    alert('交易链接已复制到剪贴板');
                  }
                }}
                className="text-purple-400 hover:underline text-sm"
              >
                查看交易详情
              </button>
            )}
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-3 font-medium text-white shadow-lg hover:bg-purple-700"
            >
              完成
            </button>
          </div>
        ) : isPendingConfirmation ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">交易确认中...</h3>
            <p className="text-gray-400 mb-4">
              请耐心等待交易被区块链确认
            </p>
            {transactionHash && (
              <button
                onClick={() => {
                  const url = `${MONAD_EXPLORER_URL}/tx/${transactionHash}`;
                  if (actions?.openUrl) {
                    actions.openUrl(url);
                  } else {
                    navigator.clipboard.writeText(url);
                    alert('交易链接已复制到剪贴板');
                  }
                }}
                className="text-purple-400 hover:underline text-sm"
              >
                查看交易详情
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 h-40 w-full overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
                {info.imgUrl ? (
                  <img src={info.imgUrl} alt={info.title} className="h-full w-full object-contain" />
                ) : (
                  <div className="text-gray-600">成就图片</div>
                )}
              </div>
              <p className="text-gray-300 mt-2">{info.description}</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-900 bg-opacity-30 p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleMint}
                disabled={isMinting}
                className={`rounded-lg px-4 py-3 font-medium text-white shadow-lg ${
                  isMinting
                    ? "bg-gray-700"
                    : "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                }`}
              >
                {isMinting ? "铸造中..." : "铸造成就"}
              </button>
              <button
                onClick={onClose}
                disabled={isMinting}
                className="rounded-lg border border-gray-700 bg-transparent px-4 py-3 font-medium text-white hover:bg-gray-800"
              >
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}