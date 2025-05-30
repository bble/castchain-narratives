"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { MONAD_CHAIN_ID, MONAD_RPC_URL } from "@/lib/constants";

export function WalletActions() {
  const { context, isEthProviderAvailable } = useMiniAppContext();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);

  // 检测是否在 Mini App 环境中
  const isMiniApp = typeof window !== 'undefined' &&
    (window.parent !== window || window.location !== window.parent.location);

  // 连接钱包
  const connectWallet = async () => {
    if (!isMiniApp || !isEthProviderAvailable) {
      setError("请在Farcaster中打开应用以连接钱包");
      return;
    }

    setError(null);

    try {
      // 使用Farcaster Frame的钱包连接器
      const farcasterConnector = connectors.find(connector => connector.id === 'farcasterFrame');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      } else {
        setError("Farcaster钱包连接器不可用");
      }
    } catch (err) {
      console.error("连接钱包失败", err);
      setError("连接钱包失败，请重试");
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    disconnect();
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
    </div>
  );
}
