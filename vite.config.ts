import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  base: './',
  define: {
    global: 'window',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-xlsx': ['xlsx'],
          'vendor-jszip': ['jszip'],
          'vendor-collab': ['yjs', 'y-webrtc'],
          'vendor-icons': ['lucide-react'],
          'vendor-radix': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
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
    {
      name: 'yjs-signaling',
      async configureServer(server) {
        const { WebSocketServer, WebSocket } = await import('ws');
        const wss = new WebSocketServer({ noServer: true });
        const topics = new Map<string, Set<InstanceType<typeof WebSocket>>>();

        const send = (conn: InstanceType<typeof WebSocket>, message: unknown) => {
          if (conn.readyState === WebSocket.OPEN) {
            try {
              conn.send(JSON.stringify(message));
            } catch {
              conn.close();
            }
          }
        };

        wss.on('connection', (conn) => {
          const subscribedTopics = new Set<string>();

          conn.on('close', () => {
            subscribedTopics.forEach((topicName) => {
              const subs = topics.get(topicName);
              if (subs) {
                subs.delete(conn);
                if (subs.size === 0) {
                  topics.delete(topicName);
                }
              }
            });
            subscribedTopics.clear();
          });

          conn.on('message', (raw) => {
            try {
              const message = JSON.parse(raw.toString());
              if (message && message.type) {
                switch (message.type) {
                  case 'subscribe':
                    (message.topics || []).forEach((topicName: string) => {
                      if (typeof topicName === 'string') {
                        let subs = topics.get(topicName);
                        if (!subs) {
                          subs = new Set();
                          topics.set(topicName, subs);
                        }
                        subs.add(conn);
                        subscribedTopics.add(topicName);
                      }
                    });
                    break;
                  case 'unsubscribe':
                    (message.topics || []).forEach((topicName: string) => {
                      const subs = topics.get(topicName);
                      if (subs) {
                        subs.delete(conn);
                      }
                    });
                    break;
                  case 'publish':
                    if (message.topic) {
                      const receivers = topics.get(message.topic);
                      if (receivers) {
                        message.clients = receivers.size;
                        receivers.forEach((receiver) => send(receiver, message));
                      }
                    }
                    break;
                  case 'ping':
                    send(conn, { type: 'pong' });
                    break;
                }
              }
            } catch {
              // ignore malformed payloads
            }
          });
        });

        server.httpServer?.on('upgrade', (req, socket, head) => {
          const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          if (url.pathname === '/_y_signaling' || url.pathname === '/signaling') {
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit('connection', ws, req);
            });
          }
        });
      },
      async configurePreviewServer(server) {
        const { WebSocketServer, WebSocket } = await import('ws');
        const wss = new WebSocketServer({ noServer: true });
        const topics = new Map<string, Set<InstanceType<typeof WebSocket>>>();

        const send = (conn: InstanceType<typeof WebSocket>, message: unknown) => {
          if (conn.readyState === WebSocket.OPEN) {
            try {
              conn.send(JSON.stringify(message));
            } catch {
              conn.close();
            }
          }
        };

        wss.on('connection', (conn) => {
          const subscribedTopics = new Set<string>();

          conn.on('close', () => {
            subscribedTopics.forEach((topicName) => {
              const subs = topics.get(topicName);
              if (subs) {
                subs.delete(conn);
                if (subs.size === 0) {
                  topics.delete(topicName);
                }
              }
            });
            subscribedTopics.clear();
          });

          conn.on('message', (raw) => {
            try {
              const message = JSON.parse(raw.toString());
              if (message && message.type) {
                switch (message.type) {
                  case 'subscribe':
                    (message.topics || []).forEach((topicName: string) => {
                      if (typeof topicName === 'string') {
                        let subs = topics.get(topicName);
                        if (!subs) {
                          subs = new Set();
                          topics.set(topicName, subs);
                        }
                        subs.add(conn);
                        subscribedTopics.add(topicName);
                      }
                    });
                    break;
                  case 'unsubscribe':
                    (message.topics || []).forEach((topicName: string) => {
                      const subs = topics.get(topicName);
                      if (subs) {
                        subs.delete(conn);
                      }
                    });
                    break;
                  case 'publish':
                    if (message.topic) {
                      const receivers = topics.get(message.topic);
                      if (receivers) {
                        message.clients = receivers.size;
                        receivers.forEach((receiver) => send(receiver, message));
                      }
                    }
                    break;
                  case 'ping':
                    send(conn, { type: 'pong' });
                    break;
                }
              }
            } catch {
              // ignore malformed payloads
            }
          });
        });

        server.httpServer?.on('upgrade', (req, socket, head) => {
          const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          if (url.pathname === '/_y_signaling' || url.pathname === '/signaling') {
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit('connection', ws, req);
            });
          }
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

