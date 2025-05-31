import { HandlerResponse } from '@netlify/functions';

// 成功响应
export function success<T>(data: T, statusCode: number = 200): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

// 错误响应
export function error(message: string, statusCode: number = 400): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({ error: message })
  };
}

// 404 Not Found
export function notFound(message: string = 'Resource not found'): HandlerResponse {
  return error(message, 404);
}

// 401 Unauthorized
export function unauthorized(message: string = 'Unauthorized'): HandlerResponse {
  return error(message, 401);
}

// 403 Forbidden
export function forbidden(message: string = 'Forbidden'): HandlerResponse {
  return error(message, 403);
}

// 500 Internal Server Error
export function serverError(message: string = 'Internal server error'): HandlerResponse {
  return error(message, 500);
}

// 验证用户是否已认证
export function validateAuth(headers: Record<string, string | undefined>): boolean {
  // 检查模拟认证头（用于测试）
  const authToken = headers['x-auth-token'] || headers['X-Auth-Token'];
  const userFid = headers['x-user-fid'] || headers['X-User-FID'];

  // 如果有模拟认证头，验证通过
  if (authToken === 'demo-token' && userFid) {
    return true;
  }

  // 检查标准Bearer token
  const authHeader = headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return !!token;
  }

  // 在开发环境中，允许无认证访问
  return true;
}

// 从请求头获取用户FID
export function getUserFid(headers: Record<string, string | undefined>): number | null {
  // 首先尝试从X-User-FID头获取
  const userFidHeader = headers['x-user-fid'] || headers['X-User-FID'];
  if (userFidHeader) {
    try {
      return parseInt(userFidHeader, 10);
    } catch (error) {
      // 解析失败，继续尝试其他方法
    }
  }

  // 备用方案：从Bearer token获取
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    return parseInt(token, 10);
  } catch (error) {
    return null;
  }
}

export default {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
  serverError,
  validateAuth,
  getUserFid
};