import { motion } from 'framer-motion'
import { Message } from '@/types/chat'
import { HTMLPreview } from '@/components/html/HTMLPreview'
import { PDFViewer } from '@/components/pdf/PDFViewer'

interface MessageBubbleProps {
  message: Message
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'
  
  // 检测消息是否包含HTML内容
  const isHTMLContent = (content: string): boolean => {
    // 检测完整HTML文档结构
    const hasDoctype = content.includes('<!DOCTYPE html>') || content.includes('<!doctype html>')
    const hasHtmlTags = content.includes('<html') && content.includes('</html>')
    const result = hasDoctype || hasHtmlTags
    
    // 调试日志
    if (!isUser && !isSystem) {
      console.log('🔍 HTML内容检测:', {
        messageId: message.id,
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
        hasDoctype,
        hasHtmlTags,
        isHTML: result
      })
    }
    
    return result
  }
  
  // 检测用户消息是否包含PDF文件
  const hasPDFFiles = isUser && message.data?.files?.some((file: File) => file.type === 'application/pdf')
  
  const hasHTMLContent = !isUser && isHTMLContent(message.content)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* AI头像（类似Gemini的蓝色方块） */}
      {!isUser && !isSystem && (
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center flex-shrink-0 mt-1">
            <div 
              className="w-3 h-3 bg-white"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
          </div>
        </div>
      )}

      <div className={`${hasHTMLContent ? 'max-w-6xl' : 'max-w-3xl'} ${!isUser && !isSystem ? 'ml-3' : ''}`}>
        {/* 消息内容 */}
        <div
          className={`${
            isSystem
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-2xl'
              : isUser
                ? 'bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3 text-gray-800 dark:text-gray-200 max-w-2xl'
                : 'text-gray-800 dark:text-gray-200 leading-relaxed'
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
          
          {/* 文件信息展示 */}
          {isUser && message.data?.files && message.data.files.length > 0 && (
            <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                📎 附件文件：
              </div>
              <div className="space-y-2">
                {message.data.files.map((file, index) => {
                  // 如果是PDF文件，显示预览组件
                  if (file.type === 'application/pdf') {
                    return (
                      <PDFViewer 
                        key={index}
                        file={file}
                      />
                    )
                  }
                  // 其他文件显示简单信息
                  return (
                    <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs">
                      <span className="font-medium">{file.name}</span>
                      <span className="ml-1 text-gray-500">
                        ({(file.size / 1024).toFixed(1)}KB)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 消息内容 */}
          {hasHTMLContent ? (
            <div>
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                🎨 已生成可视化HTML页面：
              </div>
              <HTMLPreview 
                htmlContent={message.content}
                title="生成的可视化页面"
                description="基于您的内容生成的HTML作品集"
              />
            </div>
          ) : (
            // 仅当没有PDF文件时显示用户的文本内容
            !hasPDFFiles && message.content && (
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            )
          )}
          
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
              {message.data.model === 'claude4' ? '🧠 Claude 4' : '🤖 GPT-5'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}