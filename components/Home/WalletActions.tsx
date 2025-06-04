"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWalletClient } from "wagmi";
import { MONAD_CHAIN_ID, MONAD_RPC_URL } from "@/lib/constants";
import { NetworkSelector } from "../NetworkSelector";

export function WalletActions() {
  const { context, isEthProviderAvailable, actions, setIsWalletClientReady } = useMiniAppContext();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const [error, setError] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [isInitializingWallet, setIsInitializingWallet] = useState(false);

  // 检测是否在 Mini App 环境中
  const isMiniApp = typeof window !== 'undefined' && (
    window.parent !== window ||
    window.location !== window.parent.location ||
    // 检查 Farcaster 特定的环境变量
    window.location.hostname.includes('farcaster') ||
    // 检查是否有 Farcaster SDK context
    context !== null
  );

  // 监听连接状态变化，清除错误
  useEffect(() => {
    if (isConnected && address) {
      setError(null);
      console.log("钱包连接成功:", address);
    }
  }, [isConnected, address]);

  // 监听网络变化，重新初始化钱包客户端
  useEffect(() => {
    const initializeWalletAfterNetworkChange = async () => {
      if (!isConnected || !chainId) {
        return;
      }

      console.log(`网络已切换到: ${chainId}, 重新初始化钱包客户端...`);
      setIsInitializingWallet(true);

      try {
        // 等待钱包客户端在新网络上准备就绪
        let attempts = 0;
        const maxAttempts = 20; // 最多等待 10 秒

        while (attempts < maxAttempts) {
          if (walletClient && walletClient.chain?.id === chainId) {
            console.log("钱包客户端已在新网络上准备就绪:", {
              clientChainId: walletClient.chain.id,
              currentChainId: chainId,
              address: walletClient.account?.address
            });
            // 更新全局钱包客户端状态
            setIsWalletClientReady(true);
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
          console.log(`等待钱包客户端适应新网络... ${attempts}/${maxAttempts}`);
        }

        if (attempts >= maxAttempts) {
          console.warn("钱包客户端初始化超时，但继续运行");
          // 即使超时也标记为准备就绪，让用户可以尝试
          setIsWalletClientReady(true);
        }
      } catch (error) {
        console.error("钱包客户端重新初始化失败:", error);
      } finally {
        setIsInitializingWallet(false);
      }
    };

    // 延迟一下让网络切换完全完成
    const timer = setTimeout(initializeWalletAfterNetworkChange, 1000);
    return () => clearTimeout(timer);
  }, [chainId, isConnected, walletClient]);

  // 在 Farcaster 环境中自动连接钱包
  useEffect(() => {
    const autoConnect = async () => {
      // 如果已经连接，跳过
      if (isConnected || isPending) {
        return;
      }

      // 如果在 Farcaster 环境中且有可用的连接器，自动连接
      if (isMiniApp && connectors.length > 0) {
        console.log("在 Farcaster 环境中，尝试自动连接钱包...");

        // 延迟一下让组件完全加载
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 再次检查是否已连接（可能在延迟期间已连接）
        if (isConnected) {
          return;
        }

        try {
          // 优先使用 Farcaster 连接器
          let targetConnector = connectors.find(c =>
            c.id.includes('farcaster') || c.id.includes('frame')
          );

          // 如果没有 Farcaster 连接器，使用第一个可用的连接器
          if (!targetConnector && connectors.length > 0) {
            targetConnector = connectors[0];
          }

          if (targetConnector) {
            console.log("自动连接钱包，使用连接器:", targetConnector.id);
            await connect({ connector: targetConnector });
          }
        } catch (err) {
          console.log("自动连接失败，等待用户手动连接:", err);
          // 自动连接失败不显示错误，让用户手动连接
        }
      }
    };

    autoConnect();
  }, [isMiniApp, connectors, isConnected, isPending, connect]);

  // 切换网络
  const handleSwitchNetwork = async (targetChainId: number) => {
    console.log("尝试切换网络到:", targetChainId);
    setError(null);
    setIsInitializingWallet(true);
    // 标记钱包客户端为未准备状态
    setIsWalletClientReady(false);

    try {
      await switchChain({ chainId: targetChainId });
      console.log("网络切换成功，等待钱包客户端重新初始化...");
      // 注意：钱包客户端的重新初始化会在 useEffect 中处理
    } catch (err) {
      console.error("网络切换失败", err);
      setError("网络切换失败，请手动切换到目标网络");
      setIsInitializingWallet(false);
      // 网络切换失败，恢复钱包客户端状态
      setIsWalletClientReady(true);
    }
  };

  // 连接钱包（优先使用 Farcaster 钱包）
  const connectWallet = async () => {
    console.log("连接钱包状态检查:", {
      isMiniApp,
      isEthProviderAvailable,
      isConnected,
      connectors: connectors.map(c => ({ id: c.id, name: c.name }))
    });

    setError(null);

    try {
      // 在 Farcaster 环境中，优先使用 Farcaster 连接器
      let targetConnector = connectors.find(c =>
        c.id.includes('farcaster') || c.id.includes('frame')
      );

      // 如果没有 Farcaster 连接器，使用第一个可用的连接器
      if (!targetConnector && connectors.length > 0) {
        targetConnector = connectors[0];
      }

      if (targetConnector) {
        console.log("使用连接器:", targetConnector.id);
        await connect({ connector: targetConnector });
      } else {
        console.log("没有可用的连接器");
        setError("没有可用的钱包连接器");
      }
    } catch (err) {
      console.error("连接钱包失败", err);
      setError("钱包连接失败，请重试");
    }
  };

  // 断开钱包连接
  const disconnectWallet = async () => {
    console.log("断开钱包连接");
    setError(null);

    try {
      disconnect();

      // 等待断开完成，然后清理状态
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("钱包断开完成，状态已清理");
    } catch (err) {
      console.error("断开钱包时出错:", err);
    }
  };

  // 格式化钱包地址显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 获取当前网络名称
  const getCurrentNetworkName = () => {
    if (chainId === MONAD_CHAIN_ID) return "Monad";
    return `网络 ${chainId}`;
  };

  return (
    <div>
      {isConnected && address ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {formatAddress(address)}
          </span>
          <span className="text-xs text-gray-400">
            {getCurrentNetworkName()}
          </span>
          <button
            className={`rounded-lg px-3 py-1 text-xs text-white ${
              isInitializingWallet
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={() => setShowNetworkSelector(true)}
            disabled={isInitializingWallet}
          >
            {isInitializingWallet ? "初始化中..." : "切换网络"}
          </button>
          <button
            className="rounded-lg bg-gray-800 px-3 py-1 text-xs text-white hover:bg-gray-700"
            onClick={disconnectWallet}
          >
            断开连接
          </button>
        </div>
      ) : (
        <div>
          <button
            className={`rounded-lg px-3 py-1 text-sm text-white ${
              isPending
                ? "bg-gray-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
            onClick={connectWallet}
            disabled={isPending}
          >
            {isPending ? "连接中..." : "连接钱包"}
          </button>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      )}

      <NetworkSelector
        isOpen={showNetworkSelector}
        onClose={() => setShowNetworkSelector(false)}
        onNetworkSelect={handleSwitchNetwork}
        currentChainId={chainId}
      />
    </div>
  );
}
