import { useState, useEffect } from 'react'
import { logger } from '../utils/logger'
import { aiService } from '../services/replicateAPI'
import type { APIConfig } from '../types/chat'

export const useAPIService = () => {
  const [selectedModel, setSelectedModel] = useState<'gpt5' | 'claude37'>('gpt5')
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    hasToken: false
  })

  useEffect(() => {
    checkAPIAvailability()
  }, [])

  const checkAPIAvailability = () => {
    const hasToken = !!import.meta.env.VITE_REPLICATE_API_TOKEN
    const tokenValue = import.meta.env.VITE_REPLICATE_API_TOKEN
    
    logger.info('API状态检查', {
      replicateToken: hasToken ? '已配置' : '未配置'
    }, 'APIService')
    
    console.log('🔧 环境变量检查:', {
      VITE_REPLICATE_API_TOKEN: hasToken ? `存在(${tokenValue?.length}字符)` : '缺失',
      全部环境变量: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    })
    
    setApiConfig({
      hasToken,
      tokenValue
    })

    return { hasToken, tokenValue }
  }

  const getAPIService = () => {
    return aiService
  }

  return {
    selectedModel,
    setSelectedModel,
    apiConfig,
    checkAPIAvailability,
    getAPIService
  }
}