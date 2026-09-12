export interface PasswordStrengthResult {
  score: 'weak' | 'fair' | 'strong';
  label: string;
  colorClass: string;
  barColorClass: string;
  percent: number;
}

/**
 * Pure client-side password strength evaluator for local AES-256 encryption.
 * Encourages safer passwords without blocking the user arbitrarily.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const trimmed = password.trim();

  if (!trimmed || trimmed.length < 6) {
    return {
      score: 'weak',
      label: 'Too short (min 6 chars recommended)',
      colorClass: 'text-rose-500 dark:text-rose-400',
      barColorClass: 'bg-rose-500',
      percent: trimmed.length > 0 ? 25 : 0,
    };
  }

  let varietyScore = 0;
  if (/[a-z]/.test(trimmed)) varietyScore++;
  if (/[A-Z]/.test(trimmed)) varietyScore++;
  if (/[0-9]/.test(trimmed)) varietyScore++;
  if (/[^a-zA-Z0-9]/.test(trimmed)) varietyScore++;

  if (trimmed.length >= 10 && varietyScore >= 3) {
    return {
      score: 'strong',
      label: 'Strong password',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      barColorClass: 'bg-emerald-500',
      percent: 100,
    };
  }

  if (trimmed.length >= 8 && varietyScore >= 2) {
    return {
      score: 'fair',
      label: 'Fair strength',
      colorClass: 'text-amber-600 dark:text-amber-400',
      barColorClass: 'bg-amber-500',
      percent: 65,
    };
  }

  return {
    score: 'weak',
    label: 'Weak (add numbers or uppercase)',
    colorClass: 'text-rose-500 dark:text-rose-400',
    barColorClass: 'bg-rose-500',
    percent: 35,
  };
}
