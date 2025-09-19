import { useState, useEffect } from 'react'
import { X, CreditCard, Crown, Calendar, TrendingUp, AlertCircle, CheckCircle, Star } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UsageStats {
  daily_used: number
  daily_limit: number
  total_used: number
  total_limit: number
  reset_date?: string
}

export const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 加载使用统计
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadUsageStats()
    }
  }, [isOpen, isAuthenticated])

  const loadUsageStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/usage/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsageStats(data)
      } else {
        console.error('Failed to load usage stats')
      }
    } catch (error) {
      console.error('Error loading usage stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取订阅计划信息
  const getPlanInfo = (planType: string) => {
    switch (planType) {
      case 'monthly':
        return {
          name: t('subscription.plans.monthly.name'),
          price: '¥29',
          period: t('subscription.plans.monthly.period'),
          dailyLimit: 10,
          totalLimit: 300,
          color: 'blue',
          icon: Calendar
        }
      case 'quarterly':
        return {
          name: t('subscription.plans.quarterly.name'),
          price: '¥69',
          period: t('subscription.plans.quarterly.period'),
          dailyLimit: 20,
          totalLimit: 1800,
          color: 'purple',
          icon: TrendingUp,
          savings: t('subscription.plans.quarterly.savings')
        }
      case 'yearly':
        return {
          name: t('subscription.plans.yearly.name'),
          price: '¥199',
          period: t('subscription.plans.yearly.period'),
          dailyLimit: -1,
          totalLimit: -1,
          color: 'gold',
          icon: Crown,
          savings: t('subscription.plans.yearly.savings')
        }
      default:
        return {
          name: t('subscription.plans.free.name'),
          price: t('subscription.plans.free.price'),
          period: '',
          dailyLimit: 2,
          totalLimit: 10,
          color: 'gray',
          icon: AlertCircle
        }
    }
  }

  const currentPlan = getPlanInfo(user?.plan || 'free')

  // 计算使用百分比
  const getDailyUsagePercentage = () => {
    if (!usageStats || currentPlan.dailyLimit === -1) return 0
    return Math.min((usageStats.daily_used / currentPlan.dailyLimit) * 100, 100)
  }

  const getTotalUsagePercentage = () => {
    if (!usageStats || currentPlan.totalLimit === -1) return 0
    return Math.min((usageStats.total_used / currentPlan.totalLimit) * 100, 100)
  }

  // 处理升级
  const handleUpgrade = () => {
    onClose()
    // 这里应该打开升级模态框或跳转到支付页面
    toast(t('subscription.upgradeComingSoon'))
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
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('subscription.title')}
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
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {t('subscription.loginRequired')}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* 当前订阅状态 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('subscription.currentPlan')}
                  </h3>
                  <div className="flex items-center gap-2">
                    <currentPlan.icon className={`h-5 w-5 ${
                      currentPlan.color === 'blue' ? 'text-blue-600' :
                      currentPlan.color === 'purple' ? 'text-purple-600' :
                      currentPlan.color === 'gold' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`} />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentPlan.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentPlan.price}{currentPlan.period}
                    </span>
                  </div>
                  {currentPlan.savings && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                      {currentPlan.savings}
                    </span>
                  )}
                </div>
                {user?.plan === 'free' && (
                  <button
                    onClick={() => handleUpgrade()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    {t('subscription.upgrade')}
                  </button>
                )}
              </div>
            </div>

            {/* 使用统计 */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* 今日使用 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {t('subscription.dailyUsage')}
                </h4>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {usageStats?.daily_used || user?.apiCallsToday || 0}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        / {currentPlan.dailyLimit === -1 ? t('subscription.unlimited') : currentPlan.dailyLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getDailyUsagePercentage()}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('subscription.dailyReset')}
                    </p>
                  </>
                )}
              </div>

              {/* 总使用量 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {t('subscription.totalUsage')}
                </h4>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {usageStats?.total_used || 0}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        / {currentPlan.totalLimit === -1 ? t('subscription.unlimited') : currentPlan.totalLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getTotalUsagePercentage()}%` }}
                      ></div>
                    </div>
                    {currentPlan.totalLimit !== -1 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('subscription.monthlyReset')}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 升级选项 */}
            {user?.plan === 'free' && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                <div className="text-center mb-4">
                  <Star className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('subscription.upgradeTitle')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('subscription.upgradeDescription')}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {/* 月费套餐 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer" 
                       onClick={() => handleUpgrade()}>
                    <div className="text-center">
                      <Calendar className="mx-auto h-6 w-6 text-blue-600 mb-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {t('subscription.plans.monthly.name')}
                      </h4>
                      <p className="text-blue-600 font-bold text-lg">¥29</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('subscription.plans.monthly.period')}
                      </p>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>10次/天</div>
                        <div>300次/月</div>
                      </div>
                    </div>
                  </div>

                  {/* 季费套餐 */}
                  <div className="border-2 border-purple-500 rounded-lg p-4 hover:border-purple-600 transition-colors cursor-pointer relative" 
                       onClick={() => handleUpgrade()}>
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                      {t('subscription.recommended')}
                    </div>
                    <div className="text-center">
                      <TrendingUp className="mx-auto h-6 w-6 text-purple-600 mb-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {t('subscription.plans.quarterly.name')}
                      </h4>
                      <p className="text-purple-600 font-bold text-lg">¥69</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('subscription.plans.quarterly.period')}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {t('subscription.plans.quarterly.savings')}
                      </p>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>20次/天</div>
                        <div>1800次/季</div>
                      </div>
                    </div>
                  </div>

                  {/* 年费套餐 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-yellow-500 transition-colors cursor-pointer" 
                       onClick={() => handleUpgrade()}>
                    <div className="text-center">
                      <Crown className="mx-auto h-6 w-6 text-yellow-600 mb-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {t('subscription.plans.yearly.name')}
                      </h4>
                      <p className="text-yellow-600 font-bold text-lg">¥199</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('subscription.plans.yearly.period')}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {t('subscription.plans.yearly.savings')}
                      </p>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>{t('subscription.unlimited')}</div>
                        <div>{t('subscription.unlimitedUsage')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 订阅历史 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('subscription.history')}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentPlan.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('subscription.activeSince')}: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t('subscription.unknown')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}