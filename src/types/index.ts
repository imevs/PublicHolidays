import { allHolidays as holidaysData } from "../data/holidays";

export interface Holiday {
  date: string;
  name: string;
  localName: string;
}

export interface CountryHolidays {
  countryCode: string;
  countryName: string;
  years: Record<string, Holiday[]>;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  holidays: HolidayWithCountry[];
  dayNumber: number;
}

export interface HolidayWithCountry extends Holiday {
  country: string;
}

export type CountryCode = keyof typeof holidaysData;
