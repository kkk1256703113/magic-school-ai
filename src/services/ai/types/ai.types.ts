// AI服务相关类型定义

export type ModelType = 'gpt5' | 'claude4'

export interface APIConfig {
  models: Record<ModelType, string>
  settings: {
    maxFileSize: number
    requestTimeout: number
    maxConcurrentRequests: number
    debugMode: boolean
  }
}

export interface AuthConfig {
  token: string | null
  checkLimit?: () => Promise<{ canUse: boolean; remaining: number }>
  recordUsage?: (endpoint: string, model: string, cost: number, success: boolean) => Promise<void>
}

export interface PredictionResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: any
  error?: string
}

export interface ContentInput {
  content: string
  files?: File[]
  style?: string
  signal?: AbortSignal
}

export interface PromptConfig {
  prompt: string
  reasoning_effort?: 'low' | 'medium' | 'high'
  verbosity?: 'low' | 'medium' | 'high'
  max_tokens?: number
  temperature?: number
}

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`)
    this.name = 'APIError'
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ModelError extends Error {
  constructor(
    public model: string,
    message: string
  ) {
    super(message)
    this.name = 'ModelError'
  }
}