import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import {
  generateCollabRoomId,
  normalizeCollabRoomId,
  generateRandomPeerProfile,
  extractItemsFromYDoc,
  applyLocalChangeToYDoc,
  applyProjectNameToYDoc,
  extractProjectNameFromYDoc,
  getPeerInitials,
  getNextAvailablePeerColor,
  COLLAB_PALETTE,
} from '../collaboration';
import { TranslationItem } from '@/types';

describe('collaboration module', () => {
  it('generates a 3-4-3 segmented random room ID (e.g. yfq-khjt-efn)', () => {
    const id1 = generateCollabRoomId();
    const id2 = generateCollabRoomId();
    expect(id1).toMatch(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
    expect(id2).toMatch(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
    expect(id1).not.toBe(id2);
  });

  it('normalizes room IDs to canonical formats regardless of dashes or spaces', () => {
    expect(normalizeCollabRoomId('yfq-khjt-efn')).toBe('yfq-khjt-efn');
    expect(normalizeCollabRoomId('yfqkhjtefn')).toBe('yfq-khjt-efn');
    expect(normalizeCollabRoomId('yfq khjt efn')).toBe('yfq-khjt-efn');
    expect(normalizeCollabRoomId('  YFQ-KHJT-EFN  ')).toBe('yfq-khjt-efn');
    expect(normalizeCollabRoomId('8swaabm6')).toBe('8swaabm6');
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

  it('synchronizes row review status updates across YDocs', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const itemsA: TranslationItem[] = [
      { key: 'auth.login', en: 'Login', status: 'draft' },
    ];
    applyLocalChangeToYDoc(docA, itemsA, ['en']);

    const updateA = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, updateA);

    expect(extractItemsFromYDoc(docB).items[0].status).toBe('draft');

    // Peer B approves row status
    const itemsB: TranslationItem[] = [
      { key: 'auth.login', en: 'Login', status: 'approved' },
    ];
    applyLocalChangeToYDoc(docB, itemsB, ['en']);

    const updateB = Y.encodeStateAsUpdate(docB);
    Y.applyUpdate(docA, updateB);

    expect(extractItemsFromYDoc(docA).items[0].status).toBe('approved');
  });

  it('guarantees unique colors for up to 9 peers in the same room', () => {
    expect(COLLAB_PALETTE.length).toBeGreaterThanOrEqual(9);
    
    // Simulate 9 peers joining sequentially and taking unique colors
    const allocatedColors: string[] = [];
    for (let i = 0; i < 9; i++) {
      const color = getNextAvailablePeerColor(allocatedColors);
      expect(allocatedColors).not.toContain(color);
      allocatedColors.push(color);
    }

    // Check all 9 colors are strictly unique
    const uniqueSet = new Set(allocatedColors);
    expect(uniqueSet.size).toBe(9);
  });

  it('generates random peer profile with collision avoidance if used colors provided', () => {
    const taken = [COLLAB_PALETTE[0], COLLAB_PALETTE[1]];
    const profile = generateRandomPeerProfile(taken);
    expect(taken).not.toContain(profile.color);
    expect(COLLAB_PALETTE).toContain(profile.color);
  });

  it('synchronizes project name metadata across YDocs', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    applyProjectNameToYDoc(docA, 'fintech-mobile-app');
    expect(extractProjectNameFromYDoc(docA)).toBe('fintech-mobile-app');

    // Sync Doc A to Doc B
    const updateA = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, updateA);
    expect(extractProjectNameFromYDoc(docB)).toBe('fintech-mobile-app');

    // Peer B updates project name
    applyProjectNameToYDoc(docB, 'fintech-v2');
    const updateB = Y.encodeStateAsUpdate(docB);
    Y.applyUpdate(docA, updateB);
    expect(extractProjectNameFromYDoc(docA)).toBe('fintech-v2');
  });
});

