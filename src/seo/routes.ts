import routeData from './routes.json';

export const PROD_ORIGIN = routeData.origin;

export interface SeoRoute {
  id: string;
  path: string;
  output: string;
  title: string;
  description: string;
  h1: string;
  lede: string;
  robots: string;
}

export const SEO_ROUTES: SeoRoute[] = routeData.routes;

export const HOME_ROUTE = SEO_ROUTES.find((route) => route.id === 'home')!;

export function canonicalUrl(route: SeoRoute): string | null {
  if (route.id === 'not-found') return null;
  if (route.path === '/') return `${PROD_ORIGIN}/`;
  return `${PROD_ORIGIN}${route.path}`;
}

function normalizePath(pathname: string): string {
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const noQuery = withSlash.split('?')[0].split('#')[0];
  if (noQuery.length > 1 && noQuery.endsWith('/')) return noQuery.slice(0, -1);
  return noQuery || '/';
}

export function seoRouteForPath(pathname: string): SeoRoute {
  let path = normalizePath(pathname);
  if (path === '/index.html') path = '/';
  if (path === '/__jsonlink') path = '/';
  if (path.startsWith('/__jsonlink/')) path = path.slice('/__jsonlink'.length) || '/';
  const match = SEO_ROUTES.find((route) => route.path === path);
  return match ?? SEO_ROUTES.find((route) => route.id === 'not-found')!;
}
