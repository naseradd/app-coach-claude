import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icon-192.svg',
        'icon-512.svg',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'Coach Claude',
        short_name: 'Coach',
        description: 'Personal AI fitness coach',
        theme_color: '#C8553D',
        background_color: '#F4F1EC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Don't let SW catch server-side routes — must hit network so the
        // server returns its real response (HTML form, JSON, etc.) rather
        // than the cached SPA index.html.
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/mcp/,
          /^\/health/,
          /^\/authorize/,
          /^\/token/,
          /^\/register/,
          /^\/\.well-known\//,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/mcp') ||
              url.pathname.startsWith('/authorize') ||
              url.pathname.startsWith('/token') ||
              url.pathname.startsWith('/register') ||
              url.pathname.startsWith('/.well-known/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/mcp': 'http://localhost:8080',
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor bundles so route chunks stay small and the
          // main entry contains only app boot + router.
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['motion', 'motion/react'],
          icons: ['lucide-react'],
          state: ['zustand', 'zod'],
        },
      },
    },
  },
});
