export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

// 默认使用相对URL，在生产环境中会被Netlify的部署URL覆盖
export const APP_URL = process.env.NEXT_PUBLIC_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'https://castchain-narratives.netlify.app');
// 不再抛出错误，而是使用默认值
// if (!APP_URL) {
//   throw new Error("NEXT_PUBLIC_URL is not set");
// }

// API相关常量
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? "/.netlify/functions" 
  : "/api";

// Monad网络相关常量
export const MONAD_RPC_URL = "https://rpc.monad.xyz/monad";
export const MONAD_CHAIN_ID = 1024;
export const MONAD_EXPLORER_URL = "https://explorer.monad.xyz";

// 成就合约地址
export const ACHIEVEMENT_CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

// 标签列表
export const NARRATIVE_TAGS = [
  "科幻", "奇幻", "悬疑", "冒险", "恐怖", "浪漫", "历史", "现代", 
  "太空", "战争", "神话", "未来", "古代", "末日", "校园", "魔法",
  "赛博朋克", "蒸汽朋克", "克苏鲁", "武侠", "仙侠", "灵异"
];
