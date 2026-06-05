import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Asegúrate de tener este plugin si usas v4

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})