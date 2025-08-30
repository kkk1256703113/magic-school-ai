import { APIConfig } from '../types/ai.types'

/**
 * API配置
 */
export const apiConfig: APIConfig = {
  models: {
    gpt5: import.meta.env.VITE_GPT5_MODEL || 'openai/gpt-5',
    claude4: import.meta.env.VITE_CLAUDE4_MODEL || 'anthropic/claude-4-sonnet'
  },
  settings: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
    requestTimeout: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '30000'), // 30s
    maxConcurrentRequests: parseInt(import.meta.env.VITE_MAX_CONCURRENT_REQUESTS || '3'),
    maxTokens: parseInt(import.meta.env.VITE_MAX_TOKENS || '8000'), // 默认高token限制
    debugMode: import.meta.env.VITE_DEBUG_API === 'true'
  }
}

/**
 * 获取模型端点
 */
export function getModelEndpoint(model: 'gpt5' | 'claude4'): string {
  return apiConfig.models[model]
}

/**
 * 获取API设置
 */
export function getAPISettings() {
  return apiConfig.settings
}

/**
 * 获取默认Token限制
 */
export function getDefaultMaxTokens(): number {
  return apiConfig.settings.maxTokens
}