import { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { logger } from '../../utils/logger'
import { ChevronDown, Sparkles } from 'lucide-react'
import { setAuthConfig } from '../../services/replicateAPI'

import { useChatMessages } from '../../hooks/useChatMessages'
import { useAPIService } from '../../hooks/useAPIService'
import { useContentProcessor } from '../../hooks/useContentProcessor'
import { useChatInput } from '../../hooks/useChatInput'

import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { Sidebar } from '../Sidebar'
import { UpgradeModal } from '../UpgradeModal'
import { UserMenu } from '../UserMenu'
import { AuthModal } from '../AuthModal'

export const ChatContainer = () => {
  const { theme } = useTheme()
  const { user, isAuthenticated, token, checkAPILimit, recordAPIUsage } = useAuth()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // 消息管理
  const {
    messages,
    messagesEndRef,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    clearMessages
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
    handleSendMessage,
    cancelProcessing
  } = useChatInput({
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    processUserInput,
    detectContentType,
    hasApiToken: apiConfig.hasToken,
    selectedModel
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

  // 配置API认证
  useEffect(() => {
    setAuthConfig(token, checkAPILimit, recordAPIUsage)
  }, [token, checkAPILimit, recordAPIUsage])

  // 新建对话
  const handleNewChat = () => {
    clearMessages()
    setInputText('')
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 左侧边栏 */}
      <Sidebar onNewChat={handleNewChat} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">Magic School AI</h1>
            
            {/* AI模型选择下拉 */}
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                {selectedModel === 'gpt5' ? 'GPT-5' : 'Claude 4 Sonnet'}
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showModelMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                    <button
                      onClick={() => {
                        setSelectedModel('gpt5')
                        setShowModelMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      🤖 GPT-5
                    </button>
                    <button
                      onClick={() => {
                        setSelectedModel('claude4')
                        setShowModelMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      🧠 Claude 4 Sonnet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 升级按钮 */}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              升级
            </button>

            {/* 用户菜单 */}
            <UserMenu onShowAuthModal={() => setShowAuthModal(true)} />
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
          onCancelProcessing={cancelProcessing}
        />
      </div>

      {/* 升级弹窗 */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* 登录/注册弹窗 */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}