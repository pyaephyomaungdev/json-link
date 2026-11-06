/** Production hostname that is allowed to be indexed. */
export const PRODUCTION_HOSTS = ['json-link.pages.dev'];

export const ROBOTS_INDEXABLE = `User-agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=no

Sitemap: https://json-link.pages.dev/sitemap.xml
`;

export const ROBOTS_DISALLOW = `User-agent: *
Disallow: /
`;

export function isProductionHost(hostname) {
  const host = String(hostname || '')
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
  return PRODUCTION_HOSTS.includes(host);
}

/**
 * Non-production Cloudflare Pages builds (preview URLs and the development
 * branch) bake a disallowing robots.txt. Local builds stay indexable.
 * The edge middleware also noindexes any host other than json-link.pages.dev,
 * which covers a separate Pages project that builds the main branch.
 */
export function shouldNoindexBuild(env = {}) {
  if (env.JSONLINK_INDEXABLE === '1') return false;
  if (env.JSONLINK_NOINDEX === '1') return true;
  if (env.CF_PAGES !== '1') return false;
  const branch = env.CF_PAGES_BRANCH || '';
  return branch !== 'main' && branch !== 'master';
}
