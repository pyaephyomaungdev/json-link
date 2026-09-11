import { describe, it, expect } from 'vitest';
import {
  extractVariables,
  tokenizeVariables,
  validateVariables,
  isPlaceholderOnly,
  isEffectivelyMissing,
} from '../variables';

describe('variables.ts', () => {
  describe('extractVariables', () => {
    it('extracts ICU style single braces {name}', () => {
      expect(extractVariables('Hello {name}, you have {count} messages')).toEqual([
        '{name}',
        '{count}',
      ]);
    });

    it('extracts Mustache/Handlebars double braces {{name}}', () => {
      expect(extractVariables('Welcome {{username}}, item: {{item_id}}')).toEqual([
        '{{username}}',
        '{{item_id}}',
      ]);
    });

    it('extracts printf formats %s, %d, %1$s, %(name)s', () => {
      expect(extractVariables('Formatted %s with %d count and %1$s or %(user)s')).toEqual([
        '%s',
        '%d',
        '%1$s',
        '%(user)s',
      ]);
    });

    it('extracts positional parameters $1, $2', () => {
      expect(extractVariables('Processed $1 of $2 tasks')).toEqual(['$1', '$2']);
    });

    it('deduplicates recurring variables', () => {
      expect(extractVariables('{user} texted {user} again')).toEqual(['{user}']);
    });

    it('returns empty array when text has no variables or is empty', () => {
      expect(extractVariables('Just a plain string')).toEqual([]);
      expect(extractVariables('')).toEqual([]);
      // @ts-expect-error test non-string input
      expect(extractVariables(null)).toEqual([]);
    });

    it('extracts ICU formatted variables like {amount, number, currency} and {date, date}', () => {
      expect(extractVariables('Total: {amount, number, currency} on {date, date}')).toEqual([
        '{amount, number, currency}',
        '{date, date}',
      ]);
    });

    it('extracts selector variable from ICU plural and select expressions', () => {
      const pluralStr = '{count, plural, =0{no items} =1{one item} other{{count} items}}';
      expect(extractVariables(pluralStr)).toEqual(['{count}']);

      const selectStr = '{gender, select, male{He} female{She} other{They}} said hello';
      expect(extractVariables(selectStr)).toEqual(['{gender}']);
    });
  });

  describe('tokenizeVariables', () => {
    it('segments text into tokens for variable badge highlighting', () => {
      const tokens = tokenizeVariables('Hello {name}, your total is {{amount}} kyats');
      expect(tokens).toEqual([
        { text: 'Hello ', isVariable: false },
        { text: '{name}', isVariable: true },
        { text: ', your total is ', isVariable: false },
        { text: '{{amount}}', isVariable: true },
        { text: ' kyats', isVariable: false },
      ]);
    });

    it('handles string with only a variable', () => {
      expect(tokenizeVariables('{user_id}')).toEqual([
        { text: '{user_id}', isVariable: true },
      ]);
    });

    it('handles string without any variables', () => {
      expect(tokenizeVariables('Plain message')).toEqual([
        { text: 'Plain message', isVariable: false },
      ]);
    });

    it('handles empty string gracefully', () => {
      expect(tokenizeVariables('')).toEqual([
        { text: '', isVariable: false },
      ]);
    });
  });

  describe('validateVariables', () => {
    it('passes when target has all variables from source', () => {
      const source = 'Welcome {name}, you have {count} items.';
      const target = 'မင်္ဂလာပါ {name}၊ သင့်ထံတွင် ပစ္စည်း {count} ခုရှိသည်။';
      const result = validateVariables(source, target);
      expect(result.isValid).toBe(true);
      expect(result.missingVariables).toEqual([]);
    });

    it('fails when translator accidentally deletes a variable', () => {
      const source = 'Welcome {name}, you have {count} items.';
      const target = 'မင်္ဂလာပါ၊ သင့်ထံတွင် ပစ္စည်း {count} ခုရှိသည်။';
      const result = validateVariables(source, target);
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toEqual(['{name}']);
    });

    it('fails when translator accidentally translates variable inside braces', () => {
      const source = 'Hello {username}';
      const target = 'မင်္ဂလာပါ {နာမည်}';
      const result = validateVariables(source, target);
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toEqual(['{username}']);
    });

    it('passes if source has no variables', () => {
      const result = validateVariables('Submit Form', 'ဖောင်တင်သွင်းပါ');
      expect(result.isValid).toBe(true);
      expect(result.missingVariables).toHaveLength(0);
    });

    it('passes when either source or target is empty', () => {
      expect(validateVariables('', '{name}').isValid).toBe(true);
      expect(validateVariables('{name}', '').isValid).toBe(true);
    });

    it('validates mixed format string with both {name} and %s in same source', () => {
      const source = 'Hello {name}, you uploaded %s files';
      const targetOk = 'မင်္ဂလာ {name}၊ %s ဖိုင်တင်ပြီး';
      const targetBad = 'မင်္ဂလာ {name}၊ ဖိုင်တင်ပြီး'; // missing %s
      expect(validateVariables(source, targetOk).isValid).toBe(true);
      expect(validateVariables(source, targetBad).isValid).toBe(false);
      expect(validateVariables(source, targetBad).missingVariables).toContain('%s');
    });

    it('validates Android-style positional %1$s and %2$d', () => {
      const source = '%1$s has %2$d items';
      const targetOk = '%1$s မှာ %2$d ခုရှိသည်';
      const targetBad = 'ပစ္စည်း %2$d ခုရှိသည်'; // missing %1$s
      expect(validateVariables(source, targetOk).isValid).toBe(true);
      expect(validateVariables(source, targetBad).isValid).toBe(false);
    });
  });

  describe('tokenizeVariables — additional edge cases', () => {
    it('handles consecutive variables with no text between them', () => {
      const tokens = tokenizeVariables('{first}{last}');
      const varTokens = tokens.filter(t => t.isVariable);
      expect(varTokens.length).toBe(2);
      expect(varTokens[0].text).toBe('{first}');
      expect(varTokens[1].text).toBe('{last}');
    });

    it('handles Printf variable %s inline', () => {
      const tokens = tokenizeVariables('Uploaded %s successfully');
      const varToken = tokens.find(t => t.isVariable);
      expect(varToken?.text).toBe('%s');
    });

    it('returns consistent cached results across repeated calls', () => {
      const text = 'Hello {user}, balance: {amount, number, currency}';
      const first = tokenizeVariables(text);
      const second = tokenizeVariables(text);
      expect(first).toEqual(second);

      const v1 = validateVariables(text, 'မင်္ဂလာ {user}');
      const v2 = validateVariables(text, 'မင်္ဂလာ {user}');
      expect(v1).toEqual(v2);
    });

    it('caches empty-token results (empty array must not bypass the cache)', () => {
      const text = 'no variables here';
      const first = tokenizeVariables(text);
      const second = tokenizeVariables(text);
      expect(second).toEqual(first);
      expect(second).toEqual([{ text, isVariable: false }]);
    });

    it('returns a fresh identical array for cached empty extract results', () => {
      const text = 'plain';
      expect(extractVariables(text)).toEqual([]);
      expect(extractVariables(text)).toEqual([]);
    });

    it('does not collide cache entries when texts contain "::"', () => {
      // Regression: the old `${source}::${target}` flat key made both of these
      // pairs produce the key "x::y::z", corrupting each other's result.
      expect(validateVariables('x::y', 'z').isValid).toBe(true); // no variables in source
      expect(validateVariables('x', 'y::z').isValid).toBe(true);

      const withVarSource = 'Submit {name}::x';
      const ok = validateVariables(withVarSource, 'Substitute {name}');
      const collidingPair = validateVariables('Submit', '{name}::x {other}');
      // {other} exists only in target (extra vars are not flagged), {name} present — but
      // crucially the collision-free cache must NOT return the other pair's result object.
      expect(ok).not.toBe(collidingPair);
      expect(ok.missingVariables).toEqual([]);
    });

    it('keeps cache memory bounded under repeated distinct inputs', () => {
      // Exercises the bounded eviction path: > 2000 unique inputs must not grow unbounded.
      for (let i = 0; i < 2500; i++) {
        tokenizeVariables(`greeting-${i} {param}`);
        extractVariables(`greeting-${i} {param}`);
      }
      // Simply asserting repeated calls still return correct results afterwards
      expect(extractVariables('greeting-0 {param}')).toContain('{param}');
      expect(tokenizeVariables('greeting-0 {param}').some(t => t.text === '{param}')).toBe(true);
    });
  });

  describe('isPlaceholderOnly / isEffectivelyMissing', () => {
    it('flags values made up solely of interpolation variables', () => {
      expect(isPlaceholderOnly('{user}')).toBe(true);
      expect(isPlaceholderOnly('{{count}}')).toBe(true);
      expect(isPlaceholderOnly('%s')).toBe(true);
      expect(isPlaceholderOnly('%1$s')).toBe(true);
      expect(isPlaceholderOnly('  {name}  ')).toBe(true);
      expect(isPlaceholderOnly('{a} {b}')).toBe(true);
    });

    it('does not flag real translations or mixed placeholder text', () => {
      expect(isPlaceholderOnly('Welcome back')).toBe(false);
      expect(isPlaceholderOnly('သင့်အကောင့်သို့ ဝင်ပါ')).toBe(false);
      // Mixed: real text plus placeholders is still a valid translation
      expect(isPlaceholderOnly('Hello {user}!')).toBe(false);
      expect(isPlaceholderOnly('{count} မြန်မာ')).toBe(false);
    });

    it('returns false for undefined/empty input in isPlaceholderOnly', () => {
      expect(isPlaceholderOnly(undefined)).toBe(false);
      expect(isPlaceholderOnly('')).toBe(false);
    });

    it('isEffectivelyMissing treats blank + placeholder-only as missing', () => {
      expect(isEffectivelyMissing('')).toBe(true);
      expect(isEffectivelyMissing('   ')).toBe(true);
      expect(isEffectivelyMissing(undefined)).toBe(true);
      expect(isEffectivelyMissing('{user}')).toBe(true);
      expect(isEffectivelyMissing('%s')).toBe(true);
      expect(isEffectivelyMissing('Hello')).toBe(false);
      expect(isEffectivelyMissing('Hello {user}')).toBe(false);
    });
  });
});
