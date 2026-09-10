import { describe, it, expect } from 'vitest';
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
    const result = await decryptSecret('{"invalid":"json"}');
    expect(result).toBe('');
  });
});
