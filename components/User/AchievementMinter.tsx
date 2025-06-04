"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from "wagmi";
import { AchievementType, UserAchievement } from "@/types/narrative";
import { api } from "@/lib/api";
import {
  ACHIEVEMENT_CONTRACT_ADDRESS,
  MONAD_EXPLORER_URL,
  MONAD_CHAIN_ID
} from "@/lib/constants";
import { monadTestnet } from "wagmi/chains";
import { getAddress } from "viem";

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
  const { context, actions, isWalletReady, isWalletClientReady } = useMiniAppContext();
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);
  const [achievementId, setAchievementId] = useState<string | null>(null);


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
      if (!achievementId || !transactionHash) {
        console.error('缺少 achievementId 或 transactionHash');
        return;
      }

      await api.confirmAchievementMint(
        achievementId,
        transactionHash,
        newTokenId,
        userFid
      );

      // 如果有回调，传递成就信息
      if (onMintSuccess) {
        const newAchievement: UserAchievement = {
          achievementId: achievementId,
          type: achievementType,
          title: info.title,
          description: info.description,
          imageUrl: info.imgUrl || "/images/creator-achievement.svg",
          awardedAt: new Date().toISOString(),
          ownerFid: userFid,
          narrativeId: narrativeId,
          contributionId: contributionId,
          tokenId: newTokenId,
          transactionHash: transactionHash,
        };

        onMintSuccess(newAchievement);
      }
    } catch (error) {
      console.error("确认铸造完成失败:", error);
      // 此处不阻止用户继续，仅记录错误
    }
  }, [achievementId, transactionHash, onMintSuccess, achievementType, info.title, info.description, info.imgUrl, userFid, narrativeId, contributionId]);

  // 监听交易状态
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // 如果有交易哈希，并且处于等待确认状态，则轮询交易状态
    if (transactionHash && isPendingConfirmation && publicClient) {
      intervalId = setInterval(async () => {
        try {
          // 检查真实的区块链交易状态
          const receipt = await publicClient.getTransactionReceipt({
            hash: transactionHash as `0x${string}`
          });

          if (receipt && receipt.status === 'success') {
            // 交易成功
            clearInterval(intervalId);

            // 从事件日志中查找 tokenId
            const achievementMintedEvent = receipt.logs.find(log => {
              // 查找 AchievementMinted 事件
              return log.topics[0] === '0x...' // 这里应该是 AchievementMinted 事件的签名哈希
            });

            let newTokenId = '';
            if (achievementMintedEvent && achievementMintedEvent.topics.length > 1) {
              try {
                // 解析 tokenId (第二个 topic)
                const tokenIdHex = achievementMintedEvent.topics[1];
                if (tokenIdHex) {
                  newTokenId = BigInt(tokenIdHex).toString();
                }
              } catch (error) {
                console.error("解析事件日志失败:", error);
                // 使用交易哈希的一部分作为 fallback
                newTokenId = transactionHash.slice(-8);
              }
            } else {
              // 如果无法从事件中获取，使用交易哈希的一部分
              newTokenId = transactionHash.slice(-8);
            }

            setTokenId(newTokenId);

            // 通知后端交易已确认
            await confirmMintToBackend(newTokenId);

            setIsPendingConfirmation(false);
            setSuccess(true);
          } else if (receipt && receipt.status === 'reverted') {
            // 交易失败
            clearInterval(intervalId);
            setIsPendingConfirmation(false);
            setError("智能合约交易失败，请重试");
          }
        } catch (error) {
          console.error("检查交易状态失败:", error);
          // 如果是网络错误，继续轮询
          // 如果是其他错误，停止轮询
          if (error instanceof Error && error.message.includes('not found')) {
            // 交易还未被打包，继续等待
            return;
          } else {
            clearInterval(intervalId);
            setIsPendingConfirmation(false);
            setError("检查交易状态失败，请重试");
          }
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

    // 检查网络是否为 Monad 网络
    if (chainId !== MONAD_CHAIN_ID) {
      try {
        // 使用 switchChain 切换网络
        await switchChain({ chainId: MONAD_CHAIN_ID });

        // 等待网络切换完成
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 重新获取当前网络状态
        const currentChainId = await publicClient?.getChainId();

        // 验证网络是否切换成功
        if (currentChainId !== MONAD_CHAIN_ID) {
          throw new Error(`网络切换失败，当前网络 ${currentChainId}，需要 ${MONAD_CHAIN_ID}`);
        }
      } catch (switchError: any) {
        setError(`网络切换失败: ${switchError.message || '请手动切换到 Monad 测试网'}`);
        return;
      }
    }

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
        recipientAddress: address!, // 用户的钱包地址
        achievementType,
        narrativeId,
        contributionId,
        title: info.title,
        description: info.description,
        metadata: metadata
      });

      if (result.success && result.transactionParams) {
        // 保存从后端返回的 achievementId
        if (result.achievementId) {
          setAchievementId(result.achievementId);
        }

        // 请求用户签名交易
        try {
          // 检查钱包连接状态
          if (!isConnected || !address) {
            throw new Error("钱包未连接，请先连接钱包");
          }

          // 检查全局钱包客户端状态
          if (!isWalletClientReady) {
            throw new Error("钱包客户端正在初始化中，请稍候再试");
          }

          // 检查钱包客户端
          if (!walletClient) {
            throw new Error("钱包客户端不可用，请重新连接钱包");
          }

          // 发送交易 (确保地址格式正确)
          const hash = await walletClient.sendTransaction({
            to: getAddress(result.transactionParams.to),
            data: result.transactionParams.data as `0x${string}`,
            value: BigInt(result.transactionParams.value || "0"),
            gas: result.transactionParams.gasLimit ? BigInt(result.transactionParams.gasLimit) : undefined
          });

          console.log("交易已发送:", hash);
          setTransactionHash(hash);
          setIsPendingConfirmation(true);

          // 等待交易确认会在useEffect中处理
        } catch (txError: any) {
          console.error("交易详细错误:", txError);
          console.error("错误消息:", txError.message);
          console.error("错误代码:", txError.code);

          if (txError.message?.includes('User rejected')) {
            setError("您取消了交易");
          } else if (txError.message?.includes('network')) {
            setError(`网络错误: ${txError.message}`);
          } else if (txError.message?.includes('insufficient')) {
            setError("余额不足，请确保有足够的 MON 代币支付 gas 费用");
          } else {
            setError(`交易失败: ${txError.message || '未知错误'}`);
          }
        }
      } else {
        setError(result.message || "铸造请求失败");
      }
    } catch (err: any) {
      console.error("铸造失败详细信息:", err);
      console.error("错误类型:", typeof err);
      console.error("错误消息:", err.message);
      console.error("错误堆栈:", err.stack);

      if (err.message?.includes('fetch')) {
        setError("网络连接失败，请检查网络连接");
      } else if (err.message?.includes('Authentication')) {
        setError("认证失败，请重新连接钱包");
      } else {
        setError(`铸造过程发生错误: ${err.message || '未知错误'}`);
      }
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