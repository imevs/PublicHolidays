import type { CountryCode } from "./countryNames.ts";

export const SCHOOL_HOLIDAY_COUNTRIES: ReadonlySet<CountryCode> = new Set<CountryCode>([
    "AD", "AL", "AT", "BE", "BG", "BY", "CH", "CZ", "DE", "EE", "ES",
    "FR", "HR", "HU", "IE", "IT", "LI", "LT", "LU", "LV", "MC", "MD",
    "MT", "NL", "PL", "PT", "RO", "RS", "SE", "SI", "SK",
]);

export function hasSchoolHolidayData(code: CountryCode): boolean {
    return SCHOOL_HOLIDAY_COUNTRIES.has(code);
}
