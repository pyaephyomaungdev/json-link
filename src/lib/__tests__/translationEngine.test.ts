import { describe, it, expect } from 'vitest';
import {
  inspectTranslation,
  tokenizeVariables,
  extractVariables,
  extractVariableNames,
  validateVariables,
  isPlaceholderOnly,
  isEffectivelyMissing,
  evaluateIcuMessage,
  isIcuPlural,
  runLocalizationLinter,
  fixAllWhitespaceIssues,
  translationEngine,
} from '../translationEngine';
import { TranslationItem } from '@/types';

describe('translationEngine.ts (Deep Module Interface)', () => {
  describe('inspectTranslation() - Unified Single-Entry Seam', () => {
    it('evaluates a healthy translation with variables as valid', () => {
      const result = inspectTranslation(
        'Welcome {user}, you have {count} messages!',
        'ကြိုဆိုပါတယ် {user}၊ သင့်ထံတွင် {count} စောင်ရှိသည်!'
      );

      expect(result.effectiveState).toBe('valid');
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.missingVariables).toEqual([]);
      expect(result.issues).toEqual([]);
      expect(result.canAutoFix).toBe(false);
      expect(result.tokens.filter(t => t.isVariable)).toHaveLength(2);
    });

    it('detects missing variables and marks invalid with error issue', () => {
      const result = inspectTranslation(
        'Order total: {amount} {currency}',
        'စုစုပေါင်း: {amount}'
      );

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.missingVariables).toContain('{currency}');
      expect(result.issues.some(i => i.category === 'variable-mismatch')).toBe(true);
    });

    it('identifies placeholder-only translations from AI fill', () => {
      const result = inspectTranslation('User profile', '{user}');
      expect(result.effectiveState).toBe('placeholder_only');
    });

    it('detects whitespace issue and provides instant fix()', () => {
      const result = inspectTranslation('Dashboard', '  ပင်မစာမျက်နှာ  ');
      expect(result.issues.some(i => i.category === 'whitespace')).toBe(true);
      expect(result.canAutoFix).toBe(true);
      expect(result.fix()).toBe('ပင်မစာမျက်နှာ');
    });

    it('warns when target text expands significantly beyond source', () => {
      const result = inspectTranslation(
        'Save',
        'ဤအချက်အလက်အားလုံးကို သိမ်းဆည်းရန် ဤနေရာကို နှိပ်ပါ'
      );
      // Source length is 4 (< 5), so no expansion check
      expect(result.issues.some(i => i.category === 'length-expansion')).toBe(false);

      const resultLong = inspectTranslation(
        'Delete',
        'ဤဖိုင်ကို သင့်စက်ထဲမှ အပြီးတိုင် ဖျက်ပစ်မည် ဖြစ်သောကြောင့် သေချာစွာ စစ်ဆေးပေးပါ'
      );
      expect(resultLong.issues.some(i => i.category === 'length-expansion')).toBe(true);
    });
  });

  describe('AST Tokenizer & Extraction', () => {
    it('tokenizes multiple syntax flavours in one string', () => {
      const text = 'Hello {{name}}, you have %d files and $1 credit on {date, date, short}.';
      const tokens = tokenizeVariables(text);

      const vars = tokens.filter(t => t.isVariable).map(t => t.text);
      expect(vars).toContain('{{name}}');
      expect(vars).toContain('%d');
      expect(vars).toContain('$1');
      expect(vars).toContain('{date, date, short}');
    });

    it('distinguishes braced tokens from bare variable names', () => {
      const text = 'Hello {username}, you have {count, plural, other{#}} items';
      const tokensWithBraces = extractVariables(text);
      const bareNames = extractVariableNames(text);

      expect(tokensWithBraces).toContain('{username}');
      expect(tokensWithBraces).toContain('{count}');

      expect(bareNames).toContain('username');
      expect(bareNames).toContain('count');
    });

    it('validates variable parity directly', () => {
      const v = validateVariables('Hello {name}', 'မင်္ဂလာပါ {name}');
      expect(v.isValid).toBe(true);

      const invalid = validateVariables('Hello {name}', 'မင်္ဂလာပါ');
      expect(invalid.isValid).toBe(false);
      expect(invalid.missingVariables).toEqual(['{name}']);
    });

    it('identifies placeholder and effectively missing values', () => {
      expect(isPlaceholderOnly('{username}')).toBe(true);
      expect(isPlaceholderOnly('Hello {username}')).toBe(false);

      expect(isEffectivelyMissing('')).toBe(true);
      expect(isEffectivelyMissing('   ')).toBe(true);
      expect(isEffectivelyMissing('{username}')).toBe(true);
      expect(isEffectivelyMissing('Valid translation')).toBe(false);
    });
  });

  describe('ICU Message Evaluation', () => {
    it('evaluates plurals accurately across counts', () => {
      const msg = '{count, plural, =0{Zero items} one{1 item} other{# items}}';
      expect(isIcuPlural(msg)).toBe(true);

      const r0 = evaluateIcuMessage(msg, { count: 0 });
      expect(r0.formattedText).toBe('Zero items');

      const r1 = evaluateIcuMessage(msg, { count: 1 });
      expect(r1.formattedText).toBe('1 item');

      const r5 = evaluateIcuMessage(msg, { count: 5 });
      expect(r5.formattedText).toBe('5 items');
    });
  });

  describe('Workspace QA Audit & Auto-Fix', () => {
    it('audits items and fixes whitespace losslessly', () => {
      const items: TranslationItem[] = [
        {
          key: ' app.title ',
          en: 'My App ',
          my: ' ကျွန်ုပ်အက်ပ်',
        },
        {
          key: 'app.missing',
          en: 'Hello {user}',
          my: '',
        },
      ];

      const report = runLocalizationLinter(items, ['en', 'my'], 'en');
      expect(report.totalIssues).toBeGreaterThan(0);
      expect(report.issues.some(i => i.category === 'whitespace')).toBe(true);
      expect(report.issues.some(i => i.category === 'empty')).toBe(true);

      const { updatedItems, fixedCount } = fixAllWhitespaceIssues(items, ['en', 'my']);
      expect(fixedCount).toBe(1);
      expect(updatedItems[0].key).toBe('app.title');
      expect(updatedItems[0].en).toBe('My App');
      expect(updatedItems[0].my).toBe('ကျွန်ုပ်အက်ပ်');
    });
  });

  describe('translationEngine Singleton Facade', () => {
    it('exposes all capabilities through the deep class interface', () => {
      expect(translationEngine.extract('{test}')).toEqual(['{test}']);
      expect(translationEngine.isPlaceholderOnly('{foo}')).toBe(true);
      expect(translationEngine.isEffectivelyMissing('')).toBe(true);
      expect(translationEngine.inspect('a', 'a').effectiveState).toBe('valid');
    });
  });
});
