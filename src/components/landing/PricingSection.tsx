import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void
}

export const PricingSection = ({ onSelectPlan }: PricingSectionProps) => {
  const { t } = useTranslation()

  const plans = [
    {
      id: 'free',
      name: t('landing.pricing.free.name', '免费版'),
      price: t('landing.pricing.free.price', '¥0'),
      period: '',
      features: [
        t('landing.pricing.free.feature1', '每日 2 次转换'),
        t('landing.pricing.free.feature2', '基础文档格式'),
        t('landing.pricing.free.feature3', '标准处理速度'),
        t('landing.pricing.free.feature4', '社区支持')
      ],
      cta: t('landing.pricing.free.cta', '立即体验'),
      highlighted: false
    },
    {
      id: 'monthly',
      name: t('landing.pricing.monthly.name', '月度会员'),
      price: t('landing.pricing.monthly.price', '¥29'),
      period: t('landing.pricing.monthly.period', '/月'),
      badge: t('landing.pricing.monthly.badge', '最受欢迎'),
      features: [
        t('landing.pricing.monthly.feature1', '无限次转换'),
        t('landing.pricing.monthly.feature2', '所有文档格式'),
        t('landing.pricing.monthly.feature3', '优先处理'),
        t('landing.pricing.monthly.feature4', '专属客服'),
        t('landing.pricing.monthly.feature5', '高级模板')
      ],
      cta: t('landing.pricing.monthly.cta', '开始免费试用'),
      highlighted: true
    },
    {
      id: 'yearly',
      name: t('landing.pricing.yearly.name', '年度会员'),
      price: t('landing.pricing.yearly.price', '¥199'),
      period: t('landing.pricing.yearly.period', '/年'),
      badge: t('landing.pricing.yearly.badge', '省40%'),
      features: [
        t('landing.pricing.yearly.feature1', '月度会员所有权益'),
        t('landing.pricing.yearly.feature2', 'API 访问权限'),
        t('landing.pricing.yearly.feature3', '批量处理'),
        t('landing.pricing.yearly.feature4', '定制服务'),
        t('landing.pricing.yearly.feature5', '优先体验新功能')
      ],
      cta: t('landing.pricing.yearly.cta', '开始免费试用'),
      highlighted: false
    }
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('landing.pricing.title', '选择适合你的方案')}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('landing.pricing.subtitle', '透明定价，无隐藏费用')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.highlighted ? 'scale-105' : ''}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className={`relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border ${
                plan.highlighted 
                  ? 'border-purple-500 shadow-xl shadow-purple-500/20' 
                  : 'border-gray-700'
              } hover:border-gray-600 transition-all duration-300`}>
                {/* Plan name */}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div 
          className="text-center mt-12 text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p>{t('landing.pricing.guarantee', '30 天退款保证 · 随时可以取消 · 安全支付')}</p>
        </motion.div>
      </div>
    </section>
  )
}