import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// 创建 Farcaster Frame 连接器
const createFarcasterConnector = () => {
  try {
    return farcasterFrame();
  } catch (error) {
    console.warn("创建 Farcaster Frame 连接器失败:", error);
    return null;
  }
};

// 创建注入式钱包连接器（MetaMask, Coinbase Wallet 等）
const createInjectedConnector = () => {
  try {
    // 检查是否在浏览器环境且有 ethereum 对象
    if (typeof window === 'undefined' || !window.ethereum) {
      console.log("注入式钱包不可用：没有检测到 ethereum 对象");
      return null;
    }

    // 检查是否在 iframe 中（Farcaster 环境）
    const isInIframe = window.parent !== window;
    if (isInIframe) {
      console.log("在 iframe 环境中，注入式钱包可能受限");
      // 在 Farcaster 中，注入式钱包可能无法正常工作
      // 但我们仍然创建连接器，让用户尝试
    }

    return injected({
      target: {
        id: 'injected',
        name: 'MetaMask',
        provider: window.ethereum,
      },
    });
  } catch (error) {
    console.warn("创建注入式连接器失败:", error);
    return null;
  }
};

// 创建 WalletConnect 连接器
const createWalletConnectConnector = () => {
  try {
    // 检查是否在 iframe 中（Farcaster 环境）
    const isInIframe = typeof window !== 'undefined' && window.parent !== window;
    if (isInIframe) {
      console.log("在 iframe 环境中，WalletConnect 可能受限");
      // 在 Farcaster 中，WalletConnect 弹窗可能被阻止
      // 但我们仍然创建连接器，让用户尝试
    }

    return walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
      metadata: {
        name: 'CastChain Narratives',
        description: 'Farcaster 叙事协作平台',
        url: 'https://castchain-narratives.netlify.app',
        icons: ['https://castchain-narratives.netlify.app/images/feed.png'],
      },
      showQrModal: true, // 显示二维码模态框
    });
  } catch (error) {
    console.warn("创建 WalletConnect 连接器失败:", error);
    return null;
  }
};

// 收集所有可用的连接器
const farcasterConnector = createFarcasterConnector();
const injectedConnector = createInjectedConnector();
const walletConnectConnector = createWalletConnectConnector();

// 检查是否在 iframe 环境中
const isInIframe = typeof window !== 'undefined' && window.parent !== window;

// 根据环境智能选择连接器
const connectors = [
  farcasterConnector,
  // 在 Farcaster 环境中，其他钱包可能不工作，但仍然提供选项让用户尝试
  injectedConnector,
  walletConnectConnector,
].filter((connector): connector is NonNullable<typeof connector> => connector !== null); // 过滤掉 null 值并修复类型

// 如果在 iframe 中且只有 Farcaster 连接器可用，优先使用它
if (isInIframe && farcasterConnector && connectors.length > 1) {
  console.log("在 iframe 环境中，Farcaster 钱包是最佳选择");
}

console.log("初始化钱包连接器:", connectors.length > 0 ? `已创建 ${connectors.length} 个连接器` : "没有可用的连接器");

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  connectors,
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
