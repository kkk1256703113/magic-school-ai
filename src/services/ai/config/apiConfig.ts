import { APIConfig } from '../types/ai.types'

/**
 * 提示词版本类型
 */
export type PromptVersion = 'stable' | 'enhanced'

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
    promptVersion: (import.meta.env.VITE_PROMPT_VERSION || 'stable') as PromptVersion, // 提示词版本
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

/**
 * 获取当前提示词版本
 * 首先从localStorage读取，如果没有则使用默认配置
 */
export function getPromptVersion(): PromptVersion {
  try {
    const savedVersion = localStorage.getItem('promptVersion') as PromptVersion
    if (savedVersion && (savedVersion === 'stable' || savedVersion === 'enhanced')) {
      apiConfig.settings.promptVersion = savedVersion
      return savedVersion
    }
  } catch (error) {
    console.warn('无法读取localStorage中的提示词版本设置:', error)
  }
  return apiConfig.settings.promptVersion
}

/**
 * 设置提示词版本（运行时切换并持久化）
 */
export function setPromptVersion(version: PromptVersion): void {
  apiConfig.settings.promptVersion = version
  try {
    localStorage.setItem('promptVersion', version)
  } catch (error) {
    console.warn('无法保存提示词版本设置到localStorage:', error)
  }
}