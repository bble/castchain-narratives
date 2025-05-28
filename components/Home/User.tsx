import { useMiniAppContext } from "@/hooks/use-miniapp-context";

interface UserProps {
  compact?: boolean;
}

export function User({ compact = false }: UserProps) {
  const { context } = useMiniAppContext();

  // 检测是否在 Mini App 环境中
  const isMiniApp = typeof window !== 'undefined' &&
    (window.parent !== window || window.location !== window.parent.location);

  if (!context?.user && isMiniApp) {
    return (
      <div className="animate-pulse rounded-lg bg-gray-800 p-3 text-center">
        <p className="text-sm text-gray-400">连接 Farcaster...</p>
      </div>
    );
  }

  // 在普通浏览器中显示演示用户
  if (!context?.user && !isMiniApp) {
    const demoUser = {
      displayName: "演示用户",
      username: "demo",
      fid: 12345,
      pfpUrl: "/images/icon.png"
    };

    if (compact) {
      return (
        <div className="flex items-center space-x-2">
          <img
            src={demoUser.pfpUrl}
            className="h-8 w-8 rounded-full"
            alt="用户头像"
            width={32}
            height={32}
          />
          <span className="text-sm font-medium">{demoUser.displayName}</span>
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-lg border border-gray-800 bg-[#262836] p-4">
        <h2 className="text-xl font-bold">用户信息</h2>
        <div className="flex flex-row space-x-4 items-start">
          <img
            src={demoUser.pfpUrl}
            className="w-14 h-14 rounded-full"
            alt="用户头像"
            width={56}
            height={56}
          />
          <div className="flex flex-col space-y-2">
            <p className="text-sm">
              名称: <span className="font-medium">{demoUser.displayName}</span>
            </p>
            <p className="text-sm">
              用户名: <span className="font-medium">@{demoUser.username}</span>
            </p>
            <p className="text-sm">
              FID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-xs">{demoUser.fid}</span>
            </p>
            <p className="text-xs text-gray-400">
              在 Warpcast 中打开获得完整体验
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {context?.user?.pfpUrl && (
          <img
            src={context.user.pfpUrl}
            className="h-8 w-8 rounded-full"
            alt="用户头像"
            width={32}
            height={32}
          />
        )}
        <span className="text-sm font-medium">{context?.user?.displayName || context?.user?.username}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-800 bg-[#262836] p-4">
      <h2 className="text-xl font-bold">用户信息</h2>
      <div className="flex flex-row space-x-4 items-start">
        {context?.user?.pfpUrl && (
              <img
            src={context.user.pfpUrl}
                className="w-14 h-14 rounded-full"
            alt="用户头像"
                width={56}
                height={56}
              />
            )}
        <div className="flex flex-col space-y-2">
          <p className="text-sm">
            名称: <span className="font-medium">{context?.user?.displayName}</span>
              </p>
          <p className="text-sm">
            用户名: <span className="font-medium">@{context?.user?.username}</span>
              </p>
          <p className="text-sm">
            FID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-xs">{context?.user?.fid}</span>
              </p>
            </div>
      </div>
    </div>
  );
}
