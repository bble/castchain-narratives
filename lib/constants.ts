export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

// 修复URL格式问题，确保没有双斜杠
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://castchain-narratives.netlify.app';
};

export const APP_URL = getBaseUrl();

// API相关常量
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? `${getBaseUrl()}/.netlify/functions`
  : "/api";

// Monad 网络相关常量 (当前为测试网，正式网时直接修改这些值)
export const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_CHAIN_ID = 10143;
export const MONAD_EXPLORER_URL = "https://testnet.monadexplorer.com";
export const MONAD_CURRENCY_SYMBOL = "MON";
export const MONAD_CURRENCY_NAME = "Monad";

// 成就合约地址 (正确的校验和格式)
export const ACHIEVEMENT_CONTRACT_ADDRESS = "0xC94F53281Ef92Cb9651b57C805eA5D283754d455";

// 成就类型枚举（与智能合约保持一致）
export enum ContractAchievementType {
  BRANCH_CREATOR = 0,    // 分支开创者SBT
  CHAPTER_COMPLETER = 1, // 章节完成NFT
  DREAM_WEAVER = 2       // 织梦者徽章
}

// 应用成就类型到合约成就类型的映射
export const ACHIEVEMENT_TYPE_MAPPING = {
  'creator': ContractAchievementType.DREAM_WEAVER,
  'contributor': ContractAchievementType.CHAPTER_COMPLETER,
  'branch_pioneer': ContractAchievementType.BRANCH_CREATOR,
  'narrative_completer': ContractAchievementType.CHAPTER_COMPLETER
} as const;

// 成就合约 ABI
export const ACHIEVEMENT_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "uint8", "name": "achievementType", "type": "uint8"},
      {"internalType": "string", "name": "metadataURI", "type": "string"},
      {"internalType": "uint256", "name": "narrativeId", "type": "uint256"},
      {"internalType": "bool", "name": "soulbound", "type": "bool"}
    ],
    "name": "mintAchievement",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "uint8", "name": "achievementType", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "narrativeId", "type": "uint256"}
    ],
    "name": "AchievementMinted",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "getAchievementsOfOwner",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getAchievementType",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "isSoulbound",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// 生成成就元数据 URI
export function generateAchievementMetadataURI(achievementType: string, title: string, description: string, imageUrl: string) {
  const metadata = {
    name: title,
    description: description,
    image: imageUrl,
    attributes: [
      {
        trait_type: "Achievement Type",
        value: achievementType
      },
      {
        trait_type: "Platform",
        value: "CastChain Narratives"
      },
      {
        trait_type: "Network",
        value: "Monad"
      }
    ]
  };

  // 在生产环境中，这应该上传到 IPFS 或其他去中心化存储
  // 现在我们使用 data URI 作为临时解决方案
  return `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
}

// 标签列表
export const NARRATIVE_TAGS = [
  "科幻", "奇幻", "悬疑", "冒险", "恐怖", "浪漫", "历史", "现代",
  "太空", "战争", "神话", "未来", "古代", "末日", "校园", "魔法",
  "赛博朋克", "蒸汽朋克", "克苏鲁", "武侠", "仙侠", "灵异"
];
