import { logger } from '@/utils/logger'
import { AuthConfig, AuthError } from '../types/ai.types'

/**
 * 认证管理器（单例模式）
 * 管理API认证和使用限制
 */
export class AuthManager {
  private static instance: AuthManager
  private authConfig: AuthConfig = {
    token: null
  }

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * 设置认证配置
   */
  setConfig(
    token: string | null,
    checkLimit?: () => Promise<{ canUse: boolean; remaining: number }>,
    recordUsage?: (endpoint: string, model: string, cost: number, success: boolean) => Promise<void>
  ) {
    this.authConfig = {
      token,
      checkLimit,
      recordUsage
    }
    logger.info('认证配置已更新', { hasToken: !!token })
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.authConfig.token
  }

  /**
   * 获取认证令牌
   */
  getToken(): string | null {
    return this.authConfig.token
  }

  /**
   * 检查API使用限制
   */
  async checkAPILimit(): Promise<{ canUse: boolean; remaining: number }> {
    if (!this.authConfig.checkLimit) {
      logger.warn('API限制检查器未配置，默认允许使用')
      return { canUse: true, remaining: -1 }
    }

    try {
      const result = await this.authConfig.checkLimit()
      logger.info('API限制检查完成', result)
      return result
    } catch (error) {
      logger.error('API限制检查失败', { error })
      throw new AuthError('无法检查API使用限制')
    }
  }

  /**
   * 记录API使用
   */
  async recordAPIUsage(
    endpoint: string,
    model: string,
    cost: number,
    success: boolean
  ): Promise<void> {
    if (!this.authConfig.recordUsage) {
      logger.info('API使用记录器未配置，跳过记录')
      return
    }

    try {
      await this.authConfig.recordUsage(endpoint, model, cost, success)
      logger.info('API使用已记录', { endpoint, model, cost, success })
    } catch (error) {
      logger.error('记录API使用失败', { error })
      // 记录失败不应影响主流程，所以不抛出错误
    }
  }

  /**
   * 验证认证和限制
   * 🔧 修复：所有环境都进行正确的API限制检查
   */
  async validateAuthAndLimit(): Promise<void> {
    const isProduction = typeof window !== 'undefined' && window.location?.hostname?.includes('magicschoolai.net')

    // 🔐 统一的认证检查（开发环境和生产环境）
    if (!this.isAuthenticated()) {
      const errorMsg = isProduction ? '请登录后使用API功能' : '⚠️ 开发环境：用户未登录'
      logger.warn(errorMsg)
      throw new AuthError('用户未登录，无法使用API功能')
    }

    // 🔍 统一的API限制检查（开发环境和生产环境）
    try {
      const { canUse, remaining } = await this.checkAPILimit()
      if (!canUse) {
        const errorMsg = `API调用次数已用完，剩余次数：${remaining}`
        logger.warn('🚫 API限制阻止调用', { remaining, isProduction })
        throw new AuthError(errorMsg)
      }

      logger.info('✅ 认证和限制验证通过', {
        remaining,
        environment: isProduction ? 'production' : 'development'
      })
    } catch (error) {
      // 如果是AuthError就直接抛出，否则包装一下
      if (error instanceof AuthError) {
        throw error
      }
      logger.error('❌ API限制检查失败', { error: error instanceof Error ? error.message : String(error) })
      throw new AuthError('无法验证API使用限制，请稍后重试')
    }
  }

  /**
   * 清除认证信息
   */
  clear() {
    this.authConfig = { token: null }
    logger.info('认证信息已清除')
  }
}