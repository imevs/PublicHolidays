import { useEffect, useMemo, useState } from "react";
import { CalendarDay, CalendarEvent } from "../types";
import { convertDayToEUFormat, DayIndexes, formatDateString, getNextMonth, isSameDate } from "../utils/dateUtils";
import type { CountryCode } from "../data/countryNames";
import { UTCDate } from "../utils/UTCDate";

const dateFormatter = new Intl.DateTimeFormat("en-CA"); // Canadian English uses YYYY-MM-DD format

export const useCalendar = (holidaysData: CalendarEvent[]) => {
    const [currentDate, setCurrentDate] = useState(new UTCDate());
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
            setCurrentDate(new UTCDate(date + "T00:00:00Z"));
        }
        const urlMode = urlSearchParams.get("mode") as "month" | "year";
        if (urlMode === "month" || urlMode === "year") {
            setMode(urlMode);
        }
        const showAll = urlSearchParams.get("all") as "1" | "0";
        setShowAllCountries(showAll === "1");
    }, []);

    const getHolidaysForDate = (date: UTCDate): CalendarEvent[] => {
        const dateStr = formatDateString(date);
        const holidays: CalendarEvent[] = [];

        holidays.push(...holidaysData.filter(h => h.kind === "other" && h.date === dateStr));

        selectedCountries.forEach(countryCode => {
            holidays.push(...holidaysData.filter(h =>
                h.kind === "publicHoliday" &&
                h.countryCode === countryCode &&
                h.type?.includes("National holiday") === true &&
                h.date === dateStr));
        });

        return holidays;
    };

    const selectedMonthDays = useMemo((): CalendarDay[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new UTCDate(Date.UTC(year, month, 1));
        const startDate = new UTCDate(firstDay);
        startDate.setDate(startDate.getDate() + 1 - convertDayToEUFormat(firstDay.getDay()));

        const days: CalendarDay[] = [];
        const today = new UTCDate();

        for (let i = 0; i < 42; i++) {
            const date = new UTCDate(startDate);
            date.setDate(startDate.getDate() + i);
            if (date.getDay() === DayIndexes.Monday && date.getMonth() === getNextMonth(month)) {
                break;
            }

            const isCurrentMonth = date.getMonth() === month;
            const isToday = isSameDate(date, today);
            const holidays = getHolidaysForDate(date);

            days.push({
                date,
                isCurrentMonth,
                isToday,
                isWeekend: [DayIndexes.Saturday, DayIndexes.Sunday].includes(date.getDay()),
                events: holidays,
                dayNumber: date.getDate()
            });
            if (date.getDay() === DayIndexes.Sunday && date.getMonth() === getNextMonth(month)) {
                break;
            }
        }

        return days;
    }, [currentDate, selectedCountries, holidaysData]);

    const selectedYearDays = useMemo((): CalendarDay[] => {
        const currentYear = currentDate.getFullYear();
        const firstDay = new UTCDate(Date.UTC(currentYear, 0, 1, 12, 0, 0)); // Use 12:00 as a starting time so day zone changes do not affect dates
        const startDate = new UTCDate(firstDay);

        const days: CalendarDay[] = [];
        const today = new UTCDate();

        for (let i = 1; i <= 366; i++) {
            const date = new UTCDate(startDate);
            date.setDate(i);

            const isToday = isSameDate(date, today);
            const isCurrentYear = date.getFullYear() === currentYear;
            const holidays = isCurrentYear ? getHolidaysForDate(date) : [];

            days.push({
                date,
                isCurrentMonth: false,
                isWeekend: [DayIndexes.Saturday, DayIndexes.Sunday].includes(date.getDay()),
                isToday,
                events: holidays,
                dayNumber: date.getDate()
            });
        }

        return days;
    }, [currentDate, selectedCountries, holidaysData]);

    const navigateMonth = (nextMonth: number): void => {
        const newDate = new UTCDate(currentDate);
        newDate.setMonth(nextMonth);
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("date", dateFormatter.format(newDate.valueOf()));
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

    const handleDateChange = (newDate: UTCDate): void => {
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("date", dateFormatter.format(newDate.valueOf()));
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
