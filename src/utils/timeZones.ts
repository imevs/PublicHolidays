import { CountryCode } from "../types";

// Country code → primary time zone mapping (IANA names)
// Note: some countries have multiple time zones — here is the main one
export const countryTimeZones: Record<CountryCode, string> = {
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
    UA: "Europe/Kyiv",
  };
  
  // Function to get UTC offset (e.g., "+01", "-03") for a time zone
  function getUTCOffset(timeZone: string, date = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset"
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts ? parts.find(p => p.type === "timeZoneName")?.value : ""; 
    const result = offsetPart?.replace("GMT", "").replace("UTC", "") ?? "";
    return result.startsWith("+") || result.startsWith("-") ? result : `+0`;
  }
  
  // Build a table of countries with their offsets
const europeOffsets = Object.entries(countryTimeZones).map(([countryCode, tz]) => ({
    countryCode: countryCode as CountryCode,
    timeZone: tz,
    offset: getUTCOffset(tz)
  }));

export const countryOffsets = europeOffsets.reduce((acc, { countryCode, offset }) => {
    acc[countryCode] = offset;
    return acc;
}, {} as Record<CountryCode, string>);


