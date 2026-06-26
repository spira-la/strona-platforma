import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          )
            return 'vendor-react';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/') ||
            id.includes('/zod/')
          )
            return 'vendor-forms';
          if (id.includes('i18next') || id.includes('react-i18next'))
            return 'vendor-i18n';
          if (id.includes('@radix-ui/')) return 'vendor-radix';
        },
      },
    },
  },
});
