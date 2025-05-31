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

// Monad网络相关常量
export const MONAD_RPC_URL = "https://rpc.monad.xyz/monad";
export const MONAD_CHAIN_ID = 1024;
export const MONAD_EXPLORER_URL = "https://explorer.monad.xyz";

// 成就合约地址
export const ACHIEVEMENT_CONTRACT_ADDRESS = "0xC94F53281Ef92Cb9651b57C805eA5D283754d455";

// 标签列表
export const NARRATIVE_TAGS = [
  "科幻", "奇幻", "悬疑", "冒险", "恐怖", "浪漫", "历史", "现代",
  "太空", "战争", "神话", "未来", "古代", "末日", "校园", "魔法",
  "赛博朋克", "蒸汽朋克", "克苏鲁", "武侠", "仙侠", "灵异"
];
