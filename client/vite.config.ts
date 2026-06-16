import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:5001\/api\/v1\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https?:\/\/business-tracker-xi\.vercel\.app\/api\/v1\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache-prod',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: "BusinessTracker Terminal",
        short_name: "BusinessTracker",
        description: "Multi-Tenant Business Terminal for tracking pipelines, commission, and expenses.",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        icons: [
          {
            src: "/favicon.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-core': ['axios', 'zustand'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
