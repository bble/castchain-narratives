import { useState, useEffect } from "react";
import { ethers } from "ethers";
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

  useEffect(() => {
    async function fetchSBTs() {
      if (!userAddress || !window.ethereum) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          ACHIEVEMENT_CONTRACT_ADDRESS,
          SBT_ABI,
          provider
        );

        // 获取用户SBT数量
        const balance = await contract.balanceOf(userAddress);
        
        if (balance.toNumber() === 0) {
          setSbtDetails([]);
          setLoading(false);
          return;
        }

        // 获取用户所有SBT的tokenId
        const sbtIds = [];
        for (let i = 0; i < balance.toNumber(); i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          sbtIds.push(tokenId.toString());
        }

        // 获取每个SBT的元数据URI
        const details = await Promise.all(
          sbtIds.map(async (tokenId) => {
            const uri = await contract.tokenURI(tokenId);
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
  }, [userAddress]);

  return { sbtDetails, loading, error };
} 