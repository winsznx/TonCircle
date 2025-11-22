import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'disable-host-check',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Allow all hosts for tunneling (ngrok, cloudflare, etc.)
          req.headers.host = 'localhost:3001';
          next();
        });
      }
    }
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
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
