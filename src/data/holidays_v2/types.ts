// Auto-generated types

import type { CountryCode, CountryName } from "../countryNames";
import type { DateString } from "../../utils/UTCDate";

export type Holiday = {
    date: DateString;
    localName: string;
    name: string;
    primary_type?: string;
    type: string[]; // "National holiday"
};

export type CountryHolidays = {
    countryCode: CountryCode;
    countryName: CountryName;
    holidays: Holiday[];
};
