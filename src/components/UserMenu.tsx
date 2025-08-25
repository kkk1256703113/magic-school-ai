import { useState } from 'react'
import { User, Settings, CreditCard, LogOut } from 'lucide-react'

interface UserMenuProps {
  username?: string
}

export const UserMenu = ({ username = 'User' }: UserMenuProps) => {
  const [showMenu, setShowMenu] = useState(false)
  
  // 获取用户名首字母作为头像
  const avatarLetter = username.charAt(0).toUpperCase()

  return (
    <div className="relative">
      {/* 用户头像按钮 */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors"
      >
        <span className="text-white text-sm font-medium">{avatarLetter}</span>
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* 菜单内容 */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                免费版用户
              </p>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setShowMenu(false)
                  // 处理个人资料点击
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                个人资料
              </button>

              <button
                onClick={() => {
                  setShowMenu(false)
                  // 处理账户管理点击
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                账户管理
              </button>

              <button
                onClick={() => {
                  setShowMenu(false)
                  // 处理订阅管理点击
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <CreditCard className="h-4 w-4" />
                订阅管理
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowMenu(false)
                  // 处理退出登录
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}