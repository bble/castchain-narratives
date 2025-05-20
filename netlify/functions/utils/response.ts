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
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return !!token;
}

// 从请求头获取用户FID
export function getUserFid(headers: Record<string, string | undefined>): number | null {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // 在真实环境中，这里应该验证JWT token并从中提取FID
  // 为了演示，我们假设token就是用户的FID
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