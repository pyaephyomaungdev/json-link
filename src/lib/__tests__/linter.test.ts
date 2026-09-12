import { describe, it, expect } from 'vitest';
import { runLocalizationLinter, fixAllWhitespaceIssues } from '../linter';
import { TranslationItem } from '@/types';

describe('linter.ts', () => {
  // ─── Whitespace ───────────────────────────────────────────────────────────
  it('detects leading and trailing whitespace in keys and values', () => {
    const items: TranslationItem[] = [
      { key: ' common.save ', en: 'Save ', my: '  သိမ်းမည်' },
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);

    expect(report.totalIssues).toBeGreaterThan(0);
    const wsIssues = report.issues.filter(i => i.category === 'whitespace');
    expect(wsIssues.length).toBe(3); // key, en, my
  });

  // ─── Variable Mismatch ────────────────────────────────────────────────────
  it('detects missing variables', () => {
    const items: TranslationItem[] = [
      { key: 'welcome', en: 'Welcome, {name}!', my: 'ကြိုဆိုပါသည်!' }, // missing {name} in my
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    const varIssues = report.issues.filter(i => i.category === 'variable-mismatch');
    expect(varIssues.length).toBe(1);
    expect(varIssues[0].severity).toBe('error');
  });

  it('reports variable mismatch with correct lang and key info', () => {
    const items: TranslationItem[] = [
      { key: 'msg', en: 'You have {count} items', th: 'คุณมีรายการ' }, // missing {count} in th
    ];
    const report = runLocalizationLinter(items, ['en', 'th']);
    const varIssues = report.issues.filter(i => i.category === 'variable-mismatch');
    expect(varIssues.length).toBe(1);
    expect(varIssues[0].lang).toBe('th');
    expect(varIssues[0].key).toBe('msg');
  });

  // ─── Untranslated ─────────────────────────────────────────────────────────
  it('detects untranslated strings for non-Latin target language', () => {
    const items: TranslationItem[] = [
      { key: 'login.title', en: 'Welcome Back to App', my: 'Welcome Back to App' },
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    const untranslated = report.issues.filter(i => i.category === 'untranslated');
    expect(untranslated.length).toBe(1);
  });

  it('does not flag untranslated for languages that are not in the special check list', () => {
    // 'fr' is not in the untranslated check list (only my, zh, ja, ko, th)
    const items: TranslationItem[] = [
      { key: 'btn.save', en: 'Save', fr: 'Save' }, // same as en but fr is Latin
    ];
    const report = runLocalizationLinter(items, ['en', 'fr']);
    const untranslated = report.issues.filter(i => i.category === 'untranslated');
    expect(untranslated.length).toBe(0);
  });

  // ─── Length Expansion ─────────────────────────────────────────────────────
  it('detects length expansion over 2.5x source length', () => {
    const items: TranslationItem[] = [
      {
        key: 'short.btn',
        en: 'Submit',
        my: 'ဤပုံစံကို သေချာစစ်ဆေးပြီး တင်သွင်းပါ', // way longer than "Submit"
      },
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    const expansions = report.issues.filter(i => i.category === 'length-expansion');
    expect(expansions.length).toBe(1);
    expect(expansions[0].severity).toBe('warning');
  });

  it('does not flag length expansion when source is very short (< 5 chars)', () => {
    const items: TranslationItem[] = [
      { key: 'ok', en: 'OK', my: 'အိုကေဆိုပါသည်' }, // source < 5 chars, skip check
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    const expansions = report.issues.filter(i => i.category === 'length-expansion');
    expect(expansions.length).toBe(0);
  });

  // ─── Duplicate ────────────────────────────────────────────────────────────
  it('detects duplicate translation values across different keys', () => {
    const items: TranslationItem[] = [
      { key: 'btn.save', en: 'Save Changes' },
      { key: 'btn.apply', en: 'Save Changes' },
      { key: 'btn.cancel', en: 'Cancel' },
    ];
    const report = runLocalizationLinter(items, ['en']);
    const duplicates = report.issues.filter(i => i.category === 'duplicate');
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].details).toContain('btn.save');
    expect(duplicates[0].details).toContain('btn.apply');
  });

  it('does not flag duplicates for short values (< 6 chars)', () => {
    const items: TranslationItem[] = [
      { key: 'a', en: 'OK' },
      { key: 'b', en: 'OK' },
    ];
    const report = runLocalizationLinter(items, ['en']);
    const duplicates = report.issues.filter(i => i.category === 'duplicate');
    expect(duplicates.length).toBe(0);
  });

  // ─── Empty / Missing ──────────────────────────────────────────────────────
  it('detects empty/missing translation values', () => {
    const items: TranslationItem[] = [
      { key: 'app.title', en: 'My App', my: '' },
      { key: 'app.desc', en: 'Description' }, // my is undefined
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    const emptyIssues = report.issues.filter(i => i.category === 'empty');
    expect(emptyIssues.length).toBe(2);
  });

  // ─── Empty items / edge cases ─────────────────────────────────────────────
  it('returns clean report with zero issues for empty items array', () => {
    const report = runLocalizationLinter([], ['en', 'my']);
    expect(report.totalIssues).toBe(0);
    expect(report.errorsCount).toBe(0);
    expect(report.issues).toHaveLength(0);
  });

  it('correctly tallies errorsCount, warningsCount, suggestionsCount', () => {
    const items: TranslationItem[] = [
      { key: 'k1', en: 'Hello {name}', my: 'မင်္ဂလာ' }, // error: variable mismatch
      { key: 'k2', en: 'Subtitle', my: '' },              // warning: empty
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    expect(report.errorsCount).toBeGreaterThan(0);
    expect(report.warningsCount).toBeGreaterThan(0);
  });

  it('falls back to first language as source if "en" not in languages list', () => {
    const items: TranslationItem[] = [
      { key: 'title', my: 'မင်္ဂလာပါ', th: 'สวัสดี' },
    ];
    // No 'en', so 'my' should be the source
    const report = runLocalizationLinter(items, ['my', 'th'], 'en');
    // Should not crash; should produce a valid report
    expect(report).toHaveProperty('totalIssues');
    expect(Array.isArray(report.issues)).toBe(true);
  });

  // ─── fixAllWhitespaceIssues ───────────────────────────────────────────────
  it('fixes all whitespace issues automatically', () => {
    const items: TranslationItem[] = [
      { key: ' common.save ', en: 'Save ', my: '  သိမ်းမည် ' },
      { key: 'clean.key', en: 'Clean', my: 'သန့်ရှင်း' },
    ];
    const { updatedItems, fixedCount } = fixAllWhitespaceIssues(items, ['en', 'my']);

    expect(fixedCount).toBe(1);
    expect(updatedItems[0].key).toBe('common.save');
    expect(updatedItems[0].en).toBe('Save');
    expect(updatedItems[0].my).toBe('သိမ်းမည်');

    const reReport = runLocalizationLinter(updatedItems, ['en', 'my']);
    const wsIssues = reReport.issues.filter(i => i.category === 'whitespace');
    expect(wsIssues.length).toBe(0);
  });

  it('returns fixedCount 0 when no whitespace issues exist', () => {
    const items: TranslationItem[] = [
      { key: 'app.name', en: 'App', my: 'အက်ပ်' },
    ];
    const { fixedCount } = fixAllWhitespaceIssues(items, ['en', 'my']);
    expect(fixedCount).toBe(0);
  });

  it('does not trim a key if the trimmed key would collide with another existing key', () => {
    const items: TranslationItem[] = [
      { key: 'save', en: 'Save' },
      { key: ' save ', en: 'Save padded' },
    ];
    const { updatedItems } = fixAllWhitespaceIssues(items, ['en']);
    // ' save ' should not be renamed to 'save' because 'save' already exists
    const keys = updatedItems.map(i => i.key);
    expect(keys).toContain('save');
    expect(keys).toContain(' save ');
  });

  describe('placeholder-only translation gating', () => {
    it('flags an AI-filled target consisting only of variables as an "empty" warning', () => {
      const items: TranslationItem[] = [
        { key: 'greet', en: 'greet', my: '{user}' },
      ];
      const report = runLocalizationLinter(items, ['en', 'my']);
      const issue = report.issues.find(i => i.id.startsWith('empty-greet-my'));
      expect(issue).toBeDefined();
      expect(issue!.category).toBe('empty');
      expect(issue!.message).toContain('only variables');
      expect(issue!.details).toContain('{user}');
    });

    it('does NOT flag normal translations with real text mixed with placeholders', () => {
      const items: TranslationItem[] = [
        { key: 'greet', en: 'Hello {user}', my: 'မင်္ဂလာပါ {user}' },
      ];
      const report = runLocalizationLinter(items, ['en', 'my']);
      expect(report.issues.some(i => i.category === 'empty' && i.lang === 'my')).toBe(false);
    });

    it('placeholder-only source counts too, covering the source language column', () => {
      const items: TranslationItem[] = [
        { key: 'k1', en: '%s', my: '%s' },
      ];
      const report = runLocalizationLinter(items, ['en', 'my']);
      expect(report.issues.filter(i => i.category === 'empty').length).toBe(2); // en + my
    });

    it('plain blank values keep the original missing-translation message', () => {
      const items: TranslationItem[] = [
        { key: 'k1', en: 'Hi', my: '' },
      ];
      const report = runLocalizationLinter(items, ['en', 'my']);
      const issue = report.issues.find(i => i.lang === 'my' && i.category === 'empty');
      expect(issue).toBeDefined();
      expect(issue!.message).toContain('Missing translation for MY');
    });
  });
});
