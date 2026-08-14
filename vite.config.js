import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Configuración de Vite: plugin de Vue + alias "@" hacia la carpeta src
export default defineConfig({
  base: process.env.VITE_BASE || (process.env.NODE_ENV === 'production' ? '/Auloava/' : '/'),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
    // En dev, las Netlify Functions no existen en Vite: redirige al sitio
    // desplegado para poder probar el agente. En producción esto no aplica.
    proxy: {
      '/.netlify/functions': {
        target: 'https://auloava.netlify.app',
        changeOrigin: true,
      },
    },
  },
})
