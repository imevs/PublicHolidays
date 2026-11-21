import { countryNames, type CountryCode } from "../data/countryNames.ts";
import {
    DEFAULT_LANGUAGE,
    formatTemplate,
    getIntlLocale,
    getLocalizedContinentName,
    getLocalizedCountryName,
    isSupportedLanguage,
    SUPPORTED_LANGUAGES,
    TRANSLATIONS,
} from "../i18n/locales/index.ts";
import type { ContinentId, LanguageCode, LanguageCode as Language } from "../i18n/types.ts";
import { formatDateToReadable } from "../utils/dateUtils.ts";
import { UTCDate } from "../utils/UTCDate.ts";

function collectLeafPaths(obj: unknown, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {};
    if (typeof obj === "string") {
        result[prefix] = obj;
        return result;
    }
    if (Array.isArray(obj)) {
        obj.forEach((item, idx) => {
            Object.assign(result, collectLeafPaths(item, `${prefix}[${idx}]`));
        });
        return result;
    }
    if (obj && typeof obj === "object") {
        for (const [key, value] of Object.entries(obj)) {
            const nextKey = prefix ? `${prefix}.${key}` : key;
            Object.assign(result, collectLeafPaths(value, nextKey));
        }
    }
    return result;
}

function extractPlaceholders(value: string): string[] {
    const matches = value.match(/\{(\w+)\}/g);
    return matches ? [...matches].sort() : [];
}

describe("i18n dictionaries and helpers", () => {
    const allCodes: LanguageCode[] = ["en", "ru", "fr", "es", "lv", "de"];
    const enLeaves = collectLeafPaths(TRANSLATIONS.en);
    const enKeys = Object.keys(enLeaves).sort();

    it("registers all 6 supported languages with native endonyms", () => {
        expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(allCodes);
        expect(SUPPORTED_LANGUAGES.map((l) => l.nativeName)).toEqual([
            "English",
            "Русский",
            "Français",
            "Español",
            "Latviešu",
            "Deutsch",
        ]);
        expect(DEFAULT_LANGUAGE).toBe("en");
        allCodes.forEach((code) => expect(isSupportedLanguage(code)).toBe(true));
        expect(isSupportedLanguage("xx")).toBe(false);
        expect(isSupportedLanguage(null)).toBe(false);
    });

    it.each(allCodes)("has 100% key parity, non-empty strings, and placeholder parity for %s", (code) => {
        const dict = TRANSLATIONS[code];
        const leaves = collectLeafPaths(dict);
        const keys = Object.keys(leaves).sort();

        expect(keys).toEqual(enKeys);

        for (const key of keys) {
            const val = leaves[key];
            expect(typeof val).toBe("string");
            expect(val.trim().length).toBeGreaterThan(0);
            expect(extractPlaceholders(val)).toEqual(extractPlaceholders(enLeaves[key]));
        }

        expect(dict.dates.months).toHaveLength(12);
        expect(new Set(dict.dates.months).size).toBe(12);

        expect(dict.dates.weekdaysShort).toHaveLength(7);
        expect(new Set(dict.dates.weekdaysShort).size).toBe(7);
    });

    it("provides non-empty localized names for all 54 countries and 5 continents in all 6 languages", () => {
        const countryCodes = Object.keys(countryNames) as CountryCode[];
        expect(countryCodes.length).toBe(54);

        const continentIds: ContinentId[] = ["europe", "asia", "northAmerica", "southAmerica", "oceania"];

        for (const lang of allCodes) {
            for (const code of countryCodes) {
                const localized = getLocalizedCountryName(code, lang);
                expect(localized.trim().length).toBeGreaterThan(0);

                // Reverse lookup from English country name also resolves cleanly
                const byEnglish = getLocalizedCountryName("UNKNOWN", lang, countryNames[code]);
                expect(byEnglish).toBe(localized);
            }
            for (const continentId of continentIds) {
                expect(getLocalizedContinentName(continentId, lang).trim().length).toBeGreaterThan(0);
            }
        }
    });

    it("formats templates and UTC readable dates across all 6 locales", () => {
        expect(formatTemplate("Events on {date}", { date: "2025-05-01" })).toBe("Events on 2025-05-01");
        const date = new UTCDate("2025-05-01");
        for (const lang of allCodes) {
            const formatted = formatDateToReadable(date, getIntlLocale(lang));
            expect(formatted).toContain("1");
            expect(formatted).toMatch(/\(.+\)/);
        }
    });
});

import { getLocalizedHolidayName } from "../i18n/holidayNames.ts";

describe("Holiday Name Localization", () => {
    test("getLocalizedHolidayName translates correctly for supported country/language pairs", () => {
        expect(getLocalizedHolidayName("New Year's Day", "LV", "lv")).toBe("Jaungada diena");
        expect(getLocalizedHolidayName("New Year's Day", "DE", "de")).toBe("Neujahr");
        expect(getLocalizedHolidayName("New Year's Day", "FR", "fr")).toBe("Jour de l'an");
        expect(getLocalizedHolidayName("New Year's Day", "ES", "es")).toBe("Año Nuevo");
        expect(getLocalizedHolidayName("New Year's Day", "RU", "ru")).toBe("Новый год");
    });

    test("getLocalizedHolidayName returns English name when non-matching language is active", () => {
        expect(getLocalizedHolidayName("New Year's Day", "LV", "de")).toBe("New Year's Day");
        expect(getLocalizedHolidayName("New Year's Day", "LV", "en" as unknown as Language)).toBe("New Year's Day");
    });
});
