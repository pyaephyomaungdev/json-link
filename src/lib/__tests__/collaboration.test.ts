import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import {
  generateCollabRoomId,
  generateRandomPeerProfile,
  extractItemsFromYDoc,
  applyLocalChangeToYDoc,
  getPeerInitials,
} from '../collaboration';
import { TranslationItem } from '@/types';

describe('collaboration module', () => {
  it('generates an 8-character random room ID', () => {
    const id1 = generateCollabRoomId();
    const id2 = generateCollabRoomId();
    expect(id1).toHaveLength(8);
    expect(id2).toHaveLength(8);
    expect(id1).not.toBe(id2);
  });

  it('generates a random peer profile with name and color', () => {
    const profile = generateRandomPeerProfile();
    expect(profile.name).toMatch(/^[A-Za-z]+-\d{2}$/);
    expect(profile.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('applies local changes to YDoc and extracts them cleanly', () => {
    const ydoc = new Y.Doc();
    const items: TranslationItem[] = [
      { key: 'app.title', en: 'Hello World', my: 'မင်္ဂလာပါ' },
      { key: 'app.submit', en: 'Submit', my: 'တင်သွင်းပါ' },
    ];
    const languages = ['en', 'my'];

    applyLocalChangeToYDoc(ydoc, items, languages);

    const extracted = extractItemsFromYDoc(ydoc);
    expect(extracted.languages).toEqual(['en', 'my']);
    expect(extracted.items).toHaveLength(2);
    expect(extracted.items[0].key).toBe('app.title');
    expect(extracted.items[0].en).toBe('Hello World');
    expect(extracted.items[0].my).toBe('မင်္ဂလာပါ');
    expect(extracted.items[1].key).toBe('app.submit');
  });

  it('synchronizes updates across two YDocs (simulating peer synchronization)', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const itemsA: TranslationItem[] = [
      { key: 'auth.login', en: 'Login', my: 'ဝင်ရောက်ပါ' },
    ];
    applyLocalChangeToYDoc(docA, itemsA, ['en', 'my']);

    // Exchange state vector between Doc A and Doc B (simulating WebRTC DataChannel sync)
    const updateA = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, updateA);

    const extractedB = extractItemsFromYDoc(docB);
    expect(extractedB.items).toHaveLength(1);
    expect(extractedB.items[0].en).toBe('Login');

    // Peer B edits a different field (Japanese translation)
    const itemsB: TranslationItem[] = [
      { key: 'auth.login', en: 'Login', my: 'ဝင်ရောက်ပါ', ja: 'ログイン' },
    ];
    applyLocalChangeToYDoc(docB, itemsB, ['en', 'my', 'ja']);

    // Sync B back to A
    const updateB = Y.encodeStateAsUpdate(docB);
    Y.applyUpdate(docA, updateB);

    const extractedA = extractItemsFromYDoc(docA);
    expect(extractedA.languages).toContain('ja');
    expect(extractedA.items[0].ja).toBe('ログイン');
  });

  it('correctly handles row deletion synchronization', () => {
    const ydoc = new Y.Doc();
    const items: TranslationItem[] = [
      { key: 'btn.save', en: 'Save' },
      { key: 'btn.cancel', en: 'Cancel' },
    ];
    applyLocalChangeToYDoc(ydoc, items, ['en']);
    expect(extractItemsFromYDoc(ydoc).items).toHaveLength(2);

    // Delete 'btn.cancel'
    applyLocalChangeToYDoc(ydoc, [{ key: 'btn.save', en: 'Save' }], ['en']);
    const afterDelete = extractItemsFromYDoc(ydoc);
    expect(afterDelete.items).toHaveLength(1);
    expect(afterDelete.items[0].key).toBe('btn.save');
  });

  it('computes peer initials correctly', () => {
    expect(getPeerInitials('Hawk-30')).toBe('HA');
    expect(getPeerInitials('Alex Rivera')).toBe('AR');
    expect(getPeerInitials('Fox')).toBe('FO');
    expect(getPeerInitials('')).toBe('??');
  });
});
