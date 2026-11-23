import Sanscript from '@indic-transliteration/sanscript';

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  sanscriptScheme?: string;
  scriptTitle?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', sanscriptScheme: 'bengali', scriptTitle: 'Bengali Script (বাংলা)' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', sanscriptScheme: 'kannada', scriptTitle: 'Kannada Script (ಕನ್ನಡ)' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', sanscriptScheme: 'telugu', scriptTitle: 'Telugu Script (తెలుగు)' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', sanscriptScheme: 'tamil', scriptTitle: 'Tamil Script (தமிழ்)' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', sanscriptScheme: 'malayalam', scriptTitle: 'Malayalam Script (മലയാളം)' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export function getLanguageOption(code: string): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
}

export function renderShlokaInLanguageScript(
  devanagari: string,
  languageCode: string
): { scriptTitle: string; text: string } | null {
  if (!devanagari) return null;
  const opt = getLanguageOption(languageCode);
  if (!opt.sanscriptScheme || !opt.scriptTitle) return null;
  try {
    const converted = Sanscript.t(devanagari, 'devanagari', opt.sanscriptScheme);
    return {
      scriptTitle: opt.scriptTitle,
      text: converted,
    };
  } catch {
    return null;
  }
}
