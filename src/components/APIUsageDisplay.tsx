import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Zap, Gift, AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

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

interface APIUsageDisplayProps {
  onUpgradeClick?: () => void
}

export const APIUsageDisplay = ({ onUpgradeClick }: APIUsageDisplayProps) => {
  const { token } = useAuth()
  const { t } = useTranslation()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUsage = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      const response = await axios.get('/api/usage/check', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsage(response.data)
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsage()

    // 监听API使用更新事件
    const handleApiUsageUpdate = () => {
      console.log('🔄 API使用状态更新，刷新显示...')
      fetchUsage()
    }

    window.addEventListener('apiUsageUpdated', handleApiUsageUpdate)

    return () => {
      window.removeEventListener('apiUsageUpdated', handleApiUsageUpdate)
    }
  }, [token])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!usage) {
    return null
  }

  const getStatusColor = () => {
    const total = usage?.breakdown?.total || 0
    if (total > 10) return 'text-green-600 dark:text-green-400'
    if (total > 5) return 'text-blue-600 dark:text-blue-400'
    if (total > 0) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStatusBg = () => {
    const total = usage?.breakdown?.total || 0
    if (total > 10) return 'bg-green-50 dark:bg-green-900/20'
    if (total > 5) return 'bg-blue-50 dark:bg-blue-900/20'
    if (total > 0) return 'bg-amber-50 dark:bg-amber-900/20'
    return 'bg-red-50 dark:bg-red-900/20'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          {t('usage.title') || 'API Usage'}
        </h3>
        <button
          onClick={fetchUsage}
          disabled={refreshing}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {/* 总可用次数 */}
        <div className={`${getStatusBg()} rounded-lg p-3`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('usage.available') || 'Available'}
            </span>
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {usage?.breakdown?.total || 0}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('usage.apiCalls') || 'API calls remaining'}
          </div>
        </div>

        {/* 新用户提示 */}
        {usage?.breakdown?.isFirstTimeUser && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                {t('usage.welcomeBonus') || 'Welcome Bonus!'}
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                {t('usage.newUserGift') || 'You have 20 free API calls to try our service'}
              </p>
            </div>
          </div>
        )}

        {/* 低余额警告 */}
        {usage?.breakdown?.total <= 2 && usage?.breakdown?.total > 0 && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="text-amber-800 dark:text-amber-200 font-medium">
                {t('usage.lowBalance') || 'Low Balance'}
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                {t('usage.considerRecharge') || 'Consider adding more credits'}
              </p>
            </div>
          </div>
        )}

        {/* 无余额提示 */}
        {usage?.needsPayment && (
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="text-red-800 dark:text-red-200 font-medium">
                {t('usage.noCredits') || 'No Credits'}
              </p>
              <p className="text-red-700 dark:text-red-300 mt-0.5">
                {t('usage.needRecharge') || 'Add credits to continue using the service'}
              </p>
            </div>
          </div>
        )}

        {/* 充值按钮 */}
        {(usage?.needsPayment || (usage?.breakdown?.total || 0) <= 5) && (
          <button
            onClick={onUpgradeClick}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all text-sm"
          >
            {t('usage.addCredits') || 'Add Credits'}
          </button>
        )}
      </div>
    </div>
  )
}