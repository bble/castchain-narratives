import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { APP_URL } from "@/lib/constants";

export function FarcasterActions() {
  const { actions } = useMiniAppContext();

  // 检测是否在 Mini App 环境中
  const isMiniApp = typeof window !== 'undefined' &&
    (window.parent !== window || window.location !== window.parent.location);

  return (
    <div className="space-y-4 border border-[#333] rounded-md p-4">
      <h2 className="text-xl font-bold text-left">Farcaster 功能</h2>
      <div className="flex flex-row space-x-4 justify-start items-start">
        {actions ? (
          <div className="flex flex-col space-y-4 justify-start">
            <button
              className="bg-white text-black rounded-md p-2 text-sm"
              onClick={() => actions?.addFrame()}
            >
              addFrame
            </button>
            <button
              className="bg-white text-black rounded-md p-2 text-sm"
              onClick={() => actions?.close()}
            >
              close
            </button>
            <button
              className="bg-white text-black rounded-md p-2 text-sm"
              onClick={() =>
                actions?.composeCast({
                  text: "Check out this Monad Farcaster MiniApp Template!",
                  embeds: [`${APP_URL}`],
                })
              }
            >
              composeCast
            </button>
            <button
              className="bg-white text-black rounded-md p-2 text-sm"
              onClick={() => actions?.openUrl("https://docs.monad.xyz")}
            >
              openUrl
            </button>
            <button
              className="bg-white text-black rounded-md p-2 text-sm"
              onClick={() => actions?.signIn({ nonce: "1201" })}
            >
              signIn
            </button>
            <button
              className="bg-white text-black rounded-md p-2 text-sm"
              onClick={() => actions?.viewProfile({ fid: 17979 })}
            >
              viewProfile
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {isMiniApp ? (
              <p className="text-sm text-left">正在加载 Farcaster 功能...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-left">在 Farcaster 中打开以使用完整功能：</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 发布 Cast</li>
                  <li>• 查看用户资料</li>
                  <li>• 添加到收藏</li>
                  <li>• 分享链接</li>
                </ul>
                <button
                  className="bg-purple-600 text-white rounded-md p-2 text-sm hover:bg-purple-700"
                  onClick={() => window.open('https://farcaster.xyz', '_blank')}
                >
                  在 Farcaster 中打开
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
