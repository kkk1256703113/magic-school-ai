import { X } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  if (!isOpen) return null

  const plans = [
    {
      name: '月会员',
      price: '¥29',
      period: '/月',
      description: '按月订阅，灵活便捷',
      features: [
        '无限制对话次数',
        '优先访问新功能',
        '24/7 客户支持'
      ],
      highlighted: false
    },
    {
      name: '季会员',
      price: '¥69',
      period: '/3个月',
      description: '3个月套餐，省20%',
      features: [
        '月会员所有功能',
        '专属客服通道',
        '高级模型优先体验'
      ],
      highlighted: true,
      savings: '节省¥18'
    },
    {
      name: '年会员',
      price: '¥199',
      period: '/年',
      description: '12个月套餐，省40%',
      features: [
        '季会员所有功能',
        '专属定制服务',
        '年度功能路线图预览'
      ],
      highlighted: false,
      savings: '节省¥149'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            选择订阅套餐
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                plan.highlighted
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-4 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                  推荐
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.period}
                </span>
                {plan.savings && (
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {plan.savings}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                选择此套餐
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          支持支付宝、微信支付、银行卡 · 随时可取消订阅
        </div>
      </div>
    </div>
  )
}