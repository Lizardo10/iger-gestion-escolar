import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'babylon-vendor': ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/gui'],
          'utils-vendor': ['idb', 'workbox-window', 'axios', 'zustand'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});


