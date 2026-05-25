import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import es from './locales/es.json';

const RESOURCES = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
};

const LANGUAGE_KEY = '@app_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  init: () => {},
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.warn('Failed to read language from storage', error);
    }
    
    // Fallback to device language
    const deviceLocales = Localization.getLocales();
    const bestLanguage = deviceLocales[0]?.languageCode || 'en';
    
    // Check if we support the device language
    if (RESOURCES[bestLanguage as keyof typeof RESOURCES]) {
      callback(bestLanguage);
    } else {
      callback('en');
    }
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.warn('Failed to save language to storage', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: RESOURCES,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
  });

export default i18n;
