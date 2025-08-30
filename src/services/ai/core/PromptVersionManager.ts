import { logger } from '@/utils/logger'
import { PromptVersion, getPromptVersion, setPromptVersion } from '../config/apiConfig'

/**
 * 提示词版本管理器
 * 统一管理提示词版本选择和切换
 */
export class PromptVersionManager {
  private static instance: PromptVersionManager
  private currentVersion: PromptVersion = 'stable'

  private constructor() {
    this.currentVersion = getPromptVersion()
    logger.info(`提示词版本管理器初始化，当前版本: ${this.currentVersion}`)
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PromptVersionManager {
    if (!PromptVersionManager.instance) {
      PromptVersionManager.instance = new PromptVersionManager()
    }
    return PromptVersionManager.instance
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): PromptVersion {
    return this.currentVersion
  }

  /**
   * 切换版本
   */
  switchVersion(version: PromptVersion): void {
    if (version !== this.currentVersion) {
      const oldVersion = this.currentVersion
      this.currentVersion = version
      setPromptVersion(version)
      
      logger.info(`提示词版本已切换: ${oldVersion} → ${version}`)
    }
  }

  /**
   * 是否使用稳定版本
   */
  isStableVersion(): boolean {
    return this.currentVersion === 'stable'
  }

  /**
   * 是否使用增强版本
   */
  isEnhancedVersion(): boolean {
    return this.currentVersion === 'enhanced'
  }

  /**
   * 重置为稳定版本（故障安全）
   */
  resetToStable(): void {
    logger.warn('触发故障安全机制，重置为稳定版本')
    this.switchVersion('stable')
  }

  /**
   * 获取版本状态信息
   */
  getStatus(): { version: PromptVersion; stable: boolean; enhanced: boolean } {
    return {
      version: this.currentVersion,
      stable: this.isStableVersion(),
      enhanced: this.isEnhancedVersion()
    }
  }
}

/**
 * 全局版本管理器实例
 */
export const promptVersionManager = PromptVersionManager.getInstance()