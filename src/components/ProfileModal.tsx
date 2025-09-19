import { useState, useEffect } from 'react'
import { X, User, Mail, Calendar, Save, AlertCircle, Hash } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, isAuthenticated } = useAuth()
  const { t, i18n } = useTranslation()
  
  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    joinDate: ''
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (user && isOpen) {
      // 格式化注册时间为YYYY-MM-DD格式
      let formattedJoinDate = ''
      if (user.created_at) {
        const joinDate = new Date(user.created_at)
        formattedJoinDate = joinDate.toISOString().split('T')[0]
      }

      setFormData({
        username: user.username || '',
        email: user.email || '',
        joinDate: formattedJoinDate
      })
    }
  }, [user, isOpen, i18n.language])

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 保存用户资料
  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error(t('profile.notAuthenticated'))
      return
    }

    setSaving(true)
    try {
      // TODO: 调用API更新用户资料
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          username: formData.username.trim()
        })
      })

      if (response.ok) {
        setIsEditing(false)
        toast.success(t('profile.updateSuccess'))
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || t('profile.updateFailed'))
      }
    } catch (error) {
      toast.error(t('profile.updateFailed'))
      console.error('Profile update error:', error)
    } finally {
      setSaving(false)
    }
  }

  // 取消编辑
  const handleCancel = () => {
    if (user) {
      // 格式化注册时间为YYYY-MM-DD格式
      let formattedJoinDate = ''
      if (user.created_at) {
        const joinDate = new Date(user.created_at)
        formattedJoinDate = joinDate.toISOString().split('T')[0]
      }

      setFormData({
        username: user.username || '',
        email: user.email || '',
        joinDate: formattedJoinDate
      })
    }
    setIsEditing(false)
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
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('profile.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {t('profile.loginRequired')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 用户名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.username')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 dark:text-white ${
                      isEditing 
                        ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                    placeholder={t('profile.usernamePlaceholder')}
                  />
                </div>
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('profile.emailCannotChange')}
                </p>
              </div>

              {/* 注册时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.joinDate')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.joinDate}
                    disabled={true}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* 用户ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.userId') || '用户ID'}
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={user?.id ? `#${user.id}` : ''}
                    disabled={true}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-mono text-sm"
                  />
                </div>
              </div>

              {/* 订阅信息 */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                  {t('profile.subscriptionInfo')}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  {user?.plan === 'free' ? t('userMenu.plans.free') :
                   user?.plan === 'monthly' ? t('userMenu.plans.monthly') :
                   user?.plan === 'yearly' ? t('userMenu.plans.yearly') : t('userMenu.plans.default')}
                </p>
                {user?.apiCallsToday !== undefined && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {t('userMenu.apiUsage', { count: user.apiCallsToday })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {isAuthenticated && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? t('common.saving') : t('common.save')}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {t('common.edit')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}