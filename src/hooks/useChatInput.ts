import { useState, useRef } from 'react'
import { isSimpleGreeting, generateGreetingResponse, sleep } from '../utils/chatHelpers'
import { pdfService } from '../services/pdfService'

interface UseChatInputProps {
  addUserMessage: (content: string, files?: File[]) => string
  addAssistantMessage: (content: string, status?: any) => string
  updateMessage: (messageId: string, updates: any) => void
  processUserInput: (content: string, contentType: any, messageId: string, signal?: AbortSignal) => Promise<void>
  detectContentType: (content: string) => any
  hasApiToken: boolean
  selectedModel: 'gpt5' | 'claude4'
  isAuthenticated: boolean
  user: any
}

export const useChatInput = ({
  addUserMessage,
  addAssistantMessage,
  updateMessage,
  processUserInput,
  detectContentType,
  hasApiToken,
  selectedModel,
  isAuthenticated,
  user
}: UseChatInputProps) => {
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 取消处理函数
  const cancelProcessing = () => {
    console.log('🛑 终止按钮被点击，准备取消处理')
    if (abortControllerRef.current) {
      console.log('🛑 AbortController存在，发送abort信号')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsProcessing(false)
    } else {
      console.log('⚠️ AbortController不存在')
    }
  }

  const handleSendMessage = async (message: string = inputText, files?: File[]) => {
    if ((!message.trim() && (!files || files.length === 0)) || isProcessing) return
    
    let userContent = message.trim()
    setInputText('')
    setIsProcessing(true)
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController()
    
    // 处理PDF文件
    let pdfContent = ''
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          try {
            // 使用PDF服务处理文件
            const result = await pdfService.processPDF(file)
            pdfContent += `\n\n--- PDF文件: ${file.name} ---\n`
            pdfContent += `页数: ${result.pageCount}\n`
            if (result.metadata?.title) {
              pdfContent += `标题: ${result.metadata.title}\n`
            }
            if (result.metadata?.author) {
              pdfContent += `作者: ${result.metadata.author}\n`
            }
            pdfContent += `处理方式: ${result.processedBy === 'api' ? 'iLovePDF API (高精度)' : 'PDF.js (快速处理)'}\n`
            pdfContent += `\n内容:\n${result.text}\n`
          } catch (error) {
            console.error('PDF处理失败:', error)
          }
        }
      }
    }
    
    // 如果有PDF内容，添加到用户消息中
    if (pdfContent) {
      userContent = userContent ? `${userContent}\n\n附件内容：${pdfContent}` : `请分析以下PDF内容：${pdfContent}`
    }
    
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
        
        // 首先检查用户是否已登录
        if (!isAuthenticated || !user) {
          updateMessage(aiMessageId, {
            content: `🔐 **需要登录才能使用AI功能**

请先登录您的账号以使用AI分析功能：

✅ **已注册用户**: 点击右上角头像登录
🆕 **新用户**: 点击右上角头像快速注册

登录后即可享受：
- 🤖 GPT-5 和 Claude 4 智能分析
- 📊 数据可视化生成  
- 📄 PDF文档解析
- 🎨 HTML页面生成`,
            status: 'error'
          })
          return
        }
        
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
            
            // 调用HTML生成方法，传递选择的模型和取消信号
            const htmlResult = await aiService.generateHTMLVisualization(userContent, undefined, selectedModel, abortControllerRef.current?.signal)
            
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
            // 检查多种AbortError情况
            if (htmlError instanceof Error && 
                (htmlError.name === 'AbortError' || 
                 htmlError.message.includes('abort') || 
                 htmlError.message.includes('Aborted') ||
                 htmlError.message.includes('signal is aborted'))) {
              console.log('🛑 用户取消了处理，不执行降级流程')
              throw htmlError
            }
            
            console.error('HTML生成失败，尝试降级到原有流程:', htmlError)
            
            // 检查signal是否已经被abort
            if (abortControllerRef.current?.signal.aborted) {
              console.log('🛑 Signal已被abort，不执行降级流程')
              throw new Error('处理已被用户取消')
            }
            
            // 如果HTML生成失败，回退到原有的内容分析流程，传递signal
            await processUserInput(userContent, contentType, aiMessageId, abortControllerRef.current?.signal)
          }
        }
      }
    } catch (error) {
      // 检查是否是用户主动取消
      if (error instanceof Error && error.name === 'AbortError') {
        updateMessage(aiMessageId, {
          content: '处理已被终止',
          status: 'complete'
        })
      } else {
        updateMessage(aiMessageId, {
          content: `抱歉，处理过程中出现错误：${error instanceof Error ? error.message : '未知错误'}`,
          status: 'error'
        })
      }
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }


  return {
    inputText,
    setInputText,
    isProcessing,
    handleSendMessage,
    cancelProcessing
  }
}