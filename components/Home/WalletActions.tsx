"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { MONAD_CHAIN_ID, MONAD_RPC_URL } from "@/lib/constants";
import { WalletSelector } from "../WalletSelector";

export function WalletActions() {
  const { context, isEthProviderAvailable, actions } = useMiniAppContext();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

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

  // 通过连接器 ID 连接钱包
  const connectWithConnector = async (connectorId: string) => {
    console.log("尝试连接钱包，连接器 ID:", connectorId);
    setError(null);

    try {
      // 如果已经连接，先断开
      if (isConnected) {
        console.log("检测到已连接状态，先断开连接");
        disconnect();
        // 等待断开完成
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 查找指定的连接器
      const targetConnector = connectors.find(connector => connector.id === connectorId);

      if (targetConnector) {
        console.log("找到目标连接器:", targetConnector.id);
        await connect({ connector: targetConnector });
      } else {
        console.error("未找到指定的连接器:", connectorId);
        setError("未找到指定的钱包连接器");
      }
    } catch (err) {
      console.error("连接钱包失败", err);

      // 根据连接器类型提供更具体的错误信息
      const targetConnector = connectors.find(connector => connector.id === connectorId);
      let errorMessage = "钱包连接失败，请重试";

      if (targetConnector) {
        const connectorName = targetConnector.name || targetConnector.id;
        if (connectorName.includes('MetaMask') || connectorName.includes('injected')) {
          errorMessage = isMiniApp
            ? "MetaMask 在 Farcaster 中可能无法使用，请尝试使用 Farcaster 钱包"
            : "请确保已安装 MetaMask 扩展并解锁钱包";
        } else if (connectorName.includes('WalletConnect')) {
          errorMessage = isMiniApp
            ? "WalletConnect 在 Farcaster 中可能受限，请尝试使用 Farcaster 钱包"
            : "WalletConnect 连接失败，请重试";
        }
      }

      setError(errorMessage);
    }
  };

  // 连接钱包（显示选择器或自动连接）
  const connectWallet = async () => {
    console.log("连接钱包状态检查:", {
      isMiniApp,
      isEthProviderAvailable,
      isConnected,
      connectors: connectors.map(c => ({ id: c.id, name: c.name }))
    });

    setError(null);

    // 如果有多个连接器，显示选择器
    if (connectors.length > 1) {
      setShowWalletSelector(true);
      return;
    }

    // 如果只有一个连接器，直接连接
    if (connectors.length === 1) {
      await connectWithConnector(connectors[0].id);
      return;
    }

    // 没有可用的连接器
    console.log("没有可用的连接器");
    setError("没有可用的钱包连接器");
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

  return (
    <div>
      {isConnected && address ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {formatAddress(address)}
          </span>
          {connectors.length > 1 && (
            <button
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
              onClick={() => setShowWalletSelector(true)}
            >
              切换钱包
            </button>
          )}
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
            {isPending ? "连接中..." : connectors.length > 1 ? "选择钱包" : "连接钱包"}
          </button>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      )}

      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onWalletSelect={connectWithConnector}
      />
    </div>
  );
}
