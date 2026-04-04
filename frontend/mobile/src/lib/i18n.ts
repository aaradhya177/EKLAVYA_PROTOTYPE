import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import bn from "../locales/bn.json";
import en from "../locales/en.json";
import gu from "../locales/gu.json";
import hi from "../locales/hi.json";
import kn from "../locales/kn.json";
import mr from "../locales/mr.json";
import ta from "../locales/ta.json";
import te from "../locales/te.json";
import { storageKeys } from "./storage";

export const supportedLanguages = ["en", "hi", "ta", "te", "bn", "mr", "kn", "gu"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  bn: { translation: bn },
  mr: { translation: mr },
  kn: { translation: kn },
  gu: { translation: gu }
} as const;

const detectLanguage = async (): Promise<SupportedLanguage> => {
  const stored = await AsyncStorage.getItem(storageKeys.language);
  if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }
  const locale = Localization.getLocales()[0]?.languageCode ?? "en";
  return supportedLanguages.includes(locale as SupportedLanguage) ? (locale as SupportedLanguage) : "en";
};

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

void detectLanguage().then((lng) => i18n.changeLanguage(lng));

export const changeLanguage = async (language: SupportedLanguage) => {
  await AsyncStorage.setItem(storageKeys.language, language);
  await i18n.changeLanguage(language);
};

export default i18n;
