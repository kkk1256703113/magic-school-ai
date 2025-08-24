import { motion } from 'framer-motion'
import { Message } from '../../types/chat'

interface MessageBubbleProps {
  message: Message
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
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