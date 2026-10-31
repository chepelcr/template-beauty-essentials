import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Local development against a local management-be: TSURU_DEV_API=http://localhost:5000
// proxies /api there (same origin, so the signed requests need no CORS).
const devApi = process.env.TSURU_DEV_API;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-data': ['@tanstack/react-query', 'wouter', 'zustand'],
          'vendor-aws': ['aws-amplify', '@chepelcr/tsuru-storefront-sdk'],
        },
      },
    },
  },
  // amazon-cognito-identity-js pulls in the `buffer` polyfill, which reads
  // Node's `global`; the production build shims it, the dev pre-bundle does not.
  optimizeDeps: {
    esbuildOptions: { define: { global: 'globalThis' } },
  },
  server: {
    port: 5173,
    proxy: devApi ? { '/api': { target: devApi, changeOrigin: true } } : undefined,
  },
});
