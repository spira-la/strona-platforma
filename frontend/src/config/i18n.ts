import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pl from '@/locales/pl/translation.json';
import en from '@/locales/en/translation.json';
import es from '@/locales/es/translation.json';

const SUPPORTED = ['pl', 'en', 'es'] as const;
type SupportedLanguage = (typeof SUPPORTED)[number];
const DEFAULT_LANGUAGE: SupportedLanguage = 'pl';
const STORAGE_KEY = 'spirala_lang';

const isSupported = (
  code: string | null | undefined,
): code is SupportedLanguage =>
  !!code && (SUPPORTED as readonly string[]).includes(code);

/**
 * Initial language, in priority order:
 *  1. The language the visitor picked before (saved in localStorage).
 *  2. The first browser language we have (navigator.languages, "en-GB" -> "en").
 *  3. Polish.
 */
function detectInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    // storage blocked (private mode etc.) — fall through to the browser
  }

  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of browserLanguages) {
    const code = tag?.toLowerCase().split('-')[0];
    if (isSupported(code)) return code;
  }

  return DEFAULT_LANGUAGE;
}

const initialLanguage = detectInitialLanguage();
document.documentElement.lang = initialLanguage;

// Keep <html lang> in sync and remember the visitor's own choice. The
// initial (detected) language is not saved, so a browser-language visitor
// keeps following the browser until they pick a language themselves.
let visitorChose = false;
i18n.on('languageChanged', (lng) => {
  if (!isSupported(lng)) return;
  document.documentElement.lang = lng;
  if (lng !== initialLanguage) visitorChose = true;
  if (!visitorChose) return;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore storage errors
  }
});

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
    es: { translation: es },
  },
  lng: initialLanguage,
  supportedLngs: SUPPORTED,
  fallbackLng: 'en',
  interpolation: {
    // React already escapes values
    escapeValue: false,
  },
});

export { default } from 'i18next';
