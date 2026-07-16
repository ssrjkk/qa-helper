import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ui-vendor': ['react', 'react-dom', 'framer-motion'],
          'db-vendor': ['sql.js'],
          'utils-vendor': ['jszip', 'jspdf'],
        },
      },
    },
  },
})
