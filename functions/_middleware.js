import { isProductionHost, ROBOTS_DISALLOW } from './indexing.js';

class RobotsMeta {
  element(element) {
    element.setAttribute('content', 'noindex, nofollow');
  }
}

function withNoindex(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  const wrapped = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  const contentType = headers.get('content-type') || '';
  const Rewriter = globalThis.HTMLRewriter;
  if (!Rewriter || !contentType.includes('text/html') || !wrapped.body) return wrapped;
  return new Rewriter().on('meta[name="robots"]', new RobotsMeta()).transform(wrapped);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const production = isProductionHost(url.hostname);

  if (!production && url.pathname === '/robots.txt') {
    return new Response(ROBOTS_DISALLOW, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
      },
    });
  }

  const response = await context.next();
  if (production) return response;
  return withNoindex(response);
}
