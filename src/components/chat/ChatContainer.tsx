import { useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { logger } from '../../utils/logger'

import { useChatMessages } from '../../hooks/useChatMessages'
import { useAPIService } from '../../hooks/useAPIService'
import { useContentProcessor } from '../../hooks/useContentProcessor'
import { useChatInput } from '../../hooks/useChatInput'

import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

export const ChatContainer = () => {
  const { theme, toggleTheme } = useTheme()
  
  // 消息管理
  const {
    messages,
    messagesEndRef,
    addUserMessage,
    addAssistantMessage,
    updateMessage
  } = useChatMessages()

  // API服务管理
  const {
    selectedModel,
    setSelectedModel,
    apiConfig,
    checkAPIAvailability,
    getAPIService
  } = useAPIService()

  // 内容处理
  const {
    detectContentType,
    processUserInput
  } = useContentProcessor({
    updateMessage,
    getAPIService,
    selectedModel
  })

  // 聊天输入处理
  const {
    inputText,
    setInputText,
    isProcessing,
    handleSendMessage
  } = useChatInput({
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    processUserInput,
    detectContentType,
    hasApiToken: apiConfig.hasToken
  })

  // 页面加载日志记录
  useEffect(() => {
    logger.info('ChatContainer loaded - Chat Interface', {
      theme,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    }, 'ChatContainer')
  }, [theme])

  // 首次加载时检查API状态（仅检查，不添加消息）
  useEffect(() => {
    checkAPIAvailability()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              EduVisualizer 2.0
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              智能教育内容可视化助手
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* AI模型选择 */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as 'gpt5' | 'claude37')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
              disabled={isProcessing}
            >
              <option value="gpt5">🤖 GPT-5</option>
              <option value="claude37">🧠 Claude 3.7</option>
            </select>
            
            {/* 主题切换按钮 */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`切换到${theme === 'light' ? '深色' : '浅色'}模式`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 消息列表 */}
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />

      {/* 输入框 */}
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        isProcessing={isProcessing}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}