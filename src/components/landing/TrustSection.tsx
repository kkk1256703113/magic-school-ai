import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Shield, Zap, Target, MessageCircle, Users, FileCheck, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export const TrustSection = () => {
  const { t } = useTranslation()
  const [counts, setCounts] = useState({ users: 0, documents: 0, satisfaction: 0 })

  useEffect(() => {
    // 数字动画效果
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    const targetCounts = { users: 10000, documents: 50000, satisfaction: 98 }
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      if (currentStep <= steps) {
        setCounts({
          users: Math.floor((targetCounts.users * currentStep) / steps),
          documents: Math.floor((targetCounts.documents * currentStep) / steps),
          satisfaction: Math.floor((targetCounts.satisfaction * currentStep) / steps)
        })
      } else {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [])

  const trustPoints = [
    {
      icon: Shield,
      title: t('landing.trust.security.title', '数据安全'),
      description: t('landing.trust.security.description', '端到端加密，您的文档绝对安全'),
      color: 'text-green-500'
    },
    {
      icon: Zap,
      title: t('landing.trust.speed.title', '处理速度'),
      description: t('landing.trust.speed.description', '平均 10 秒完成文档转换'),
      color: 'text-yellow-500'
    },
    {
      icon: Target,
      title: t('landing.trust.accuracy.title', '精准转换'),
      description: t('landing.trust.accuracy.description', '98% 的用户满意度'),
      color: 'text-blue-500'
    },
    {
      icon: MessageCircle,
      title: t('landing.trust.support.title', '专业支持'),
      description: t('landing.trust.support.description', '7×24 小时客服支持'),
      color: 'text-purple-500'
    }
  ]

  const stats = [
    {
      number: `${counts.users.toLocaleString()}+`,
      label: t('landing.trust.stats.users', '活跃用户'),
      icon: Users
    },
    {
      number: `${counts.documents.toLocaleString()}+`,
      label: t('landing.trust.stats.documents', '文档已处理'),
      icon: FileCheck
    },
    {
      number: `${counts.satisfaction}%`,
      label: t('landing.trust.stats.satisfaction', '满意度'),
      icon: TrendingUp
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('landing.trust.title', '为什么选择 Magic School AI')}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('landing.trust.subtitle', '值得信赖的 AI 文档处理平台')}
          </p>
        </motion.div>

        {/* Trust Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {trustPoints.map((point, index) => {
            const Icon = point.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4 ${point.color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{point.title}</h3>
                <p className="text-gray-400">{point.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Stats */}
        <motion.div 
          className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-2xl p-8 backdrop-blur-sm border border-gray-700"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <Icon className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}