import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Identifies each build: the GitHub commit SHA when built by GitHub Actions
const BUILD_ID = (process.env.GITHUB_SHA || `local-${Date.now()}`).slice(0, 12);

export default defineConfig(() => {
  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(BUILD_ID)
    },
    plugins: [
      react(),
      {
        // Publishes /version.json so open pages can detect a new deploy and reload themselves
        name: 'emit-version-json',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({ buildId: BUILD_ID, builtAt: new Date().toISOString() })
          });
        }
      },
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Rotina.ai - Sua Vida Acompanhada com Clareza',
          short_name: 'Rotina.ai',
          description: 'Assistente pessoal e de organização familiar para rotinas, agenda, hábitos e acompanhamento de saúde.',
          theme_color: '#FAF8F5',
          background_color: '#FDFBF7',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Never serve the SPA shell for Firebase reserved URLs (Google sign-in handler) or API calls
          navigateFallbackDenylist: [/^\/__\//, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {}
    }
  };
});
