// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { applyDocumentSeo } from '../applyDocumentSeo';
import { HOME_ROUTE, SEO_ROUTES, canonicalUrl, seoRouteForPath } from '../routes';

describe('route SEO metadata', () => {
  it('gives every public route a distinct title, description, and self canonical', () => {
    const publicRoutes = SEO_ROUTES.filter((route) => route.id !== 'not-found');
    const titles = new Set(publicRoutes.map((route) => route.title));
    const descriptions = new Set(publicRoutes.map((route) => route.description));
    expect(titles.size).toBe(publicRoutes.length);
    expect(descriptions.size).toBe(publicRoutes.length);

    for (const route of publicRoutes) {
      const canonical = canonicalUrl(route);
      expect(canonical).toBe(
        route.path === '/' ? 'https://json-link.pages.dev/' : `https://json-link.pages.dev${route.path}`,
      );
      expect(route.h1.length).toBeGreaterThan(0);
    }
  });

  it('does not canonicalize unknown pages to the homepage', () => {
    const missing = seoRouteForPath('/does-not-exist');
    expect(missing.id).toBe('not-found');
    expect(canonicalUrl(missing)).toBeNull();
    expect(missing.robots).toContain('noindex');
  });

  it('maps devtool subpaths back onto the public routes', () => {
    expect(seoRouteForPath('/__jsonlink/docs').id).toBe('docs');
    expect(seoRouteForPath('/about/').id).toBe('about');
  });

  it('writes the matching title, description, and canonical into the document', () => {
    document.head.innerHTML = `
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
    `;

    applyDocumentSeo('/docs');

    const docs = SEO_ROUTES.find((route) => route.id === 'docs')!;
    expect(document.title).toBe(docs.title);
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(docs.description);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://json-link.pages.dev/docs',
    );
    expect(document.head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://json-link.pages.dev/docs',
    );

    applyDocumentSeo('/404');
    expect(document.title).toBe('Page not found — JSON Link');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('noindex');
    expect(HOME_ROUTE.h1).toBe('Translate your app without breaking it.');
  });
});
