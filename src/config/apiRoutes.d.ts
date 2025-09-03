// TypeScript 声明文件for apiRoutes.js
// 为 JavaScript 模块提供类型定义

export interface APIRoutesAuth {
  LOGIN: string
  REGISTER: string
  STATUS: string
  LOGOUT: string
  FORGOT_PASSWORD: string
  RESET_PASSWORD: string
  SEND_CODE: string
  VERIFY_CODE: string
  GOOGLE: string
}

export interface APIRoutesUsage {
  CHECK: string
  RECORD: string
  HISTORY: string
}

export interface APIRoutesReplicate {
  BASE: string
}

export interface APIRoutes {
  BASE: string
  HEALTH: string
  STATUS: string
  AUTH: APIRoutesAuth
  USAGE: APIRoutesUsage
  REPLICATE: APIRoutesReplicate
}

export const API_ROUTES: APIRoutes

export const API_ROUTE_TYPES: {
  AUTH: string[]
  USAGE: string[]
}

export function getFullApiUrl(route: string, baseUrl?: string): string

export function validateRoute(route: string): boolean