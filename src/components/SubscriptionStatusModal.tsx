import { useState, useEffect, useRef } from 'react'
import { X, Zap, Plus, RefreshCw, DollarSign, Activity, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/context/LanguageContext'
import axios from 'axios'
import toast from 'react-hot-toast'

interface SubscriptionStatusModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenUpgrade?: () => void
}

interface UsageData {
  remaining: number
  rechargeHistory: Array<{
    date: string
    amount: number
    calls: number
    message: string
  }>
  usageHistory: Array<{
    date: string
    action: string
    model: string
  }>
  breakdown: {
    bonusCalls: number
    isFirstTimeUser: boolean
    total: number
  }
}


export const SubscriptionStatusModal = ({ isOpen, onClose }: SubscriptionStatusModalProps) => {
  const { token } = useAuth()
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<number | null>(null)

  // 日期格式化函数，根据语言设置显示不同格式
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = language === 'zh' ? 'zh-CN' : 'en-US'

    const dateStr = date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

    const timeStr = date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    })

    return language === 'zh' ? `${dateStr.replace(/\//g, '-')} ${timeStr}` : `${dateStr} ${timeStr}`
  }

  const fetchData = async () => {
    if (!token) {
      setLoading(false)
      console.log('❌ [前端] 无认证token，请重新登录')
      toast.error(t('subscription.pleaseLogin') || '请先登录')
      return
    }

    try {
      setRefreshing(true)
      console.log('🔍 [前端] 开始获取API使用量数据...')
      console.log('🔍 [前端] Token长度:', token.length)

      const usageResponse = await axios.get('/api/usage/check', {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('✅ [前端] API响应状态:', usageResponse.status)
      console.log('✅ [前端] API原始响应数据:', JSON.stringify(usageResponse.data, null, 2))
      const usageData = usageResponse.data

      // 验证关键字段是否存在
      console.log('🔍 [前端] 检查关键字段:')
      console.log('  - apiCallsRemaining:', usageData.apiCallsRemaining)
      console.log('  - remaining:', usageData.remaining)
      console.log('  - rechargeHistory长度:', usageData.rechargeHistory?.length || 0)
      console.log('  - usageHistory长度:', usageData.usageHistory?.length || 0)
      console.log('  - breakdown:', usageData.breakdown)

      // 🔧 修复API响应结构映射 - 使用服务器实际返回的字段名
      const mappedUsage = {
        remaining: usageData.apiCallsRemaining || usageData.remaining || 0,  // 优先使用apiCallsRemaining
        rechargeHistory: usageData.rechargeHistory || [],
        usageHistory: usageData.usageHistory || [],
        breakdown: usageData.breakdown || {
          bonusCalls: usageData.apiCallsRemaining || 0,
          isFirstTimeUser: false,
          total: usageData.apiCallsRemaining || 0
        }
      }

      console.log('🔧 [前端] 映射后的数据:', JSON.stringify(mappedUsage, null, 2))
      console.log('📊 [前端] 设置usage状态，剩余次数:', mappedUsage.remaining)

      setUsage(mappedUsage)

      // 验证状态设置是否成功
      setTimeout(() => {
        console.log('⏰ [前端] 500ms后检查usage状态是否更新...')
      }, 500)

    } catch (error: any) {
      console.error('❌ [前端] 获取使用量数据失败:', error)
      console.error('❌ [前端] 错误详情:', {
        message: error.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      })

      // 401错误不关闭弹窗，让用户看到默认值
      if (error?.response?.status === 401) {
        console.log('🔑 [前端] Token验证失败，但继续显示弹窗')
        toast.error('认证失败，请重新登录')
      } else {
        toast.error(`获取数据失败: ${error.message}`)
      }

      // 显示安全的默认值
      const defaultUsage = {
        remaining: 0,
        rechargeHistory: [],
        usageHistory: [],
        breakdown: {
          bonusCalls: 0,
          isFirstTimeUser: false,
          total: 0
        }
      }
      console.log('🔧 [前端] 设置默认值:', defaultUsage)
      setUsage(defaultUsage)
    } finally {
      setLoading(false)
      setRefreshing(false)
      console.log('🏁 [前端] fetchData函数执行完成')
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()

      // 设置30秒自动刷新
      intervalRef.current = setInterval(() => {
        fetchData()
      }, 30000)

      // 监听API使用更新事件
      const handleApiUsageUpdate = () => {
        console.log('🔄 检测到API使用更新，刷新订阅数据...')
        fetchData()
      }

      window.addEventListener('apiUsageUpdated', handleApiUsageUpdate)

      return () => {
        // 清理定时器
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        // 清理事件监听器
        window.removeEventListener('apiUsageUpdated', handleApiUsageUpdate)
      }
    } else {
      // 关闭弹窗时清除定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isOpen, token])

  const handleUpgradeClick = () => {
    // 显示支付不可用提示
    toast(t('subscription.paymentUnavailable'), {
      icon: '📢',
      duration: 5000,
      style: {
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f9fafb' : '#1f2937',
        border: document.documentElement.classList.contains('dark') ? '1px solid #374151' : '1px solid #e5e7eb',
      },
    })
  }

  if (!isOpen) return null

  const getStatusColor = () => {
    const remaining = usage?.remaining || 0

    if (remaining > 10) return 'text-green-600 dark:text-green-400'
    if (remaining > 5) return 'text-blue-600 dark:text-blue-400'
    if (remaining > 0) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
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

        {/* 🔥 核心指标：剩余次数 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('subscription.remainingCalls') || '剩余次数'}
              </h3>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${getStatusColor()}`}>
                  {loading ? '...' : (usage?.remaining || 0)}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  {t('subscription.times') || '次'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('subscription.currentAvailable')}
              </p>
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

        {/* 🔥 并列历史记录卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 充值历史 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shadow-sm">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('subscription.rechargeHistory')}
              </h4>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 text-green-600 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">{t('subscription.loading')}</span>
                </div>
              ) : usage?.rechargeHistory && usage.rechargeHistory.length > 0 ? (
                usage.rechargeHistory.slice(0, 10).map((record, index) => (
                  <div key={index} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-green-100/50 dark:border-green-800/20">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ${record.amount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          +{record.calls}{t('subscription.credits')}
                        </div>
                        {record.message && (
                          <div className="text-xs text-gray-400 mt-1 max-w-[80px] truncate">
                            {record.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscription.noRechargeHistory')}</p>
                </div>
              )}
            </div>
          </div>

          {/* 使用历史 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('subscription.usageHistory')}
              </h4>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">{t('subscription.loading')}</span>
                </div>
              ) : usage?.usageHistory && usage.usageHistory.length > 0 ? (
                usage.usageHistory.slice(0, 10).map((record, index) => (
                  <div key={index} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-blue-100/50 dark:border-blue-800/20">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {record.action}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.date)}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          -1{t('subscription.credits')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 capitalize">
                          {record.model}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscription.noUsageHistory')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 余额为0的状态提示 */}
        {usage?.remaining === 0 && (
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('subscription.zeroBalanceWarning')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}