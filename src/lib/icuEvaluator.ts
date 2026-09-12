/**
 * Lightweight ICU MessageFormat & Plural Evaluator
 * Supports:
 * - Plural syntax: {count, plural, =0{no items} one{1 item} other{# items}}
 * - Variable interpolation: {name}, {{username}}, %s, $1
 * - Native Intl.PluralRules for accurate linguistic plural rules per locale
 */

export interface IcuEvaluationResult {
  formattedText: string;
  isPlural: boolean;
  pluralVarName?: string;
  detectedVariables: string[];
}

/** Extract all variable names from a translation string */
export function extractVariables(message: string): string[] {
  const vars = new Set<string>();

  // Matches {variable}, {variable, plural, ...}
  const curlyRegex = /\{([a-zA-Z0-9_-]+)(?:,\s*[a-zA-Z]+)?/g;
  let match;
  while ((match = curlyRegex.exec(message)) !== null) {
    vars.add(match[1]);
  }

  // Matches {{variable}}
  const doubleCurlyRegex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
  while ((match = doubleCurlyRegex.exec(message)) !== null) {
    vars.add(match[1]);
  }

  return Array.from(vars);
}

/** Check if a string contains an ICU plural expression */
export function isIcuPlural(message: string): boolean {
  return /\{[a-zA-Z0-9_-]+,\s*plural,/i.test(message);
}

/**
 * Evaluate an ICU formatted message with variable parameters and count
 */
export function evaluateIcuMessage(
  message: string,
  params: Record<string, string | number> = {},
  locale = 'en'
): IcuEvaluationResult {
  const detectedVariables = extractVariables(message);
  let isPlural = false;
  let pluralVarName: string | undefined;

  // Balance braces to extract {varName, plural, ...nested...}
  const pluralMarker = /\{([a-zA-Z0-9_-]+),\s*plural,/i;
  const markerMatch = pluralMarker.exec(message);

  let resultText = message;

  if (markerMatch) {
    const startIndex = markerMatch.index;
    let depth = 0;
    let endIndex = -1;

    for (let i = startIndex; i < message.length; i++) {
      if (message[i] === '{') depth++;
      else if (message[i] === '}') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex !== -1) {
      isPlural = true;
      pluralVarName = markerMatch[1];
      const rawBranches = message.slice(startIndex + markerMatch[0].length, endIndex);

      const rawCount = params[pluralVarName] !== undefined ? Number(params[pluralVarName]) : 0;
      const count = isNaN(rawCount) ? 0 : rawCount;

      // Parse branches: =0{...} =1{...} one{...} other{...}
      const branchRegex = /(=[0-9]+|[a-zA-Z]+)\s*\{([^}]*)\}/g;
      const branches: Record<string, string> = {};
      let bMatch;
      while ((bMatch = branchRegex.exec(rawBranches)) !== null) {
        branches[bMatch[1]] = bMatch[2];
      }

      // Determine target branch
      let selectedBranchContent = '';
      const exactMatchKey = `=${count}`;

      if (branches[exactMatchKey] !== undefined) {
        selectedBranchContent = branches[exactMatchKey];
      } else {
        // Use Intl.PluralRules according to locale
        let rule = 'other';
        try {
          const pr = new Intl.PluralRules(locale);
          rule = pr.select(count);
        } catch {
          rule = count === 1 ? 'one' : 'other';
        }

        selectedBranchContent =
          branches[rule] !== undefined
            ? branches[rule]
            : branches['other'] || Object.values(branches)[0] || '';
      }

      // Replace '#' with the number
      const expandedBranch = selectedBranchContent.replace(/#/g, String(count));

      // Substitute back into message
      resultText = message.slice(0, startIndex) + expandedBranch + message.slice(endIndex + 1);
    }
  }

  // Replace remaining variable placeholders: {param} and {{param}}
  for (const [key, val] of Object.entries(params)) {
    const valStr = String(val);
    resultText = resultText
      .replace(new RegExp(`\\{${key}\\}`, 'g'), valStr)
      .replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), valStr);
  }

  return {
    formattedText: resultText,
    isPlural,
    pluralVarName,
    detectedVariables,
  };
}
