import { logger } from '@/utils/logger'
import { 
  detectContentType, 
  analyzeFormulaText, 
  generateResponseContent,
  handleAPIError
} from '@/utils/contentAnalysis'
import { createStatusUpdater, sleep } from '@/utils/chatHelpers'
import type { ContentType } from '@/types/chat'

interface UseContentProcessorProps {
  updateMessage: (messageId: string, updates: any) => void
  getAPIService: () => any
  selectedModel: 'gpt5' | 'claude4'
  language: 'zh' | 'en'
}

export const useContentProcessor = ({
  updateMessage,
  getAPIService,
  selectedModel,
  language
}: UseContentProcessorProps) => {

  const processUserInput = async (
    userContent: string, 
    contentType: ContentType, 
    aiMessageId: string,
    signal?: AbortSignal
  ) => {
    // 立即检查signal状态
    if (signal?.aborted) {
      console.log('⚠️ processUserInput: Signal已被abort，不执行处理')
      throw new DOMException('Aborted', 'AbortError')
    }
    
    const apiService = getAPIService()
    const results: any = {}
    let hasErrors = false
    let errorDetails: string[] = []
    
    console.log('🚀 开始处理用户输入:', {
      userContent,
      contentType,
      selectedModel,
      language,
      apiService: typeof apiService,
      hasToken: !!import.meta.env.VITE_REPLICATE_API_TOKEN,
      tokenLength: import.meta.env.VITE_REPLICATE_API_TOKEN?.length
    })
    
    console.log('📍 当前选择的模型:', selectedModel)
    console.log('📍 将要调用的模型端点:', selectedModel === 'claude4' ? 'anthropic/claude-4-sonnet' : 'openai/gpt-5')
    
    try {
      // 步骤1: 更新状态
      updateMessage(aiMessageId, { content: '🔍 正在分析内容...', status: 'thinking' })
      await sleep(500)
      
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
          logger.error('公式分析失败', { error }, 'ContentProcessor')
        }
      }
      
      // 步骤3: 内容分析
      updateMessage(aiMessageId, { content: '📊 正在分析内容主题...', status: 'thinking' })
      await sleep(1000)
      
      try {
        console.log('🤖 开始内容分析，调用API:', typeof apiService.analyzeContent)
        
        if (!import.meta.env.VITE_REPLICATE_API_TOKEN) {
          throw new Error('API Token未配置，请检查 .env.local 文件中的 VITE_REPLICATE_API_TOKEN 配置')
        }
        
        // 显示等待提示
        updateMessage(aiMessageId, { content: '🤖 正在创建AI任务...（预计需要30-60秒）', status: 'thinking' })
        await sleep(2000)
        
        updateMessage(aiMessageId, { content: '⏳ AI正在深度分析中...可能需要1-2分钟，请耐心等待', status: 'thinking' })
        
        // 定期更新状态提示
        const statusUpdater = createStatusUpdater(updateMessage, aiMessageId)
        statusUpdater.start()
        
        console.log('📤 准备调用analyzeContent API...')
        console.log('🤖 选择的模型:', selectedModel)
        
        try {
          // 统一使用analyzeContent方法，它会根据selectedModel自动路由
          console.log('🤖 使用模型进行分析:', selectedModel)
          console.log('🔗 API端点:', selectedModel === 'claude4' ? 'anthropic/claude-4-sonnet' : 'openai/gpt-5')
          
          const contentAnalysis = await apiService.analyzeContent(userContent, selectedModel, undefined, signal)
          
          console.log('📥 API调用成功，返回结果:', contentAnalysis)
          results.analysis = contentAnalysis
          
          statusUpdater.stop()
          console.log('✅ 内容分析完成:', contentAnalysis)
        } catch (apiError) {
          statusUpdater.stop()
          console.error('❌ API调用失败 - 选择的模型:', selectedModel)
          console.error('❌ 详细错误信息:', apiError)
          
          // 不允许静默降级，直接抛出错误让用户知道具体问题
          throw new Error(`${selectedModel.toUpperCase()} API调用失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`)
        }
        
        // 显示成功状态
        updateMessage(aiMessageId, { content: '✅ 内容分析完成！正在整理结果...', status: 'thinking' })
        await sleep(1000)
        
      } catch (error) {
        console.error('❌ 内容分析失败:', error)
        console.error('❌ 失败的模型:', selectedModel)
        hasErrors = true
        
        const { message: errorMessage } = handleAPIError(error)
        errorDetails.push(`${selectedModel.toUpperCase()}模型调用失败: ${errorMessage}`)
        logger.error(`${selectedModel.toUpperCase()}模型内容分析失败`, { 
          error, 
          selectedModel,
          modelEndpoint: selectedModel === 'claude4' ? 'anthropic/claude-4-sonnet' : 'openai/gpt-5'
        }, 'ContentProcessor')
        
        // 不提供降级分析，直接抛出错误让用户知道具体问题
        throw new Error(`${selectedModel.toUpperCase()}模型API调用失败: ${errorMessage}。请检查模型可用性和API配置。`)
      }
      
      // 步骤4: 可视化生成（对于公式）
      if (contentType === 'formula' || contentType === 'mixed') {
        updateMessage(aiMessageId, { content: '🎨 正在生成可视化图表...', status: 'thinking' })
        await sleep(1000)
        
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
          await sleep(1500)
          
          updateMessage(aiMessageId, { content: '🎨 AI正在绘制可视化图表...请稍候', status: 'thinking' })
          
          const visualization = await apiService.generateVisualization(visualizationData, 'mathematical', selectedModel, signal)
          results.visualization = visualization
          
          console.log('✅ 可视化生成完成:', visualization)
          console.log('🔍 可视化使用的模型:', selectedModel)
          
          // 显示成功状态
          updateMessage(aiMessageId, { content: '✅ 可视化生成完成！正在最终整理...', status: 'thinking' })
          await sleep(800)
          
        } catch (error) {
          console.error('❌ 可视化生成失败:', error)
          hasErrors = true
          errorDetails.push(`可视化生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
          logger.error('可视化生成失败', { error }, 'ContentProcessor')
        }
      }
      
      // 步骤5: 生成响应内容
      updateMessage(aiMessageId, { content: '📝 正在整理回复...', status: 'thinking' })
      await sleep(300)
      
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
      logger.error('处理用户输入失败', { error }, 'ContentProcessor')
      updateMessage(aiMessageId, {
        content: `处理过程中出现严重错误：\n\n❌ ${error instanceof Error ? error.message : '未知错误'}\n\n请检查网络连接和API配置。`,
        status: 'error'
      })
    }
  }

  return {
    detectContentType,
    processUserInput
  }
}