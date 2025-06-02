'use client';

import { useState } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { useMiniAppContext } from '../hooks/use-miniapp-context';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const getWalletOptions = (connectors: readonly any[]): WalletOption[] => {
  return connectors.map(connector => {
    const id = connector.id || connector.name || 'unknown';
    
    // 根据连接器类型返回不同的钱包信息
    if (id.includes('farcaster') || id.includes('frame')) {
      return {
        id,
        name: 'Farcaster 钱包',
        icon: '🟣',
        description: '使用 Farcaster 内置钱包连接'
      };
    } else if (id.includes('injected') || id.includes('metamask')) {
      const isInIframe = typeof window !== 'undefined' && window.parent !== window;
      return {
        id,
        name: 'MetaMask',
        icon: '🦊',
        description: isInIframe
          ? '使用 MetaMask（在 Farcaster 中可能受限）'
          : '使用 MetaMask 浏览器扩展'
      };
    } else if (id.includes('walletConnect')) {
      const isInIframe = typeof window !== 'undefined' && window.parent !== window;
      return {
        id,
        name: 'WalletConnect',
        icon: '🔗',
        description: isInIframe
          ? '连接移动端钱包（在 Farcaster 中可能受限）'
          : '连接移动端钱包'
      };
    } else if (id.includes('coinbase')) {
      return {
        id,
        name: 'Coinbase Wallet',
        icon: '🔵',
        description: '使用 Coinbase Wallet'
      };
    } else {
      return {
        id,
        name: connector.name || '未知钱包',
        icon: '💼',
        description: '其他钱包连接器'
      };
    }
  });
};

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSelect: (connectorId: string) => void;
}

export function WalletSelector({ isOpen, onClose, onWalletSelect }: WalletSelectorProps) {
  const { connectors } = useConnect();
  const { context } = useMiniAppContext();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const walletOptions = getWalletOptions(connectors);
  
  // 在 Farcaster 环境中，优先显示 Farcaster 钱包
  const isMiniApp = typeof window !== 'undefined' && (
    window.parent !== window || 
    window.location !== window.parent.location ||
    context !== null
  );
  
  const sortedWalletOptions = isMiniApp 
    ? walletOptions.sort((a, b) => {
        if (a.name.includes('Farcaster')) return -1;
        if (b.name.includes('Farcaster')) return 1;
        return 0;
      })
    : walletOptions;

  const handleWalletSelect = async (walletId: string) => {
    try {
      // 如果已连接，先断开
      if (isConnected) {
        disconnect();
        // 等待断开完成
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      onWalletSelect(walletId);
      onClose();
    } catch (error) {
      console.error('切换钱包失败:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">选择钱包</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {sortedWalletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet.id)}
              className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallet.icon}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">{wallet.name}</div>
                  <div className="text-gray-400 text-sm">{wallet.description}</div>
                </div>
                {isMiniApp && wallet.name.includes('Farcaster') && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                    推荐
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        
        {walletOptions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">没有可用的钱包连接器</div>
            <div className="text-sm text-gray-500">
              请确保在支持的环境中打开应用
            </div>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 text-center space-y-1">
            {isMiniApp ? (
              <>
                <div>在 Farcaster 中推荐使用 Farcaster 钱包</div>
                <div className="text-yellow-400">
                  ⚠️ 其他钱包在 iframe 环境中可能无法正常工作
                </div>
              </>
            ) : (
              <div>请选择您偏好的钱包连接方式</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
