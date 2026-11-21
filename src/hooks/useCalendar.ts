import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDay, CalendarEvent } from "../types/index.ts";
import {
    convertDayToEUFormat,
    DayIndexes,
    formatDateString,
    getNextMonth,
    isSameDate,
    isWeekend
} from "../utils/dateUtils.ts";
import type { CountryCode } from "../data/countryNames.ts";
import { type DateString, type DateThreeParts, UTCDate } from "../utils/UTCDate.ts";
import { dateLocale } from "../consts.ts";

const dateFormatter = new Intl.DateTimeFormat(dateLocale);

export interface HolidaysIndex {
    otherByDate: Map<DateString, CalendarEvent[]>;
    publicByDateAndCountry: Map<DateString, Map<CountryCode, CalendarEvent[]>>;
}

export function buildHolidaysIndex(holidaysData: CalendarEvent[]): HolidaysIndex {
    const otherByDate = new Map<DateString, CalendarEvent[]>();
    const publicByDateAndCountry = new Map<DateString, Map<CountryCode, CalendarEvent[]>>();

    for (const h of holidaysData) {
        if (h.kind === "other") {
            let list = otherByDate.get(h.date);
            if (!list) {
                list = [];
                otherByDate.set(h.date, list);
            }
            list.push(h);
        } else if (h.kind === "publicHoliday" && h.type?.includes("National holiday") === true) {
            let byCountry = publicByDateAndCountry.get(h.date);
            if (!byCountry) {
                byCountry = new Map<CountryCode, CalendarEvent[]>();
                publicByDateAndCountry.set(h.date, byCountry);
            }
            let list = byCountry.get(h.countryCode);
            if (!list) {
                list = [];
                byCountry.set(h.countryCode, list);
            }
            list.push(h);
        }
    }

    return { otherByDate, publicByDateAndCountry };
}

function getParams() {
    return new URLSearchParams(window.location.hash.replace("#", ""));
}

function calcSelectedDays(
    currentDate: UTCDate,
    holidaysIndex: HolidaysIndex,
    selectedCountries: CountryCode[],
    month: number,
    showAllHolidays: boolean,
    onlyMonth = false,
) {
    const year = currentDate.getFullYear();
    const firstDay = new UTCDate(`${year}-${String(month + 1).padStart(2, "0")}-01`);
    const startDate = new UTCDate(firstDay);
    startDate.setDate(startDate.getDate() + 1 - convertDayToEUFormat(firstDay.getDay()));

    const days: CalendarDay[] = [];
    const today = new UTCDate();
    const nextMonth = getNextMonth(month);
    const maxDays = onlyMonth ? 42 : 366 + 7;

    let isSideMonth = true;
    for (let i = 0; i < maxDays; i++) {
        const date = new UTCDate(startDate);
        date.setDate(startDate.getDate() + i);
        if (date.getDay() === DayIndexes.Monday && date.getMonth() === nextMonth) {
            isSideMonth = false;
            if (onlyMonth) {
                break;
            }
        }

        const isToday = isSameDate(date, today);
        const isCurrentYear = date.getFullYear() === year;

        const holidays = isCurrentYear ? getHolidaysForDate(date, holidaysIndex, selectedCountries) : [];
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
        if (date.getDay() === DayIndexes.Sunday && date.getMonth() === nextMonth) {
            isSideMonth = false;
            if (onlyMonth) {
                break;
            }
        }
    }

    return days;
}

export function getHolidaysForDate(
    date: UTCDate,
    holidaysIndex: HolidaysIndex,
    selectedCountries: CountryCode[],
): CalendarEvent[] {
    const dateStr = formatDateString(date);
    const otherEvents = holidaysIndex.otherByDate.get(dateStr);
    const publicByCountry = holidaysIndex.publicByDateAndCountry.get(dateStr);

    if (!otherEvents && !publicByCountry) {
        return [];
    }

    const result: CalendarEvent[] = otherEvents ? [...otherEvents] : [];
    if (publicByCountry) {
        for (const countryCode of selectedCountries) {
            const countryEvents = publicByCountry.get(countryCode);
            if (countryEvents) {
                result.push(...countryEvents);
            }
        }
    }
    return result;
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

    const [hasInteractedRef] = useState(() => ({ current: false }));
    const [shouldScrollToMonth, setShouldScrollToMonth] = useState(false);
    const clearShouldScrollToMonth = useCallback(() => setShouldScrollToMonth(false), []);

    const loadStateFromSearchParams = useCallback(() => {
        const urlSearchParams = getParams();
        const countries = urlSearchParams.get("countries") ?? "";
        if (countries) {
            setSelectedCountries(countries.split(",") as CountryCode[]);
        }
        const date = urlSearchParams.get("date") ?? "";
        if (date) {
            const skipScroll = sessionStorage.getItem("skipMonthScroll") === "1";
            if (skipScroll) {
                sessionStorage.removeItem("skipMonthScroll");
            }
            setCurrentDate(new UTCDate(date as DateThreeParts));
            if (!hasInteractedRef.current && !skipScroll) {
                setShouldScrollToMonth(true);
            }
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

    const holidaysIndex = useMemo(() => buildHolidaysIndex(holidaysData), [holidaysData]);

    const selectedMonthDays = useMemo((): CalendarDay[] => {
        return calcSelectedDays(currentDate, holidaysIndex, selectedCountries, currentDate.getMonth(), showAllHolidays, true);
    }, [currentDate, selectedCountries, holidaysIndex, showAllHolidays]);

    const selectedYearDays = useMemo((): CalendarDay[] => {
        return calcSelectedDays(currentDate, holidaysIndex, selectedCountries, 0, showAllHolidays);
    }, [currentDate, selectedCountries, holidaysIndex, showAllHolidays]);

    const navigateMonth = useCallback((nextMonth: number): UTCDate => {
        hasInteractedRef.current = true;
        setShouldScrollToMonth(false);
        const newDate = new UTCDate(currentDate);
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
        hasInteractedRef.current = true;
        setShouldScrollToMonth(false);
        const params = getParams();
        params.set("date", dateFormatter.format(newDate.valueOf()));
        window.location.hash = decodeURIComponent(params.toString());
        setCurrentDate(newDate);
    }, []);

    const handleModeChange = useCallback((newMode: "month" | "year", month: number): void => {
        hasInteractedRef.current = true;
        setShouldScrollToMonth(false);
        const params = getParams();
        params.set("mode", newMode);
        if (newMode === "month") {
            const newDate = new UTCDate(currentDate);
            newDate.setDate(1);
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
        shouldScrollToMonth,
        clearShouldScrollToMonth,
    };
};
