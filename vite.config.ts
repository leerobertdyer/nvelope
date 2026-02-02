import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Same as production (vercel.json): auth and firebase must be same-origin so getRedirectResult() works and init.json loads.
      '/__/auth': {
        target: 'https://nvelope-3e93b.firebaseapp.com',
        changeOrigin: true,
      },
      '/__/firebase': {
        target: 'https://nvelope-3e93b.firebaseapp.com',
        changeOrigin: true,
      },
    },
  },
})
