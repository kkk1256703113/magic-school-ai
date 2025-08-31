import { useState } from 'react'
import { X, Settings, Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AccountModal = ({ isOpen, onClose }: AccountModalProps) => {
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  
  const [activeTab, setActiveTab] = useState<'security' | 'privacy'>('security')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // 密码修改表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // 处理密码输入变化
  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  // 更新密码
  const handleUpdatePassword = async () => {
    if (!isAuthenticated) {
      toast.error(t('account.notAuthenticated'))
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('account.passwordMismatch'))
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error(t('account.passwordTooShort'))
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (response.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        toast.success(t('account.passwordUpdateSuccess'))
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || t('account.passwordUpdateFailed'))
      }
    } catch (error) {
      toast.error(t('account.passwordUpdateFailed'))
      console.error('Password update error:', error)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // 验证密码强度
  const getPasswordStrength = (password: string) => {
    if (password.length < 4) return { level: 0, text: t('account.passwordWeak'), color: 'text-red-500' }
    if (password.length < 8) return { level: 1, text: t('account.passwordFair'), color: 'text-orange-500' }
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 3, text: t('account.passwordStrong'), color: 'text-green-500' }
    }
    if (password.length >= 8) return { level: 2, text: t('account.passwordGood'), color: 'text-blue-500' }
    return { level: 0, text: t('account.passwordWeak'), color: 'text-red-500' }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('account.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {t('account.loginRequired')}
            </p>
          </div>
        ) : (
          <>
            {/* 选项卡 */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'security'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('account.security')}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'privacy'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('account.privacy')}
                  </div>
                </button>
              </nav>
            </div>

            {/* 内容 */}
            <div className="p-6">
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* 账户信息 */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      {t('account.accountInfo')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('account.email')}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user?.email}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('account.lastLogin')}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {t('account.now')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 修改密码 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      {t('account.changePassword')}
                    </h3>
                    <div className="space-y-4">
                      {/* 当前密码 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('account.currentPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* 新密码 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('account.newPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.newPassword && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    getPasswordStrength(passwordForm.newPassword).level === 0 ? 'w-0' :
                                    getPasswordStrength(passwordForm.newPassword).level === 1 ? 'w-1/4 bg-red-500' :
                                    getPasswordStrength(passwordForm.newPassword).level === 2 ? 'w-2/4 bg-orange-500' :
                                    getPasswordStrength(passwordForm.newPassword).level === 3 ? 'w-full bg-green-500' : 'w-3/4 bg-blue-500'
                                  }`}
                                />
                              </div>
                              <span className={`text-xs font-medium ${getPasswordStrength(passwordForm.newPassword).color}`}>
                                {getPasswordStrength(passwordForm.newPassword).text}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 确认密码 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('account.confirmPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordForm.confirmPassword && (
                          <div className="mt-1 flex items-center gap-1">
                            {passwordForm.newPassword === passwordForm.confirmPassword ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-xs ${
                              passwordForm.newPassword === passwordForm.confirmPassword ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {passwordForm.newPassword === passwordForm.confirmPassword 
                                ? t('account.passwordMatch') 
                                : t('account.passwordMismatch')
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingPassword ? t('account.updating') : t('account.updatePassword')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t('account.privacySettings')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {t('account.privacyDescription')}
                    </p>
                  </div>
                  
                  {/* 隐私选项 */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {t('account.dataUsage')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {t('account.dataUsageDescription')}
                      </p>
                      <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {t('account.dataProtected')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}