import path from 'path';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      plugins: [
        react({
          // Enable React optimizations
          fastRefresh: true,
          babel: {
            plugins: mode === 'production' ? [['babel-plugin-transform-remove-console']] : []
          }
        }),
        
        // Advanced vendor chunk splitting
        splitVendorChunkPlugin(),
        
        // Bundle analyzer (only in build mode)
        mode === 'production' && visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true
        }),
        
        
        // Enhanced Brotli compression
        mode === 'production' && viteCompression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 512, // Lower threshold for better compression coverage
          compressionOptions: {
            level: 11, // Maximum compression
            chunkSize: 32 * 1024
          }
        }),
        
        // Enhanced Gzip compression  
        mode === 'production' && viteCompression({
          algorithm: 'gzip',
          ext: '.gz',
          threshold: 512,
          compressionOptions: {
            level: 9,
            memLevel: 9
          }
        }),
        mode === 'production' && viteCompression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 1024
        }),
        
        // HTML optimization
        createHtmlPlugin({
          minify: mode === 'production' ? {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true
          } : false
        })
      ].filter(Boolean),
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.FAL_API_KEY': JSON.stringify(env.FAL_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info']
          },
          mangle: {
            safari10: true
          }
        },
        rollupOptions: {
          output: {
            // Advanced manual chunking strategy
            manualChunks: (id) => {
              // Vendor chunks (critical third-party)
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('framer-motion')) {
                  return 'animation-vendor';
                }
                if (id.includes('@google/generative-ai') || id.includes('openai')) {
                  return 'ai-vendor';
                }
                if (id.includes('lucide-react') || id.includes('gsap')) {
                  return 'ui-vendor';
                }
                if (id.includes('@supabase') || id.includes('cors') || id.includes('express')) {
                  return 'backend-vendor';
                }
                // All other node_modules go to vendor
                return 'vendor';
              }
              
              // Component chunks (lazy-loadable)
              if (id.includes('/components/templates/')) {
                return 'templates';
              }
              if (id.includes('/components/premium/')) {
                return 'premium';
              }
              if (id.includes('/components/dashboard/')) {
                return 'dashboard';
              }
              if (id.includes('/components/admin/')) {
                return 'admin';
              }
              
              // Service chunks
              if (id.includes('/services/') && !id.includes('geminiService')) {
                return 'services';
              }
              if (id.includes('geminiService') || id.includes('aiOrchestrator')) {
                return 'ai-services';
              }
              
              // Hook chunks
              if (id.includes('/hooks/')) {
                return 'hooks';
              }
              
              // Context and state management
              if (id.includes('/contexts/') || id.includes('AuthContext')) {
                return 'contexts';
              }
              
              // Utilities
              if (id.includes('/utils/')) {
                return 'utils';
              }
            },
            
            // Optimize chunk file names
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
              return `js/[name]-[hash].js`;
            },
            entryFileNames: 'js/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              let extType = info[info.length - 1];
              if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
                extType = 'media';
              } else if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
                extType = 'images';
              } else if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
                extType = 'fonts';
              }
              return `${extType}/[name]-[hash].[ext]`;
            }
          },
          
          // Tree shaking optimizations
          treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false
          }
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: mode === 'development' ? true : 'hidden',
        assetsInlineLimit: 8192, // Inline assets up to 8KB
        cssCodeSplit: true,
        reportCompressedSize: false, // Faster builds
        
        // Advanced minification (already defined above)
        write: true,
        emptyOutDir: true
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'framer-motion',
          'lucide-react',
          '@google/generative-ai',
          'marked'
        ],
        exclude: [
          // Heavy components for lazy loading
          './components/templates/SimplePreviewTemplate',
          './components/templates/CreativeProjectTemplate',
          './components/templates/TechProjectTemplate',
          './components/error/ErrorBoundary',
          './components/premium/PremiumGeneratorModal',
          './components/dashboard/AnalyticsDashboard',
          './components/admin/CommissionDashboard'
        ],
        
        // Force optimization for problematic packages
        force: ['react', 'react-dom', 'framer-motion'],
        
        // Pre-bundling settings
        esbuildOptions: {
          target: 'esnext',
          platform: 'browser',
          format: 'esm'
        }
      },
      server: {
        port: 5173,
        strictPort: false,
        host: true,
        open: false,
        hmr: {
          overlay: true,
        }
      },
      preview: {
        port: 5273,
        strictPort: false,
      },
      esbuild: {
        // Remove debugger statements in production
        drop: mode === 'production' ? ['debugger', 'console'] : [],
        // Tree shaking for better optimization
        treeShaking: true,
        // Advanced optimizations
        legalComments: 'none',
        minifyIdentifiers: mode === 'production',
        minifySyntax: mode === 'production',
        minifyWhitespace: mode === 'production',
        target: 'esnext'
      },
      
      // Advanced experimental features
      experimental: {
        renderBuiltUrl(filename) {
          // Custom URL building for CDN deployment
          return `https://cdn.4site.pro/assets/${filename}`;
        }
      }
    };
});
