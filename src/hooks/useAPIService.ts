import { useState, useEffect } from 'react'
import { logger } from '../utils/logger'
import { aiService } from '../services/replicateAPI'
import { mockAPIService } from '../services/mockAPI'
import type { APIConfig } from '../types/chat'

export const useAPIService = () => {
  const [useMockAPI, setUseMockAPI] = useState(false)
  const [selectedModel, setSelectedModel] = useState<'gpt5' | 'claude37'>('gpt5')
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    hasToken: false,
    useMockAPI: false
  })

  useEffect(() => {
    checkAPIAvailability()
  }, [])

  const checkAPIAvailability = () => {
    // 强制使用真实API
    setUseMockAPI(false)
    
    const hasToken = !!import.meta.env.VITE_REPLICATE_API_TOKEN
    const tokenValue = import.meta.env.VITE_REPLICATE_API_TOKEN
    
    logger.info('✅ 强制使用真实API模式', {
      replicateToken: hasToken ? '已配置' : '未配置'
    }, 'APIService')
    
    console.log('🔧 环境变量检查:', {
      VITE_REPLICATE_API_TOKEN: hasToken ? `存在(${tokenValue?.length}字符)` : '缺失',
      全部环境变量: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    })
    
    setApiConfig({
      hasToken,
      tokenValue,
      useMockAPI: false
    })

    return { hasToken, tokenValue }
  }

  const getAPIService = () => {
    return useMockAPI ? mockAPIService : aiService
  }

  const getConfigMessage = (hasToken: boolean) => {
    if (!hasToken) {
      return `❌ **API配置缺失**

需要配置Replicate API Token才能使用AI功能：

**步骤1**: 在项目根目录创建 \`.env.local\` 文件
**步骤2**: 添加以下内容：
\`\`\`
VITE_REPLICATE_API_TOKEN=你的API密钥
\`\`\`

**获取API密钥**: 访问 https://replicate.com/account

配置完成后刷新页面即可使用完整功能！`
    }
    
    return '✅ API配置已就绪！现在可以使用完整的AI分析功能。'
  }

  return {
    useMockAPI,
    setUseMockAPI,
    selectedModel,
    setSelectedModel,
    apiConfig,
    checkAPIAvailability,
    getAPIService,
    getConfigMessage
  }
}