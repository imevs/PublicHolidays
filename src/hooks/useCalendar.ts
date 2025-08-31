import { useEffect, useMemo, useState } from "react";
import { CalendarDay, CountryCode, HolidayWithCountry } from "../types";
import { allHolidays as holidaysData } from "../data/holidays_v2";
import { formatDateString, isSameDate } from "../utils/dateUtils";

const dateFormatter = new Intl.DateTimeFormat("en-CA"); // Canadian English uses YYYY-MM-DD format

export const useCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(["LV"]);
    const [selectedYear, setSelectedYear] = useState(new Date().getUTCFullYear());

    useEffect(() => {
        const urlSearchParams = new URLSearchParams(window.location.hash.replace("#", ""));
        const countries = (urlSearchParams.get("countries") ?? "");
        if (countries) {
            setSelectedCountries(countries.split(",") as CountryCode[]);
        }
        const date = (urlSearchParams.get("date") ?? "");
        if (date) {
            setCurrentDate(new Date(date + "T00:00:00Z"));
            setSelectedYear(new Date(date + "T00:00:00Z").getFullYear());
        }
    }, []);

    const getHolidaysForDate = (date: Date): HolidayWithCountry[] => {
        const dateStr = formatDateString(date);
        const holidays: HolidayWithCountry[] = [];

        selectedCountries.forEach(countryCode => {
            const countryHolidays = holidaysData[countryCode]?.holidays || [];
            countryHolidays.forEach(holiday => {
                if (holiday.date === dateStr && holiday.type?.includes("National holiday")) {
                    holidays.push({
                        ...holiday,
                        country: holidaysData[countryCode].countryName,
                        countryCode: countryCode,
                    });
                }
            });
        });

        return holidays;
    };

    const selectedMonthDays = useMemo((): CalendarDay[] => {
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();
        const firstDay = new Date(Date.UTC(year, month, 1));
        const startDate = new Date(firstDay);
        startDate.setUTCDate(startDate.getUTCDate() - (firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1));

        const days: CalendarDay[] = [];
        const today = new Date();

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getUTCDate() + i);

            const isCurrentMonth = date.getUTCMonth() === month;
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

    const currentYear = currentDate.getUTCFullYear();
    const selectedYearDays = useMemo((): CalendarDay[] => {
        const firstDay = new Date(Date.UTC(currentYear, 0, 1, 12, 0, 0));// use 12:00 as a starting time so day zone changes do not affect dates
        const startDate = new Date(firstDay);


        const days: CalendarDay[] = [];
        const today = new Date();

        for (let i = 1; i <= 366; i++) {
            const date = new Date(startDate);
            date.setDate(i);

            const isToday = isSameDate(date, today);
            const holidays = getHolidaysForDate(date);

            days.push({
                date,
                isCurrentMonth: false,
                isToday,
                holidays,
                dayNumber: date.getDate()
            });
        }

        return days;
    }, [currentYear, selectedCountries]);

    const navigateMonth = (nextMonth: number): void => {
        const newDate = new Date(currentDate);
        newDate.setUTCMonth(nextMonth);
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("date", dateFormatter.format(newDate));
        window.location.hash = decodeURIComponent(params.toString());
        setCurrentDate(newDate);
    };

    const toggleCountry = (countryCode: CountryCode): void => {
        setSelectedCountries(prev => {
            const newCountries = prev.includes(countryCode)
                ? prev.filter(c => c !== countryCode)
                : [...prev, countryCode];
            const params = new URLSearchParams(window.location.hash.replace("#", ""));
            params.set("countries", newCountries.join(","));
            window.location.hash = decodeURIComponent(params.toString());
            return newCountries;
        });
    };

    const handleYearChange = (year: number): void => {
        const newDate = new Date(currentDate);
        newDate.setUTCFullYear(year);
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("date", dateFormatter.format(newDate));
        window.location.hash = decodeURIComponent(params.toString());
        setCurrentDate(newDate);
        setSelectedYear(year);
    };

    return {
        currentDate,
        selectedCountries,
        selectedYear,
        selectedMonthDays,
        selectedYearDays,
        navigateMonth,
        toggleCountry,
        handleYearChange
    };
};
