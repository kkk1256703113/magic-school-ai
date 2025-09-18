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
    // 🔧 详细日志：API调用开始
    console.log('🚀 AIServiceBase.executeWithAuth开始:', {
      modelType: this.modelType,
      endpoint,
      cost,
      timestamp: new Date().toISOString()
    })
    
    try {
      // 检查认证和限制
      console.log('🔐 检查认证和限制...')
      await this.checkAuthAndLimit()
      console.log('✅ 认证检查通过')
      
      // 执行操作
      console.log('🎆 开始执行API操作:', endpoint)
      const result = await operation()
      console.log('✅ API操作成功完成')
      
      // 记录成功的使用
      console.log('🔥 准备记录API使用:', { endpoint, modelType: this.modelType, cost, success: true })
      await this.recordUsage(endpoint, cost, true)
      console.log('✅ API使用记录完成')

      // 触发使用数据更新事件
      window.dispatchEvent(new CustomEvent('apiUsageUpdated'))

      return result
    } catch (error) {
      // 🔧 详细错误追踪
      console.error('❌ AIServiceBase.executeWithAuth失败:', {
        modelType: this.modelType,
        endpoint,
        errorName: error instanceof Error ? error.name : 'unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
        timestamp: new Date().toISOString()
      })
      
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