/**
 * Web Crypto AES-GCM vault for API keys and GitHub tokens.
 * Ciphertext lives in localStorage; the wrapping key is a random
 * non-extractable CryptoKey persisted in IndexedDB (device-local).
 * This is not equivalent to a user-chosen password.
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

const VAULT_DB_NAME = 'jsonlink_vault';
const VAULT_STORE = 'crypto_keys';
const VAULT_KEY_ID = 'device-aes-gcm';

let memoryVaultKey: CryptoKey | null = null;

function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function openVaultDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    try {
      const request = indexedDB.open(VAULT_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(VAULT_STORE)) {
          db.createObjectStore(VAULT_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readStoredVaultKey(db: IDBDatabase): Promise<CryptoKey | null> {
  return new Promise(resolve => {
    try {
      const tx = db.transaction(VAULT_STORE, 'readonly');
      const req = tx.objectStore(VAULT_STORE).get(VAULT_KEY_ID);
      req.onsuccess = () => resolve((req.result as CryptoKey) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeStoredVaultKey(db: IDBDatabase, key: CryptoKey): Promise<void> {
  return new Promise(resolve => {
    try {
      const tx = db.transaction(VAULT_STORE, 'readwrite');
      tx.objectStore(VAULT_STORE).put(key, VAULT_KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getOrCreateVaultKey(): Promise<CryptoKey> {
  if (memoryVaultKey) return memoryVaultKey;

  const db = await openVaultDb();
  if (db) {
    const stored = await readStoredVaultKey(db);
    if (stored) {
      memoryVaultKey = stored;
      return stored;
    }
    const created = await generateVaultKey();
    await writeStoredVaultKey(db, created);
    memoryVaultKey = created;
    return created;
  }

  memoryVaultKey = await generateVaultKey();
  return memoryVaultKey;
}

/** Legacy origin-seeded key (v1 payloads only). Kept so existing vaults still open. */
async function deriveLegacyOriginKey(salt: Uint8Array): Promise<CryptoKey> {
  const originSeed =
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'jsonlink') +
    '_vault_key_2026';
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
 * Returns a JSON payload containing hex-encoded iv and ciphertext.
 */
export async function encryptSecret(plainText: string): Promise<string> {
  if (!plainText) return '';
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getOrCreateVaultKey();

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plainText)
    );

    const payload = {
      v: 2,
      iv: toHex(iv),
      c: toHex(new Uint8Array(encrypted)),
    };
    return JSON.stringify(payload);
  } catch (err) {
    console.error('Web Crypto subtle encryption failed:', err);
    return '';
  }
}

/**
 * Decrypts an AES-GCM encrypted payload back to plain-text string.
 */
export async function decryptSecret(cipherPayload: string): Promise<string> {
  if (!cipherPayload || cipherPayload.startsWith('b64:')) return '';
  try {
    const parsed = JSON.parse(cipherPayload);
    if (!parsed?.iv || !parsed?.c) {
      return '';
    }

    const iv = fromHex(parsed.iv);
    const cipher = fromHex(parsed.c);
    const isLegacy = parsed.v === 1 || Boolean(parsed.s);
    const key = isLegacy
      ? await deriveLegacyOriginKey(fromHex(parsed.s))
      : await getOrCreateVaultKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('Failed to decrypt secret payload:', err);
    return '';
  }
}
