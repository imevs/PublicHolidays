import { useEffect, useMemo, useState } from "react";
import { CalendarDay, CalendarEvent } from "../types";
import { formatDateString, isSameDate } from "../utils/dateUtils";
import type { CountryHolidays } from "../data/holidays_v2/types";
import type { CountryCode } from "../data/countryNames";

const dateFormatter = new Intl.DateTimeFormat("en-CA"); // Canadian English uses YYYY-MM-DD format

export const useCalendar = (holidaysData: Record<CountryCode, CountryHolidays> | undefined) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(["LV"]);
    const [mode, setMode] = useState<"month" | "year">("year");
    const [showAllCountries, setShowAllCountries] = useState(false);

    useEffect(() => {
        const urlSearchParams = new URLSearchParams(window.location.hash.replace("#", ""));
        const countries = urlSearchParams.get("countries") ?? "";
        if (countries) {
            setSelectedCountries(countries.split(",") as CountryCode[]);
        }
        const date = urlSearchParams.get("date") ?? "";
        if (date) {
            setCurrentDate(new Date(date + "T00:00:00Z"));
        }
        const urlMode = urlSearchParams.get("mode") as "month" | "year";
        if (urlMode === "month" || urlMode === "year") {
            setMode(urlMode);
        }
        const showAll = urlSearchParams.get("all") as "1" | "0";
        setShowAllCountries(showAll === "1");
    }, []);

    const getHolidaysForDate = (date: Date): CalendarEvent[] => {
        if (!holidaysData) {
            return [];
        }
        const dateStr = formatDateString(date);
        const holidays: CalendarEvent[] = [];

        selectedCountries.forEach(countryCode => {
            const countryHolidays = holidaysData[countryCode]?.holidays || [];
            countryHolidays.forEach(holiday => {
                if (holiday.date === dateStr && holiday.type?.includes("National holiday")) {
                    holidays.push({
                        ...holiday,
                        type: "publicHoliday",
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
                isWeekend: [6,0].includes(date.getDay()),
                events: holidays,
                dayNumber: date.getDate()
            });
        }

        return days;
    }, [currentDate, selectedCountries, holidaysData]);

    const selectedYearDays = useMemo((): CalendarDay[] => {
        const currentYear = currentDate.getUTCFullYear();
        const firstDay = new Date(Date.UTC(currentYear, 0, 1, 12, 0, 0)); // Use 12:00 as a starting time so day zone changes do not affect dates
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
                isWeekend: [6,0].includes(date.getDay()),
                isToday,
                events: holidays,
                dayNumber: date.getDate()
            });
        }

        return days;
    }, [currentDate, selectedCountries, holidaysData]);

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

    const handleDateChange = (newDate: Date): void => {
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("date", dateFormatter.format(newDate));
        window.location.hash = decodeURIComponent(params.toString());
        setCurrentDate(newDate);
    };

    const handleModeChange = (newMode: "month" | "year"): void => {
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("mode", newMode);
        window.location.hash = decodeURIComponent(params.toString());
        setMode(newMode);
    };

    const onShowAllCountries = (state: boolean) => {
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("all", state ? "1" : "0");
        window.location.hash = decodeURIComponent(params.toString());
        setShowAllCountries(state);
    };

    return {
        currentDate,
        selectedCountries,
        selectedMonthDays,
        selectedYearDays,
        mode,
        navigateMonth,
        toggleCountry,
        handleDateChange,
        handleModeChange,
        showAllCountries,
        setShowAllCountries: onShowAllCountries,
    };
};
