/**
 * 格式化距离当前时间的时间间隔
 * @param date 要格式化的日期
 * @returns 格式化后的字符串，如"5分钟前"、"2小时前"、"3天前"等
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天前`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
}

/**
 * 生成随机ID
 * @returns 随机字符串ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 截断文本到指定长度，超出部分用省略号表示
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
}

/**
 * 解析URL参数
 * @param url URL字符串
 * @returns 包含参数的对象
 */
export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  const searchParams = new URLSearchParams(urlObj.search);
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * 从Farcaster Context安全获取用户FID
 * @param context Farcaster上下文对象或类似结构
 * @returns 用户FID或null
 */
export function getUserFid(context: any): number | null {
  return context?.user?.fid || null;
}

/**
 * 格式化地址，例如将 0x1234567890abcdef1234567890abcdef12345678 格式化为 0x1234...5678
 * @param address 以太坊地址
 * @param firstChars 保留的前缀字符数，默认为4
 * @param lastChars 保留的后缀字符数，默认为4
 * @returns 格式化后的地址
 */
export function formatAddress(
  address: string,
  firstChars: number = 4,
  lastChars: number = 4
): string {
  if (!address) return "";
  const start = address.substring(0, firstChars + 2); // +2 for "0x"
  const end = address.substring(address.length - lastChars);
  return `${start}...${end}`;
}

/**
 * 将数组分组
 * @param array 要分组的数组
 * @param size 每组的大小
 * @returns 分组后的二维数组
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * 随机选择数组中的一个元素
 * @param array 源数组
 * @returns 随机选中的元素
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 在两个数之间生成随机数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机数
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 将对象的键值对转换为URL查询字符串
 * @param params 参数对象
 * @returns URL查询字符串
 */
export function objectToQueryString(params: Record<string, any>): string {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
}

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key as keyof typeof source])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof typeof source] });
        } else {
          (output as any)[key] = deepMerge(
            (target as any)[key],
            (source as any)[key]
          );
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof typeof source] });
      }
    });
  }
  
  return output;
}

/**
 * 判断一个值是否为对象
 * @param item 要判断的值
 * @returns 是否为对象
 */
function isObject(item: any): boolean {
  return item && typeof item === "object" && !Array.isArray(item);
} 