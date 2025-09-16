import { X, ExternalLink, Gift, Zap, Coffee } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  if (!isOpen) return null

  // Ko-fi充值套餐
  const packages = [
    {
      amount: 1,
      calls: 2,
      bonus: 0,
      total: 2,
      pricePerCall: i18n.language === 'zh' ? '¥3.5' : '$0.50',
      color: 'bg-gray-100 dark:bg-gray-700'
    },
    {
      amount: 5,
      calls: 10,
      bonus: 2,
      total: 12,
      pricePerCall: i18n.language === 'zh' ? '¥2.9' : '$0.42',
      color: 'bg-blue-50 dark:bg-blue-900/20',
      badge: null
    },
    {
      amount: 10,
      calls: 20,
      bonus: 5,
      total: 25,
      pricePerCall: i18n.language === 'zh' ? '¥2.8' : '$0.40',
      color: 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
      badge: t('upgrade.kofi.popular') || 'Popular'
    },
    {
      amount: 20,
      calls: 40,
      bonus: 10,
      total: 50,
      pricePerCall: i18n.language === 'zh' ? '¥2.8' : '$0.40',
      color: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      badge: t('upgrade.kofi.bestValue') || 'Best Value'
    }
  ]

  const kofiUrl = 'https://ko-fi.com/blueli10830'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Coffee className="h-6 w-6 text-[#FF5E5B]" />
            {t('upgrade.kofi.title') || 'Support Us & Get More API Calls'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 说明信息 */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {t('upgrade.kofi.donationRewards') || 'Donation Rewards'}
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>{t('upgrade.kofi.reward1') || '💰 Every $1 = 2 permanent API calls'}</li>
              <li>{t('upgrade.kofi.reward2') || '⭐ Credits never expire'}</li>
              <li>{t('upgrade.kofi.reward3') || '🎁 Bonus credits for larger donations'}</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('upgrade.kofi.newUserPolicy') || 'New User Benefits'}
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>{t('upgrade.kofi.newUser1') || '🆓 5 free calls for new users'}</li>
              <li>{t('upgrade.kofi.newUser2') || '🎯 Test all features before paying'}</li>
              <li>{t('upgrade.kofi.newUser3') || '💎 Upgrade anytime for more calls'}</li>
            </ul>
          </div>
        </div>

        {/* Ko-fi充值套餐 */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {packages.map((pkg) => (
            <div
              key={pkg.amount}
              className={`relative rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-lg hover:scale-105 ${pkg.color}`}
            >
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  {pkg.badge}
                </div>
              )}

              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${pkg.amount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('upgrade.kofi.donation') || 'Donation'}
                </div>
              </div>

              <div className="text-center mb-3">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {pkg.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('upgrade.kofi.apiCalls') || 'API Calls'}
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    +{pkg.bonus} {t('upgrade.kofi.bonus') || 'bonus'}!
                  </div>
                )}
              </div>

              <div className="text-center mb-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {pkg.pricePerCall}/{t('upgrade.kofi.perCall') || 'call'}
                </div>
              </div>

              <a
                href={`${kofiUrl}?amount=${pkg.amount}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-[#FF5E5B] hover:bg-[#FF4E4A] text-white rounded-lg font-medium transition-colors text-center"
              >
                <span className="flex items-center justify-center gap-2">
                  ☕ {t('upgrade.kofi.supportButton') || `Support $${pkg.amount}`}
                </span>
              </a>
            </div>
          ))}
        </div>

        {/* 重要提示 */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{t('upgrade.kofi.important') || 'Important'}:</strong> {t('upgrade.kofi.useEmail') || 'Please use your registered email'}
            <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">
              ({user?.email})
            </span>
            {' '}{t('upgrade.kofi.forAutoCredit') || 'for automatic credit'}
          </p>
        </div>

        {/* 直接Ko-fi链接 */}
        <div className="text-center">
          <a
            href={kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('upgrade.kofi.visitPage') || 'Visit our Ko-fi page'}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          {t('upgrade.kofi.processingNote') || 'Credits are added automatically after payment processing (usually within 1 minute)'}
        </div>
      </div>
    </div>
  )
}