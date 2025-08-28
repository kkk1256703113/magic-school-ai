import React, { createContext, useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

type Language = 'zh' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, options?: any) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: React.ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation()
  
  const currentLanguage = i18n.language as Language

  const setLanguage = (newLanguage: Language) => {
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  // Initialize language from localStorage or browser
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['zh', 'en'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage)
    }
  }, [i18n])

  const value = {
    language: currentLanguage,
    setLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}