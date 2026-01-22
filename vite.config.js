import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://87.106.96.173',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://87.106.96.173',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
