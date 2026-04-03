import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pl from '@/locales/pl/translation.json';
import en from '@/locales/en/translation.json';
import es from '@/locales/es/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en },
      es: { translation: es },
    },
    lng: 'pl',
    fallbackLng: 'en',
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
  });

export default i18n;
