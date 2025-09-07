// Auto-generated types

import type { CountryName } from "../countryNames";

export type Holiday = {
    date: string;
    localName: string;
    name: string;
    primary_type?: string;
    type?: string[];
};

export type CountryHolidays = {
    countryCode: string;
    countryName: CountryName;
    holidays: Holiday[];
};
