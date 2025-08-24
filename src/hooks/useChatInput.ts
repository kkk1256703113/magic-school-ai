import { useState } from 'react'
import { isSimpleGreeting, generateGreetingResponse, sleep } from '../utils/chatHelpers'

interface UseChatInputProps {
  addUserMessage: (content: string, files?: File[]) => string
  addAssistantMessage: (content: string, status?: any) => string
  updateMessage: (messageId: string, updates: any) => void
  processUserInput: (content: string, contentType: any, messageId: string) => Promise<void>
  detectContentType: (content: string) => any
  hasApiToken: boolean
  selectedModel: 'gpt5' | 'claude4'
}

export const useChatInput = ({
  addUserMessage,
  addAssistantMessage,
  updateMessage,
  processUserInput,
  detectContentType,
  hasApiToken,
  selectedModel
}: UseChatInputProps) => {
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSendMessage = async (message: string = inputText, files?: File[]) => {
    if ((!message.trim() && (!files || files.length === 0)) || isProcessing) return
    
    const userContent = message.trim()
    setInputText('')
    setIsProcessing(true)
    
    // 添加用户消息
    addUserMessage(userContent, files)
    
    // 检查是否是简单问候
    const isGreeting = isSimpleGreeting(userContent)
    
    // 添加助手思考消息
    const aiMessageId = addAssistantMessage('正在分析中...', 'thinking')
    
    try {
      if (isGreeting) {
        // 简单问候直接回复，不调用API
        await sleep(1000) // 模拟思考时间
        updateMessage(aiMessageId, {
          content: generateGreetingResponse(),
          status: 'complete'
        })
      } else {
        // 检测内容类型并处理
        const contentType = detectContentType(userContent)
        
        if (!hasApiToken) {
          // 如果没有配置API Token，直接显示错误
          updateMessage(aiMessageId, {
            content: `❌ **API配置缺失**

需要配置Replicate API Token才能使用AI功能：

**步骤1**: 在项目根目录创建 \`.env.local\` 文件
**步骤2**: 添加以下内容：
\`\`\`
VITE_REPLICATE_API_TOKEN=你的API密钥
\`\`\`

**获取API密钥**: 访问 https://replicate.com/account

配置完成后刷新页面即可使用完整功能！`,
            status: 'error'
          })
        } else {
          // 如果配置了API Token，调用HTML生成API
          try {
            // 导入API服务
            const { aiService } = await import('../services/replicateAPI')
            
            updateMessage(aiMessageId, { 
              content: '🎨 正在生成可视化HTML页面...', 
              status: 'thinking' 
            })
            
            // 调用HTML生成方法，传递选择的模型
            const htmlResult = await aiService.generateHTMLVisualization(userContent, undefined, selectedModel)
            
            // 更新消息显示HTML内容
            updateMessage(aiMessageId, {
              content: htmlResult.htmlContent,
              status: 'complete',
              data: {
                model: selectedModel,
                htmlGenerated: true,
                fileSize: htmlResult.fileSize,
                generatedAt: htmlResult.generatedAt
              }
            })
          } catch (htmlError) {
            console.error('HTML生成失败，尝试降级到原有流程:', htmlError)
            // 如果HTML生成失败，回退到原有的内容分析流程
            await processUserInput(userContent, contentType, aiMessageId)
          }
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


  return {
    inputText,
    setInputText,
    isProcessing,
    handleSendMessage
  }
}