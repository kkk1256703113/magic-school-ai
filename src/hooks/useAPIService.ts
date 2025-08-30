import { useState, useEffect } from 'react'
import { logger } from '@/utils/logger'
import { aiService } from '@/services/ai'
import type { APIConfig } from '@/types/chat'

export const useAPIService = () => {
  const [selectedModel, setSelectedModel] = useState<'gpt5' | 'claude4'>('gpt5')
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    hasToken: false
  })
  const [modelStatus, setModelStatus] = useState<Record<string, {
    available: boolean
    model: string
    error?: string
  }>>({})

  useEffect(() => {
    checkAPIAvailability()
    // 可选：启动时验证模型（可能比较慢，先注释掉）
    // validateModels()
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

  const validateModels = async () => {
    try {
      console.log('🔍 开始验证模型可用性...')
      const results = await aiService.validateAllModels()
      setModelStatus(results)
      
      // 如果当前选择的模型不可用，自动切换到可用的模型
      if (results[selectedModel] && !results[selectedModel].available) {
        const availableModel = Object.keys(results).find(key => results[key].available) as 'gpt5' | 'claude4'
        if (availableModel && availableModel !== selectedModel) {
          console.log(`⚠️ 自动切换模型: ${selectedModel} -> ${availableModel}`)
          setSelectedModel(availableModel)
        }
      }
    } catch (error) {
      console.error('❌ 模型验证失败:', error)
    }
  }

  const getAPIService = () => {
    return aiService
  }

  return {
    selectedModel,
    setSelectedModel,
    apiConfig,
    modelStatus,
    checkAPIAvailability,
    validateModels,
    getAPIService
  }
}