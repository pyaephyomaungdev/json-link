import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isProductionHost, shouldNoindexBuild, ROBOTS_DISALLOW } from '../functions/indexing.js';
import { renderRouteHtml, routeForUrl } from './prerender-html.mjs';
import routeData from '../src/seo/routes.json' with { type: 'json' };

const home = routeData.routes.find((route) => route.id === 'home');

function shell() {
  return `<!doctype html>
<html><head>
<title>Old</title>
<meta name="description" content="old" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://json-link.pages.dev/" />
<meta property="og:title" content="old" />
<meta property="og:description" content="old" />
<meta property="og:url" content="https://json-link.pages.dev/" />
<meta name="twitter:title" content="old" />
<meta name="twitter:description" content="old" />
<meta name="twitter:url" content="https://json-link.pages.dev/" />
<meta property="og:image" content="https://json-link.pages.dev/og-image.png" />
<script type="application/ld+json">{ "name": "old" }</script>
</head><body>
<div id="root"><main class="seo-hero"><h1>Old</h1><p>Old</p></main></div>
<script type="module" src="./assets/index-abc.js"></script>
</body></html>`;
}

describe('indexing', () => {
  it('indexes only the production hostname', () => {
    expect(isProductionHost('json-link.pages.dev')).toBe(true);
    expect(isProductionHost('JSON-LINK.pages.dev')).toBe(true);
    expect(isProductionHost('development-json-link.pages.dev')).toBe(false);
    expect(isProductionHost('abc123.json-link.pages.dev')).toBe(false);
    expect(isProductionHost('localhost')).toBe(false);
  });

  it('noindexes Cloudflare Pages builds that are not main', () => {
    expect(shouldNoindexBuild({})).toBe(false);
    expect(shouldNoindexBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main' })).toBe(false);
    expect(shouldNoindexBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'development' })).toBe(true);
    expect(shouldNoindexBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main', JSONLINK_NOINDEX: '1' })).toBe(true);
    expect(shouldNoindexBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'development', JSONLINK_INDEXABLE: '1' })).toBe(false);
    expect(ROBOTS_DISALLOW).toContain('Disallow: /');
  });
});

describe('prerendered route html', () => {
  it('puts a unique title, description, canonical, and h1 in each route', () => {
    const seenTitles = new Set();
    for (const route of routeData.routes) {
      const html = renderRouteHtml(shell(), route, { absolutize: route.output !== 'index.html' });
      expect(html).toContain(`<title>${route.title}</title>`);
      expect(html).toContain(`content="${route.description}"`);
      expect(html).toContain(`<h1>${route.h1.replaceAll('&', '&amp;')}</h1>`);
      expect(html).toContain(route.lede);
      seenTitles.add(route.title);
      if (route.id === 'not-found') {
        expect(html).not.toContain('rel="canonical"');
        expect(html).not.toContain('application/ld+json');
        expect(html).toContain('noindex');
      } else {
        const canonical = route.path === '/' ? 'https://json-link.pages.dev/' : `https://json-link.pages.dev${route.path}`;
        expect(html).toContain(`<link rel="canonical" href="${canonical}" />`);
        expect(html).toContain(`property="og:url" content="${canonical}"`);
      }
      if (route.output !== 'index.html') {
        expect(html).toContain('src="/assets/index-abc.js"');
      } else {
        expect(html).toContain('src="./assets/index-abc.js"');
      }
    }
    expect(seenTitles.size).toBe(routeData.routes.length);
  });

  it('resolves unknown urls to the 404 route', () => {
    expect(routeForUrl('/does-not-exist').id).toBe('not-found');
    expect(routeForUrl('/assets/does-not-exist.js').id).toBe('not-found');
    expect(routeForUrl('/docs').id).toBe('docs');
  });
});

describe('source html', () => {
  it('ships the hero in index.html and does not request Google Fonts', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    expect(html).toContain(`<h1>${home.h1}</h1>`);
    expect(html).toContain(home.lede);
    expect(html).toContain(`<title>${home.title}</title>`);
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
    const redirects = fs.readFileSync(path.resolve('public/_redirects'), 'utf8');
    expect(redirects).not.toMatch(/^\s*\*\s+\/index\.html\s+200/m);
    expect(redirects).toContain('/about     /about.html    200');
  });

  it('writes disallowing robots when a non-production build asks for it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonlink-seo-'));
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'assets', 'index-abc.css'), "url('/fonts/inter-latin-700.woff2')");
    fs.writeFileSync(path.join(dir, 'index.html'), shell());
    fs.writeFileSync(path.join(dir, '_redirects'), '/about     /about.html    200\n');
    fs.writeFileSync(path.join(dir, 'robots.txt'), 'User-agent: *\nAllow: /\n');
    fs.writeFileSync(path.join(dir, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n');
    return import('./prerender-html.mjs').then(({ prerenderDist }) => {
      prerenderDist(dir, { CF_PAGES: '1', CF_PAGES_BRANCH: 'development' });
      expect(fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8')).toContain('Disallow: /');
      expect(fs.readFileSync(path.join(dir, '_headers'), 'utf8')).toContain('X-Robots-Tag: noindex, nofollow');
      expect(fs.existsSync(path.join(dir, 'about.html'))).toBe(true);
      expect(fs.existsSync(path.join(dir, '404.html'))).toBe(true);
      const about = fs.readFileSync(path.join(dir, 'about.html'), 'utf8');
      expect(about).toContain('noindex, nofollow');
      expect(about).toContain('https://json-link.pages.dev/about');
      fs.rmSync(dir, { recursive: true, force: true });
    });
  });
});
