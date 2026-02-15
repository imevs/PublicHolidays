// Auto-generated types

import type { CountryCode, CountryName } from "../countryNames";

export type Holiday = {
    date: string;
    localName: string;
    name: string;
    type: string[];
};

export type CountryHolidays = {
    countryCode: CountryCode;
    countryName: CountryName;
    holidays: Holiday[];
};
