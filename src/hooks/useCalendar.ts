import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDay, CalendarEvent } from "../types";
import { convertDayToEUFormat, DayIndexes, formatDateString, getNextMonth, isSameDate } from "../utils/dateUtils";
import type { CountryCode } from "../data/countryNames";
import { type DateString, UTCDate } from "../utils/UTCDate";

const dateFormatter = new Intl.DateTimeFormat("en-CA"); // Canadian English uses YYYY-MM-DD format

export const useCalendar = (holidaysData: CalendarEvent[]) => {
    const [currentDate, setCurrentDate] = useState(new UTCDate());
    const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(["LV"]);
    const [mode, setMode] = useState<"month" | "year">("year");
    const [showAllCountries, setShowAllCountries] = useState(false);

    const loadStateFromSearchParams = useCallback(() => {
        const urlSearchParams = new URLSearchParams(window.location.hash.replace("#", ""));
        const countries = urlSearchParams.get("countries") ?? "";
        if (countries) {
            setSelectedCountries(countries.split(",") as CountryCode[]);
        }
        const date = urlSearchParams.get("date") ?? "";
        if (date) {
            setCurrentDate(new UTCDate(date as DateString));
        }
        const urlMode = urlSearchParams.get("mode") as "month" | "year";
        if (urlMode === "month" || urlMode === "year") {
            setMode(urlMode);
        }
        const showAll = urlSearchParams.get("all") as "1" | "0";
        setShowAllCountries(showAll === "1");
    }, []);

    useEffect(() => {
        loadStateFromSearchParams();
        window.addEventListener("hashchange", loadStateFromSearchParams);
        return () => {
            window.removeEventListener("hashchange", loadStateFromSearchParams);
        };
    }, []);

    const getHolidaysForDate = (date: UTCDate): CalendarEvent[] => {
        const dateStr = formatDateString(date);
        return [
            ...holidaysData.filter(h => h.kind === "other" && h.date === dateStr),
            ...selectedCountries.flatMap(countryCode =>
                holidaysData.filter(h =>
                    h.kind === "publicHoliday" && h.countryCode === countryCode &&
                    h.type?.includes("National holiday") === true &&
                    h.date === dateStr
                ),
            ),
        ];
    };

    const selectedMonthDays = useMemo((): CalendarDay[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new UTCDate(`${year}-${String(month + 1).padStart(2, "0")}-01`);
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
        const firstDay = new UTCDate(`${currentYear}-01-01`);
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
