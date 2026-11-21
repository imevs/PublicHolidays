import { useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { CountryCode } from "../data/countryNames.ts";
import {
    getLanguageSnapshot,
    LanguageContext,
    setStoredLanguage,
    subscribeLanguage,
} from "./languageStore.ts";
import {
    DEFAULT_LANGUAGE,
    formatTemplate,
    getIntlLocale,
    getLocalizedContinentName,
    getLocalizedCountryName,
    TRANSLATIONS,
} from "./locales/index.ts";
import type { ContinentId, LanguageCode, TranslationDictionary } from "./types.ts";

export interface UseTranslationResult {
    language: LanguageCode;
    setLanguage: (language: LanguageCode) => void;
    t: TranslationDictionary;
    intlLocale: string;
    getCountryName: (code: CountryCode | string, fallbackEnglish?: string) => string;
    getContinentName: (id: ContinentId) => string;
    getMonthName: (month: number) => string;
    getShortDayName: (dayIndex: number) => string;
    format: (template: string, params: Record<string, string | number>) => string;
}

export function useTranslation(): UseTranslationResult {
    const context = useContext(LanguageContext);
    const storeLanguage = useSyncExternalStore(
        subscribeLanguage,
        getLanguageSnapshot,
        () => DEFAULT_LANGUAGE
    );

    const language = context?.language ?? storeLanguage;
    const setLanguage = context?.setLanguage ?? setStoredLanguage;
    const t = TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
    const intlLocale = getIntlLocale(language);

    const getCountryName = useCallback(
        (code: CountryCode | string, fallbackEnglish?: string) =>
            getLocalizedCountryName(code, language, fallbackEnglish),
        [language]
    );

    const getContinentName = useCallback(
        (id: ContinentId) => getLocalizedContinentName(id, language),
        [language]
    );

    const getMonthName = useCallback(
        (month: number) => t.dates.months[month] ?? "",
        [t]
    );

    const getShortDayName = useCallback(
        (dayIndex: number) => t.dates.weekdaysShort[dayIndex] ?? "",
        [t]
    );

    return useMemo(() => ({
        language,
        setLanguage,
        t,
        intlLocale,
        getCountryName,
        getContinentName,
        getMonthName,
        getShortDayName,
        format: formatTemplate,
    }), [language, setLanguage, t, intlLocale, getCountryName, getContinentName, getMonthName, getShortDayName]);
}
