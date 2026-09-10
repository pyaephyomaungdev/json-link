import { describe, it, expect } from 'vitest';
import { pseudolocalize, generatePseudoLocaleRecords } from '../pseudoloc';

describe('pseudoloc.ts', () => {
  it('replaces ASCII characters with accented homoglyphs and wraps in brackets', () => {
    const result = pseudolocalize('Account');
    expect(result.startsWith('[!!! ')).toBe(true);
    expect(result.endsWith(' !!!]')).toBe(true);
    expect(result).toContain('Àççöûñţ');
  });

  it('preserves variables completely untouched', () => {
    const input = 'Welcome {name}, you have {{count}} messages!';
    const result = pseudolocalize(input);
    expect(result).toContain('{name}');
    expect(result).toContain('{{count}}');
  });

  it('expands text length to test UI boundaries', () => {
    const original = 'Save Settings';
    const pseudo = pseudolocalize(original, { brackets: false });
    expect(pseudo.length).toBeGreaterThan(original.length * 1.25);
  });

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
});
