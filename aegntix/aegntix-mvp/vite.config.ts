import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './web', // This path is relative to aegntix/aegntix-mvp/
  build: {
    outDir: '../dist', // This path is relative to aegntix/aegntix-mvp/web/
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './web/src'), // Relative to aegntix/aegntix-mvp/
      '@shared': path.resolve(__dirname, './src'), // Relative to aegntix/aegntix-mvp/
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3005',
        ws: true,
      },
    },
  },
});
