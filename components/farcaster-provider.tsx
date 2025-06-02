"use client";

import { FrameContext } from "@farcaster/frame-core/dist/context";
import sdk from "@farcaster/frame-sdk";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import FrameWalletProvider from "./frame-wallet-provider";

interface FrameContextValue {
  context: FrameContext | null;
  isSDKLoaded: boolean;
  isEthProviderAvailable: boolean;
  error: string | null;
  actions: typeof sdk.actions | null;
}

const FrameProviderContext = createContext<FrameContextValue | undefined>(
  undefined
);

export function useFrame() {
  const context = useContext(FrameProviderContext);
  if (context === undefined) {
    throw new Error("useFrame must be used within a FrameProvider");
  }
  return context;
}

interface FrameProviderProps {
  children: ReactNode;
}

export function FrameProvider({ children }: FrameProviderProps) {
  const [context, setContext] = useState<FrameContext | null>(null);
  const [actions, setActions] = useState<typeof sdk.actions | null>(null);
  const [isEthProviderAvailable, setIsEthProviderAvailable] =
    useState<boolean>(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        console.log("开始加载Farcaster SDK...");

        // 检查是否在支持的环境中
        if (typeof window === 'undefined') {
          console.warn("不在浏览器环境中，跳过SDK加载");
          return;
        }

        const context = await sdk.context;
        console.log("获取到Farcaster context:", context);

        if (context) {
          setContext(context as FrameContext);
          setActions(sdk.actions);
          setIsEthProviderAvailable(sdk.wallet?.ethProvider ? true : false);
          console.log("Farcaster context设置成功");
        } else {
          console.warn("未获取到Farcaster context，可能不在Farcaster环境中");
          setError("Failed to load Farcaster context");
        }

        // 尝试调用ready，但不强制要求成功
        try {
          await sdk.actions.ready();
          console.log("SDK ready调用成功");
        } catch (readyErr) {
          console.warn("SDK ready调用失败，但继续运行:", readyErr);
          // 即使 ready 失败，也设置基本的 context 和 actions
          if (context && !actions) {
            setActions(sdk.actions);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize SDK";
        console.error("SDK初始化错误:", err);
        setError(errorMessage);
      }
    };

    if (sdk && !isSDKLoaded) {
      load().then(() => {
        setIsSDKLoaded(true);
        console.log("SDK加载完成");
      }).catch((err) => {
        console.error("SDK加载失败:", err);
        setIsSDKLoaded(true); // 即使失败也标记为已加载，避免无限重试
      });
    }
  }, [isSDKLoaded]);

  return (
    <FrameProviderContext.Provider
      value={{
        context,
        actions,
        isSDKLoaded,
        isEthProviderAvailable,
        error,
      }}
    >
      <FrameWalletProvider>{children}</FrameWalletProvider>
    </FrameProviderContext.Provider>
  );
}
