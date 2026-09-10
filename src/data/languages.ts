/**
 * Comprehensive ISO 639-1 and BCP-47 World Languages Dataset
 * Includes English names, Native scripts, and standard ISO codes.
 */

export interface LanguageDefinition {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
}

export const ISO_LANGUAGES: LanguageDefinition[] = [
  // Southeast Asia & East Asia
  { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ', region: 'Southeast Asia' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', region: 'Southeast Asia' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Southeast Asia' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Southeast Asia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Southeast Asia' },
  { code: 'tl', name: 'Filipino (Tagalog)', nativeName: 'Wikang Tagalog', region: 'Southeast Asia' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', region: 'Southeast Asia' },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', region: 'Southeast Asia' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'East Asia' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', region: 'East Asia' },
  { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '繁體中文', region: 'East Asia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'East Asia' },

  // English & Major European Languages
  { code: 'en', name: 'English', nativeName: 'English', region: 'Global' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'Europe / Americas' },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'Europe' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'Europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'Europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'Europe / Americas' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português do Brasil', region: 'Americas' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'Europe / Asia' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'Europe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'Europe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'Europe' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Europe / Asia' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'Europe' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'Europe' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'Europe' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'Europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'Europe' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'Europe' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'Europe' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'Europe' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'Europe' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'Europe' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'Europe' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', region: 'Europe' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'Europe' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'Europe' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'Europe' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'Europe' },

  // South Asia & Middle East
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'South Asia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'South Asia' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'South Asia' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'South Asia' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'South Asia' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle East' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Middle East' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', region: 'Middle East' },

  // Africa & Others
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'Africa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'Africa' },
];

/**
 * Finds language definition by code
 */
export function getLanguageByCode(code: string): LanguageDefinition | undefined {
  const clean = code.toLowerCase().trim();
  return ISO_LANGUAGES.find(l => l.code.toLowerCase() === clean);
}

/**
 * Formats a language code into a user-friendly label
 */
export function formatLanguageLabel(code: string): string {
  const found = getLanguageByCode(code);
  if (found) {
    return `${found.name} (${found.nativeName})`;
  }
  return code.toUpperCase();
}
