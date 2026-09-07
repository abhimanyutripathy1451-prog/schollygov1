import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      ...(process.env.TEST_MODE === 'true' ? [] : [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'logo-192.png', 'logo-512.png'],
          manifest: {
            name: 'SchollyGo',
            short_name: 'SchollyGo',
            description: 'A platform for students and partners',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: 'favicon.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'favicon.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              },
              {
                src: 'logo-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'logo-512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
            navigateFallback: 'index.html',
          }
        })
      ])
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        // Let Vite handle chunking automatically to prevent circular dependency errors
      }
    },
    server: {
      strictPort: true, // Fail if port is in use, preventing silent CORS issues
      proxy: {
        '/auth': 'http://127.0.0.1:8000',
        '/curriculum': 'http://127.0.0.1:8000',
        '/quiz': 'http://127.0.0.1:8000',
        '/assignments': 'http://127.0.0.1:8000',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/test-results/**', '**/playwright-report/**', '**/.playwright/**', '**/dev-dist/**']
      },
    },
  };
});
