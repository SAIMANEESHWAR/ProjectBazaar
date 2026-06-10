import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    // Prevent Vercel build OOM by avoiding huge production sourcemaps.
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          editor: ['@monaco-editor/react'],
        },
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://codexcareer.com',
        changeOrigin: true,
      },
      // ATS Lambda: avoids browser CORS errors when developing on localhost:5173
      '/dev-api/ats-scorer': {
        target: 'https://8ysn1do8kb.execute-api.ap-south-2.amazonaws.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/dev-api\/ats-scorer/, '/default/ats_scorer_handler'),
      },
      // Fix My Resume Lambda — fix_resume_handler-API (55if5jjozg)
      '/dev-api/fix-resume': {
        target: 'https://55if5jjozg.execute-api.ap-south-2.amazonaws.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/dev-api\/fix-resume/, '/default/fix_resume_handler'),
      },
      // Live Mock Interview results API (g20pktgtz9)
      '/dev-api/live-mock-interview': {
        target: 'https://g20pktgtz9.execute-api.ap-south-2.amazonaws.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/dev-api\/live-mock-interview/, '/default/LiveMockinterview'),
      },
    },
  },
}))
