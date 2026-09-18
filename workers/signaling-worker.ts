/**
 * Cloudflare Workers + Durable Objects WebSocket Signaling Server for JSON Link
 * Implements y-webrtc signaling protocol (subscribe, unsubscribe, publish, ping/pong).
 *
 * Free Tier Eligible:
 * - 100,000 requests/day
 * - Durable Objects included on free tier
 * - Deploy via `npx wrangler deploy`
 */

export interface Env {
  SIGNALING_ROOMS: DurableObjectNamespace;
}

export class SignalingRoom {
  state: DurableObjectState;
  sessions: Map<WebSocket, Set<string>>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(_request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    const subscribedTopics = new Set<string>();
    this.sessions.set(server, subscribedTopics);

    server.addEventListener('message', (event) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
        const message = JSON.parse(raw);

        if (!message || !message.type) return;

        switch (message.type) {
          case 'subscribe':
            (message.topics || []).forEach((topic: string) => {
              subscribedTopics.add(topic);
            });
            break;
          case 'unsubscribe':
            (message.topics || []).forEach((topic: string) => {
              subscribedTopics.delete(topic);
            });
            break;
          case 'publish':
            if (message.topic) {
              let count = 0;
              for (const [ws, subs] of this.sessions.entries()) {
                if (subs.has(message.topic)) {
                  count++;
                  try {
                    ws.send(JSON.stringify(message));
                  } catch {
                    ws.close();
                  }
                }
              }
              message.clients = count;
            }
            break;
          case 'ping':
            server.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch {
        // Ignore malformed payloads
      }
    });

    const closeHandler = () => {
      this.sessions.delete(server);
    };
    server.addEventListener('close', closeHandler);
    server.addEventListener('error', closeHandler);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response(
        'JSON Link P2P WebRTC Signaling Server (Cloudflare Worker Tier)\nStatus: Healthy',
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    const id = env.SIGNALING_ROOMS.idFromName('global-signaling-relay');
    const roomObject = env.SIGNALING_ROOMS.get(id);
    return roomObject.fetch(request);
  },
};
