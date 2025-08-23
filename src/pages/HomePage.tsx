import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

import { logger } from '../utils/logger'
import { aiService } from '../services/replicateAPI'
import { mockAPIService } from '../services/mockAPI'

// 消息类型定义
interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'thinking' | 'complete' | 'error'
  data?: {
    formulas?: any
    analysis?: any
    visualization?: any
    files?: File[]
    contentType?: 'text' | 'formula' | 'mixed'
    isLocalAnalysis?: boolean
    hasApiToken?: boolean
    hasErrors?: boolean
    errorDetails?: string[]
  }
}

const HomePage = () => {
  const { theme, toggleTheme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: '👋 你好！我是EduVisualizer AI助手。我可以帮你分析数学公式、解读教育内容，并生成可视化图表。',
      timestamp: new Date(),
      status: 'complete'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [useMockAPI, setUseMockAPI] = useState(false)
  const [selectedModel, setSelectedModel] = useState<'gpt5' | 'claude37'>('gpt5')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 页面加载和API检查
  useEffect(() => {
    logger.info('HomePage loaded - Chat Interface', {
      theme,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    }, 'HomePage')
    
    checkAPIAvailability()
  }, [theme])

  const checkAPIAvailability = () => {
    // 强制使用真实API
    setUseMockAPI(false)
    
    const hasToken = !!import.meta.env.VITE_REPLICATE_API_TOKEN
    const tokenValue = import.meta.env.VITE_REPLICATE_API_TOKEN
    
    logger.info('✅ 强制使用真实API模式', {
      replicateToken: hasToken ? '已配置' : '未配置'
    }, 'HomePage')
    
    console.log('🔧 环境变量检查:', {
      VITE_REPLICATE_API_TOKEN: hasToken ? `存在(${tokenValue?.length}字符)` : '缺失',
      全部环境变量: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    })
    
    // 添加API状态到系统消息
    if (!hasToken) {
      setTimeout(() => {
        const configMessage: Message = {
          id: Date.now().toString() + '_config',
          type: 'system',
          content: `❌ **API配置缺失**

需要配置Replicate API Token才能使用AI功能：

**步骤1**: 在项目根目录创建 \`.env.local\` 文件
**步骤2**: 添加以下内容：
\`\`\`
VITE_REPLICATE_API_TOKEN=你的API密钥
\`\`\`

**获取API密钥**: 访问 https://replicate.com/account

配置完成后刷新页面即可使用完整功能！`,
          timestamp: new Date(),
          status: 'complete'
        }
        setMessages(prev => [...prev, configMessage])
      }, 1000)
    } else {
      console.log('✅ API Token 已配置，长度:', tokenValue?.length)
      setTimeout(() => {
        const successMessage: Message = {
          id: Date.now().toString() + '_success',
          type: 'system',
          content: '✅ API配置已就绪！现在可以使用完整的AI分析功能。',
          timestamp: new Date(),
          status: 'complete'
        }
        setMessages(prev => [...prev, successMessage])
      }, 1000)
    }
  }

  // 添加用户消息
  const addUserMessage = (content: string, files?: File[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
      data: files ? { files } : undefined
    }
    
    setMessages(prev => [...prev, userMessage])
    return userMessage.id
  }

  // 添加助手消息
  const addAssistantMessage = (content: string, status: Message['status'] = 'thinking') => {
    const assistantMessage: Message = {
      id: Date.now().toString() + '_ai',
      type: 'assistant',
      content,
      timestamp: new Date(),
      status
    }
    
    setMessages(prev => [...prev, assistantMessage])
    return assistantMessage.id
  }

  // 更新消息
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ))
  }

  // 处理用户输入
  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return
    
    const userContent = inputText.trim()
    setInputText('')
    setIsProcessing(true)
    
    // 添加用户消息
    addUserMessage(userContent)
    
    // 检查是否是简单问候
    const isSimpleGreeting = /^(在\?|在？|你好|hello|hi|在吗|在嘛)$/i.test(userContent)
    
    // 添加助手思考消息
    const aiMessageId = addAssistantMessage('正在分析中...', 'thinking')
    
    try {
      if (isSimpleGreeting) {
        // 简单问候直接回复，不调用API
        await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟思考时间
        updateMessage(aiMessageId, {
          content: `在的！😊 有什么我可以帮你的吗？\n\n我可以帮你:\n• 📐 分析数学公式 (如 y=x)\n• 📊 分析教育内容\n• 🎨 生成可视化图表\n\n直接输入你的问题即可！`,
          status: 'complete'
        })
      } else {
        // 优先使用简化版本，确保基本功能工作
        const contentType = detectContentType(userContent)
        
        // 检查是否配置了API Token
        const hasToken = !!import.meta.env.VITE_REPLICATE_API_TOKEN
        
        if (!hasToken) {
          // 如果没有配置API Token，使用本地分析
          await handleLocalAnalysis(userContent, contentType, aiMessageId)
        } else {
          // 如果配置了API Token，尝试调用真实API
          await processUserInput(userContent, contentType, aiMessageId)
        }
      }
    } catch (error) {
      updateMessage(aiMessageId, {
        content: `抱歉，处理过程中出现错误：${error instanceof Error ? error.message : '未知错误'}`,
        status: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 检测内容类型
  const detectContentType = (content: string): 'text' | 'formula' | 'mixed' => {
    const hasFormula = /[+\-*/=()x²³¹²³⁰⁴⁵⁶⁷⁸⁹∫∑√]|[a-zA-Z]\s*=|y\s*=|f\(|sin|cos|tan|log|ln|exp|\^|x\^/.test(content)
    const hasText = content.length > 20 || /[。！？，；：""''（）【】]/.test(content)
    
    if (hasFormula && hasText) return 'mixed'
    if (hasFormula) return 'formula'
    return 'text'
  }

  // 本地分析处理（无API Token时使用）
  const handleLocalAnalysis = async (userContent: string, contentType: 'text' | 'formula' | 'mixed', aiMessageId: string) => {
    console.log('🔧 使用本地分析模式（无API Token）')
    
    // 步骤1: 内容识别
    updateMessage(aiMessageId, { content: '🔍 正在分析内容...', status: 'thinking' })
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 步骤2: 生成本地分析结果
    updateMessage(aiMessageId, { content: '📊 正在生成分析报告...', status: 'thinking' })
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    let response = ''
    
    if (contentType === 'formula') {
      response = `我来帮你分析这个数学公式："${userContent}"。\n\n`
      
      // 公式分析
      response += `📐 **公式分析**\n`
      if (userContent.toLowerCase().includes('y=x')) {
        response += `• LaTeX格式: \`y = x\`\n`
        response += `• 说明: 这是一个简单的线性函数，表示y与x相等\n`
        response += `• 特点: 通过原点的45度直线，斜率为1\n\n`
      } else {
        response += `• LaTeX格式: \`${userContent}\`\n`
        response += `• 说明: 这是一个数学表达式\n\n`
      }
      
      // 内容分析
      response += `📊 **内容分析**\n`
      response += `• 学科: 数学\n`
      response += `• 难度: 基础\n`
      response += `• 标签: 线性函数, 基础代数\n`
      response += `• 学习目标: 理解线性关系的基本概念\n\n`
      
      // 可视化信息
      response += `🎨 **可视化建议**\n`
      response += `• 建议绘制坐标系图表\n`
      response += `• 标记几个关键点 (0,0), (1,1), (2,2)\n`
      response += `• 观察直线的斜率和截距\n\n`
      
    } else {
      response = `我来分析这段内容："${userContent}"。\n\n`
      
      response += `📊 **内容分析**\n`
      response += `• 内容类型: 文本内容\n`
      response += `• 长度: ${userContent.length} 字符\n`
      response += `• 建议: 可以进一步详细分析\n\n`
    }
    
    response += `⚠️ **注意**: 当前使用本地分析模式。要获得完整的AI分析功能，请配置API Token:\n\n`
    response += `1. 在项目根目录创建 \`.env.local\` 文件\n`
    response += `2. 添加: \`VITE_REPLICATE_API_TOKEN=你的API密钥\`\n`
    response += `3. 重启服务器\n\n`
    response += `有什么问题可以继续问我！😊`
    
    // 更新最终结果
    updateMessage(aiMessageId, {
      content: response,
      status: 'complete',
      data: { 
        contentType,
        isLocalAnalysis: true,
        hasApiToken: false
      }
    })
    
    console.log('✅ 本地分析完成')
  }

  // 处理用户输入的核心逻辑
  const processUserInput = async (userContent: string, contentType: 'text' | 'formula' | 'mixed', aiMessageId: string) => {
    const apiService = useMockAPI ? mockAPIService : aiService
    const results: any = {}
    let hasErrors = false
    let errorDetails: string[] = []
    
    console.log('🚀 开始处理用户输入:', {
      userContent,
      contentType,
      useMockAPI,
      apiService: typeof apiService,
      hasToken: !!import.meta.env.VITE_REPLICATE_API_TOKEN,
      tokenLength: import.meta.env.VITE_REPLICATE_API_TOKEN?.length
    })
    
    try {
      // 步骤1: 更新状态
      updateMessage(aiMessageId, { content: '🔍 正在分析内容...', status: 'thinking' })
      await new Promise(resolve => setTimeout(resolve, 500)) // 让用户看到状态变化
      
      // 步骤2: 公式分析（如果需要）
      if (contentType === 'formula' || contentType === 'mixed') {
        updateMessage(aiMessageId, { content: '🧮 正在分析数学公式...', status: 'thinking' })
        
        try {
          console.log('📐 开始公式分析...')
          const formulaAnalysis = await analyzeFormulaText(userContent)
          results.formulas = formulaAnalysis
          console.log('✅ 公式分析成功:', formulaAnalysis)
        } catch (error) {
          console.error('❌ 公式分析失败:', error)
          hasErrors = true
          errorDetails.push(`公式分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
          logger.error('公式分析失败', { error }, 'HomePage')
        }
      }
      
      // 步骤3: 内容分析
      updateMessage(aiMessageId, { content: '📊 正在分析内容主题...', status: 'thinking' })
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        console.log('🤖 开始内容分析，调用API:', typeof apiService.analyzeContent)
        console.log('🔑 API Token状态:', !!import.meta.env.VITE_REPLICATE_API_TOKEN ? '已配置' : '未配置')
        console.log('📝 API Token详情:', {
          exists: !!import.meta.env.VITE_REPLICATE_API_TOKEN,
          length: import.meta.env.VITE_REPLICATE_API_TOKEN?.length,
          firstChars: import.meta.env.VITE_REPLICATE_API_TOKEN?.substring(0, 3) + '...',
          env: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
        })
        
        if (!import.meta.env.VITE_REPLICATE_API_TOKEN) {
          throw new Error('API Token未配置，请检查 .env.local 文件中的 VITE_REPLICATE_API_TOKEN 配置')
        }
        
        // 显示等待提示
        updateMessage(aiMessageId, { content: '🤖 正在创建AI任务...（预计需要30-60秒）', status: 'thinking' })
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        updateMessage(aiMessageId, { content: '⏳ AI正在深度分析中...可能需要1-2分钟，请耐心等待', status: 'thinking' })
        
        // 定期更新状态提示，让用户知道还在处理中
        const statusInterval = setInterval(() => {
          if (!isProcessing) return
          const currentTime = new Date().toLocaleTimeString()
          updateMessage(aiMessageId, { 
            content: `⏳ AI仍在分析中...（${currentTime}）请继续等待，不要关闭页面`, 
            status: 'thinking' 
          })
        }, 10000) // 每10秒更新一次状态
        
        // 存储interval ID以便后续清除
        ;(window as any).statusInterval = statusInterval
        
        console.log('📤 准备调用analyzeContent API...')
        console.log('🤖 选择的模型:', selectedModel)
        try {
          let contentAnalysis
          if (selectedModel === 'claude37' && !useMockAPI) {
            console.log('🧠 使用 Claude 3.7 Sonnet 进行分析')
            contentAnalysis = await aiService.analyzeContentWithClaude(userContent)
          } else {
            console.log('🤖 使用 GPT-5 进行分析')
            contentAnalysis = await apiService.analyzeContent(userContent)
          }
          console.log('📥 API调用成功，返回结果:', contentAnalysis)
          results.analysis = contentAnalysis
          
          // 清除状态更新间隔器
          const currentStatusInterval = (window as any).statusInterval
          if (currentStatusInterval) {
            console.log('🧹 清除状态更新间隔器')
            clearInterval(currentStatusInterval)
            ;(window as any).statusInterval = null
          } else {
            console.log('⚠️ 未找到状态更新间隔器')
          }
          
          console.log('✅ 内容分析完成:', contentAnalysis)
        } catch (apiError) {
          console.error('❌ analyzeContent API调用失败:', apiError)
          throw apiError
        }
        
        // 显示成功状态
        updateMessage(aiMessageId, { content: '✅ 内容分析完成！正在整理结果...', status: 'thinking' })
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        // 清除状态更新间隔器
        const errorStatusInterval = (window as any).statusInterval
        if (errorStatusInterval) {
          console.log('🧹 错误处理：清除状态更新间隔器')
          clearInterval(errorStatusInterval)
          ;(window as any).statusInterval = null
        } else {
          console.log('⚠️ 错误处理：未找到状态更新间隔器')
        }
        
        console.error('❌ 内容分析失败:', error)
        console.error('错误详情:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error
        })
        hasErrors = true
        
        let errorMessage = '未知错误'
        if (error instanceof Error) {
          errorMessage = error.message
          
          // 特定错误处理
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            errorMessage = 'API密钥无效或已过期'
          } else if (errorMessage.includes('402') || errorMessage.includes('Payment Required')) {
            errorMessage = 'API余额不足，请充值'
          } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            errorMessage = '网络连接失败，请检查网络或API服务状态'
          } else if (errorMessage.includes('API Token未配置')) {
            errorMessage = 'API Token未配置，请在.env.local文件中添加VITE_REPLICATE_API_TOKEN'
          }
        }
        
        errorDetails.push(`内容分析失败: ${errorMessage}`)
        logger.error('内容分析失败', { error }, 'HomePage')
        
        // 提供降级的内容分析
        results.analysis = {
          subject: '分析失败',
          difficulty: 'unknown',
          tags: ['API调用失败'],
          confidence: 0.0,
          learningObjectives: ['请先配置API Token'],
          prerequisites: ['检查网络和API配置'],
          category: '配置错误',
          keyTopics: ['API配置'],
          suggestions: ['请检查.env.local文件中的API Token配置']
        }
      }
      
      // 步骤4: 可视化生成（对于公式）
      if (contentType === 'formula' || contentType === 'mixed') {
        updateMessage(aiMessageId, { content: '🎨 正在生成可视化图表...', status: 'thinking' })
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        try {
          const visualizationData = {
            text: userContent,
            type: contentType,
            formulas: results.formulas,
            analysis: results.analysis
          }
          
          console.log('🎨 开始生成可视化...')
          
          // 显示详细的等待状态
          updateMessage(aiMessageId, { content: '🖼️ 正在创建图像生成任务...（预计需要10-20秒）', status: 'thinking' })
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          updateMessage(aiMessageId, { content: '🎨 AI正在绘制可视化图表...请稍候', status: 'thinking' })
          
          const visualization = await apiService.generateVisualization(visualizationData, 'mathematical')
          results.visualization = visualization
          
          console.log('✅ 可视化生成完成:', visualization)
          
          // 显示成功状态
          updateMessage(aiMessageId, { content: '✅ 可视化生成完成！正在最终整理...', status: 'thinking' })
          await new Promise(resolve => setTimeout(resolve, 800))
          
        } catch (error) {
          console.error('❌ 可视化生成失败:', error)
          hasErrors = true
          errorDetails.push(`可视化生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
          logger.error('可视化生成失败', { error }, 'HomePage')
        }
      }
      
      // 步骤5: 生成响应内容
      updateMessage(aiMessageId, { content: '📝 正在整理回复...', status: 'thinking' })
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const responseContent = generateResponseContent(userContent, contentType, results, hasErrors, errorDetails)
      
      console.log('🎯 最终处理结果:', {
        hasFormulas: !!results.formulas,
        hasAnalysis: !!results.analysis,
        hasVisualization: !!results.visualization,
        hasErrors,
        errorCount: errorDetails.length,
        model: selectedModel
      })
      
      // 更新最终结果，包含模型信息
      updateMessage(aiMessageId, {
        content: responseContent,
        status: hasErrors ? 'error' : 'complete',
        data: { ...results, contentType, hasErrors, errorDetails, model: selectedModel }
      })
      
    } catch (error) {
      console.error('💥 处理过程中出现严重错误:', error)
      logger.error('处理用户输入失败', { error }, 'HomePage')
      updateMessage(aiMessageId, {
        content: `处理过程中出现严重错误：\n\n❌ ${error instanceof Error ? error.message : '未知错误'}\n\n请检查网络连接和API配置。`,
        status: 'error'
      })
    }
  }

  // 分析公式文本的辅助函数
  const analyzeFormulaText = async (text: string) => {
    try {
      const file = new File([text], 'formula.txt', { type: 'text/plain' })
      return await aiService.parseFormulas(file)
    } catch (error) {
      logger.error('公式文本分析失败，使用降级方案', { error }, 'HomePage')
      return {
        formulas: [
          {
            latex: text.includes('=') ? text : `f(x) = ${text}`,
            category: 'math' as const,
            explanation: `数学表达式: ${text}`,
            difficulty: 'basic' as const,
            confidence: 0.95
          }
        ]
      }
    }
  }

  // 生成AI响应内容
  const generateResponseContent = (
    userContent: string, 
    contentType: 'text' | 'formula' | 'mixed', 
    results: any, 
    hasErrors: boolean = false, 
    errorDetails: string[] = []
  ): string => {
    let response = ''
    
    // 根据内容类型生成个性化回复
    if (contentType === 'formula') {
      response = `我来帮你分析这个数学公式："${userContent}"。\n\n`
    } else if (contentType === 'mixed') {
      response = `我来分析这段包含数学内容的文本。\n\n`
    } else {
      response = `我来分析这段内容。\n\n`
    }
    
    // 如果有错误，先显示错误信息
    if (hasErrors && errorDetails.length > 0) {
      response += `⚠️ **处理过程中遇到一些问题**\n`
      errorDetails.forEach(error => {
        response += `• ${error}\n`
      })
      response += `\n我会尽力提供可用的分析结果：\n\n`
    }
    
    // 公式分析结果
    if (results.formulas?.formulas?.length > 0) {
      response += `📐 **公式分析**\n`
      results.formulas.formulas.forEach((formula: any, index: number) => {
        response += `• LaTeX格式: \`${formula.latex}\`\n`
        response += `• 说明: ${formula.explanation}\n`
        if (index < results.formulas.formulas.length - 1) response += `\n`
      })
      response += `\n`
    }
    
    // 内容分析结果
    if (results.analysis) {
      response += `📊 **内容分析**\n`
      response += `• 学科: ${results.analysis.subject}\n`
      response += `• 难度: ${results.analysis.difficulty}\n`
      if (results.analysis.tags?.length > 0) {
        response += `• 标签: ${results.analysis.tags.join(', ')}\n`
      }
      if (results.analysis.learningObjectives?.length > 0) {
        response += `• 学习目标: ${results.analysis.learningObjectives.join(', ')}\n`
      }
      if (results.analysis.confidence !== undefined) {
        response += `• 置信度: ${Math.round(results.analysis.confidence * 100)}%\n`
      }
      response += `\n`
    }
    
    // 可视化结果
    if (results.visualization) {
      response += `🎨 **可视化生成完成**\n`
      if (results.visualization.generatedImage) {
        response += `• ✅ 已生成函数图像\n`
      }
      if (results.visualization.codeOptions?.chartjs) {
        response += `• ✅ 已生成 Chart.js 配置\n`
      }
      if (results.visualization.codeOptions?.svg) {
        response += `• ✅ 已生成 SVG 代码\n`
      }
      if (results.visualization.codeOptions?.d3) {
        response += `• ✅ 已生成 D3.js 代码\n`
      }
      response += `\n`
    }
    
    // 如果没有任何有效结果
    if (!results.formulas && !results.analysis && !results.visualization) {
      response += `😅 抱歉，这次处理没能获得有效结果。可能是API服务暂时不可用。\n\n`
      response += `你可以:\n`
      response += `• 稍后重试\n`
      response += `• 尝试输入其他内容\n`
      response += `• 检查网络连接\n\n`
    }
    
    // 添加互动提示
    response += `有什么问题可以继续问我！😊`
    
    return response
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-gray-800 dark:text-gray-200">
              EduVisualizer AI
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              用户咨询助手在线状态
            </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="model-select" className="text-sm text-gray-600 dark:text-gray-400">
              AI模型:
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as 'gpt5' | 'claude37')}
              className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            >
              <option value="gpt5">GPT-5</option>
              <option value="claude37">Claude 3.7 Sonnet</option>
            </select>
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          </div>
        </div>
      </header>

            {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
          </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isProcessing ? '正在处理中...' : '输入你的问题...'}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            输入后按 Enter 发送，Shift + Enter 换行
          </div>
        </div>
      </footer>
    </div>
  )
}

// 消息气泡组件
const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
        {/* 消息气泡 */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isSystem
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              : isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
          }`}
        >
          {/* 思考状态指示器 */}
          {message.status === 'thinking' && (
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </motion.div>
              <span className="text-sm text-gray-500">正在思考...</span>
            </div>
          )}
          
          {/* 消息内容 */}
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
          
          {/* 可视化内容展示 */}
          {message.data?.visualization && (
            <div className="mt-4 space-y-3">
              {/* 显示生成的图像 */}
              {message.data.visualization.generatedImage && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    📈 函数可视化图像
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src={message.data.visualization.generatedImage}
                      alt="函数图像"
                      className="max-w-full h-auto border rounded shadow-sm"
                      style={{ maxHeight: '250px' }}
                    />
                  </div>
                </div>
              )}
              
              {/* 显示代码选项 */}
              {message.data.visualization.codeOptions && (
                <div className="space-y-2">
                  {message.data.visualization.codeOptions.chartjs && (
                    <details className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                        📊 Chart.js 配置代码
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        <code>{JSON.stringify(message.data.visualization.codeOptions.chartjs.config, null, 2)}</code>
                      </pre>
                    </details>
                  )}
                  
                  {message.data.visualization.codeOptions.svg && (
                    <details className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                        🖼️ SVG 代码
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        <code>{message.data.visualization.codeOptions.svg.code}</code>
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 时间戳和状态 */}
        <div className={`mt-1 text-xs text-gray-400 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString()} 
          {message.status === 'error' && (
            <span className="ml-2 text-red-500">发送失败</span>
          )}
          {message.status === 'complete' && !isUser && (
            <span className="ml-2 text-green-500">完成</span>
          )}
          {!isUser && !isSystem && message.data?.model && (
            <span className="ml-2 text-blue-500">
              {message.data.model === 'claude37' ? '🧠 Claude 3.7' : '🤖 GPT-5'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default HomePage