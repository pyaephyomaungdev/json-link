import { describe, it, expect } from 'vitest';
import { runLocalizationLinter, fixAllWhitespaceIssues } from '../linter';
import { TranslationItem } from '@/types';

describe('linter.ts', () => {
  it('detects leading and trailing whitespace in keys and values', () => {
    const items: TranslationItem[] = [
      { key: ' common.save ', en: 'Save ', my: '  သိမ်းမည်' },
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);

    expect(report.totalIssues).toBeGreaterThan(0);
    const wsIssues = report.issues.filter(i => i.category === 'whitespace');
    expect(wsIssues.length).toBe(3); // key, en, my
  });

  it('detects missing variables', () => {
    const items: TranslationItem[] = [
      { key: 'welcome', en: 'Welcome, {name}!', my: 'ကြိုဆိုပါသည်!' }, // missing {name} in my
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    const varIssues = report.issues.filter(i => i.category === 'variable-mismatch');
    expect(varIssues.length).toBe(1);
    expect(varIssues[0].severity).toBe('error');
  });

  it('detects untranslated strings for non-Latin target language', () => {
    const items: TranslationItem[] = [
      { key: 'login.title', en: 'Welcome Back to App', my: 'Welcome Back to App' },
    ];
    const report = runLocalizationLinter(items, ['en', 'my']);
    const untranslated = report.issues.filter(i => i.category === 'untranslated');
    expect(untranslated.length).toBe(1);
  });

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

    // Re-lint should show 0 whitespace issues
    const reReport = runLocalizationLinter(updatedItems, ['en', 'my']);
    const wsIssues = reReport.issues.filter(i => i.category === 'whitespace');
    expect(wsIssues.length).toBe(0);
  });
});
