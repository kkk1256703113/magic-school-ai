import { useState, useRef, useEffect } from 'react'
import { Message } from '@/types/chat'

const INITIAL_MESSAGES: Message[] = []

export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // 添加系统消息
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString() + '_system',
      type: 'system',
      content,
      timestamp: new Date(),
      status: 'complete'
    }
    
    setMessages(prev => [...prev, systemMessage])
    return systemMessage.id
  }

  // 更新消息
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ))
  }

  // 清空消息（新建对话）
  const clearMessages = () => {
    setMessages(INITIAL_MESSAGES)
  }

  return {
    messages,
    messagesEndRef,
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    updateMessage,
    clearMessages
  }
}