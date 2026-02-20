/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
  server: {
    proxy: {
      // Optional: proxy Firebase paths. Not required for popup auth; can remove if you don't need it.
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
