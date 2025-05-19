// FaunaDB类型声明

declare module 'faunadb' {
  export const query: any;
  
  export class Client {
    constructor(options: {
      secret: string;
      domain?: string;
      scheme?: string;
      port?: number;
      timeout?: number;
      headers?: Record<string, string>;
    });
    
    query<T = any>(expr: any): Promise<T>;
  }
  
  export namespace query {
    export function Ref(collection: any, id: string): any;
    export function Collection(name: string): any;
    export function Create(collection: any, params: any): any;
    export function Get(ref: any): any;
    export function Update(ref: any, params: any): any;
    export function Replace(ref: any, params: any): any;
    export function Delete(ref: any): any;
    export function Match(index: any, ...terms: any[]): any;
    export function Index(name: string): any;
    export function Map(collection: any, lambda: any): any;
    export function Paginate(set: any, opts?: any): any;
    export function Lambda(pattern: any, expr: any): any;
    export function Documents(collection: any): any;
    export function Filter(collection: any, lambda: any): any;
    export function CreateCollection(params: any): any;
    export function CreateIndex(params: any): any;
    export function Exists(ref: any): any;
    export function Var(name: string): any;
  }
} 