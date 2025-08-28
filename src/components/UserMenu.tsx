import { useState } from 'react'
import { User, Settings, CreditCard, LogOut, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface UserMenuProps {
  onShowAuthModal?: () => void
}

export const UserMenu = ({ onShowAuthModal }: UserMenuProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  
  // 获取用户名首字母作为头像，未登录时使用默认图标
  const avatarLetter = user?.username 
    ? user.username.charAt(0).toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() 
    || 'U'

  // 处理退出登录
  const handleLogout = async () => {
    setShowMenu(false)
    try {
      logout()
      toast.success('已退出登录')
    } catch (error) {
      toast.error('退出登录失败')
    }
  }

  // 处理登录按钮点击
  const handleLoginClick = () => {
    setShowMenu(false)
    if (onShowAuthModal) {
      onShowAuthModal()
    }
  }

  // 如果正在加载用户信息，显示加载状态
  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 用户头像按钮 */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`w-8 h-8 ${
          isAuthenticated 
            ? 'bg-purple-600 hover:bg-purple-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        } rounded-full flex items-center justify-center transition-colors`}
        title={isAuthenticated ? `${user?.username || user?.email}` : '点击登录'}
      >
        {isAuthenticated ? (
          <span className="text-white text-sm font-medium">{avatarLetter}</span>
        ) : (
          <UserPlus className="h-4 w-4 text-white" />
        )}
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
            
            {isAuthenticated ? (
              <>
                {/* 已登录用户信息 */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.username || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.plan_type === 'free' ? '免费版用户' : 
                     user?.plan_type === 'monthly' ? '月费用户' :
                     user?.plan_type === 'yearly' ? '年费用户' : '免费用户'}
                  </p>
                  {user?.api_calls_today !== undefined && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      今日已使用: {user.api_calls_today} 次
                    </p>
                  )}
                </div>

                {/* 用户功能菜单 */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      // TODO: 实现个人资料页面
                      toast.info('个人资料功能开发中...')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User className="h-4 w-4" />
                    个人资料
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false)
                      // TODO: 实现账户管理页面
                      toast.info('账户管理功能开发中...')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4" />
                    账户管理
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false)
                      // TODO: 实现订阅管理页面
                      toast.info('订阅管理功能开发中...')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <CreditCard className="h-4 w-4" />
                    订阅管理
                  </button>
                </div>

                {/* 退出登录 */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 未登录用户提示 */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    未登录
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    登录以享受完整功能
                  </p>
                </div>

                {/* 登录/注册按钮 */}
                <div className="py-1">
                  <button
                    onClick={handleLoginClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <UserPlus className="h-4 w-4" />
                    登录 / 注册
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}