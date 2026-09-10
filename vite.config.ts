import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'ensure-js-mime-type',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const urlPath = req.url.split('?')[0];
            if (/\.(js|mjs|ts|tsx)$/.test(urlPath)) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            }
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const urlPath = req.url.split('?')[0];
            if (/\.(js|mjs|ts|tsx)$/.test(urlPath)) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
});

