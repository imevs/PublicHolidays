// Auto-generated types

export type Holiday = {
  date: string;
  localName: string;
  name: string;
  primary_type?: string;
  type?: string[];
};

export type CountryHolidays = {
  countryCode: string;
  countryName: string;
  holidays: Holiday[];
};
