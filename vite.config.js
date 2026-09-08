import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_BASE || 'http://localhost:3000').replace(/\/$/, '')

  return {
    plugins: [tailwindcss(), react()],
    optimizeDeps: {
      exclude: ['apexcharts'],
    },
    server: {
      proxy: {
        // File bukti disimpan di backend; proxy agar /uploads di dev tidak kena 404 SPA
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
