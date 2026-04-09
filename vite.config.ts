import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Same as process.env.VITE_API_GATEWAY_URL once Vite loads .env* files
  const gateway = (env.VITE_API_GATEWAY_URL || process.env.VITE_API_GATEWAY_URL || '').trim()

  if ((command === 'serve' || command === 'preview') && !gateway) {
    console.warn(
      '[vite] Set VITE_API_GATEWAY_URL in .env / .env.local so /api/* can proxy to API Gateway.'
    )
  }

  const apiProxy = gateway
    ? {
        '/api': {
          target: gateway,
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api/, '') || '/',
        },
      }
    : {}

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    build: {
      sourcemap: true,
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
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
  }
})
