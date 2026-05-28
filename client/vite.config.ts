import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached aggressively by browsers
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Heavy chart lib in its own chunk
          'vendor-recharts': ['recharts'],
          // Axios + Zustand state
          'vendor-core': ['axios', 'zustand'],
          // PDF export (jsPDF) — only loaded when printing
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
    // Increase chunk size warning threshold
    chunkSizeWarningLimit: 600,
  },
})
