import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Change default port from 5173 to avoid conflicts
    port: 5179,
    // Auto-open browser on server start
    open: true,
    // Allow external connections (useful for testing on mobile/other devices)
    host: true,
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
