import { useState, useEffect } from 'react'
import { X, Zap, TrendingUp, Calendar, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

interface SubscriptionStatusModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenUpgrade?: () => void
}

interface UsageData {
  apiCallsRemaining: number
  breakdown: {
    bonusCalls: number
    isFirstTimeUser: boolean
    total: number
  }
  needsPayment: boolean
  email: string
}

interface UsageStats {
  todayUsed: number
  weekUsed: number
  totalUsed: number
  lastRefreshDate: string
}

export const SubscriptionStatusModal = ({ isOpen, onClose, onOpenUpgrade }: SubscriptionStatusModalProps) => {
  const { user, token } = useAuth()
  const { t } = useTranslation()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      const usageResponse = await axios.get('/api/usage/check', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUsage(usageResponse.data)
      setStats({
        todayUsed: user?.api_calls_today || 0,
        weekUsed: 0, // 暂时设为0，避免API调用失败
        totalUsed: 0, // 暂时设为0，避免API调用失败
        lastRefreshDate: new Date().toLocaleDateString()
      })
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
      // 使用用户数据作为后备
      setStats({
        todayUsed: user?.api_calls_today || 0,
        weekUsed: 0,
        totalUsed: 0,
        lastRefreshDate: new Date().toLocaleDateString()
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, token])

  const handleUpgradeClick = () => {
    onClose()
    if (onOpenUpgrade) {
      onOpenUpgrade()
    }
  }

  if (!isOpen) return null

  const getStatusColor = () => {
    const total = usage?.breakdown?.total || 0
    if (total > 10) return 'text-green-600 dark:text-green-400'
    if (total > 5) return 'text-blue-600 dark:text-blue-400'
    if (total > 0) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            {t('subscription.statusTitle') || 'API使用统计'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 当前余额 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('subscription.remainingCalls') || '剩余调用次数'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-3xl font-bold ${getStatusColor()}`}>
                  {loading ? '...' : (usage?.breakdown?.total || 0)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('subscription.times') || '次'}
                </span>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 快捷充值按钮 */}
          <button
            onClick={handleUpgradeClick}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            {t('subscription.addCredits') || '充值更多次数'}
          </button>
        </div>

        {/* 使用统计 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('subscription.usageStats') || '使用统计'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* 今日使用 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('subscription.todayUsed') || '今日已用'}
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '-' : (stats?.todayUsed || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('subscription.times') || '次'}
              </div>
            </div>

            {/* 总使用量 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('subscription.totalUsed') || '累计使用'}
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '-' : (stats?.totalUsed || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('subscription.times') || '次'}
              </div>
            </div>
          </div>

          {/* 账户信息 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('subscription.accountInfo') || '账户信息'}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('subscription.email') || '邮箱'}:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {user?.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('subscription.accountType') || '账户类型'}:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {usage?.breakdown?.isFirstTimeUser
                    ? (t('subscription.newUser') || '新用户')
                    : (t('subscription.regularUser') || '常规用户')
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('subscription.lastUpdate') || '最后更新'}:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {stats?.lastRefreshDate}
                </span>
              </div>
            </div>
          </div>

          {/* 使用提示 */}
          {usage?.breakdown?.isFirstTimeUser && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 {t('subscription.newUserTip') || '新用户享有5次免费API调用，用完后可通过充值获得更多次数。'}
              </p>
            </div>
          )}

          {usage?.needsPayment && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ {t('subscription.noCreditsWarning') || '您的API调用次数已用完，请充值以继续使用服务。'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}