import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Narrative,
  NarrativeContribution,
  NarrativeBranch,
  UserAchievement,
  Notification
} from '../../../types/narrative';

// 日志函数
function logError(message: string, ...args: any[]) {
  console.error(`[SUPABASE:ERROR ${new Date().toISOString()}] ${message}`, ...args);
}

// 检查环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logError('Supabase环境变量未设置！需要SUPABASE_URL和SUPABASE_ANON_KEY');
}

// 单例Supabase客户端
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase环境变量未设置');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// 表名定义
export const tables = {
  narratives: 'narratives',
  contributions: 'contributions',
  branches: 'branches',
  achievements: 'achievements',
  followers: 'followers',
  notifications: 'notifications',
} as const;

// 创建记录
export async function create(table: string, data: any): Promise<any> {
  try {
    const client = getSupabaseClient();

    const { data: result, error } = await client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      logError(`创建记录失败 [${table}]:`, error);
      throw error;
    }

    return result;
  } catch (error) {
    logError(`创建记录异常 [${table}]:`, error);
    throw error;
  }
}

// 获取单个记录
export async function get(table: string, id: string): Promise<any> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logError(`获取记录失败 [${table}:${id}]:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    logError(`获取记录异常 [${table}:${id}]:`, error);
    throw error;
  }
}

// 更新记录
export async function update(table: string, id: string, data: any): Promise<any> {
  try {
    const client = getSupabaseClient();

    const { data: result, error } = await client
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logError(`更新记录失败 [${table}:${id}]:`, error);
      throw error;
    }

    return result;
  } catch (error) {
    logError(`更新记录异常 [${table}:${id}]:`, error);
    throw error;
  }
}

// 根据自定义字段更新记录
export async function updateByField(table: string, field: string, value: string, data: any): Promise<any> {
  try {
    const client = getSupabaseClient();

    const { data: result, error } = await client
      .from(table)
      .update(data)
      .eq(field, value)
      .select()
      .single();

    if (error) {
      logError(`更新记录失败 [${table}:${field}=${value}]:`, error);
      throw error;
    }

    return result;
  } catch (error) {
    logError(`更新记录异常 [${table}:${field}=${value}]:`, error);
    throw error;
  }
}

// 删除记录
export async function remove(table: string, id: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      logError(`删除记录失败 [${table}:${id}]:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    logError(`删除记录异常 [${table}:${id}]:`, error);
    throw error;
  }
}

// 计数记录
export async function count(table: string, options: {
  filters?: { [key: string]: any };
} = {}): Promise<number> {
  try {
    const client = getSupabaseClient();

    let queryBuilder = client.from(table).select('*', { count: 'exact', head: true });

    // 应用过滤条件
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          queryBuilder = queryBuilder.in(key, value);
        } else {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
    }

    const { count: totalCount, error } = await queryBuilder;

    if (error) {
      logError(`计数失败 [${table}]:`, error);
      throw error;
    }

    return totalCount || 0;
  } catch (error) {
    logError(`计数异常 [${table}]:`, error);
    throw error;
  }
}

// 查询记录
export async function query(table: string, options: {
  filters?: { [key: string]: any };
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
} = {}): Promise<any[]> {
  try {
    const client = getSupabaseClient();

    let queryBuilder = client.from(table).select('*');

    // 应用过滤条件
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          queryBuilder = queryBuilder.in(key, value);
        } else {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
    }

    // 应用排序
    if (options.orderBy) {
      queryBuilder = queryBuilder.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false
      });
    }

    // 应用分页
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }
    if (options.offset) {
      queryBuilder = queryBuilder.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      logError(`查询失败 [${table}]:`, error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logError(`查询异常 [${table}]:`, error);
    throw error;
  }
}

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('narratives')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      logError('连接测试失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    logError('连接测试异常:', error);
    return false;
  }
}

// 初始化数据库
export async function setupDatabase(): Promise<boolean> {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('无法连接到Supabase数据库');
    }

    return true;
  } catch (error) {
    logError('数据库初始化失败:', error);
    throw error;
  }
}

export default {
  create,
  get,
  update,
  updateByField,
  remove,
  query,
  count,
  testConnection,
  setupDatabase,
  tables
};
