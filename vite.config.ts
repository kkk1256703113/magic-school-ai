import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/replicate': {
        target: 'https://api.replicate.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/replicate/, ''),
        headers: {
          'Origin': 'https://api.replicate.com'
        }
      },
      '/api': {
        target: 'http://45.77.86.20:3001',
        changeOrigin: true,
        secure: false,
        headers: {
          'Origin': 'http://localhost:3000'
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
