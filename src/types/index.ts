export interface Holiday {
  date: string;
  name: string;
}

export interface CountryHolidays {
  name: string;
  holidays: Holiday[];
}

export interface HolidaysData {
  [countryCode: string]: CountryHolidays;
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

export type CountryCode = 'LV' | 'SE' | 'PL' | 'ES' | 'EE' | 'UA';
