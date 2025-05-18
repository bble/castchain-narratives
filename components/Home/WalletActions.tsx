"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { MONAD_CHAIN_ID, MONAD_RPC_URL } from "@/lib/constants";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletActions() {
  const { context } = useMiniAppContext();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查钱包连接状态
  useEffect(() => {
    async function checkConnection() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error("获取钱包账户失败", err);
        }
      }
    }

    checkConnection();

    // 监听账户变化
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError("请安装MetaMask或其他支持以太坊的钱包");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // 请求用户授权连接
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);

      // 请求切换到Monad网络
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${MONAD_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // 如果网络不存在，添加网络
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${MONAD_CHAIN_ID.toString(16)}`,
                  chainName: 'Monad',
                  nativeCurrency: {
                    name: 'MONAD',
                    symbol: 'MONAD',
                    decimals: 18,
                  },
                  rpcUrls: [MONAD_RPC_URL],
                  blockExplorerUrls: ['https://explorer.monad.xyz/'],
                },
              ],
            });
          } catch (addError) {
            console.error("添加Monad网络失败", addError);
            setError("添加Monad网络失败");
          }
        } else {
          console.error("切换到Monad网络失败", switchError);
          setError("切换到Monad网络失败");
        }
      }
    } catch (err) {
      console.error("连接钱包失败", err);
      setError("连接钱包失败，请重试");
    } finally {
      setConnecting(false);
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  // 格式化钱包地址显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div>
      {walletAddress ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {formatAddress(walletAddress)}
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
              connecting
                ? "bg-gray-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
            onClick={connectWallet}
            disabled={connecting}
          >
            {connecting ? "连接中..." : "连接钱包"}
          </button>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
