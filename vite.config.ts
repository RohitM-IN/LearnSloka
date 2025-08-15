import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-32x32.png',
        'favicon-96x96.png',
        'favicon-16x16.png',
        'apple-icon-180x180.png',
        'rudra.mp3',
        // optional: include all the apple-icon sizes if you want them precached
      ],
      manifest: {
        name: 'श्लोकपाठम्',
        short_name: 'Shlokpatham',
        description: 'Sanskrit shloka player with synced text',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/ms-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/apple-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.(mp3)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  }
});
