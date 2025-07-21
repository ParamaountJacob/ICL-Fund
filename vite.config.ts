import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5179,
    host: true,
    strictPort: false,
    fs: {
      strict: false
    },
    hmr: {
      port: 5180
    }
  },
  build: {
    copyPublicDir: true,
    assetsDir: 'assets'
  }
});
