/**
 * Myanmar Font Utilities: Unicode ⇄ Zawgyi Detection & Conversion.
 * Based on standardized Parabaik / Rabbit rule set.
 */

// Regex patterns strictly characteristic of Zawgyi encoding
const ZAWGYI_REGEX = new RegExp(
  [
    '[\u1060-\u1097]', // Zawgyi specific code points
    '\u1031[\u1000-\u1021]', // Pre-posed e-vowel followed by consonant
    '[\u107e-\u1085]', // Zawgyi medials
    '\u103b[\u1000-\u1021]', // Pre-posed ya-yit
    '\u1039[^\u1000-\u1021]', // Stack virama not followed by consonant
    '\u1033', // Zawgyi u vowel
    '\u1034', // Zawgyi uu vowel
    '\u1088', '\u1089', '\u108a', // Zawgyi tone marks
    '\u1064', '\u106b', // Zawgyi medials
  ].join('|')
);

// Regex patterns characteristic of standard Myanmar Unicode
const UNICODE_REGEX = new RegExp(
  [
    '[\u1000-\u1021]\u103c', // Consonant + ya-yit
    '[\u1000-\u1021]\u103b', // Consonant + ya-pin
    '[\u1000-\u1021]\u103d', // Consonant + wa-hswae
    '[\u1000-\u1021]\u103e', // Consonant + ha-hto
    '[\u1000-\u1021]\u1039[\u1000-\u1021]', // Stacking virama
    '\u1004\u103a\u1039', // Kinzi
    '[\u1000-\u1021]\u1031', // Consonant + post-posed e-vowel
    '\u103a[\u1038\u1037]', // Asat + tone marks
  ].join('|')
);

/**
 * Detects whether a string is encoded in Zawgyi or Unicode.
 * Returns true if Zawgyi is detected with higher confidence than Unicode.
 */
export function isZawgyi(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  // Count Zawgyi-specific signatures
  const zgMatches = text.match(new RegExp(ZAWGYI_REGEX.source, 'g')) || [];
  const uniMatches = text.match(new RegExp(UNICODE_REGEX.source, 'g')) || [];

  if (zgMatches.length > 0 && uniMatches.length === 0) {
    return true;
  }

  return zgMatches.length > uniMatches.length;
}

/**
 * Scans an array of records to check if a specific language column contains Zawgyi text.
 */
export function detectZawgyiInItems(
  items: { [key: string]: any }[],
  lang: string
): { hasZawgyi: boolean; count: number } {
  let count = 0;
  for (const item of items) {
    const val = item[lang];
    if (typeof val === 'string' && isZawgyi(val)) {
      count++;
    }
  }
  return {
    hasZawgyi: count > 0,
    count,
  };
}

/**
 * Converts Zawgyi text into standard Myanmar Unicode (Pyidaungsu / Noto Sans).
 */
export function zawgyiToUnicode(text: string): string {
  if (!text) return '';

  let output = text;

  // 1. Kinzi reordering (\u1064 -> \u1004\u103a\u1039)
  output = output.replace(/\u1064/g, '\u1004\u103a\u1039');

  // 2. Ya-yit (\u103b / \u107e-\u1084 before consonant -> consonant + \u103c in Unicode)
  output = output.replace(/([\u107e-\u1084\u103b]+)([\u1000-\u1021])/g, '$2\u103c');

  // 3. Pre-posed e-vowel (\u1031 before consonant -> consonant + \u1031 in Unicode)
  output = output.replace(/\u1031([\u1000-\u1021])/g, '$1\u1031');

  // 4. Medial wa and ha combinations
  output = output.replace(/\u108a/g, '\u103d\u103e'); // wa-hswae + ha-hto
  output = output.replace(/\u1087/g, '\u103d'); // wa-hswae
  output = output.replace(/\u1088/g, '\u103e'); // ha-hto
  output = output.replace(/\u1089/g, '\u103e'); // ha-hto

  // 5. U / UU vowels
  output = output.replace(/\u1033/g, '\u102f');
  output = output.replace(/\u1034/g, '\u1030');

  // 6. Asat and Virama cleanup
  output = output.replace(/\u1039([\u1000-\u1021])/g, '\u1039$1');
  output = output.replace(/\u1025\u102e/g, '\u100Filled'); // cleanup

  // 7. Tall AA (\u106a -> \u102b, \u106b -> \u102c)
  output = output.replace(/\u106a/g, '\u102b');
  output = output.replace(/\u106b/g, '\u102c');

  // 8. Great Sa (\u1060 / \u1061 -> \u1039\u1000 / \u1039\u1001)
  output = output.replace(/\u1060/g, '\u1039\u1000');
  output = output.replace(/\u1061/g, '\u1039\u1001');

  // 9. Reorder common vowels: Consonant + E + AA -> Consonant + E + AA
  output = output.replace(/([\u1000-\u1021])\u103c\u1031/g, '$1\u1031\u103c');

  // Fix storage ordering for standard Unicode: Consonant + Medials + E + Upper/Lower Vowels + Anusvara + Asat + Tone
  output = output.replace(
    /([\u1000-\u1021])(\u103c)?(\u103b)?(\u103d)?(\u103e)?\u1031([\u102d\u102e])?([\u102f\u1030])?(\u1036)?(\u103a)?(\u1038|\u1037)?/g,
    (_, c, yayit, yapin, wahswe, hahto, i_ii, u_uu, anusvara, asat, tone) => {
      let res = c;
      if (yapin) res += yapin;
      if (yayit) res += yayit;
      if (wahswe) res += wahswe;
      if (hahto) res += hahto;
      res += '\u1031';
      if (i_ii) res += i_ii;
      if (u_uu) res += u_uu;
      if (asat) res += asat;
      if (anusvara) res += anusvara;
      if (tone) res += tone;
      return res;
    }
  );

  return output;
}

/**
 * Converts Unicode text into Zawgyi (useful for exporting to legacy clients).
 */
export function unicodeToZawgyi(text: string): string {
  if (!text) return '';

  let output = text;

  // 1. Move e-vowel before consonant: Consonant + \u1031 -> \u1031 + Consonant
  output = output.replace(/([\u1000-\u1021])\u1031/g, '\u1031$1');

  // 2. Move ya-yit before consonant in Zawgyi: Consonant + \u103c -> \u103b + Consonant
  output = output.replace(/([\u1000-\u1021])\u103c/g, '\u103b$1');

  // 3. Tall AA
  output = output.replace(/\u102b/g, '\u106a');

  // 4. Medials
  output = output.replace(/\u103d\u103e/g, '\u108a');
  output = output.replace(/\u103d/g, '\u1087');
  output = output.replace(/\u103e/g, '\u1088');

  // 5. U / UU vowels
  output = output.replace(/\u102f/g, '\u1033');
  output = output.replace(/\u1030/g, '\u1034');

  return output;
}
