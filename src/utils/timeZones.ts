// Country code → primary time zone mapping (IANA names)
// Note: some countries have multiple time zones — here is the main one
import type { CountryCode } from "../data/countryNames.ts";
import { dateLocale } from "../consts.ts";

export const countryTimeZones: Record<CountryCode, string> = {
    KR: "Asia/Seoul",
    AU: "Australia/Sydney",
    BR: "America/Sao_Paulo",
    CA: "America/Toronto",
    CN: "Asia/Shanghai",
    ID: "Asia/Jakarta",
    IN: "Asia/Kolkata",
    JP: "Asia/Tokyo",
    NZ: "Pacific/Auckland",
    US: "America/New_York",
    AD: "Europe/Andorra",
    AL: "Europe/Tirane",
    AT: "Europe/Vienna",
    BA: "Europe/Sarajevo",
    BE: "Europe/Brussels",
    BG: "Europe/Sofia",
    BY: "Europe/Minsk",
    CH: "Europe/Zurich",
    CY: "Asia/Nicosia", // Cyprus is partly Asia geographically but politically in EU
    CZ: "Europe/Prague",
    DE: "Europe/Berlin",
    DK: "Europe/Copenhagen",
    EE: "Europe/Tallinn",
    ES: "Europe/Madrid", // Canary Islands use Atlantic/Canary
    FI: "Europe/Helsinki",
    FR: "Europe/Paris",
    GB: "Europe/London",
    GR: "Europe/Athens",
    HR: "Europe/Zagreb",
    HU: "Europe/Budapest",
    IE: "Europe/Dublin",
    IS: "Atlantic/Reykjavik",
    IT: "Europe/Rome",
    LI: "Europe/Vaduz",
    LT: "Europe/Vilnius",
    LU: "Europe/Luxembourg",
    LV: "Europe/Riga",
    MC: "Europe/Monaco",
    MD: "Europe/Chisinau",
    ME: "Europe/Podgorica",
    MK: "Europe/Skopje",
    MT: "Europe/Malta",
    NL: "Europe/Amsterdam",
    NO: "Europe/Oslo",
    PL: "Europe/Warsaw",
    PT: "Europe/Lisbon",
    RO: "Europe/Bucharest",
    RS: "Europe/Belgrade",
    RU: "Europe/Moscow", // Russia has many time zones — using Moscow for west Russia
    SE: "Europe/Stockholm",
    SI: "Europe/Ljubljana",
    SK: "Europe/Bratislava",
    TR: "Europe/Istanbul",
    UA: "Europe/Kyiv"
};
export const countryTimeZonesFallBack: Partial<Record<CountryCode, string>> = {
    UA: "Europe/Kiev",
};
  
// Function to get UTC offset (e.g., "+01", "-03") for a time zone
function getOffset(timeZone: string, reserveTz: string | undefined) {
    const date = new Date();
    const zones = [timeZone, reserveTz].filter((tz): tz is string => Boolean(tz));
    let formatter: Intl.DateTimeFormat | undefined = undefined;
    for (const tz of zones) {
        try {
            formatter = new Intl.DateTimeFormat(dateLocale, {
                timeZone: tz,
                timeZoneName: "shortOffset"
            });
            break;
        } catch (ex: unknown) {
            window.console.error(ex);
        }
    }
    if (!formatter) {
        return "";
    }
    const parts = formatter.formatToParts(date);
    const offsetPart = parts ? parts.find(p => p.type === "timeZoneName")?.value : "";
    const result = offsetPart?.replace("GMT", "").replace("UTC", "") ?? "";
    return result.startsWith("+") || result.startsWith("-") ? result : "+0";
}
  
// Build a table of countries with their offsets
const europeOffsets = Object.entries(countryTimeZones).map(([countryCode, tz]) => ({
    countryCode: countryCode as CountryCode,
    timeZone: tz,
    offset: getOffset(tz, countryTimeZonesFallBack[countryCode as CountryCode])
}));

export const countryOffsets = europeOffsets.reduce((acc, { countryCode, offset }) => {
    acc[countryCode] = offset;
    return acc;
}, {} as Record<CountryCode, string>);

// Function to get the local time for a given timezone
export const getLocalTime = (country: CountryCode): string => {
    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    } as const;
    const zones = [countryTimeZones[country], countryTimeZonesFallBack[country]].filter(Boolean);
    for (const timeZone of zones) {
        try {
            const formatter = new Intl.DateTimeFormat(dateLocale, { timeZone, ...options });
            return formatter.format(new Date());
        } catch (e) {
            window.console.error(e);
        }
    }
    return "";
};

