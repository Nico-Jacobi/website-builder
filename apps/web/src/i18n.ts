import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import de from './locales/de';
import en from './locales/en';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'de',
        supportedLngs: ['de', 'en'],
        load: 'languageOnly',
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18n_lang',
        },
        interpolation: {
            escapeValue: false,
        },
        resources: {
            de: { translation: de },
            en: { translation: en },
        },
    });

export default i18n;
