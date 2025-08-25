import { useState } from 'react'
import { MessageSquarePlus, Settings, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface SidebarProps {
  onNewChat: () => void
}

export const Sidebar = ({ onNewChat }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme()
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  return (
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
      <div className="flex-1" />
      
      <div className="flex flex-col gap-3">
        {/* 新建对话按钮 */}
        <button
          onClick={onNewChat}
          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
          title="新建对话"
        >
          <MessageSquarePlus className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
        </button>

        {/* 设置按钮（主题切换） */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
            title="设置"
          >
            <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </button>

          {/* 主题菜单 */}
          {showThemeMenu && (
            <div className="absolute left-full ml-2 bottom-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                主题设置
              </div>
              <button
                onClick={() => {
                  if (theme === 'dark') toggleTheme()
                  setShowThemeMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                <Sun className="h-4 w-4" />
                浅色模式
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
                深色模式
                {theme === 'dark' && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}