'use client';

import { useState } from 'react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import {
  MONAD_CHAIN_ID,
  MONAD_RPC_URL,
  MONAD_CURRENCY_SYMBOL
} from '../lib/constants';

interface NetworkOption {
  id: number;
  name: string;
  icon: string;
  description: string;
  rpcUrl?: string;
}

const NETWORK_OPTIONS: NetworkOption[] = [
  {
    id: MONAD_CHAIN_ID,
    name: 'MonadTest',
    icon: '🟣',
    description: 'Monad Testnet - 推荐用于 CastChain',
    rpcUrl: MONAD_RPC_URL
  },
  {
    id: 8453,
    name: 'Base',
    icon: '🔵',
    description: 'Base Mainnet - Coinbase L2'
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    icon: '🔵',
    description: 'Base Sepolia Testnet'
  },
  {
    id: 1,
    name: 'Ethereum',
    icon: '⚡',
    description: 'Ethereum Mainnet'
  },
  {
    id: 11155111,
    name: 'Sepolia',
    icon: '⚡',
    description: 'Ethereum Sepolia Testnet'
  }
];

interface NetworkSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onNetworkSelect: (chainId: number) => void;
  currentChainId?: number;
}

export function NetworkSelector({ 
  isOpen, 
  onClose, 
  onNetworkSelect, 
  currentChainId 
}: NetworkSelectorProps) {
  const { context } = useMiniAppContext();
  const [isLoading, setIsLoading] = useState<number | null>(null);
  
  // 检测是否在 Mini App 环境中
  const isMiniApp = typeof window !== 'undefined' && (
    window.parent !== window || 
    window.location !== window.parent.location ||
    context !== null
  );
  
  // 在 Farcaster 环境中，优先显示 Monad 网络
  const sortedNetworkOptions = isMiniApp
    ? NETWORK_OPTIONS.sort((a, b) => {
        if (a.id === MONAD_CHAIN_ID) return -1; // Monad 网络优先
        if (b.id === MONAD_CHAIN_ID) return 1;
        return 0;
      })
    : NETWORK_OPTIONS;

  const handleNetworkSelect = async (chainId: number) => {
    try {
      setIsLoading(chainId);
      await onNetworkSelect(chainId);
      onClose();
    } catch (error) {
      console.error('网络切换失败:', error);
    } finally {
      setIsLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">选择网络</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {sortedNetworkOptions.map((network) => {
            const isCurrentNetwork = currentChainId === network.id;
            const isLoadingThis = isLoading === network.id;
            
            return (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network.id)}
                disabled={isCurrentNetwork || isLoadingThis}
                className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                  isCurrentNetwork
                    ? 'bg-purple-600 border-purple-500 cursor-default'
                    : isLoadingThis
                    ? 'bg-gray-700 border-gray-600 cursor-wait'
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-purple-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{network.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium flex items-center space-x-2">
                      <span>{network.name}</span>
                      {isCurrentNetwork && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                          当前
                        </span>
                      )}
                      {isLoadingThis && (
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                          切换中...
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">{network.description}</div>
                    <div className="text-gray-500 text-xs mt-1">Chain ID: {network.id}</div>
                  </div>
                  {isMiniApp && network.id === MONAD_CHAIN_ID && !isCurrentNetwork && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                      推荐
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 text-center space-y-1">
            {isMiniApp ? (
              <>
                <div>在 Farcaster 中推荐使用 Monad 网络</div>
                <div className="text-yellow-400">
                  💡 CastChain Narratives 专为 Monad 网络优化
                </div>
              </>
            ) : (
              <div>选择您要连接的区块链网络</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
