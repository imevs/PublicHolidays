import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDay, CalendarEvent } from "../types";
import {
    convertDayToEUFormat,
    dateLocale,
    DayIndexes,
    formatDateString,
    getNextMonth,
    isSameDate,
    isWeekend
} from "../utils/dateUtils";
import type { CountryCode } from "../data/countryNames";
import { type DateThreeParts, UTCDate } from "../utils/UTCDate";

const dateFormatter = new Intl.DateTimeFormat(dateLocale);

function getParams() {
    return new URLSearchParams(window.location.search || window.location.hash.replace("#", ""));
}

function calcSelectedDays(
    currentDate: UTCDate,
    holidaysData: CalendarEvent[],
    selectedCountries: CountryCode[],
    month: number,
    showAllHolidays: boolean,
) {
    const year = currentDate.getFullYear();
    const firstDay = new UTCDate(`${year}-${String(month + 1).padStart(2, "0")}-01`);
    const startDate = new UTCDate(firstDay);
    startDate.setDate(startDate.getDate() + 1 - convertDayToEUFormat(firstDay.getDay()));

    const days: CalendarDay[] = [];
    const today = new UTCDate();

    let isSideMonth = true;
    for (let i = 0; i <= 366 + 6; i++) {
        const date = new UTCDate(startDate);
        date.setDate(startDate.getDate() + i);
        if (date.getDay() === DayIndexes.Monday && date.getMonth() === getNextMonth(month)) {
            isSideMonth = false;
        }

        const isToday = isSameDate(date, today);
        const isCurrentYear = date.getFullYear() === year;

        const holidays = isCurrentYear ? getHolidaysForDate(date, holidaysData, selectedCountries) : [];
        days.push({
            date,
            isSideMonth: date.getMonth() !== month && isSideMonth,
            isCurrentMonth: date.getMonth() === month && isCurrentYear,
            isCurrentYear: isCurrentYear,
            isToday,
            isWeekend: isWeekend(date.getDay()),
            events: showAllHolidays || !isWeekend(date.getDay()) ? holidays : [],
            dayNumber: date.getDate()
        });
        if (date.getDay() === DayIndexes.Sunday && date.getMonth() === getNextMonth(month)) {
            isSideMonth = false;
        }
    }

    return days;
}

function getHolidaysForDate(date: UTCDate, holidaysData: CalendarEvent[], selectedCountries: CountryCode[]): CalendarEvent[] {
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
}

export const useCalendar = (holidaysData: CalendarEvent[], showAllHolidays = true) => {
    const [currentDate, setCurrentDateWithoutCheck] = useState(new UTCDate());
    const setCurrentDate = (date: UTCDate) => {
        if (date.valueOf() !== currentDate.valueOf()) {
            setCurrentDateWithoutCheck(date)
        }
    };
    const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(["LV"]);
    const [mode, setMode] = useState<"month" | "year">("year");
    const [showAllCountries, setShowAllCountries] = useState(false);

    const loadStateFromSearchParams = useCallback(() => {
        const urlSearchParams = getParams();
        const countries = urlSearchParams.get("countries") ?? "";
        if (countries) {
            setSelectedCountries(countries.split(",") as CountryCode[]);
        }
        const date = urlSearchParams.get("date") ?? "";
        if (date) {
            setCurrentDate(new UTCDate(date as DateThreeParts));
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

    const selectedMonthDays = useMemo((): CalendarDay[] => {
        return calcSelectedDays(currentDate, holidaysData, selectedCountries, currentDate.getMonth(), showAllHolidays)
            .filter(d => d.isSideMonth || d.isCurrentMonth);
    }, [currentDate, selectedCountries, holidaysData, showAllHolidays]);

    const selectedYearDays = useMemo((): CalendarDay[] => {
        return calcSelectedDays(currentDate, holidaysData, selectedCountries, 0, showAllHolidays);
    }, [currentDate, selectedCountries, holidaysData, showAllHolidays]);

    const navigateMonth = useCallback((nextMonth: number): UTCDate => {
        const newDate = new UTCDate(currentDate);
        console.log(currentDate);
        newDate.setDate(1);
        newDate.setMonth(nextMonth);
        const params = getParams();
        params.set("date", dateFormatter.format(newDate.valueOf()));
        window.location.hash = decodeURIComponent(params.toString()); // will trigger hashchange event
        return newDate;
    }, [currentDate]);

    const toggleCountry = useCallback((countryCode: CountryCode): void => {
        setSelectedCountries(prev => {
            const newCountries = prev.includes(countryCode)
                ? prev.filter(c => c !== countryCode)
                : [...prev, countryCode];
            const params = getParams();
            params.set("countries", newCountries.join(","));
            window.location.hash = decodeURIComponent(params.toString());
            return newCountries;
        });
    }, []);

    const handleDateChange = useCallback((newDate: UTCDate): void => {
        const params = getParams();
        params.set("date", dateFormatter.format(newDate.valueOf()));
        window.location.hash = decodeURIComponent(params.toString());
        setCurrentDate(newDate);
    }, []);

    const handleModeChange = useCallback((newMode: "month" | "year", month: number): void => {
        const params = getParams();
        params.set("mode", newMode);
        if (newMode === "month") {
            const newDate = new UTCDate(currentDate);
            newDate.setMonth(month);
            params.set("date", dateFormatter.format(newDate.valueOf()));
        }
        window.location.hash = decodeURIComponent(params.toString());
        setMode(newMode);
    }, [currentDate]);

    const onShowAllCountries = useCallback((state: boolean) => {
        const params = getParams();
        params.set("all", state ? "1" : "0");
        window.location.hash = decodeURIComponent(params.toString());
        setShowAllCountries(state);
    }, []);

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
