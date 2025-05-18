import { SafeAreaContainer } from "@/components/safe-area-container";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import dynamic from "next/dynamic";

const CastchainHome = dynamic(() => import("@/components/Home"), {
  ssr: false,
  loading: () => <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <h2 className="text-xl font-bold">加载中...</h2>
      <p className="text-sm mt-2">正在准备链上叙事世界</p>
    </div>
  </div>,
});

export default function Home() {
  const { context } = useMiniAppContext();
  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <CastchainHome />
    </SafeAreaContainer>
  );
}
