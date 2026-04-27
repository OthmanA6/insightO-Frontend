import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import path from 'path'

// تحويل رابط الملف الحالي لمسار يدعم __dirname في بيئة ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
  optimizeDeps: {
    include: ['tailwindcss-animate'],
  },
  resolve: {
    alias: {
      // الآن `@` ستشير دائماً لمجلد الـ src بدقة
      '@': path.resolve(__dirname, './src'),
    },
  },
})