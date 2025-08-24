import { useState, useRef } from 'react'
import { isSimpleGreeting, generateGreetingResponse, sleep } from '../utils/chatHelpers'

interface UseChatInputProps {
  addUserMessage: (content: string, files?: File[]) => string
  addAssistantMessage: (content: string, status?: any) => string
  updateMessage: (messageId: string, updates: any) => void
  handleLocalAnalysis: (content: string, contentType: any, messageId: string) => Promise<void>
  processUserInput: (content: string, contentType: any, messageId: string) => Promise<void>
  detectContentType: (content: string) => any
  hasApiToken: boolean
}

export const useChatInput = ({
  addUserMessage,
  addAssistantMessage,
  updateMessage,
  handleLocalAnalysis,
  processUserInput,
  detectContentType,
  hasApiToken
}: UseChatInputProps) => {
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return
    
    const userContent = inputText.trim()
    setInputText('')
    setIsProcessing(true)
    
    // 添加用户消息
    addUserMessage(userContent)
    
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return {
    inputText,
    setInputText,
    isProcessing,
    inputRef,
    handleSendMessage,
    handleKeyPress
  }
}