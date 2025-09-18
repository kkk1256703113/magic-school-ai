import { useState, useEffect, useRef } from 'react'
import { X, Zap, Plus, RefreshCw, DollarSign, Activity, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

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


export const SubscriptionStatusModal = ({ isOpen, onClose, onOpenUpgrade }: SubscriptionStatusModalProps) => {
  const { token } = useAuth()
  const { t } = useTranslation()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const fetchData = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      console.log('🔍 获取API使用量数据...')

      const usageResponse = await axios.get('/api/usage/check', {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('✅ API使用量数据获取成功:', usageResponse.data)
      const usageData = usageResponse.data

      // 🔧 使用新的API响应结构
      const mappedUsage = {
        remaining: usageData.remaining || 0,
        rechargeHistory: usageData.rechargeHistory || [],
        usageHistory: usageData.usageHistory || [],
        breakdown: usageData.breakdown || {
          bonusCalls: 0,
          isFirstTimeUser: false,
          total: 0
        }
      }

      setUsage(mappedUsage)
      // 移除stats的使用，简化代码
    } catch (error) {
      console.error('❌ 获取使用量数据失败:', error)

      // 错误时显示安全的默认值
      setUsage({
        remaining: 0,
        rechargeHistory: [],
        usageHistory: [],
        breakdown: {
          bonusCalls: 0,
          isFirstTimeUser: false,
          total: 0
        }
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
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
    onClose()
    if (onOpenUpgrade) {
      onOpenUpgrade()
    }
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
                {usage?.breakdown?.isFirstTimeUser ? '新用户免费额度' : '当前可用额度'}
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

        {/* 🔥 两个辅助信息卡片 */}
        <div className="space-y-4">
          {/* 充值历史 */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-green-600" />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                充值历史
              </h4>
            </div>

            {loading ? (
              <div className="text-sm text-gray-500">加载中...</div>
            ) : usage?.rechargeHistory && usage.rechargeHistory.length > 0 ? (
              <div className="space-y-2">
                {usage.rechargeHistory.map((record, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${record.amount} → +{record.calls}次
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(record.date).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    {record.message && (
                      <div className="text-xs text-gray-400 max-w-[100px] truncate">
                        {record.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                暂无充值记录
              </div>
            )}
          </div>

          {/* 消耗历史 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                使用历史
              </h4>
            </div>

            {loading ? (
              <div className="text-sm text-gray-500">加载中...</div>
            ) : usage?.usageHistory && usage.usageHistory.length > 0 ? (
              <div className="space-y-2">
                {usage.usageHistory.map((record, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {record.action}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(record.date).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {record.model}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                暂无使用记录
              </div>
            )}
          </div>

          {/* 简化的状态提示 */}
          {usage?.remaining === 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ 当前余额为0，请充值后继续使用
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}