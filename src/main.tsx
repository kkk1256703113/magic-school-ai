import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import { ResetPassword } from './components/ResetPassword'
import './i18n' // Initialize i18n
import './index.css'
import './styles/landing.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              {/* 宣传页路由 - 新增但不影响现有功能 */}
              <Route path="/welcome" element={<LandingPage />} />
              
              {/* 现有功能页始终可通过 /app 访问 */}
              <Route path="/app" element={<HomePage />} />
              
              {/* 根路径处理 - 可通过环境变量控制 */}
              <Route 
                path="/" 
                element={
                  import.meta.env.VITE_LANDING_AS_HOME === 'true' 
                    ? <LandingPage /> 
                    : <HomePage />
                } 
              />
              
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444', 
                  secondary: 'white',
                },
              },
            }}
          />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
