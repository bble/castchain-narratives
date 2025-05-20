// fauna包的类型声明

declare module 'fauna' {
  export class Client {
    constructor(options: {
      secret: string;
      domain?: string;
      scheme?: string;
      port?: number;
      timeout?: number;
      headers?: Record<string, string>;
    });
    
    query<T = any>(expr: any): Promise<{ data: T }>;
  }
  
  // fql模板字符串标签函数
  export function fql(strings: TemplateStringsArray, ...values: any[]): any;
} 