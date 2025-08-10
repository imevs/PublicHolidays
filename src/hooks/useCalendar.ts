import { useEffect, useMemo, useState } from 'react';
import { CalendarDay, CountryCode, HolidayWithCountry } from '../types';
import { allHolidays as holidaysData } from '../data/holidays';
import { formatDateString, isSameDate } from '../utils/dateUtils';


const dateFormatter = new Intl.DateTimeFormat('en-CA'); // Canadian English uses YYYY-MM-DD format

export const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(['LV']);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.hash.replace("#", ""));
    const countries = (urlSearchParams.get("countries") ?? "");
    if (countries) {
      setSelectedCountries(countries.split(",") as CountryCode[]);
    }
    const date = (urlSearchParams.get("date") ?? "");
    if (date) {
      setCurrentDate(new Date(date));
      setSelectedYear(new Date(date).getFullYear());
    }
  }, []);

  const getHolidaysForDate = (date: Date): HolidayWithCountry[] => {
    const dateStr = formatDateString(date);
    const holidays: HolidayWithCountry[] = [];

    selectedCountries.forEach(countryCode => {
      const countryHolidays = holidaysData[countryCode]?.holidays || [];
      countryHolidays.forEach(holiday => {
        if (holiday.date === dateStr) {
          holidays.push({
            ...holiday,
            country: holidaysData[countryCode].countryName,
          });
        }
      });
    });

    return holidays;
  };

  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    // const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = isSameDate(date, today);
      const holidays = getHolidaysForDate(date);

      days.push({
        date,
        isCurrentMonth,
        isToday,
        holidays,
        dayNumber: date.getDate()
      });
    }

    return days;
  }, [currentDate, selectedCountries]);

  const navigateMonth = (direction: number): void => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    const params = new URLSearchParams(window.location.hash.replace("#", ""));
    params.set("date", dateFormatter.format(newDate))
    window.location.hash = decodeURIComponent(params.toString());
    setCurrentDate(newDate);
  };

  const toggleCountry = (countryCode: CountryCode): void => {
    setSelectedCountries(prev => {
      const newCountries = prev.includes(countryCode)
          ? prev.filter(c => c !== countryCode)
          : [...prev, countryCode];
      const params = new URLSearchParams(window.location.hash.replace("#", ""));
      params.set("countries", newCountries.join(","))
      window.location.hash = decodeURIComponent(params.toString());
      return newCountries;
    });
  };

  const handleYearChange = (year: number): void => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    const params = new URLSearchParams(window.location.hash.replace("#", ""));
    params.set("date", dateFormatter.format(newDate))
    window.location.hash = decodeURIComponent(params.toString());
    setCurrentDate(newDate);
    setSelectedYear(year);
  };

  return {
    currentDate,
    selectedCountries,
    selectedYear,
    calendarDays,
    navigateMonth,
    toggleCountry,
    handleYearChange
  };
};
