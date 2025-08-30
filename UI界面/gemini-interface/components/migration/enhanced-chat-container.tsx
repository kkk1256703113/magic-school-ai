"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ChevronDown,
  Paperclip,
  Send,
  Sparkles,
  Upload,
  FileText,
  Image,
  AlertCircle,
  CheckCircle,
  Loader2,
  Bot,
  User,
  Wand2
} from "lucide-react"

// 导入类型定义
import type { Message, ChatState, FileUploadState } from "../../types/chat"

interface EnhancedChatContainerProps {
  isAuthenticated: boolean
  currentUser?: {
    id: string
    email: string
    plan: 'free' | 'monthly' | 'quarterly' | 'yearly'
  }
  onAuthRequired?: () => void
  onModelChange?: (model: 'gpt5' | 'claude4') => void
  onSendMessage?: (content: string, files?: File[]) => Promise<void>
}

export function EnhancedChatContainer({
  isAuthenticated,
  currentUser,
  onAuthRequired,
  onModelChange,
  onSendMessage
}: EnhancedChatContainerProps) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    inputText: '',
    isProcessing: false,
    selectedModel: 'gpt5',
    isAuthenticated,
    currentUser
  })

  const [fileState, setFileState] = useState<FileUploadState>({
    files: [],
    isUploading: false,
    uploadProgress: 0,
    supportedTypes: ['pdf', 'txt', 'md', 'docx', 'png', 'jpg', 'jpeg']
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatState.messages])

  // 处理文件上传
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setFileState(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }))
  }

  // 移除文件
  const removeFile = (index: number) => {
    setFileState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      onAuthRequired?.()
      return
    }

    const content = chatState.inputText.trim()
    if (!content && fileState.files.length === 0) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
      data: {
        files: fileState.files.length > 0 ? fileState.files : undefined,
        model: chatState.selectedModel
      }
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      inputText: '',
      isProcessing: true
    }))

    setFileState(prev => ({
      ...prev,
      files: []
    }))

    try {
      await onSendMessage?.(content, fileState.files)
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setChatState(prev => ({
        ...prev,
        isProcessing: false
      }))
    }
  }

  // 渲染消息
  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user'
    const isProcessing = message.status === 'thinking'
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
          <Card className={`p-4 ${
            isUser 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-muted/50'
          }`}>
            <div className="space-y-2">
              {message.content && (
                <div className="text-sm leading-relaxed">
                  {message.content}
                </div>
              )}
              
              {/* 文件附件显示 */}
              {message.data?.files && message.data.files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.data.files.map((file, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      {file.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* 状态指示器 */}
              <div className="flex items-center gap-2 text-xs opacity-70">
                {isProcessing && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>AI正在思考...</span>
                  </>
                )}
                {message.status === 'complete' && !isUser && (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>完成</span>
                  </>
                )}
                {message.data?.model && (
                  <Badge variant="outline" className="text-xs">
                    {message.data.model === 'gpt5' ? 'GPT-5' : 'Claude 4'}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* 模型选择头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold">Magic School AI</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Wand2 className="w-4 h-4 mr-2" />
              {chatState.selectedModel === 'gpt5' ? 'GPT-5' : 'Claude 4 Sonnet'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setChatState(prev => ({...prev, selectedModel: 'gpt5'}))
                onModelChange?.('gpt5')
              }}
            >
              GPT-5 (快速分析)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setChatState(prev => ({...prev, selectedModel: 'claude4'}))
                onModelChange?.('claude4')
              }}
            >
              Claude 4 Sonnet (深度理解)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 消息区域 */}
      <ScrollArea className="flex-1 p-4">
        {chatState.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">开始对话</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                上传文档、输入问题，让AI为您创建精美的可视化内容
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {chatState.messages.map(renderMessage)}
          {chatState.isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <Card className="bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI正在分析您的内容...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* 输入区域 */}
      <div className="border-t p-4 space-y-3">
        {/* 文件预览 */}
        {fileState.files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fileState.files.map((file, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FileText className="w-3 h-3" />
                <span className="text-xs">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* 登录提示 */}
        {!isAuthenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              请先登录以使用AI功能。
              <Button variant="link" className="p-0 h-auto ml-1" onClick={onAuthRequired}>
                立即登录
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 输入框 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={chatState.inputText}
              onChange={(e) => setChatState(prev => ({
                ...prev,
                inputText: e.target.value
              }))}
              placeholder={isAuthenticated ? "输入消息或拖放文件..." : "请先登录..."}
              disabled={!isAuthenticated || chatState.isProcessing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="pr-10"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isAuthenticated}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!isAuthenticated || chatState.isProcessing || (!chatState.inputText.trim() && fileState.files.length === 0)}
          >
            {chatState.isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}