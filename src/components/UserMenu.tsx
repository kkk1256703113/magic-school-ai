import { useState, useEffect, useRef } from 'react'
import { User, Settings, CreditCard, LogOut, UserPlus, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ProfileModal } from './ProfileModal'
import { AccountModal } from './AccountModal'
import { SubscriptionStatusModal } from './SubscriptionStatusModal'
import { UpgradeModal } from './UpgradeModal'

interface UserMenuProps {
  onShowAuthModal?: () => void
}

export const UserMenu = ({ onShowAuthModal }: UserMenuProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const { t, i18n } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
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
    } catch (error) {
      toast.error(t('userMenu.logoutFailed'))
    }
  }

  // 处理登录按钮点击
  const handleLoginClick = () => {
    setShowMenu(false)
    if (onShowAuthModal) {
      onShowAuthModal()
    }
  }

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMenu) {
        setShowMenu(false)
        buttonRef.current?.focus()
      }
    }

    if (showMenu) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMenu])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // 菜单位置计算
  const getMenuPosition = () => {
    if (!buttonRef.current) return {}
    
    const rect = buttonRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const menuWidth = 224 // w-56 = 14rem = 224px
    
    // 如果右侧空间不足，则向左对齐
    if (rect.right + menuWidth > viewportWidth - 16) {
      return { right: 0 }
    }
    
    return { left: 0 }
  }

  // 如果正在加载用户信息，显示加载状态
  if (isLoading) {
    return (
      <div 
        className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center"
        role="status"
        aria-label={t('common.loading')}
      >
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 用户头像按钮 */}
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault()
            setShowMenu(true)
          }
        }}
        className={`relative w-8 h-8 ${
          isAuthenticated 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        } rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
          showMenu ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800' : ''
        }`}
        title={isAuthenticated ? `${user?.username || user?.email}` : t('userMenu.clickToLogin')}
        aria-label={isAuthenticated ? t('userMenu.openUserMenu') : t('userMenu.clickToLogin')}
        aria-expanded={showMenu}
        aria-haspopup="menu"
      >
        {isAuthenticated ? (
          <>
            <span className="text-white text-sm font-semibold">{avatarLetter}</span>
            <ChevronDown className={`absolute -bottom-1 -right-1 h-3 w-3 text-white bg-gray-800 rounded-full p-0.5 transition-transform duration-200 ${
              showMenu ? 'rotate-180' : ''
            }`} />
          </>
        ) : (
          <UserPlus className="h-4 w-4 text-white" />
        )}
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-5"
            aria-hidden="true"
          />
          
          {/* 菜单内容 */}
          <div 
            ref={menuRef}
            className="absolute top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200"
            style={getMenuPosition()}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
          >
            
            {isAuthenticated ? (
              <>
                {/* 已登录用户信息 */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    {user?.username || user?.email}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {user?.plan_type === 'free' ? t('userMenu.plans.free') : 
                       user?.plan_type === 'monthly' ? t('userMenu.plans.monthly') :
                       user?.plan_type === 'yearly' ? t('userMenu.plans.yearly') : t('userMenu.plans.default')}
                    </p>
                    {user?.plan_type !== 'free' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                        {t('userMenu.proBadge')}
                      </span>
                    )}
                  </div>
                  {user?.api_calls_today !== undefined && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t('userMenu.todayUsage')}
                      </p>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {user.api_calls_today} {t('userMenu.times')}
                      </p>
                    </div>
                  )}

                  {/* 注册时间显示（跟随语言设置） */}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('userMenu.memberSince')}
                    </p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString(
                            i18n.language === 'zh' ? 'zh-CN' : 'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )
                        : '--'}
                    </p>
                  </div>
                </div>

                {/* 用户功能菜单 */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowProfileModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-all duration-150 group"
                    role="menuitem"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                    </div>
                    <span className="font-medium">{t('userMenu.profile')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowAccountModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-150 group"
                    role="menuitem"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <span className="font-medium">{t('userMenu.accountManagement')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowSubscriptionModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-150 group"
                    role="menuitem"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                      <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{t('userMenu.subscriptionManagement')}</span>
                      {user?.plan_type === 'free' && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {t('userMenu.upgradeAvailable')}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* 退出登录 */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-150 group"
                    role="menuitem"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                      <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                    </div>
                    <span className="font-medium">{t('userMenu.logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 未登录用户提示 */}
                <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {t('userMenu.welcomeGuest')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('userMenu.loginToEnjoy')}
                  </p>
                </div>

                {/* 登录/注册按钮 */}
                <div className="py-2 px-4">
                  <button
                    onClick={handleLoginClick}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all duration-150 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    role="menuitem"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{t('userMenu.loginOrRegister')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      
      {/* 模态框组件 */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
      <SubscriptionStatusModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}
