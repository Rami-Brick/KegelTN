import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

function syncDocumentLanguage(language: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
}

i18n.on('languageChanged', syncDocumentLanguage);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);

export default i18n;
