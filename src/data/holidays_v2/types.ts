// Auto-generated types

export type Holiday = {
    date: string;
    endDate?: string;
    localName: string;
    name: string;
    type?: string[];
};

export type CountryHolidays = {
    countryCode: string;
    countryName: string;
    holidays: Holiday[];
};
