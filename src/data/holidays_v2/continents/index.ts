import type { CountryCode } from "../../countryNames";
import type { CountryHolidays } from "../types";

export type ContinentId = "europe" | "asia" | "northAmerica" | "southAmerica" | "oceania";

export const COUNTRY_TO_CONTINENT: Partial<Record<CountryCode, ContinentId>> = {
    AD: "europe",
    AL: "europe",
    AT: "europe",
    BA: "europe",
    BE: "europe",
    BG: "europe",
    BY: "europe",
    CH: "europe",
    CY: "europe",
    CZ: "europe",
    DE: "europe",
    DK: "europe",
    EE: "europe",
    ES: "europe",
    FI: "europe",
    FR: "europe",
    GB: "europe",
    GR: "europe",
    HR: "europe",
    HU: "europe",
    IE: "europe",
    IS: "europe",
    IT: "europe",
    LI: "europe",
    LT: "europe",
    LU: "europe",
    LV: "europe",
    MC: "europe",
    MD: "europe",
    ME: "europe",
    MK: "europe",
    MT: "europe",
    NL: "europe",
    NO: "europe",
    PL: "europe",
    PT: "europe",
    RO: "europe",
    RS: "europe",
    RU: "europe",
    SE: "europe",
    SI: "europe",
    SK: "europe",
    TR: "europe",
    UA: "europe",

    CN: "asia",
    ID: "asia",
    JP: "asia",
    KR: "asia",

    CA: "northAmerica",
    US: "northAmerica",

    BR: "southAmerica",

    AU: "oceania",
    NZ: "oceania",
};

const continentCache = new Map<string, Promise<CountryHolidays[]>>();

export function getContinentCacheKey(continentId: ContinentId, year?: number): string {
    const targetYear = year ?? new Date().getUTCFullYear();
    const isSupportedEuropeYear = continentId === "europe" && targetYear >= 2024 && targetYear <= 2028;
    return continentId === "europe"
        ? (isSupportedEuropeYear ? `europe-${targetYear}` : "europe-all")
        : continentId;
}

export async function loadContinentHolidays(continentId: ContinentId, year?: number): Promise<CountryHolidays[]> {
    const targetYear = year ?? new Date().getUTCFullYear();
    const cacheKey = getContinentCacheKey(continentId, year);

    if (continentCache.has(cacheKey)) {
        return continentCache.get(cacheKey)!;
    }

    const promise = (async () => {
        let mod: { holidays: Record<string, CountryHolidays> };
        if (continentId === "europe") {
            switch (targetYear) {
                case 2024:
                    mod = await import("./europe-2024");
                    break;
                case 2025:
                    mod = await import("./europe-2025");
                    break;
                case 2026:
                    mod = await import("./europe-2026");
                    break;
                case 2027:
                    mod = await import("./europe-2027");
                    break;
                case 2028:
                    mod = await import("./europe-2028");
                    break;
                default:
                    mod = await import("./europe");
                    return Object.values(mod.holidays);
            }
            return Object.values(mod.holidays);
        }

        switch (continentId) {
            case "asia":
                mod = await import("./asia");
                break;
            case "northAmerica":
                mod = await import("./northAmerica");
                break;
            case "southAmerica":
                mod = await import("./southAmerica");
                break;
            case "oceania":
                mod = await import("./oceania");
                break;
            default:
                throw new Error(`Unknown continent: ${continentId}`);
        }
        return Object.values(mod.holidays);
    })().catch((err) => {
        continentCache.delete(cacheKey);
        throw err;
    });

    continentCache.set(cacheKey, promise);
    return promise;
}

export function getMissingContinents(
    countryCodes: CountryCode[],
    loadedContinents: Set<string>,
    year?: number
): ContinentId[] {
    const missing = new Set<ContinentId>();
    for (const code of countryCodes) {
        const continent = COUNTRY_TO_CONTINENT[code];
        if (continent) {
            if (continent === "europe" && loadedContinents.has("europe-all")) {
                continue;
            }
            const key = getContinentCacheKey(continent, year);
            if (!loadedContinents.has(key)) {
                missing.add(continent);
            }
        }
    }
    return Array.from(missing);
}
