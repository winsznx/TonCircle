import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    strictPort: false,
    hmr: false, // Disable HMR for cloudflare tunnel compatibility
    allowedHosts: ['.trycloudflare.com', 'jovanni-unpredicted-mournfully.ngrok-free.dev']
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
