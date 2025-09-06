// Auto-generated types

import type { CountryName } from "../holidays_descriptions/all";

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
