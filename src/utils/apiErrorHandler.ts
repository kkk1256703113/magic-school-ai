import { logger } from '@/utils/logger'
import type { TFunction } from 'i18next'

/**
 * API错误类型枚举
 */
export enum APIErrorType {
  NO_CREDITS = 'NO_CREDITS',
  LOW_CREDITS = 'LOW_CREDITS',
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 友好错误响应接口
 */
export interface FriendlyErrorResponse {
  type: APIErrorType
  title: string
  message: string
  actionButton?: string
  actionHandler?: () => void
  supportText?: string
  remaining?: number
  showUpgrade?: boolean
}

/**
 * 检测错误类型
 * @param error 错误对象或错误信息
 * @param remaining 剩余次数
 * @returns 错误类型
 */
export function detectAPIErrorType(error: any, remaining?: number): APIErrorType {
  // 优先检查error对象上的errorType属性（AuthManager设置的）
  if (error?.errorType) {
    return error.errorType
  }

  const errorStr = error instanceof Error ? error.message : String(error).toLowerCase()

  // 检查API次数相关错误
  if (errorStr.includes('no api calls remaining') ||
      errorStr.includes('no_api_calls_remaining') ||
      errorStr.includes('api调用次数已用完') ||
      errorStr.includes('api调用次数已达上限') ||
      errorStr.includes('余额不足') ||
      remaining === 0) {
    return APIErrorType.NO_CREDITS
  }

  // 检查低余额警告
  if (remaining !== undefined && remaining > 0 && remaining <= 3) {
    return APIErrorType.LOW_CREDITS
  }

  // 检查认证错误
  if (errorStr.includes('unauthorized') ||
      errorStr.includes('401') ||
      errorStr.includes('用户未登录') ||
      errorStr.includes('身份验证失败')) {
    return APIErrorType.AUTH_ERROR
  }

  // 检查网络错误
  if (errorStr.includes('network') ||
      errorStr.includes('fetch') ||
      errorStr.includes('connection') ||
      errorStr.includes('网络') ||
      errorStr.includes('连接')) {
    return APIErrorType.NETWORK_ERROR
  }

  // 检查服务器错误
  if (errorStr.includes('500') ||
      errorStr.includes('502') ||
      errorStr.includes('503') ||
      errorStr.includes('server error') ||
      errorStr.includes('service unavailable') ||
      errorStr.includes('服务器错误') ||
      errorStr.includes('服务不可用')) {
    return APIErrorType.SERVER_ERROR
  }

  // 检查支付错误
  if (errorStr.includes('payment') ||
      errorStr.includes('402') ||
      errorStr.includes('支付') ||
      errorStr.includes('billing')) {
    return APIErrorType.PAYMENT_ERROR
  }

  // 检查配置错误
  if (errorStr.includes('configuration') ||
      errorStr.includes('config') ||
      errorStr.includes('api token') ||
      errorStr.includes('配置') ||
      errorStr.includes('未配置')) {
    return APIErrorType.CONFIG_ERROR
  }

  // 检查处理错误
  if (errorStr.includes('processing') ||
      errorStr.includes('failed to process') ||
      errorStr.includes('处理失败') ||
      errorStr.includes('处理错误')) {
    return APIErrorType.PROCESSING_ERROR
  }

  return APIErrorType.UNKNOWN_ERROR
}

/**
 * 生成友好的错误响应
 * @param error 错误对象
 * @param t 翻译函数
 * @param remaining 剩余次数
 * @param onUpgrade 升级回调函数
 * @returns 友好错误响应
 */
export function createFriendlyErrorResponse(
  error: any,
  t: TFunction,
  remaining?: number,
  onUpgrade?: () => void
): FriendlyErrorResponse {
  const errorType = detectAPIErrorType(error, remaining)

  logger.warn('API错误处理', {
    errorType,
    remaining,
    originalError: error instanceof Error ? error.message : String(error)
  })

  switch (errorType) {
    case APIErrorType.NO_CREDITS:
      return {
        type: errorType,
        title: t('apiLimit.noCreditsTitle'),
        message: t('apiLimit.noCreditsMessage'),
        actionButton: t('apiLimit.upgradeButton'),
        actionHandler: onUpgrade,
        supportText: t('apiLimit.helpText'),
        remaining: 0,
        showUpgrade: true
      }

    case APIErrorType.LOW_CREDITS:
      return {
        type: errorType,
        title: t('apiLimit.noCreditsTitle'),
        message: t('apiLimit.noCreditsMessageWithRemaining', { remaining }),
        actionButton: t('apiLimit.upgradeButton'),
        actionHandler: onUpgrade,
        supportText: t('apiLimit.retryPrompt'),
        remaining,
        showUpgrade: true
      }

    case APIErrorType.AUTH_ERROR:
      return {
        type: errorType,
        title: t('apiLimit.authError'),
        message: t('apiLimit.authError'),
        supportText: t('apiLimit.contactSupport'),
        showUpgrade: false
      }

    case APIErrorType.NETWORK_ERROR:
      return {
        type: errorType,
        title: t('apiLimit.networkError'),
        message: t('apiLimit.networkError'),
        supportText: t('apiLimit.retryPrompt'),
        showUpgrade: false
      }

    case APIErrorType.SERVER_ERROR:
      return {
        type: errorType,
        title: t('apiLimit.serverError'),
        message: t('apiLimit.serverError'),
        supportText: t('apiLimit.contactSupport'),
        showUpgrade: false
      }

    case APIErrorType.PAYMENT_ERROR:
      return {
        type: errorType,
        title: t('apiLimit.paymentError'),
        message: t('apiLimit.paymentError'),
        supportText: t('apiLimit.contactSupport'),
        showUpgrade: false
      }

    case APIErrorType.CONFIG_ERROR:
      return {
        type: errorType,
        title: t('apiLimit.configError'),
        message: t('apiLimit.configError'),
        supportText: t('apiLimit.contactSupport'),
        showUpgrade: false
      }

    case APIErrorType.PROCESSING_ERROR:
      return {
        type: errorType,
        title: t('apiLimit.processingFailed'),
        message: t('apiLimit.processingFailed'),
        supportText: t('apiLimit.retryPrompt'),
        showUpgrade: false
      }

    default:
      return {
        type: APIErrorType.UNKNOWN_ERROR,
        title: t('chat.errors.unknownError'),
        message: error instanceof Error ? error.message : String(error),
        supportText: t('apiLimit.contactSupport'),
        showUpgrade: false
      }
  }
}

/**
 * 简化的错误信息生成函数 - 用于替换现有的硬编码错误信息
 * @param error 错误对象
 * @param t 翻译函数
 * @param remaining 剩余次数
 * @returns 友好的错误消息字符串
 */
export function getFriendlyErrorMessage(
  error: any,
  t: TFunction,
  remaining?: number
): string {
  const errorType = detectAPIErrorType(error, remaining)

  switch (errorType) {
    case APIErrorType.NO_CREDITS:
      return `${t('apiLimit.noCreditsTitle')}\n\n${t('apiLimit.noCreditsMessage')}\n\n${t('apiLimit.upgradePrompt')}`

    case APIErrorType.LOW_CREDITS:
      return `${t('apiLimit.noCreditsTitle')}\n\n${t('apiLimit.noCreditsMessageWithRemaining', { remaining })}\n\n${t('apiLimit.retryPrompt')}`

    case APIErrorType.AUTH_ERROR:
      return t('apiLimit.authError')

    case APIErrorType.NETWORK_ERROR:
      return t('apiLimit.networkError')

    case APIErrorType.SERVER_ERROR:
      return t('apiLimit.serverError')

    case APIErrorType.PAYMENT_ERROR:
      return t('apiLimit.paymentError')

    case APIErrorType.CONFIG_ERROR:
      return t('apiLimit.configError')

    case APIErrorType.PROCESSING_ERROR:
      return t('apiLimit.processingFailed')

    default:
      return error instanceof Error ? error.message : String(error)
  }
}

/**
 * 错误日志记录
 * @param error 错误对象
 * @param context 上下文信息
 */
export function logAPIError(error: any, context: string) {
  logger.error(`API错误 - ${context}`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context
  })
}