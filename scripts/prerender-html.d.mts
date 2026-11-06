export function prerenderDist(distDir: string, env?: NodeJS.ProcessEnv): void;
export function renderRouteHtml(
  html: string,
  route: {
    id: string;
    path: string;
    title: string;
    description: string;
    h1: string;
    lede: string;
    robots: string;
  },
  options?: { absolutize?: boolean },
): string;
export function routeForUrl(url: string): {
  id: string;
  path: string;
  output: string;
  title: string;
  description: string;
  h1: string;
  lede: string;
  robots: string;
};
