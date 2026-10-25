import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routeData from '../src/seo/routes.json' with { type: 'json' };
import { ROBOTS_DISALLOW, shouldNoindexBuild } from '../functions/indexing.js';

const ORIGIN = routeData.origin;

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');
}

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function routeForUrl(url) {
  const pathname = String(url || '/').split('?')[0].split('#')[0];
  let path = pathname || '/';
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (path === '/index.html') path = '/';
  if (path === '/__jsonlink') path = '/';
  if (path.startsWith('/__jsonlink/')) path = path.slice('/__jsonlink'.length) || '/';
  return (
    routeData.routes.find((route) => route.path === path) ??
    routeData.routes.find((route) => route.id === 'not-found')
  );
}

export function canonicalUrl(route) {
  if (route.id === 'not-found') return null;
  if (route.path === '/') return `${ORIGIN}/`;
  return `${ORIGIN}${route.path}`;
}

function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`SEO prerender could not find ${label}`);
  }
  return html.replace(pattern, replacement);
}

function upsertMetaName(html, name, content) {
  const pattern = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*/?>`, 'i');
  if (!content) return html.replace(pattern, '');
  const tag = `<meta name="${name}" content="${escapeAttr(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertMetaProperty(html, property, content) {
  const pattern = new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]*"\\s*/?>`, 'i');
  if (!content) {
    return html.replace(pattern, '');
  }
  const tag = `<meta property="${property}" content="${escapeAttr(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  if (!href) return html.replace(pattern, '');
  const tag = `<link rel="canonical" href="${escapeAttr(href)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function jsonLdFor(route) {
  const canonical = canonicalUrl(route);
  if (!canonical) return '';
  if (route.id === 'home') {
    return `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "JSON Link",
      "url": ${JSON.stringify(canonical)},
      "description": ${JSON.stringify(route.description)},
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "author": {
        "@type": "Person",
        "name": "Pyae Phyo Maung",
        "url": "https://github.com/pyaephyomaungdev"
      },
      "featureList": [
        "In-browser spreadsheet for JSON, Flutter ARB, Android XML, iOS .strings, Excel, and CSV",
        "Placeholder chips for tokens such as {count} and %1$s, with a linter that flags missing ones",
        "Optional AI translation through your own OpenRouter key",
        "Myanmar Zawgyi and Unicode conversion",
        "Files stay in the browser unless you turn on AI translation or GitHub sync"
      ]
    }
    </script>`;
  }
  const page = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: route.title,
    url: canonical,
    description: route.description,
    isPartOf: { '@type': 'WebSite', name: 'JSON Link', url: `${ORIGIN}/` },
  };
  return `<script type="application/ld+json">\n    ${JSON.stringify(page)}\n    </script>`;
}

function fallbackMarkup(route) {
  return `<main class="seo-hero"><h1>${escapeText(route.h1)}</h1><p>${escapeText(route.lede)}</p></main>`;
}

export function absolutizeAssetUrls(html) {
  return html.replaceAll('src="./', 'src="/').replaceAll('href="./', 'href="/');
}

export function renderRouteHtml(html, route, options = {}) {
  const canonical = canonicalUrl(route);
  let next = html;
  next = replaceOnce(next, /<title>[^<]*<\/title>/i, `<title>${escapeText(route.title)}</title>`, 'title');
  next = upsertMetaName(next, 'description', route.description);
  next = upsertMetaName(next, 'robots', route.robots);
  next = upsertCanonical(next, canonical);
  next = upsertMetaProperty(next, 'og:title', route.title);
  next = upsertMetaProperty(next, 'og:description', route.description);
  next = upsertMetaProperty(next, 'og:url', canonical ?? '');
  next = upsertMetaName(next, 'twitter:title', route.title);
  next = upsertMetaName(next, 'twitter:description', route.description);
  next = upsertMetaName(next, 'twitter:url', canonical ?? '');
  next = next.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, jsonLdFor(route));
  next = replaceOnce(
    next,
    /<div id="root">[\s\S]*?<\/div>/,
    `<div id="root">${fallbackMarkup(route)}</div>`,
    '#root',
  );
  if (options.absolutize) next = absolutizeAssetUrls(next);
  return next;
}

function patchHeaders(headers, noindex) {
  const cleaned = headers.replace(/^[ \t]*X-Robots-Tag:.*\n/gm, '');
  if (!noindex) return cleaned;
  if (cleaned.includes('/*')) {
    return cleaned.replace('/*\n', '/*\n  X-Robots-Tag: noindex, nofollow\n');
  }
  return `${cleaned.trim()}\n\n/*\n  X-Robots-Tag: noindex, nofollow\n`;
}

export function prerenderDist(distDir, env = process.env) {
  const indexPath = path.join(distDir, 'index.html');
  const built = fs.readFileSync(indexPath, 'utf8');
  const noindex = shouldNoindexBuild(env);

  for (const route of routeData.routes) {
    const robots = noindex ? 'noindex, nofollow' : route.robots;
    const html = renderRouteHtml(built, { ...route, robots }, { absolutize: route.output !== 'index.html' });
    const target = path.join(distDir, route.output);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html);
  }

  const redirectsPath = path.join(distDir, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    const redirects = fs.readFileSync(redirectsPath, 'utf8');
    if (/^\s*\*\s+\/index\.html\s+200/m.test(redirects)) {
      throw new Error('dist/_redirects still rewrites every URL to index.html');
    }
  }

  if (noindex) {
    fs.writeFileSync(path.join(distDir, 'robots.txt'), ROBOTS_DISALLOW);
    const headersPath = path.join(distDir, '_headers');
    if (fs.existsSync(headersPath)) {
      fs.writeFileSync(headersPath, patchHeaders(fs.readFileSync(headersPath, 'utf8'), true));
    }
  }

  const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter((name) => name.endsWith('.css'));
  const bundledCss = cssFiles.map((name) => fs.readFileSync(path.join(distDir, 'assets', name), 'utf8')).join('\n');
  const homeHtml = fs.readFileSync(indexPath, 'utf8');
  if (homeHtml.includes('fonts.googleapis.com') || bundledCss.includes('fonts.googleapis.com')) {
    throw new Error('Production build still references fonts.googleapis.com');
  }
  if (!bundledCss.includes('inter-latin-700.woff2')) {
    throw new Error('Production CSS is missing the self-hosted Inter font');
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  prerenderDist(distDir, process.env);
}
