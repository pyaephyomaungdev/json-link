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

interface EncryptedContainer {
  v: 1;
  enc: 1;
  s: string; // Base64URL salt (16 bytes)
  iv: string; // Base64URL iv (12 bytes)
  c: string; // Base64URL ciphertext
}

export const MAX_SAFE_URL_LENGTH = 2500;

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(base64url: string): Uint8Array {
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
 * Derives a 256-bit AES-GCM CryptoKey using PBKDF2 with 100,000 iterations
 */
export async function deriveKeyFromPassword(password: string, salt: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
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
 * Checks if a share hash requires password decryption
 */
export function isPayloadEncrypted(hashStr: string): boolean {
  try {
    const cleanHash = hashStr.replace(/^#\/?share=/, '').replace(/^#/, '').trim();
    if (!cleanHash) return false;

    const bytes = base64UrlToBytes(cleanHash);
    const decodedText = new TextDecoder().decode(bytes);
    if (decodedText.startsWith('{"v":1,"enc":1')) {
      return true;
    }
  } catch {
    // Not an encrypted JSON container
  }
  return false;
}

/**
 * Compresses project data into a URL-safe hash string (with optional AES-GCM 256 encryption)
 */
export async function encodeSharePayload(
  projectName: string,
  items: TranslationItem[],
  languages: string[],
  password?: string
): Promise<string> {
  const compact = packProjectData(projectName, items, languages);
  const jsonStr = JSON.stringify(compact);

  let rawBytes: Uint8Array;

  const hasStreamSupport =
    typeof CompressionStream !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    typeof new Blob().stream === 'function';

  if (hasStreamSupport) {
    try {
      const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'));
      const buffer = await new Response(stream).arrayBuffer();
      rawBytes = new Uint8Array(buffer);
    } catch {
      rawBytes = new TextEncoder().encode(jsonStr);
    }
  } else {
    rawBytes = new TextEncoder().encode(jsonStr);
  }

  // If password provided, encrypt with AES-GCM 256
  const cleanPassword = password?.trim();
  if (cleanPassword && typeof crypto !== 'undefined' && crypto.subtle) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKeyFromPassword(cleanPassword, salt, ['encrypt']);
    const encryptedBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      rawBytes
    );

    const container: EncryptedContainer = {
      v: 1,
      enc: 1,
      s: bytesToBase64Url(salt),
      iv: bytesToBase64Url(iv),
      c: bytesToBase64Url(new Uint8Array(encryptedBuf)),
    };

    const containerBytes = new TextEncoder().encode(JSON.stringify(container));
    return bytesToBase64Url(containerBytes);
  }

  return bytesToBase64Url(rawBytes);
}

/**
 * Decompresses and decrypts a URL-safe hash string back into project data
 */
export async function decodeSharePayload(
  hashStr: string,
  password?: string
): Promise<ShareProjectData | null> {
  try {
    const cleanHash = hashStr.replace(/^#\/?share=/, '').replace(/^#/, '').trim();
    if (!cleanHash) return null;

    const rawBytes = base64UrlToBytes(cleanHash);

    // Check if it is an encrypted container
    let isEncrypted = false;
    let container: EncryptedContainer | null = null;
    try {
      const text = new TextDecoder().decode(rawBytes);
      if (text.startsWith('{"v":1,"enc":1')) {
        container = JSON.parse(text);
        isEncrypted = true;
      }
    } catch {
      // Not JSON container
    }

    if (isEncrypted && container) {
      if (!password) {
        throw new Error('PASSWORD_REQUIRED');
      }

      const salt = base64UrlToBytes(container.s);
      const iv = base64UrlToBytes(container.iv);
      const cipherBytes = base64UrlToBytes(container.c);

      let key: CryptoKey;
      try {
        key = await deriveKeyFromPassword(password, salt, ['decrypt']);
      } catch (keyErr) {
        throw new Error('INCORRECT_PASSWORD');
      }

      let decryptedBuf: ArrayBuffer;
      try {
        decryptedBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          cipherBytes
        );
      } catch (decErr) {
        throw new Error('INCORRECT_PASSWORD');
      }

      // Decompress decrypted buffer
      const hasStreamSupport =
        typeof DecompressionStream !== 'undefined' &&
        typeof Blob !== 'undefined' &&
        typeof new Blob().stream === 'function';

      if (hasStreamSupport) {
        try {
          const stream = new Blob([decryptedBuf]).stream().pipeThrough(new DecompressionStream('gzip'));
          const text = await new Response(stream).text();
          const parsed = JSON.parse(text);
          return unpackProjectData(parsed);
        } catch {
          const text = new TextDecoder().decode(decryptedBuf);
          const parsed = JSON.parse(text);
          return unpackProjectData(parsed);
        }
      }

      const text = new TextDecoder().decode(decryptedBuf);
      const parsed = JSON.parse(text);
      return unpackProjectData(parsed);
    }

    // Unencrypted flow: Decompress directly
    const hasStreamSupport =
      typeof DecompressionStream !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof new Blob().stream === 'function';

    if (hasStreamSupport) {
      try {
        const stream = new Blob([rawBytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        const text = await new Response(stream).text();
        const parsed = JSON.parse(text);
        return unpackProjectData(parsed);
      } catch {
        const text = new TextDecoder().decode(rawBytes);
        const parsed = JSON.parse(text);
        return unpackProjectData(parsed);
      }
    }

    const text = new TextDecoder().decode(rawBytes);
    const parsed = JSON.parse(text);
    return unpackProjectData(parsed);
  } catch (e: any) {
    if (e?.message === 'PASSWORD_REQUIRED' || e?.message === 'INCORRECT_PASSWORD') {
      throw e;
    }
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
  password?: string,
  origin: string = typeof window !== 'undefined' ? window.location.origin : 'https://json-link.pages.dev'
): Promise<{ url: string; length: number; isSafeLength: boolean; isEncrypted: boolean }> {
  const hash = await encodeSharePayload(projectName, items, languages, password);
  const url = `${origin}/#share=${hash}`;
  return {
    url,
    length: url.length,
    isSafeLength: url.length <= MAX_SAFE_URL_LENGTH,
    isEncrypted: Boolean(password && password.trim()),
  };
}
