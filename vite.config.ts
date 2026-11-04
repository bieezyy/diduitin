import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Akses langsung via Apache localhost/apps/diduitin/
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [
    react(),
    tailwindcss()
  ]
})
