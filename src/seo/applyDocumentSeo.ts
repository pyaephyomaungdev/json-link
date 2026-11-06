import { canonicalUrl, seoRouteForPath, type SeoRoute } from './routes';

function setMeta(doc: Document, attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = doc.head.querySelector(selector);
  if (!content) {
    el?.parentElement?.removeChild(el);
    return;
  }
  if (!el) {
    el = doc.createElement('meta');
    el.setAttribute(attr, key);
    doc.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(doc: Document, href: string | null) {
  let el = doc.head.querySelector('link[rel="canonical"]');
  if (!href) {
    el?.parentElement?.removeChild(el);
    return;
  }
  if (!el) {
    el = doc.createElement('link');
    el.setAttribute('rel', 'canonical');
    doc.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyDocumentSeo(pathname: string, doc: Document = document) {
  const route: SeoRoute = seoRouteForPath(pathname);
  const canonical = canonicalUrl(route);
  doc.title = route.title;
  setMeta(doc, 'name', 'description', route.description);
  setMeta(doc, 'name', 'robots', route.robots);
  setCanonical(doc, canonical);
  setMeta(doc, 'property', 'og:title', route.title);
  setMeta(doc, 'property', 'og:description', route.description);
  setMeta(doc, 'property', 'og:url', canonical ?? '');
  setMeta(doc, 'name', 'twitter:title', route.title);
  setMeta(doc, 'name', 'twitter:description', route.description);
  setMeta(doc, 'name', 'twitter:url', canonical ?? '');
}
