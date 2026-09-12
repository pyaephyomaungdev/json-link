import { describe, it, expect } from 'vitest';
import { evaluateIcuMessage, isIcuPlural, extractVariables } from '../icuEvaluator';

describe('icuEvaluator.ts', () => {
  it('detects ICU plural expression', () => {
    expect(isIcuPlural('{count, plural, one{1 item} other{# items}}')).toBe(true);
    expect(isIcuPlural('Hello {username}!')).toBe(false);
  });

  it('extracts variable names', () => {
    const vars = extractVariables('Hello {username}, you have {count, plural, other{#}} messages!');
    expect(vars).toContain('username');
    expect(vars).toContain('count');
  });

  it('evaluates ICU plural forms correctly for count = 0, 1, and 5', () => {
    const msg = '{count, plural, =0{No notifications} one{1 notification} other{# notifications}}';

    const res0 = evaluateIcuMessage(msg, { count: 0 }, 'en');
    expect(res0.formattedText).toBe('No notifications');

    const res1 = evaluateIcuMessage(msg, { count: 1 }, 'en');
    expect(res1.formattedText).toBe('1 notification');

    const res5 = evaluateIcuMessage(msg, { count: 5 }, 'en');
    expect(res5.formattedText).toBe('5 notifications');
  });

  it('evaluates variable interpolation alongside plural syntax', () => {
    const msg = 'Hi {name}! {count, plural, one{You have 1 unread message} other{You have # unread messages}}';

    const result = evaluateIcuMessage(msg, { name: 'Alice', count: 3 }, 'en');
    expect(result.formattedText).toBe('Hi Alice! You have 3 unread messages');
  });
});
