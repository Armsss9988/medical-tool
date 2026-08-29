import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    alias: {
      '@domain': path.resolve(import.meta.dirname, '../../packages/shared/src/domain'),
      '@infra': path.resolve(import.meta.dirname, './src/infrastructure'),
      '@data': path.resolve(import.meta.dirname, '../../packages/shared/src/data'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@assets': path.resolve(import.meta.dirname, './src/assets')
    }
  },
  envDir: '../..',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0
  }
});