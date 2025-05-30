import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { ACHIEVEMENT_CONTRACT_ADDRESS } from "@/lib/constants";

// SBT合约ABI简化版
const SBT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)"
];

export interface SBTDetail {
  tokenId: string;
  metadata: any;
  uri: string;
}

export function useUserSBTs(userAddress: string | null) {
  const [sbtDetails, setSbtDetails] = useState<SBTDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function fetchSBTs() {
      if (!userAddress || !publicClient) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 获取用户SBT数量
        const balance = await publicClient.readContract({
          address: ACHIEVEMENT_CONTRACT_ADDRESS as `0x${string}`,
          abi: SBT_ABI,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`]
        }) as bigint;

        if (Number(balance) === 0) {
          setSbtDetails([]);
          setLoading(false);
          return;
        }

        // 获取用户所有SBT的tokenId
        const sbtIds = [];
        for (let i = 0; i < Number(balance); i++) {
          const tokenId = await publicClient.readContract({
            address: ACHIEVEMENT_CONTRACT_ADDRESS as `0x${string}`,
            abi: SBT_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [userAddress as `0x${string}`, BigInt(i)]
          }) as bigint;
          sbtIds.push(tokenId.toString());
        }

        // 获取每个SBT的元数据URI
        const details = await Promise.all(
          sbtIds.map(async (tokenId) => {
            const uri = await publicClient.readContract({
              address: ACHIEVEMENT_CONTRACT_ADDRESS as `0x${string}`,
              abi: SBT_ABI,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)]
            }) as string;

            // 处理ipfs://开头的URI
            const metadataUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");

            // 获取元数据内容
            try {
              const response = await fetch(metadataUrl);
              const metadata = await response.json();

              return {
                tokenId,
                metadata,
                uri
              };
            } catch (err) {
              console.error(`Failed to fetch metadata for token ${tokenId}`, err);
              return {
                tokenId,
                metadata: { name: "未知成就", description: "无法加载元数据" },
                uri
              };
            }
          })
        );

        setSbtDetails(details);
      } catch (err) {
        console.error("Error fetching SBTs:", err);
        setError("获取成就数据失败，请确保已连接到Monad网络");
      } finally {
        setLoading(false);
      }
    }

    fetchSBTs();
  }, [userAddress, publicClient]);

  return { sbtDetails, loading, error };
}