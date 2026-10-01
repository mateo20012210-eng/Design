import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// BASE_PATH is set by the GitHub Actions deploy workflow to "/<repo-name>/".
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'IB Interview Prep',
        short_name: 'IB Prep',
        description:
          'Investment banking interview flashcards with spaced repetition, plus a weekly Market Pulse of global deal activity.',
        theme_color: '#0f1f3d',
        background_color: '#f6f7fb',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        id: base,
        lang: 'en',
        categories: ['education', 'finance', 'productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything built by Vite (app shell, bundled question data) is precached: fully offline after first load.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\/news\//],
        runtimeCaching: [
          {
            // Weekly Market Pulse editions: show cached copy immediately, refresh in the background.
            urlPattern: ({ url }) => url.pathname.includes('/news/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'market-pulse-editions',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/')) return 'questions';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'vendor';
        },
      },
    },
  },
});
