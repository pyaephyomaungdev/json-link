/**
 * Myanmar Font Utilities: Unicode ⇄ Zawgyi Detection & Conversion.
 * Powered by standardized Rabbit algorithm (MIT License, Saturngod & Myanmar Open Source Community).
 */

interface Rule {
  pattern: RegExp;
  to: string;
}

const ZG_REGEX = new RegExp(
  [
    '[\u1060-\u1097]', // Zawgyi-specific glyph ranges (stacked consonants, medials, tall vowels)
    '\u1033', '\u1034', // Zawgyi u/uu vowels
    '(?:^|[\s\u104a\u104b\u103a\u1037\u1038\u102c\u102b\u102d\u102e\u102f\u1030\u1032\u1036])\u1031[\u1000-\u1021]', // Pre-posed e-vowel
    '(?:^|[\s\u104a\u104b\u103a\u1037\u1038\u102c\u102b\u102d\u102e\u102f\u1030\u1032\u1036])\u103b[\u1000-\u1021]', // Pre-posed ya-yit
    '\u1039[^\u1000-\u1021]', // Stacking virama not followed by consonant
    '\u104e\u1004\u103a\u1038', // Zawgyi ၎င်္း
    '\u103c\u1031', // ya-yit before e-vowel
    '\u102d\u103a|\u103a\u102d', // Zawgyi stacked tone marks
  ].join('|')
);

/**
 * Detects whether a string contains Zawgyi encoded text.
 */
export function isZawgyi(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return ZG_REGEX.test(text);
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

const RAW_ZG2UNI: { from: string; to: string }[] = [
  {
    "from": "([ိီွု့႕])\\1+",
    "to": "$1"
  },
  {
    "from": "​",
    "to": ""
  },
  {
    "from": "ွြ",
    "to": "ႊ"
  },
  {
    "from": "(ွ|ႇ)",
    "to": "ှ"
  },
  {
    "from": "ြ",
    "to": "ွ"
  },
  {
    "from": "(ျ|ၾ|ၿ|ႀ|ႁ|ႂ|ႃ|ႄ)",
    "to": "ြ"
  },
  {
    "from": "(်|ၽ)",
    "to": "ျ"
  },
  {
    "from": "္",
    "to": "်"
  },
  {
    "from": "(ၦ|ၧ)",
    "to": "္ဆ"
  },
  {
    "from": "ၪ",
    "to": "ဉ"
  },
  {
    "from": "ၫ",
    "to": "ည"
  },
  {
    "from": "ၬ",
    "to": "္ဋ"
  },
  {
    "from": "ၭ",
    "to": "္ဌ"
  },
  {
    "from": "ၮ",
    "to": "ဍ္ဍ"
  },
  {
    "from": "ၯ",
    "to": "ဍ္ဎ"
  },
  {
    "from": "ၰ",
    "to": "္ဏ"
  },
  {
    "from": "(ၱ|ၲ)",
    "to": "္တ"
  },
  {
    "from": "ၠ",
    "to": "္က"
  },
  {
    "from": "ၡ",
    "to": "္ခ"
  },
  {
    "from": "ၢ",
    "to": "္ဂ"
  },
  {
    "from": "ၣ",
    "to": "္ဃ"
  },
  {
    "from": "ၥ",
    "to": "္စ"
  },
  {
    "from": "ၨ",
    "to": "္ဇ"
  },
  {
    "from": "ၩ",
    "to": "္ဈ"
  },
  {
    "from": "(ၳ|ၴ)",
    "to": "္ထ"
  },
  {
    "from": "ၵ",
    "to": "္ဒ"
  },
  {
    "from": "ၶ",
    "to": "္ဓ"
  },
  {
    "from": "ၷ",
    "to": "္န"
  },
  {
    "from": "ၸ",
    "to": "္ပ"
  },
  {
    "from": "ၹ",
    "to": "္ဖ"
  },
  {
    "from": "ၺ",
    "to": "္ဗ"
  },
  {
    "from": "ၼ",
    "to": "္မ"
  },
  {
    "from": "ႅ",
    "to": "္လ"
  },
  {
    "from": "ဳ",
    "to": "ု"
  },
  {
    "from": "ဴ",
    "to": "ူ"
  },
  {
    "from": "ဿ",
    "to": "ူ"
  },
  {
    "from": "ႆ",
    "to": "ဿ"
  },
  {
    "from": "ံႈ",
    "to": "ႈံ"
  },
  {
    "from": "ႈ",
    "to": "ှု"
  },
  {
    "from": "ႉ",
    "to": "ှူ"
  },
  {
    "from": "ႊ",
    "to": "ွှ"
  },
  {
    "from": "ျၤ",
    "to": "ၤျ"
  },
  {
    "from": "ြ([က-အ])([ၤႋႍ])",
    "to": "$1ြ$2"
  },
  {
    "from": "(ေ)?([က-အ၀-၉])(ြ)?ၤ",
    "to": "င်္$1$2$3"
  },
  {
    "from": "(ေ)?([က-အ])(ျ|ြ)?ႋ",
    "to": "င်္$1$2$3ိ"
  },
  {
    "from": "(ေ)?([က-အ])(ျ)?ႌ",
    "to": "င်္$1$2$3ီ"
  },
  {
    "from": "(ေ)?([က-အ])([ျြ])?ႍ",
    "to": "င်္$1$2$3ံ"
  },
  {
    "from": "ႎ",
    "to": "ိံ"
  },
  {
    "from": "ႏ",
    "to": "န"
  },
  {
    "from": "႐",
    "to": "ရ"
  },
  {
    "from": "႑",
    "to": "ဏ္ဍ"
  },
  {
    "from": "႒",
    "to": "ဋ္ဌ"
  },
  {
    "from": "မာ(ၻ|႓)",
    "to": "မ္ဘာ"
  },
  {
    "from": "(ၻ|႓)",
    "to": "္ဘ"
  },
  {
    "from": "(႔|႕)",
    "to": "့"
  },
  {
    "from": "([က-အ])့ဲ",
    "to": "$1ဲ့"
  },
  {
    "from": "႖",
    "to": "္တွ"
  },
  {
    "from": "႗",
    "to": "ဋ္ဋ"
  },
  {
    "from": "ြ([က-အ])([က-အ])?",
    "to": "$1ြ$2"
  },
  {
    "from": "([က-အ])ြ်",
    "to": "ြ$1်"
  },
  {
    "from": "၇(?=[ာ-ူဲံ-းွး])",
    "to": "ရ"
  },
  {
    "from": "ေ၇",
    "to": "ေရ"
  },
  {
    "from": "၀(ီ|ု|ို|ူ|ံ|ွ|ှ)",
    "to": "ဝ$1"
  },
  {
    "from": "([^၀၁၂၃၄၅၆၇၈၉])၀ါ",
    "to": "$1ဝါ"
  },
  {
    "from": "([၀၁၂၃၄၅၆၇၈၉])၀ါ(?!း)",
    "to": "$1ဝါ"
  },
  {
    "from": "^၀(?=ါ)",
    "to": "ဝ"
  },
  {
    "from": "၀ိ(?! ?/)",
    "to": "ဝိ"
  },
  {
    "from": "([^၀-၉])၀([^၀-၉ ]|[၊။])",
    "to": "$1ဝ$2"
  },
  {
    "from": "([^၀-၉])၀(?=[\\f\\n\\r])",
    "to": "$1ဝ"
  },
  {
    "from": "([^၀-၉])၀$",
    "to": "$1ဝ"
  },
  {
    "from": "ေ([က-အဿ])(ှ)?(ျ)?",
    "to": "$1$2$3ေ"
  },
  {
    "from": "([က-အ])ေ([ျြွှ]+)",
    "to": "$1$2ေ"
  },
  {
    "from": "ဲွ",
    "to": "ွဲ"
  },
  {
    "from": "([ိီ])ျ",
    "to": "ျ$1"
  },
  {
    "from": "ွျ",
    "to": "ျွ"
  },
  {
    "from": "့်",
    "to": "့်"
  },
  {
    "from": "ု(ိ|ီ|ံ|့)ု",
    "to": "ု$1"
  },
  {
    "from": "(ု|ူ)(ိ|ီ)",
    "to": "$2$1"
  },
  {
    "from": "(ှ)(ျ|ြ)",
    "to": "$2$1"
  },
  {
    "from": "ဥ(?=[့]?[်ာ])",
    "to": "ဉ"
  },
  {
    "from": "ဦ",
    "to": "ဦ"
  },
  {
    "from": "စျ",
    "to": "ဈ"
  },
  {
    "from": "ံ(ု|ူ)",
    "to": "$1ံ"
  },
  {
    "from": "ေ့ှ",
    "to": "ှေ့"
  },
  {
    "from": "ေှာ",
    "to": "ှော"
  },
  {
    "from": "ၚ",
    "to": "ါ်"
  },
  {
    "from": "ေျှ",
    "to": "ျှေ"
  },
  {
    "from": "(ိ|ီ)(ွ|ှ)",
    "to": "$2$1"
  },
  {
    "from": "ာ္([က-အ])",
    "to": "္$1ာ"
  },
  {
    "from": "္ြ်္([က-အ])",
    "to": "်္$1ြ"
  },
  {
    "from": "ြ္([က-အ])",
    "to": "္$1ြ"
  },
  {
    "from": "ံ္([က-အ])",
    "to": "္$1ံ"
  },
  {
    "from": "၎",
    "to": "၎င်း"
  },
  {
    "from": "၀(ါ|ာ|ံ)",
    "to": "ဝ$1"
  },
  {
    "from": "ဥ္",
    "to": "ဉ္"
  },
  {
    "from": "([က-အ])ြေွ",
    "to": "$1ြွေ"
  },
  {
    "from": "([က-အ])ျေွ(ှ)?",
    "to": "$1ျွ$2ေ"
  },
  {
    "from": "([က-အ])ွေျ",
    "to": "$1ျွေ"
  },
  {
    "from": "([က-အ])ေ(္[က-အ]ွ?)",
    "to": "$1$2ေ"
  },
  {
    "from": "း်",
    "to": "်း"
  },
  {
    "from": "ိ်|်ိ",
    "to": "ိ"
  },
  {
    "from": "ို်",
    "to": "ို"
  },
  {
    "from": " ့",
    "to": "့"
  },
  {
    "from": "့ံ",
    "to": "ံ့"
  },
  {
    "from": "[ိ]+",
    "to": "ိ"
  },
  {
    "from": "[်]+",
    "to": "်"
  },
  {
    "from": "[ွ]+",
    "to": "ွ"
  },
  {
    "from": "[့]+",
    "to": "့"
  },
  {
    "from": "[ီ]+",
    "to": "ီ"
  },
  {
    "from": "ိီ|ီိ",
    "to": "ီ"
  },
  {
    "from": "ုိ",
    "to": "ို"
  },
  {
    "from": "့့",
    "to": "့"
  },
  {
    "from": "ဲဲ",
    "to": "ဲ"
  },
  {
    "from": "၄င်း",
    "to": "၎င်း"
  },
  {
    "from": "([ိီ])္([က-အ])",
    "to": "္$2$1"
  },
  {
    "from": "(ြေ)္([က-အ])",
    "to": "္$2$1"
  },
  {
    "from": "ံွ",
    "to": "ွံ"
  },
  {
    "from": "၇((?=[က-အ]်)|(?=[ာ-ူဲံ-းွှ]))",
    "to": "ရ"
  }
];

const RAW_UNI2ZG: { from: string; to: string }[] = [
  {
    "from": "င်္",
    "to": "ၤ"
  },
  {
    "from": "္တွ",
    "to": "႖"
  },
  {
    "from": "ါ်",
    "to": "ၚ"
  },
  {
    "from": "ိံ",
    "to": "ႎ"
  },
  {
    "from": "၎င်း",
    "to": "၎"
  },
  {
    "from": "[ဥဉ](?=္)",
    "to": "ၪ"
  },
  {
    "from": "ဉ(?=[ုူ])",
    "to": "ဥ"
  },
  {
    "from": "[ဥဉ](?=[့]?[်])",
    "to": "ဥ"
  },
  {
    "from": "ည(?=[္ွ])",
    "to": "ၫ"
  },
  {
    "from": "(္[က-အ])(ိ){0,1}ု",
    "to": "$1$2ဳ"
  },
  {
    "from": "(္[က-အ])ူ",
    "to": "$1ဴ"
  },
  {
    "from": "န(?=[ိီု်]?[ူွှု္])",
    "to": "ႏ"
  },
  {
    "from": "န(?=်ု )",
    "to": "ႏ"
  },
  {
    "from": "နြ",
    "to": "ႏြ"
  },
  {
    "from": "္က",
    "to": "ၠ"
  },
  {
    "from": "္ခ",
    "to": "ၡ"
  },
  {
    "from": "္ဂ",
    "to": "ၢ"
  },
  {
    "from": "္ဃ",
    "to": "ၣ"
  },
  {
    "from": "္စ",
    "to": "ၥ"
  },
  {
    "from": "္ဆ",
    "to": "ၦ"
  },
  {
    "from": "္ဇ",
    "to": "ၨ"
  },
  {
    "from": "္ဈ",
    "to": "ၩ"
  },
  {
    "from": "္ဋ",
    "to": "ၬ"
  },
  {
    "from": "ဋ္ဌ",
    "to": "႒"
  },
  {
    "from": "္ဌ",
    "to": "ၭ"
  },
  {
    "from": "ဍ္ဍ",
    "to": "ၮ"
  },
  {
    "from": "ဍ္ဎ",
    "to": "ၯ"
  },
  {
    "from": "္ဏ",
    "to": "ၰ"
  },
  {
    "from": "္တ",
    "to": "ၱ"
  },
  {
    "from": "္ထ",
    "to": "ၳ"
  },
  {
    "from": "္ဒ",
    "to": "ၵ"
  },
  {
    "from": "္ဓ",
    "to": "ၶ"
  },
  {
    "from": "္[နႏ]",
    "to": "ၷ"
  },
  {
    "from": "္ပ",
    "to": "ၸ"
  },
  {
    "from": "္ဖ",
    "to": "ၹ"
  },
  {
    "from": "္ဗ",
    "to": "ၺ"
  },
  {
    "from": "္ဘ",
    "to": "ၻ"
  },
  {
    "from": "္မ",
    "to": "ၼ"
  },
  {
    "from": "္လ",
    "to": "ႅ"
  },
  {
    "from": "ဿ",
    "to": "ႆ"
  },
  {
    "from": "ွှ",
    "to": "ႊ"
  },
  {
    "from": "(ၤ)([က-အ])([ျြ]?)ိ",
    "to": "$2$3ႋ"
  },
  {
    "from": "(ၤ)([က-အ])([ျြ]?)ီ",
    "to": "$2$3ႌ"
  },
  {
    "from": "(ၤ)([က-အ])([ျြ]?)ံ",
    "to": "$2$3ႍ"
  },
  {
    "from": "(ၤ)([က-အ၀-၉])([ျြ]?)([ေ]?)",
    "to": "$2$3$4$1"
  },
  {
    "from": "ရ(?=([ိီ]?)[ုူွႊ])",
    "to": "႐"
  },
  {
    "from": "ဏ္ဍ",
    "to": "႑"
  },
  {
    "from": "ဋ္ဋ",
    "to": "႗"
  },
  {
    "from": "([က-အႏဩၪၮၯႆ႐႑႒႗႖])([ၠ-ၩၬၭၰ-ၼႅႊ])?([ျ-ှ]*)?ေ",
    "to": "ေ$1$2$3"
  },
  {
    "from": "ြှ",
    "to": "ြႇ"
  },
  {
    "from": "([က-အႏဩ])([ၠ-ၩၬၭၰ-ၼႅ])?(ြ)",
    "to": "$3$1$2"
  },
  {
    "from": "်",
    "to": "္"
  },
  {
    "from": "ျ",
    "to": "်"
  },
  {
    "from": "ြ",
    "to": "ျ"
  },
  {
    "from": "ွ",
    "to": "ြ"
  },
  {
    "from": "ှ",
    "to": "ွ"
  },
  {
    "from": "([^်ည])ွ([ိီ]?)ု",
    "to": "$1ႈ$2"
  },
  {
    "from": "([ရ်ြႊႈ႐])([ူွ])?([ဲံ္ိီႋႌႍႎ]?)(ု)?့",
    "to": "$1$2$3$4႕"
  },
  {
    "from": "([ုနူွ])([ဲံ္ိီႋႌႍႎ]?)့",
    "to": "$1$2႔"
  },
  {
    "from": "([ျ])([က-အ])([ႇ]?)([ံိီႋႌႍႎ]?)ု",
    "to": "$1$2$3$4ဳ"
  },
  {
    "from": "([ျ])([က-အ])([ႇ]?)([ံိီႋႌႍႎ]?)ူ",
    "to": "$1$2$3$4ဴ"
  },
  {
    "from": "([်ြညဈဋဌဍဠဥ])([ွ]?)([ံိီႋႌႍႎ]?)ု",
    "to": "$1$2$3ဳ"
  },
  {
    "from": "([်ြညဈဋဌဍဠဥ])(ွ?)([ံိီႋႌႍႎ]?)ူ",
    "to": "$1$2$3ဴ"
  },
  {
    "from": "([ညဠဉ])ွ",
    "to": "$1ႇ"
  },
  {
    "from": "ွူ",
    "to": "ႉ"
  },
  {
    "from": "ျ([ကဃဆဏတထဘယလယသဟ])",
    "to": "ၾ$1"
  },
  {
    "from": "ၾ([ကဃဆဏတထဘယလယသဟ])([ြႊ])([ဲံိီႋႌႍႎ])",
    "to": "ႄ$1$2$3"
  },
  {
    "from": "ၾ([ကဃဆဏတထဘယလယသဟ])([ြႊ])",
    "to": "ႂ$1$2"
  },
  {
    "from": "ၾ([ကဃဆဏတထဘယလယသဟ])([ဳဴ]?)([ဲံိီႋႌႍႎ])",
    "to": "ႀ$1$2$3"
  },
  {
    "from": "ျ([က-အ])([ြႊ])([ဲံိီႋႌႍႎ])",
    "to": "ႃ$1$2$3"
  },
  {
    "from": "ျ([က-အ])([ြႊ])",
    "to": "ႁ$1$2"
  },
  {
    "from": "ျ([က-အ])([ဳဴ]?)([ဲံိီႋႌႍႎ])",
    "to": "ၿ$1$2$3"
  },
  {
    "from": "်ွ",
    "to": "ွ်"
  },
  {
    "from": "်([ြႊ])",
    "to": "$1ၽ"
  },
  {
    "from": "([ဳဴ])(ံ?)႔",
    "to": "$1$2႕"
  },
  {
    "from": "ႏၱ",
    "to": "ႏၲ"
  },
  {
    "from": "ႏၳ",
    "to": "ႏၴ"
  },
  {
    "from": "([က-အ])([ၻၦ])ာ",
    "to": "$1ာ$2"
  },
  {
    "from": "ာ([ၻၦ])့",
    "to": "ာ$1႔"
  },
  {
    "from": "၇((?=[က-အ]္)|(?=[ာ-ူဲံ-းြွ]))",
    "to": "ရ"
  }
];

const zg2uniRules: Rule[] = RAW_ZG2UNI.map(({ from, to }) => ({
  pattern: new RegExp(from, 'g'),
  to,
}));

const uni2zgRules: Rule[] = RAW_UNI2ZG.map(({ from, to }) => ({
  pattern: new RegExp(from, 'g'),
  to,
}));

/**
 * Converts Zawgyi text into standard Myanmar Unicode (Pyidaungsu / Noto Sans).
 */
export function zawgyiToUnicode(text: string): string {
  if (!text) return '';
  let output = text;
  for (let i = 0; i < zg2uniRules.length; i++) {
    output = output.replace(zg2uniRules[i].pattern, zg2uniRules[i].to);
  }
  return output;
}

/**
 * Converts Unicode text into Zawgyi (useful for exporting to legacy clients).
 */
export function unicodeToZawgyi(text: string): string {
  if (!text) return '';
  let output = text;
  for (let i = 0; i < uni2zgRules.length; i++) {
    output = output.replace(uni2zgRules[i].pattern, uni2zgRules[i].to);
  }
  return output;
}
