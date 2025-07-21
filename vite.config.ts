import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Ensure proper handling of assets
    fs: {
      strict: false
    }
  },
  build: {
    // Ensure public assets are properly copied
    copyPublicDir: true,
    assetsDir: 'assets'
  }
});
