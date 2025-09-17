import React, { useState, useRef } from 'react'
import { Send, Paperclip, X, StopCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import toast from 'react-hot-toast'

interface ChatInputProps {
  inputText: string
  setInputText: (text: string) => void
  isProcessing: boolean
  isCancelling?: boolean
  onSendMessage: (message: string, files?: File[]) => void
  onCancelProcessing?: () => void
}

export const ChatInput = ({
  inputText,
  setInputText,
  isProcessing,
  isCancelling = false,
  onSendMessage,
  onCancelProcessing
}: ChatInputProps) => {
  const { t } = useLanguage()
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadButtonActive, setIsUploadButtonActive] = useState(false)
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

  const handleUploadClick = () => {
    console.log('🔄 文件上传按钮被点击 - Chrome兼容性增强版')

    // 立即设置按钮状态，确保在用户手势上下文中
    setIsUploadButtonActive(true)

    try {
      // 检查 fileInputRef 是否存在
      if (!fileInputRef.current) {
        console.error('❌ 文件输入框引用不存在')
        toast.error(t('chat.fileUploadError') || '文件上传功能暂时不可用，请刷新页面重试')
        setIsUploadButtonActive(false)
        return
      }

      console.log('✅ 文件输入框引用存在，尝试触发点击')

      // Chrome兼容性修复：确保在用户手势的同步上下文中立即触发
      // 不使用任何异步操作或延迟
      const fileInput = fileInputRef.current

      // 重置文件输入框以确保可以重复选择相同文件
      fileInput.value = ''

      // 立即触发点击，保持在用户手势上下文中
      fileInput.click()

      console.log('📁 文件选择器已触发 (Chrome兼容模式)')

      // 延迟重置按钮状态，但不影响文件选择
      const resetTimer = setTimeout(() => {
        setIsUploadButtonActive(false)
      }, 2000) // 给用户更多时间选择文件

      // 如果文件选择成功，提前重置状态
      const handleSuccessReset = () => {
        clearTimeout(resetTimer)
        setIsUploadButtonActive(false)
      }

      // 临时存储重置函数，在文件选择成功时调用
      ;(fileInput as any)._successReset = handleSuccessReset

    } catch (error) {
      console.error('❌ 触发文件选择时发生错误:', error)

      // 检查是否是Chrome的安全限制
      const isChrome = /Chrome/.test(navigator.userAgent)
      const errorMessage = isChrome
        ? t('chat.chromeFileUploadError') || '检测到Chrome浏览器限制，请直接拖拽文件到输入框区域，或尝试其他浏览器'
        : t('chat.fileUploadError') || '无法打开文件选择器，请尝试直接拖拽文件到此区域'

      toast.error(errorMessage, { duration: 5000 })
      setIsUploadButtonActive(false)
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
      const supportedTypes = [
        'text/plain',
        'text/markdown', 
        'application/pdf',
        'text/csv',
        'application/json',
        'text/html',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      const supportedExtensions = ['.txt', '.md', '.json', '.csv', '.html', '.doc', '.docx', '.xls', '.xlsx']
      
      // 分类处理文件
      const supportedFiles: File[] = []
      const unsupportedFiles: File[] = []
      const oversizedFiles: File[] = []
      
      newFiles.forEach(file => {
        // 检查文件类型
        const isSupported = supportedTypes.includes(file.type) || 
                           supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        
        if (!isSupported) {
          unsupportedFiles.push(file)
          return
        }
        
        // 根据文件类型设置不同的大小限制
        const isOfficeFile = file.type.includes('msword') || 
                             file.type.includes('spreadsheetml') || 
                             file.type.includes('ms-excel') ||
                             ['.doc', '.docx', '.xls', '.xlsx'].some(ext => file.name.toLowerCase().endsWith(ext))
        
        const sizeLimit = isOfficeFile ? 10 * 1024 * 1024 : 2 * 1024 * 1024 // Office: 10MB, 其他: 2MB
        
        if (file.size > sizeLimit) {
          oversizedFiles.push(file)
          return
        }
        
        supportedFiles.push(file)
      })
      
      // 添加支持的文件
      if (supportedFiles.length > 0) {
        setFiles((prev) => [...prev, ...supportedFiles])
        console.log(`✅ 成功添加 ${supportedFiles.length} 个文件:`, supportedFiles.map(f => f.name))
      }
      
      // 显示不支持文件的警告
      if (unsupportedFiles.length > 0) {
        console.warn('❌ 以下文件类型不支持:', unsupportedFiles.map(f => `${f.name} (${f.type})`))
      }
      
      // 显示超大文件的警告
      if (oversizedFiles.length > 0) {
        const oversizedNames = oversizedFiles.map(f => {
          const sizeMB = Math.round(f.size / 1024 / 1024)
          const isOfficeFile = f.type.includes('msword') || 
                               f.type.includes('spreadsheetml') || 
                               f.type.includes('ms-excel') ||
                               ['.doc', '.docx', '.xls', '.xlsx'].some(ext => f.name.toLowerCase().endsWith(ext))
          const limit = isOfficeFile ? '10MB' : '2MB'
          return `${f.name} (${sizeMB}MB, 超过${limit}限制)`
        })
        console.warn('📏 以下文件超过大小限制:', oversizedNames)
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
            accept=".txt,.md,.pdf,.csv,.json,.html,.doc,.docx,.xls,.xlsx,text/plain,text/markdown,application/pdf,application/json,text/csv,text/html,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              console.log('📂 文件输入框onChange触发，选择的文件:', e.target.files?.length || 0)
              handleFileSelect(e.target.files)

              // 调用成功重置函数（如果存在）
              const fileInput = e.target as HTMLInputElement
              if ((fileInput as any)._successReset) {
                (fileInput as any)._successReset()
                delete (fileInput as any)._successReset
              } else {
                // 备用重置方案
                setIsUploadButtonActive(false)
              }

              // 重置input value以允许重复选择相同文件
              e.target.value = ''
            }}
            onFocus={() => {
              console.log('🎯 文件输入框获得焦点')
            }}
            onBlur={() => {
              console.log('🔍 文件输入框失去焦点')
              // 延迟重置按钮状态，给用户一些时间选择文件
              setTimeout(() => {
                setIsUploadButtonActive(false)
              }, 500)
            }}
          />

          <div className="flex items-center gap-3 p-4">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('chat.inputPlaceholder')}
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
                onClick={handleUploadClick}
                disabled={isProcessing}
                className={`h-8 w-8 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-full ${
                  isUploadButtonActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={t('chat.uploadFile')}
              >
                <Paperclip className={`h-4 w-4 ${isUploadButtonActive ? 'animate-pulse' : ''}`} />
              </button>

              {isProcessing ? (
                <button
                  type="button"
                  onClick={onCancelProcessing}
                  disabled={isCancelling}
                  className={`h-8 w-8 flex items-center justify-center text-white rounded-full transition-colors ${
                    isCancelling 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={isCancelling ? t('chat.cancelling') : t('chat.cancelProcessing')}
                >
                  <StopCircle className={`h-4 w-4 ${isCancelling ? 'animate-pulse' : ''}`} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && files.length === 0}
                  className="h-8 w-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                  title={t('chat.sendMessage')}
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 拖拽提示 */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-3xl border-2 border-dashed border-blue-500">
              <p className="text-blue-600 dark:text-blue-400 font-medium">{t('chat.dragDropHint')}</p>
            </div>
          )}
        </div>

        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('chat.supportedFormats')}
          {/Chrome/.test(navigator.userAgent) && (
            <div className="mt-1 text-blue-600 dark:text-blue-400">
              Chrome用户建议：如上传按钮无响应，请直接拖拽文件到此区域
            </div>
          )}
        </div>
      </div>
    </div>
  )
}