import { useState, useEffect } from 'react'
import { MessageSquarePlus, Settings, Sun, Moon, Zap, CheckCircle } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { promptVersionManager } from '@/services/ai/core/PromptVersionManager'

interface SidebarProps {
  onNewChat: () => void
}

export const Sidebar = ({ onNewChat }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [currentPromptVersion, setCurrentPromptVersion] = useState(promptVersionManager.getCurrentVersion())

  // 组件挂载时恢复版本状态
  useEffect(() => {
    setCurrentPromptVersion(promptVersionManager.getCurrentVersion())
  }, [])

  // 版本切换处理函数
  const handleVersionSwitch = (version: 'stable' | 'enhanced') => {
    promptVersionManager.switchVersion(version)
    setCurrentPromptVersion(version)
    setShowThemeMenu(false)
  }

  return (
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
      <div className="flex-1" />
      
      <div className="flex flex-col gap-3">
        {/* 新建对话按钮 */}
        <button
          onClick={onNewChat}
          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
          title={t('sidebar.newChat')}
        >
          <MessageSquarePlus className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
        </button>

        {/* 设置按钮（主题切换） */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
            title={t('sidebar.settings')}
          >
            <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </button>

          {/* 主题菜单 */}
          {showThemeMenu && (
            <div className="absolute left-full ml-2 bottom-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                {t('sidebar.themeSettings')}
              </div>
              <button
                onClick={() => {
                  if (theme === 'dark') toggleTheme()
                  setShowThemeMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                <Sun className="h-4 w-4" />
                {t('sidebar.lightMode')}
                {theme === 'light' && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => {
                  if (theme === 'light') toggleTheme()
                  setShowThemeMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                <Moon className="h-4 w-4" />
                {t('sidebar.darkMode')}
                {theme === 'dark' && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
              
              {/* 分隔线 */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              
              {/* 语言设置标题 */}
              <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('sidebar.languageSettings')}
              </div>
              
              {/* 中文选项 */}
              <button
                onClick={() => {
                  i18n.changeLanguage('zh')
                  setShowThemeMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                <span className="text-base">🇨🇳</span>
                <span>{t('sidebar.chineseName')}</span>
                {i18n.language === 'zh' && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
              
              {/* 英文选项 */}
              <button
                onClick={() => {
                  i18n.changeLanguage('en')
                  setShowThemeMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                <span className="text-base">🇺🇸</span>
                <span>{t('sidebar.englishName')}</span>
                {i18n.language === 'en' && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
              
              {/* 分隔线 */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              
              {/* 提示词版本设置标题 */}
              <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('sidebar.promptVersion.title')}
              </div>
              
              {/* 稳定版本选项 */}
              <button
                onClick={() => handleVersionSwitch('stable')}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                title={t('sidebar.promptVersion.stableDescription')}
              >
                <CheckCircle className="h-4 w-4" />
                <span>{t('sidebar.promptVersion.stable')}</span>
                {currentPromptVersion === 'stable' && (
                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
              
              {/* 增强版本选项 */}
              <button
                onClick={() => handleVersionSwitch('enhanced')}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                title={t('sidebar.promptVersion.enhancedDescription')}
              >
                <Zap className="h-4 w-4" />
                <span>{t('sidebar.promptVersion.enhanced')}</span>
                {currentPromptVersion === 'enhanced' && (
                  <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}