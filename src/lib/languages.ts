// Languages with stable codes — used for casting call matching.
// Codes follow ISO 639-1 where possible.
// Display name is what the user sees; code is what gets stored.

export const LANGUAGES = [
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português (Brasil)' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'no', name: 'Norwegian', native: 'Norsk' },
  { code: 'da', name: 'Danish', native: 'Dansk' },
  { code: 'fi', name: 'Finnish', native: 'Suomi' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', native: 'עברית' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'zh', name: 'Mandarin Chinese', native: '中文' },
  { code: 'yue', name: 'Cantonese', native: '粵語' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'tl', name: 'Tagalog / Filipino', native: 'Tagalog' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu' },
  { code: 'ht', name: 'Haitian Creole', native: 'Kreyòl Ayisyen' },
  { code: 'ca', name: 'Catalan', native: 'Català' },
  { code: 'eu', name: 'Basque', native: 'Euskara' },
  { code: 'ga', name: 'Irish', native: 'Gaeilge' },
  { code: 'cy', name: 'Welsh', native: 'Cymraeg' },
  { code: 'is', name: 'Icelandic', native: 'Íslenska' },
  { code: 'cs', name: 'Czech', native: 'Čeština' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar' },
  { code: 'ro', name: 'Romanian', native: 'Română' },
  { code: 'bg', name: 'Bulgarian', native: 'Български' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
  { code: 'sr', name: 'Serbian', native: 'Српски' },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina' },
  { code: 'sq', name: 'Albanian', native: 'Shqip' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių' },
  { code: 'et', name: 'Estonian', native: 'Eesti' },
  { code: 'asl', name: 'American Sign Language', native: 'ASL' },
  { code: 'lsm', name: 'Mexican Sign Language', native: 'LSM' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const codeToLang = new Map(LANGUAGES.map((l) => [l.code, l]));

export function getLanguageName(code: string): string {
  return codeToLang.get(code as LanguageCode)?.name ?? code;
}

export function getLanguageNative(code: string): string {
  return codeToLang.get(code as LanguageCode)?.native ?? code;
}
