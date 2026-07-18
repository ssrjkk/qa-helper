import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'analyze' ? [visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'workers/[name]-[hash].js',
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
      pure: ['console.info', 'console.debug'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'ui-vendor': ['react', 'react-dom', 'framer-motion'],
          'db-vendor': ['sql.js'],
          'state-vendor': ['zustand', 'immer'],
          'utils-vendor': ['jspdf'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 600,
  },
}))
