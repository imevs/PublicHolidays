import { countryNames, type CountryCode } from "../../data/countryNames.ts";
import type { ContinentId, LanguageCode, LanguageOption, TranslationDictionary } from "../types.ts";
import { de } from "./de.ts";
import { en } from "./en.ts";
import { es } from "./es.ts";
import { fr } from "./fr.ts";
import { lv } from "./lv.ts";
import { ru } from "./ru.ts";

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const LANGUAGE_STORAGE_KEY = "language";

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
    { code: "en", intlLocale: "en-CA", nativeName: "English", flag: "🇬🇧" },
    { code: "ru", intlLocale: "ru-RU", nativeName: "Русский", flag: "🇷🇺" },
    { code: "fr", intlLocale: "fr-FR", nativeName: "Français", flag: "🇫🇷" },
    { code: "es", intlLocale: "es-ES", nativeName: "Español", flag: "🇪🇸" },
    { code: "lv", intlLocale: "lv-LV", nativeName: "Latviešu", flag: "🇱🇻" },
    { code: "de", intlLocale: "de-DE", nativeName: "Deutsch", flag: "🇩🇪" },
] as const;

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
    en,
    ru,
    fr,
    es,
    lv,
    de,
};

const INTL_LOCALE_BY_CODE: Record<LanguageCode, string> = SUPPORTED_LANGUAGES.reduce(
    (acc, lang) => {
        acc[lang.code] = lang.intlLocale;
        return acc;
    },
    {} as Record<LanguageCode, string>
);

const ENGLISH_COUNTRY_TO_CODE: Record<string, CountryCode> = (
    Object.entries(countryNames) as [CountryCode, string][]
).reduce((acc, [code, name]) => {
    acc[name] = code;
    return acc;
}, {} as Record<string, CountryCode>);

export function isSupportedLanguage(value: unknown): value is LanguageCode {
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(TRANSLATIONS, value);
}

export function getIntlLocale(language: LanguageCode): string {
    return INTL_LOCALE_BY_CODE[language] ?? INTL_LOCALE_BY_CODE[DEFAULT_LANGUAGE];
}

export function getLocalizedCountryName(
    code: CountryCode | string,
    language: LanguageCode,
    fallbackEnglish?: string
): string {
    const dict = TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
    if (Object.prototype.hasOwnProperty.call(dict.countries, code)) {
        return dict.countries[code as CountryCode];
    }
    if (fallbackEnglish) {
        const mappedCode = ENGLISH_COUNTRY_TO_CODE[fallbackEnglish];
        if (mappedCode && Object.prototype.hasOwnProperty.call(dict.countries, mappedCode)) {
            return dict.countries[mappedCode];
        }
        return fallbackEnglish;
    }
    return code;
}

export function getLocalizedContinentName(id: ContinentId, language: LanguageCode): string {
    const dict = TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
    return dict.continents[id];
}

export function formatTemplate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
        return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match;
    });
}
