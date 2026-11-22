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

const continentCache = new Map<ContinentId, Promise<CountryHolidays[]>>();

export async function loadContinentHolidays(continentId: ContinentId): Promise<CountryHolidays[]> {
    if (continentCache.has(continentId)) {
        return continentCache.get(continentId)!;
    }

    const promise = (async () => {
        let mod: { holidays: Record<string, CountryHolidays> };
        switch (continentId) {
            case "europe":
                mod = await import("./europe");
                break;
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
    })();

    continentCache.set(continentId, promise);
    return promise;
}

export function getMissingContinents(
    countryCodes: CountryCode[],
    loadedContinents: Set<ContinentId>
): ContinentId[] {
    const missing = new Set<ContinentId>();
    for (const code of countryCodes) {
        const continent = COUNTRY_TO_CONTINENT[code];
        if (continent && !loadedContinents.has(continent)) {
            missing.add(continent);
        }
    }
    return Array.from(missing);
}
