import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el sitio funciona en la raíz (Vercel) y en /terapia/ (GitHub Pages).
  // Como usa HashRouter, no hace falta reescribir rutas en el servidor.
  base: './',
  // Dos páginas: el GDD (index.html) y el juego solo, como se va a ver en la versión final (juego/index.html)
  build: {
    rollupOptions: {
      input: {
        gdd: 'index.html',
        juego: 'juego/index.html',
      },
    },
  },
})
