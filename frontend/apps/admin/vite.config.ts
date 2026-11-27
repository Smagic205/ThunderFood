import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, '../../..'),
  server: { port: 5174 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
