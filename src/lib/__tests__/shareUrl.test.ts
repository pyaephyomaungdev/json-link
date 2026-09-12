import { describe, it, expect } from 'vitest';
import {
  encodeSharePayload,
  decodeSharePayload,
  buildShareUrl,
  packProjectData,
  unpackProjectData,
  isPayloadEncrypted,
  MAX_SAFE_URL_LENGTH,
} from '../shareUrl';
import { TranslationItem } from '@/types';

describe('shareUrl', () => {
  const sampleItems: TranslationItem[] = [
    {
      key: 'app.title',
      namespace: 'common',
      description: 'Main app title',
      status: 'approved',
      en: 'JSON Link',
      my: 'ဂျေဆန် လင့်ခ်',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      key: 'actions.submit',
      namespace: 'buttons',
      status: 'draft',
      en: 'Submit',
      my: 'အတည်ပြုသည်',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  it('packs and unpacks project data correctly', () => {
    const packed = packProjectData('test-project', sampleItems, ['en', 'my']);
    expect(packed.v).toBe(1);
    expect(packed.n).toBe('test-project');
    expect(packed.l).toEqual(['en', 'my']);
    expect(packed.i.length).toBe(2);

    const unpacked = unpackProjectData(packed);
    expect(unpacked.projectName).toBe('test-project');
    expect(unpacked.languages).toEqual(['en', 'my']);
    expect(unpacked.items.length).toBe(2);
    expect(unpacked.items[0].key).toBe('app.title');
    expect(unpacked.items[0].en).toBe('JSON Link');
    expect(unpacked.items[0].my).toBe('ဂျေဆန် လင့်ခ်');
    expect(unpacked.items[0].namespace).toBe('common');
    expect(unpacked.items[0].status).toBe('approved');
  });

  it('compresses and decompresses round-trip with Myanmar unicode intact without password', async () => {
    const hash = await encodeSharePayload('myanmar-test', sampleItems, ['en', 'my']);
    expect(typeof hash).toBe('string');
    expect(isPayloadEncrypted(hash)).toBe(false);

    const decoded = await decodeSharePayload(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.projectName).toBe('myanmar-test');
    expect(decoded?.languages).toEqual(['en', 'my']);
    expect(decoded?.items[0].my).toBe('ဂျေဆန် လင့်ခ်');
  });

  it('encrypts and decrypts with password correctly using AES-GCM 256', async () => {
    const password = 'my-secret-vault-password';
    const hash = await encodeSharePayload('encrypted-project', sampleItems, ['en', 'my'], password);
    
    expect(isPayloadEncrypted(hash)).toBe(true);

    // Requires password
    await expect(decodeSharePayload(hash)).rejects.toThrow('PASSWORD_REQUIRED');

    // Rejects incorrect password
    await expect(decodeSharePayload(hash, 'wrong-password-123')).rejects.toThrow('INCORRECT_PASSWORD');

    // Successfully decrypts with correct password
    const decrypted = await decodeSharePayload(hash, password);
    expect(decrypted).not.toBeNull();
    expect(decrypted?.projectName).toBe('encrypted-project');
    expect(decrypted?.items.length).toBe(2);
    expect(decrypted?.items[0].my).toBe('ဂျေဆန် လင့်ခ်');
  });

  it('builds share URL and correctly reports safe length and encrypted flag', async () => {
    const res = await buildShareUrl('demo', sampleItems, ['en', 'my'], 'mypassword', 'https://json-link.pages.dev');
    expect(res.url.startsWith('https://json-link.pages.dev/#share=')).toBe(true);
    expect(res.isSafeLength).toBe(true);
    expect(res.isEncrypted).toBe(true);
    expect(res.length).toBeLessThan(MAX_SAFE_URL_LENGTH);
  });

  it('handles invalid or corrupted hash gracefully', async () => {
    const decoded = await decodeSharePayload('invalid-random-garbage!@#$');
    expect(decoded).toBeNull();
  });

  it('handles empty hash string gracefully', async () => {
    const decoded = await decodeSharePayload('');
    expect(decoded).toBeNull();
  });
});
