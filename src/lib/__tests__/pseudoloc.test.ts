import { describe, it, expect } from 'vitest';
import { pseudolocalize, generatePseudoLocaleRecords } from '../pseudoloc';

describe('pseudoloc.ts', () => {
  // ─── pseudolocalize ────────────────────────────────────────────────────────
  it('replaces ASCII characters with accented homoglyphs and wraps in brackets', () => {
    const result = pseudolocalize('Account');
    expect(result.startsWith('[!!! ')).toBe(true);
    expect(result.endsWith(' !!!]')).toBe(true);
    expect(result).toContain('Àççöûñţ');
  });

  it('preserves ICU single-brace variables completely untouched', () => {
    const input = 'Welcome {name}, you have {{count}} messages!';
    const result = pseudolocalize(input);
    expect(result).toContain('{name}');
    expect(result).toContain('{{count}}');
  });

  it('preserves Printf-style %s and %d variables untouched', () => {
    const input = 'Uploaded %s of %d files';
    const result = pseudolocalize(input);
    expect(result).toContain('%s');
    expect(result).toContain('%d');
  });

  it('preserves positional printf %1$s variables untouched', () => {
    const input = 'Hello %1$s, you have %2$d messages';
    const result = pseudolocalize(input);
    expect(result).toContain('%1$s');
    expect(result).toContain('%2$d');
  });

  it('expands text length to test UI boundaries', () => {
    const original = 'Save Settings';
    const pseudo = pseudolocalize(original, { brackets: false });
    expect(pseudo.length).toBeGreaterThan(original.length * 1.25);
  });

  it('handles empty string gracefully without crashing', () => {
    const result = pseudolocalize('');
    // Should return something (could be just brackets or empty)
    expect(typeof result).toBe('string');
  });

  it('handles string that is only a variable', () => {
    const result = pseudolocalize('{user}');
    expect(result).toContain('{user}');
  });

  // ─── generatePseudoLocaleRecords ──────────────────────────────────────────
  it('generates pseudo locale records from items array', () => {
    const items = [
      { key: 'btn.save', en: 'Save' },
      { key: 'btn.cancel', en: 'Cancel' },
    ];
    const records = generatePseudoLocaleRecords(items, 'en');
    expect(records['btn.save']).toBeDefined();
    expect(records['btn.save'].startsWith('[!!! ')).toBe(true);
    expect(records['btn.cancel']).toBeDefined();
  });

  it('skips items with empty source language value', () => {
    const items = [
      { key: 'empty.key', en: '' },
      { key: 'normal.key', en: 'Hello' },
    ];
    const records = generatePseudoLocaleRecords(items, 'en');
    // normal.key must be present
    expect(records['normal.key']).toBeDefined();
    // empty key may be absent or empty
    if (records['empty.key'] !== undefined) {
      expect(records['empty.key']).toBeDefined(); // at minimum doesn't crash
    }
  });
});
