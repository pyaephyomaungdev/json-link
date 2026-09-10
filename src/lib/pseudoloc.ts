import { tokenizeVariables } from './variables';

const PSEUDO_MAP: Record<string, string> = {
  a: 'à', b: 'ƀ', c: 'ç', d: 'ð', e: 'è', f: 'ƒ', g: 'ğ', h: 'ĥ', i: 'î',
  j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ö', p: 'þ', q: 'q', r: 'ř',
  s: 'š', t: 'ţ', u: 'û', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'À', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'È', F: 'Ƒ', G: 'Ğ', H: 'Ĥ', I: 'Î',
  J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ', N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Q', R: 'Ř',
  S: 'Š', T: 'Ţ', U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
};

export interface PseudolocOptions {
  expandRatio?: number; // e.g. 0.35 = 35% longer (default 0.35)
  brackets?: boolean; // wrap in [!!! ... !!!] (default true)
}

/**
 * Pseudolocalizes a string for UI stress testing:
 * - Transforms ASCII letters into accented homoglyphs
 * - Expands string length by ~35% to test layout and button boundaries
 * - Strictly preserves i18n interpolation variables ({name}, %s, {{count}}) untouched
 * - Wraps in [!!! ... !!!] delimiters to easily spot text truncation in UI
 */
export function pseudolocalize(text: string, options: PseudolocOptions = {}): string {
  if (!text || typeof text !== 'string') return '';

  const { expandRatio = 0.35, brackets = true } = options;
  const tokens = tokenizeVariables(text);

  let transformed = '';
  let plainCharCount = 0;

  for (const token of tokens) {
    if (token.isVariable) {
      // Variables must remain untouched!
      transformed += token.text;
    } else {
      let segment = '';
      for (const char of token.text) {
        segment += PSEUDO_MAP[char] || char;
        if (/[a-zA-Z]/.test(char)) plainCharCount++;
      }
      transformed += segment;
    }
  }

  // Calculate length expansion padding
  if (expandRatio > 0 && plainCharCount > 0) {
    const padLength = Math.max(2, Math.round(plainCharCount * expandRatio));
    // Pad with repeating accented vowels
    const padChars = 'àèîöû';
    let pad = ' ';
    for (let i = 0; i < padLength; i++) {
      pad += padChars[i % padChars.length];
    }
    transformed += pad;
  }

  return brackets ? `[!!! ${transformed} !!!]` : transformed;
}

/**
 * Generates a full pseudo-localized dictionary column from a source language.
 */
export function generatePseudoLocaleRecords(
  items: { key: string; [lang: string]: any }[],
  sourceLang: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of items) {
    const sourceText = item[sourceLang] || item.key;
    result[item.key] = pseudolocalize(sourceText);
  }
  return result;
}
