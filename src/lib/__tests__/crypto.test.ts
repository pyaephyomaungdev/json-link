import { describe, it, expect, vi } from 'vitest';
import { encryptSecret, decryptSecret } from '../crypto';

describe('crypto.ts', () => {
  it('encrypts and decrypts text cleanly', async () => {
    const rawKey = 'sk-or-v1-abcdef1234567890abcdef1234567890';
    const encrypted = await encryptSecret(rawKey);

    // Ensure it is not stored as plain text
    expect(encrypted).not.toBe(rawKey);
    expect(encrypted).not.toContain('abcdef1234567890');

    // Decrypts back to the original text
    const decrypted = await decryptSecret(encrypted);
    expect(decrypted).toBe(rawKey);
  });

  it('handles empty strings gracefully', async () => {
    expect(await encryptSecret('')).toBe('');
    expect(await decryptSecret('')).toBe('');
  });

  it('handles corrupted cipher payload safely without crashing', async () => {
    // Silence the expected console.warn from decryptSecret's catch block —
    // this negative-path test intentionally feeds malformed payloads.
    const errSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await decryptSecret('{"invalid":"json"}');
    expect(result).toBe('');

    errSpy.mockRestore();
  });

  it('handles completely non-JSON string without crashing', async () => {
    const errSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await decryptSecret('not-even-json!!!');
    expect(result).toBe('');

    errSpy.mockRestore();
  });

  it('encrypts and decrypts special characters (Myanmar, emoji, quotes)', async () => {
    const special = 'မင်္ဂလာပါ 🎉 "quoted" & <tag>';
    const encrypted = await encryptSecret(special);
    expect(encrypted).not.toBe(special);
    const decrypted = await decryptSecret(encrypted);
    expect(decrypted).toBe(special);
  });

  it('encrypts and decrypts a long string (>500 chars) accurately', async () => {
    const long = 'sk-or-v1-'.repeat(60); // ~540 chars
    const encrypted = await encryptSecret(long);
    const decrypted = await decryptSecret(encrypted);
    expect(decrypted).toBe(long);
  });

  it('produces different ciphertext for same plaintext on each call (random IV)', async () => {
    const key = 'my-secret-api-key';
    const enc1 = await encryptSecret(key);
    const enc2 = await encryptSecret(key);
    // Each encryption uses a random IV so ciphertexts should differ
    expect(enc1).not.toBe(enc2);
    // But both should decrypt to the same value
    expect(await decryptSecret(enc1)).toBe(key);
    expect(await decryptSecret(enc2)).toBe(key);
  });
});
