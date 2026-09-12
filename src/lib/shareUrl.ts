import { TranslationItem } from '@/types';

export interface ShareProjectData {
  projectName: string;
  languages: string[];
  items: TranslationItem[];
}

interface CompactItem {
  k: string;
  ns?: string;
  d?: string;
  s?: string;
  t: Record<string, string>;
}

interface CompactPayload {
  v: 1;
  n: string;
  l: string[];
  i: CompactItem[];
}

export const MAX_SAFE_URL_LENGTH = 2500;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Packs project data into a compact payload structure
 */
export function packProjectData(
  projectName: string,
  items: TranslationItem[],
  languages: string[]
): CompactPayload {
  const compactItems: CompactItem[] = items.map(item => {
    const translations: Record<string, string> = {};
    languages.forEach(lang => {
      if (item[lang]) {
        translations[lang] = item[lang];
      }
    });

    const out: CompactItem = {
      k: item.key,
      t: translations,
    };
    if (item.namespace) out.ns = item.namespace;
    if (item.description) out.d = item.description;
    if (item.status && item.status !== 'draft') out.s = item.status;
    return out;
  });

  return {
    v: 1,
    n: projectName.trim() || 'translations',
    l: languages,
    i: compactItems,
  };
}

/**
 * Unpacks a compact payload structure back into standard Project data
 */
export function unpackProjectData(payload: CompactPayload): ShareProjectData {
  const languages = Array.isArray(payload.l) && payload.l.length > 0 ? payload.l : ['en', 'my'];
  const projectName = payload.n || 'translations';

  const items: TranslationItem[] = (payload.i || []).map(ci => {
    const item: TranslationItem = {
      key: ci.k,
      namespace: ci.ns,
      description: ci.d,
      status: (ci.s as any) || 'draft',
      updatedAt: new Date().toISOString(),
    };
    languages.forEach(lang => {
      item[lang] = ci.t?.[lang] || '';
    });
    return item;
  });

  return {
    projectName,
    languages,
    items,
  };
}

/**
 * Compresses project data into a URL-safe hash string
 */
export async function encodeSharePayload(
  projectName: string,
  items: TranslationItem[],
  languages: string[]
): Promise<string> {
  const compact = packProjectData(projectName, items, languages);
  const jsonStr = JSON.stringify(compact);

  const hasStreamSupport =
    typeof CompressionStream !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    typeof new Blob().stream === 'function';

  if (hasStreamSupport) {
    try {
      const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'));
      const buffer = await new Response(stream).arrayBuffer();
      return bytesToBase64Url(new Uint8Array(buffer));
    } catch (e) {
      console.warn('CompressionStream failed, using fallback', e);
    }
  }

  // Fallback for environments without CompressionStream or Blob.stream (e.g. JSDOM)
  return btoa(unescape(encodeURIComponent(jsonStr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decompresses a URL-safe hash string back into project data
 */
export async function decodeSharePayload(hashStr: string): Promise<ShareProjectData | null> {
  try {
    const cleanHash = hashStr.replace(/^#share=/, '').replace(/^#/, '').trim();
    if (!cleanHash) return null;

    const hasStreamSupport =
      typeof DecompressionStream !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof new Blob().stream === 'function';

    if (hasStreamSupport) {
      try {
        const bytes = base64UrlToBytes(cleanHash);
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        const text = await new Response(stream).text();
        const parsed = JSON.parse(text);
        return unpackProjectData(parsed);
      } catch (gzipErr) {
        // Might be uncompressed fallback base64
        const binary = atob(cleanHash.replace(/-/g, '+').replace(/_/g, '/'));
        const text = decodeURIComponent(escape(binary));
        const parsed = JSON.parse(text);
        return unpackProjectData(parsed);
      }
    }

    const binary = atob(cleanHash.replace(/-/g, '+').replace(/_/g, '/'));
    const text = decodeURIComponent(escape(binary));
    const parsed = JSON.parse(text);
    return unpackProjectData(parsed);
  } catch (e) {
    return null;
  }
}

/**
 * Generates full share URL from current origin
 */
export async function buildShareUrl(
  projectName: string,
  items: TranslationItem[],
  languages: string[],
  origin: string = typeof window !== 'undefined' ? window.location.origin : 'https://json-link.pages.dev'
): Promise<{ url: string; length: number; isSafeLength: boolean }> {
  const hash = await encodeSharePayload(projectName, items, languages);
  const url = `${origin}/#share=${hash}`;
  return {
    url,
    length: url.length,
    isSafeLength: url.length <= MAX_SAFE_URL_LENGTH,
  };
}
