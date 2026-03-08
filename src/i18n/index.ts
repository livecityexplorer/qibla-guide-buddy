import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ar from "./locales/ar.json";
import fr from "./locales/fr.json";
import tr from "./locales/tr.json";
import ur from "./locales/ur.json";
import id from "./locales/id.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";
import ms from "./locales/ms.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
  tr: { translation: tr },
  ur: { translation: ur },
  id: { translation: id },
  es: { translation: es },
  de: { translation: de },
  hi: { translation: hi },
  bn: { translation: bn },
  ms: { translation: ms },
  ru: { translation: ru },
  zh: { translation: zh },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "app-language",
    },
  });

export default i18n;
