/**
 * Language Configuration
 * This file defines all supported languages in the app.
 * To add a new language:
 * 1. Add language code and display name here
 * 2. Add translations in constants/translations.ts
 * 3. That's it! The app will automatically support the new language
 */

export interface LanguageConfig {
  code: string;          // Language code (e.g., 'en', 'hi', 'es')
  name: string;          // Display name in the language (e.g., 'English', 'हिंदी')
  nativeName: string;    // Native name (optional, for consistency)
  icon?: string;         // Optional icon SF Symbol
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    icon: '🇺🇸',
  },
  {
    code: 'hi',
    name: 'हिंदी',
    nativeName: 'Hindi',
    icon: '🇮🇳',
  },
  {
    code: 'ta',
    name: 'தமிழ்',
    nativeName: 'Tamil',
    icon: '🇮🇳',
  },
  {
    code: 'te',
    name: 'తెలుగు',
    nativeName: 'Telugu',
    icon: '🇮🇳',
  },
  {
    code: 'as',
    name: 'অসমীয়া',
    nativeName: 'Assamese',
    icon: '🇮🇳',
  },
  {
    code: 'sik',
    name: 'Sikkimese',
    nativeName: 'Drenjongke',
    icon: '🇮🇳',
  },
  {
    code: 'brx',
    name: 'बड़ो',
    nativeName: 'Bodo',
    icon: '🇮🇳',
  },
  {
    code: 'ne',
    name: 'नेपाली',
    nativeName: 'Nepali',
    icon: '🇳🇵',
  },
  {
    code: 'mr',
    name: 'मराठी',
    nativeName: 'Marathi',
    icon: '🇮🇳',
  },
  {
    code: 'pa',
    name: 'ਪੰਜਾਬੀ',
    nativeName: 'Punjabi',
    icon: '🇮🇳',
  },
  {
    code: 'kn',
    name: 'ಕನ್ನಡ',
    nativeName: 'Kannada',
    icon: '🇮🇳',
  },
  {
    code: 'bn',
    name: 'বাংলা',
    nativeName: 'Bengali',
    icon: '🇮🇳',
  },
  {
    code: 'ml',
    name: 'മലയാളം',
    nativeName: 'Malayalam',
    icon: '🇮🇳',
  },
  {
    code: 'kha',
    name: 'Khasi',
    nativeName: 'Khasi',
    icon: '🇮🇳',
  },
  {
    code: 'gu',
    name: 'ગુજરાતી',
    nativeName: 'Gujarati',
    icon: '🇮🇳',
  },
  // Add more languages here in the future:
  // {
  //   code: 'es',
  //   name: 'Español',
  //   nativeName: 'Spanish',
  //   icon: '🇪🇸',
  // },
  // {
  //   code: 'fr',
  //   name: 'Français',
  //   nativeName: 'French',
  //   icon: '🇫🇷',
  // },
  // {
  //   code: 'de',
  //   name: 'Deutsch',
  //   nativeName: 'German',
  //   icon: '🇩🇪',
  // },
  // {
  //   code: 'ja',
  //   name: '日本語',
  //   nativeName: 'Japanese',
  //   icon: '🇯🇵',
  // },
  // {
  //   code: 'zh',
  //   name: '中文',
  //   nativeName: 'Chinese',
  //   icon: '🇨🇳',
  // },
];

// Get default language code
export const DEFAULT_LANGUAGE = 'en';

// Utility function to get language config by code
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

// Utility function to get all language codes
export function getLanguageCodes(): string[] {
  return SUPPORTED_LANGUAGES.map((lang) => lang.code);
}

// Utility function to validate if a language code is supported
export function isLanguageSupported(code: string): boolean {
  return getLanguageCodes().includes(code);
}
