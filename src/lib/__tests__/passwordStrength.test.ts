import { describe, it, expect } from 'vitest';
import { evaluatePasswordStrength } from '../passwordStrength';

describe('passwordStrength', () => {
  it('identifies short passwords as weak', () => {
    expect(evaluatePasswordStrength('').score).toBe('weak');
    expect(evaluatePasswordStrength('abc').score).toBe('weak');
    expect(evaluatePasswordStrength('12345').score).toBe('weak');
  });

  it('identifies moderate passwords as fair', () => {
    const res = evaluatePasswordStrength('password123');
    expect(res.score).toBe('fair');
    expect(res.percent).toBe(65);
  });

  it('identifies complex passwords as strong', () => {
    const res = evaluatePasswordStrength('ComplexP@ssw0rd2026');
    expect(res.score).toBe('strong');
    expect(res.percent).toBe(100);
  });
});
