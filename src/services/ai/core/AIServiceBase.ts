import { logger } from '@/utils/logger'
import { APIClient } from './APIClient'
import { AuthManager } from './AuthManager'
import { ContentInput, ModelType } from '../types/ai.types'

/**
 * AI服务基础抽象类
 * 提供通用功能和接口定义
 */
export abstract class AIServiceBase {
  protected apiClient: APIClient
  protected authManager: AuthManager
  protected modelType: ModelType

  constructor(modelType: ModelType) {
    this.apiClient = new APIClient()
    this.authManager = AuthManager.getInstance()
    this.modelType = modelType
  }

  /**
   * 检查认证和API限制
   */
  protected async checkAuthAndLimit(): Promise<void> {
    await this.authManager.validateAuthAndLimit()
  }

  /**
   * 记录API使用
   */
  protected async recordUsage(
    endpoint: string,
    cost: number,
    success: boolean
  ): Promise<void> {
    await this.authManager.recordAPIUsage(
      endpoint,
      this.modelType,
      cost,
      success
    )
  }

  /**
   * 执行API调用的通用包装方法
   */
  protected async executeWithAuth<T>(
    operation: () => Promise<T>,
    endpoint: string,
    cost = 1
  ): Promise<T> {
    try {
      // 检查认证和限制
      await this.checkAuthAndLimit()
      
      // 执行操作
      const result = await operation()
      
      // 记录成功的使用
      await this.recordUsage(endpoint, cost, true)
      
      return result
    } catch (error) {
      // 记录失败的使用
      await this.recordUsage(endpoint, cost, false)
      
      logger.error(`${this.modelType} API调用失败`, { endpoint, error })
      throw error
    }
  }

  /**
   * 获取模型端点
   */
  protected abstract getModelEndpoint(): string

  /**
   * 生成内容（由子类实现）
   */
  abstract generateContent(input: ContentInput): Promise<any>

  /**
   * 分析内容（由子类实现）
   */
  abstract analyzeContent(content: string, files?: File[], signal?: AbortSignal): Promise<any>

  /**
   * 生成HTML（由子类实现）
   */
  abstract generateHTML(content: string, files?: File[], signal?: AbortSignal): Promise<any>
}