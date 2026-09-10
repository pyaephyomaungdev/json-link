/**
 * Variable extraction, tokenization and validation for i18n localization
 * Supports:
 * - ICU MessageFormat / Simple braces: {name}, {count}, {0}
 * - Mustache / Handlebars: {{name}}, {{count}}
 * - C / PHP / Python sprintf format: %s, %d, %1$s, %(name)s, %.2f
 * - Positional parameters: $1, $name
 */

// Regex pattern covering common i18n interpolation variables
const VARIABLE_REGEX = /(?:\{\{[a-zA-Z0-9_.-]+\}\}|\{[a-zA-Z0-9_.-]+\}|%[0-9]*\$?[a-zA-Z]|%\([a-zA-Z0-9_.-]+\)[a-zA-Z]|\$[0-9]+)/g;

/**
 * Extracts all unique interpolation variables from a string.
 */
export function extractVariables(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(VARIABLE_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export interface TokenPart {
  text: string;
  isVariable: boolean;
}

/**
 * Tokenizes text into plain text segments and variable segments for UI highlighting.
 */
export function tokenizeVariables(text: string): TokenPart[] {
  if (!text || typeof text !== 'string') return [{ text: '', isVariable: false }];

  const tokens: TokenPart[] = [];
  let lastIndex = 0;
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Leading plain text
    if (match.index > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, match.index),
        isVariable: false,
      });
    }

    // Variable token
    tokens.push({
      text: match[0],
      isVariable: true,
    });

    lastIndex = regex.lastIndex;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    tokens.push({
      text: text.slice(lastIndex),
      isVariable: false,
    });
  }

  return tokens.length > 0 ? tokens : [{ text, isVariable: false }];
}

export interface VariableValidationResult {
  isValid: boolean;
  missingVariables: string[];
  extraVariables: string[];
}

/**
 * Compares target translation against source string for missing or corrupted variables.
 */
export function validateVariables(
  sourceText: string,
  targetText: string
): VariableValidationResult {
  // If either text is empty or blank, validation is considered pending/pass
  if (!sourceText?.trim() || !targetText?.trim()) {
    return { isValid: true, missingVariables: [], extraVariables: [] };
  }

  const sourceVars = extractVariables(sourceText);
  if (sourceVars.length === 0) {
    return { isValid: true, missingVariables: [], extraVariables: [] };
  }

  const targetVars = new Set(extractVariables(targetText));
  const missingVariables: string[] = [];

  for (const v of sourceVars) {
    if (!targetVars.has(v)) {
      missingVariables.push(v);
    }
  }

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
    extraVariables: [],
  };
}
