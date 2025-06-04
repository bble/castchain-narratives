import { useFrame } from "../components/farcaster-provider";
import { FrameContext } from "@farcaster/frame-core/dist/context";
import sdk from "@farcaster/frame-sdk";

// Define specific types for each context
interface FarcasterContextResult {
  context: FrameContext;
  actions: typeof sdk.actions | null;
  isEthProviderAvailable: boolean;
  isWalletReady: boolean;
  isWalletClientReady: boolean;
  setIsWalletClientReady: (ready: boolean) => void;
}

interface NoContextResult {
  context: null;
  actions: null;
  isEthProviderAvailable: boolean;
  isWalletReady: boolean;
  isWalletClientReady: boolean;
  setIsWalletClientReady: (ready: boolean) => void;
}

// Union type of all possible results
type ContextResult = FarcasterContextResult | NoContextResult;

export const useMiniAppContext = (): ContextResult => {
  // Try to get Farcaster context
  try {
    const farcasterContext = useFrame();
    if (farcasterContext.context) {
      return {
        context: farcasterContext.context,
        actions: farcasterContext.actions,
        isEthProviderAvailable: farcasterContext.isEthProviderAvailable,
        isWalletReady: farcasterContext.isWalletReady,
        isWalletClientReady: farcasterContext.isWalletClientReady,
        setIsWalletClientReady: farcasterContext.setIsWalletClientReady,
      } as FarcasterContextResult;
    }
  } catch (e) {
    // Ignore error if not in Farcaster context
  }

  // No context found - provide dummy function for setIsWalletClientReady
  return {
    context: null,
    actions: null,
    isEthProviderAvailable: false,
    isWalletReady: false,
    isWalletClientReady: false,
    setIsWalletClientReady: () => {}, // dummy function
  } as NoContextResult;
};
