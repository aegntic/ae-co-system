import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      // PWA Support
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: '4site.pro - GitHub to Website Generator',
          short_name: '4site.pro',
          theme_color: '#8B5CF6',
          background_color: '#0F172A',
          display: 'standalone',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      // Sentry Error Tracking
      mode === 'production' && sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: '4sitepro',
        project: 'frontend',
        release: {
          name: env.VITE_BUILD_VERSION
        }
      })
    ].filter(Boolean),
    
    build: {
      // Production optimizations
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'utils': ['axios', 'date-fns', 'uuid']
          }
        }
      },
      sourcemap: true, // For error tracking
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    
    server: {
      port: 5173,
      host: true
    },
    
    define: {
      __BUILD_VERSION__: JSON.stringify(env.VITE_BUILD_VERSION),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  };
});