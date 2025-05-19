// Netlify Functions 类型声明

declare module '@netlify/functions' {
  export interface Context {
    identity?: {
      user?: {
        sub: string;
        email: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
    user?: {
      sub: string;
      [key: string]: any;
    };
    clientContext?: {
      [key: string]: any;
    };
    [key: string]: any;
  }

  export interface Event {
    rawUrl: string;
    body: string | null;
    rawQuery: string;
    headers: Record<string, string>;
    httpMethod: string;
    isBase64Encoded: boolean;
    multiValueHeaders: Record<string, string[]>;
    multiValueQueryStringParameters: Record<string, string[]> | null;
    path: string;
    queryStringParameters: Record<string, string> | null;
  }

  export type Response = {
    statusCode: number;
    headers?: Record<string, string>;
    multiValueHeaders?: Record<string, string[]>;
    body: string;
    isBase64Encoded?: boolean;
  }

  export type Handler = (event: Event, context: Context) => Promise<Response> | Response;
} 