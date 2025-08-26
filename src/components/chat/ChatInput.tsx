import React, { useState, useRef } from 'react'
import { Send, Paperclip, X, StopCircle } from 'lucide-react'

interface ChatInputProps {
  inputText: string
  setInputText: (text: string) => void
  isProcessing: boolean
  onSendMessage: (message: string, files?: File[]) => void
  onCancelProcessing?: () => void
}

export const ChatInput = ({
  inputText,
  setInputText,
  isProcessing,
  onSendMessage,
  onCancelProcessing
}: ChatInputProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (inputText.trim() || files.length > 0) {
      onSendMessage(inputText.trim(), files)
      setInputText("")
      setFiles([])
      // 重置文件输入框
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // 重置textarea高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = '40px'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
      // 过滤支持的文件类型
      const supportedFiles = newFiles.filter(file => {
        const supportedTypes = [
          'text/plain',
          'text/markdown', 
          'application/pdf',
          'text/csv',
          'application/json',
          'text/html',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        return supportedTypes.includes(file.type) || 
               file.name.toLowerCase().endsWith('.md') ||
               file.name.toLowerCase().endsWith('.txt')
      })
      
      if (supportedFiles.length > 0) {
        setFiles((prev) => [...prev, ...supportedFiles])
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* 文件预览区域 */}
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="truncate max-w-[200px] text-gray-700 dark:text-gray-300">{file.name}</span>
                <button
                  type="button"
                  className="ml-1 p-0.5 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 rounded transition-colors"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 输入区域 - 类似Gemini的圆角卡片设计 */}
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-3xl border shadow-sm transition-all ${
            isDragging 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-gray-200 dark:border-gray-700"
          } ${isProcessing ? "opacity-50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.csv,.json,.html,.doc,.docx,text/plain,text/markdown,application/pdf"
            className="hidden"
            onChange={(e) => {
              handleFileSelect(e.target.files)
              // 重置input value以允许重复选择相同文件
              e.target.value = ''
            }}
          />

          <div className="flex items-center gap-3 p-4">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="向 EduVisualizer 提问..."
              className="flex-1 min-h-[24px] max-h-[120px] resize-none border-0 bg-transparent text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
              disabled={isProcessing}
              rows={1}
              style={{
                height: 'auto',
                overflowY: textareaRef.current && textareaRef.current.scrollHeight > 120 ? 'scroll' : 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />

            {/* 按钮区域 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="上传文件"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {isProcessing ? (
                <button
                  type="button"
                  onClick={onCancelProcessing}
                  className="h-8 w-8 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                  title="终止处理"
                >
                  <StopCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && files.length === 0}
                  className="h-8 w-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                  title="发送消息"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 拖拽提示 */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-3xl border-2 border-dashed border-blue-500">
              <p className="text-blue-600 dark:text-blue-400 font-medium">拖拽文件到这里上传</p>
            </div>
          )}
        </div>

        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          支持 TXT, MD, PDF, CSV, JSON, HTML, DOC, DOCX · Enter 发送 · Shift+Enter 换行
        </div>
      </div>
    </div>
  )
}