/**
 * Web Crypto API (AES-GCM 256-bit) client-side encryption utility.
 * Used to encrypt sensitive tokens (like OpenRouter API keys) before storing in localStorage,
 * preventing plain-text exposure in browser DevTools or casual inspection.
 */

function toHex(buffer: Uint8Array): string {
  return Array.from(buffer, b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derives a 256-bit AES-GCM CryptoKey using PBKDF2
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const originSeed = (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'jsonlink') + '_vault_key_2026';
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(originSeed),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 10000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plain-text string with AES-GCM (256-bit).
 * Returns a JSON payload containing hex-encoded salt, iv, and ciphertext.
 */
export async function encryptSecret(plainText: string): Promise<string> {
  if (!plainText) return '';
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(salt);

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plainText)
    );

    const payload = {
      v: 1,
      s: toHex(salt),
      iv: toHex(iv),
      c: toHex(new Uint8Array(encrypted)),
    };
    return JSON.stringify(payload);
  } catch (err) {
    console.warn('Crypto subtle encryption fallback triggered:', err);
    return 'b64:' + btoa(plainText);
  }
}

/**
 * Decrypts an AES-GCM encrypted payload back to plain-text string.
 */
export async function decryptSecret(cipherPayload: string): Promise<string> {
  if (!cipherPayload) return '';
  try {
    if (cipherPayload.startsWith('b64:')) {
      return atob(cipherPayload.slice(4));
    }
    const parsed = JSON.parse(cipherPayload);
    if (!parsed?.s || !parsed?.iv || !parsed?.c) {
      return '';
    }

    const salt = fromHex(parsed.s);
    const iv = fromHex(parsed.iv);
    const cipher = fromHex(parsed.c);

    const key = await deriveKey(salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.warn('Failed to decrypt secret payload:', err);
    return '';
  }
}
