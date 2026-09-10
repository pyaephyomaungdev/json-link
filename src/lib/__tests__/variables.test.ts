import { describe, it, expect } from 'vitest';
import {
  extractVariables,
  tokenizeVariables,
  validateVariables,
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
  });
});
