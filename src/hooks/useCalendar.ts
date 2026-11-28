import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDay, CalendarEvent, CalendarMode } from "../types/index.ts";
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
import { LONG_HOLIDAY_PALETTE } from "../utils/longHolidayColors.ts";

const dateFormatter = new Intl.DateTimeFormat(dateLocale);

export interface HolidaysIndex {
    otherByDate: Map<DateString, CalendarEvent[]>;
    publicByDateAndCountry: Map<DateString, Map<CountryCode, CalendarEvent[]>>;
}

export function buildHolidaysIndex(holidaysData: CalendarEvent[], showSchoolHolidays = false): HolidaysIndex {
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
        } else if (h.kind === "publicHoliday") {
            if (h.type?.includes("National holiday") === true || (showSchoolHolidays && h.type?.includes("School Holiday") === true)) {
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
    }

    return { otherByDate, publicByDateAndCountry };
}

function getParams() {
    return new URLSearchParams(window.location.hash.replace("#", ""));
}

function markLongHolidays(days: CalendarDay[], hasTargetEvent: (d: CalendarDay) => boolean): CalendarDay[] {
    const isOff = (d: CalendarDay) => d.isWeekend || hasTargetEvent(d);
    
    const n = days.length;
    const result = days.map(d => ({ ...d }));
    
    let i = 0;
    while (i < n) {
        if (isOff(result[i])) {
            let start = i;
            while (i < n && isOff(result[i])) {
                i++;
            }
            let end = i; // exclusive
            let runLength = end - start;
            let hasEvent = false;
            for (let j = start; j < end; j++) {
                if (hasTargetEvent(result[j])) {
                    hasEvent = true;
                    break;
                }
            }
            if (runLength >= 3 && hasEvent) {
                for (let j = start; j < end; j++) {
                    result[j].isLongHoliday = true;
                    result[j].longHolidayDays = runLength;
                }
            } else {
                for (let j = start; j < end; j++) {
                    result[j].isLongHoliday = false;
                }
            }
        } else {
            result[i].isLongHoliday = false;
            i++;
        }
    }
    return result;
}

function calcSelectedDays(
    currentDate: UTCDate,
    holidaysIndex: HolidaysIndex,
    selectedCountries: CountryCode[],
    month: number,
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

        const holidays = getHolidaysForDate(date, holidaysIndex, selectedCountries);
        days.push({
            date,
            isSideMonth: date.getMonth() !== month && isSideMonth,
            isCurrentMonth: date.getMonth() === month && isCurrentYear,
            isCurrentYear: isCurrentYear,
            isToday,
            isWeekend: isWeekend(date.getDay()),
            events: holidays,
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

function markLongHolidaysWithPadding(
    days: CalendarDay[],
    holidaysIndex: HolidaysIndex,
    selectedCountries: CountryCode[],
): CalendarDay[] {
    if (days.length === 0) return days;
    const firstDate = new UTCDate(days[0].date);
    firstDate.setDate(firstDate.getDate() - 7);
    const lastDate = new UTCDate(days[days.length - 1].date);
    lastDate.setDate(lastDate.getDate() + 7);

    const paddedDays: CalendarDay[] = [];
    const curr = new UTCDate(firstDate);
    while (curr <= lastDate) {
        const date = new UTCDate(curr);
        const holidayEvents = getHolidaysForDate(date, holidaysIndex, selectedCountries);
        const filteredEvents = holidayEvents;
        paddedDays.push({
            date,
            events: filteredEvents,
            isWeekend: isWeekend(date.getDay()),
            isCurrentMonth: false,
            isCurrentYear: false,
            isSideMonth: false,
            isToday: false,
            dayNumber: date.getDate(),
        });
        curr.setDate(curr.getDate() + 1);
    }

    const longHolidayCountriesByDate = new Map<DateString, CountryCode[]>();
    const longHolidayDetailsByDate = new Map<DateString, { countryCode?: string; days: number }[]>();
    for (const countryCode of selectedCountries) {
        const marked = markLongHolidays(paddedDays, d => d.events.some(e => e.kind === "publicHoliday" && e.countryCode === countryCode && e.type?.includes("National holiday") === true));
        for (const d of marked) {
            if (d.isLongHoliday && d.longHolidayDays) {
                const dateStr = formatDateString(d.date);
                let list = longHolidayCountriesByDate.get(dateStr);
                if (!list) {
                    list = [];
                    longHolidayCountriesByDate.set(dateStr, list);
                }
                if (!list.includes(countryCode)) {
                    list.push(countryCode);
                }

                let details = longHolidayDetailsByDate.get(dateStr);
                if (!details) {
                    details = [];
                    longHolidayDetailsByDate.set(dateStr, details);
                }
                if (!details.some(item => item.countryCode === countryCode)) {
                    details.push({ countryCode, days: d.longHolidayDays });
                }
            }
        }
    }

    const customMarked = markLongHolidays(paddedDays, d => d.events.some(e => e.kind === "other"));
    const customLongHolidayDates = new Set<DateString>();
    const customLongHolidayDaysByDate = new Map<DateString, number>();
    for (const d of customMarked) {
        if (d.isLongHoliday && d.longHolidayDays) {
            const dateStr = formatDateString(d.date);
            customLongHolidayDates.add(dateStr);
            customLongHolidayDaysByDate.set(dateStr, d.longHolidayDays);
        }
    }

    return days.map(d => {
        const dateStr = formatDateString(d.date);
        const countries = longHolidayCountriesByDate.get(dateStr);
        const isLong = Boolean(countries?.length) || customLongHolidayDates.has(dateStr);
        const colors = countries?.map(code => LONG_HOLIDAY_PALETTE[selectedCountries.indexOf(code) % LONG_HOLIDAY_PALETTE.length]) ?? (isLong ? [LONG_HOLIDAY_PALETTE[0]] : undefined);
        let details = longHolidayDetailsByDate.get(dateStr);
        if (!details && customLongHolidayDaysByDate.has(dateStr) && !countries?.length) {
            details = [{ days: customLongHolidayDaysByDate.get(dateStr)! }];
        }
        return {
            ...d,
            isLongHoliday: isLong,
            ...(countries?.length ? { longHolidayCountries: countries } : {}),
            ...(colors?.length ? { longHolidayColors: colors } : {}),
            ...(details?.length ? { longHolidayDetails: details } : {}),
        };
    });
}

export const useCalendar = (holidaysData: CalendarEvent[]) => {
    const [currentDate, setCurrentDateWithoutCheck] = useState(new UTCDate());
    const setCurrentDate = (date: UTCDate) => {
        if (date.valueOf() !== currentDate.valueOf()) {
            setCurrentDateWithoutCheck(date)
        }
    };
    const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(["LV"]);
    const [mode, setMode] = useState<CalendarMode>("year");
    const [showAllCountries, setShowAllCountries] = useState(false);
    const [showSchoolHolidays, setShowSchoolHolidays] = useState(false);

    const isInitialMountRef = useRef(true);
    const [hasInteractedRef] = useState(() => ({ current: false }));
    const [shouldScrollToMonth, setShouldScrollToMonth] = useState(false);
    const clearShouldScrollToMonth = useCallback(() => setShouldScrollToMonth(false), []);

    const loadStateFromSearchParams = useCallback((isInitialLoad = false) => {
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
            if (isInitialLoad && !hasInteractedRef.current && !skipScroll) {
                setShouldScrollToMonth(true);
            }
        }
        const urlMode = urlSearchParams.get("mode") as CalendarMode;
        if (urlMode === "month" || urlMode === "year" || urlMode === "planner") {
            setMode(urlMode);
        }
        const showAll = urlSearchParams.get("all") as "1" | "0";
        setShowAllCountries(showAll === "1");
        const schoolHolidays = urlSearchParams.get("school");
        setShowSchoolHolidays(schoolHolidays === "1");
    }, []);

    useEffect(() => {
        loadStateFromSearchParams(isInitialMountRef.current);
        isInitialMountRef.current = false;
        const handleHashChange = () => loadStateFromSearchParams(false);
        window.addEventListener("hashchange", handleHashChange);
        return () => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, []);

    const holidaysIndex = useMemo(() => buildHolidaysIndex(holidaysData, showSchoolHolidays), [holidaysData, showSchoolHolidays]);

    const selectedYearDays = useMemo((): CalendarDay[] => {
        const days = calcSelectedDays(currentDate, holidaysIndex, selectedCountries, 0);
        return markLongHolidaysWithPadding(days, holidaysIndex, selectedCountries);
    }, [currentDate, selectedCountries, holidaysIndex]);

    const selectedMonthDays = useMemo((): CalendarDay[] => {
        const days = calcSelectedDays(currentDate, holidaysIndex, selectedCountries, currentDate.getMonth(), true);
        return markLongHolidaysWithPadding(days, holidaysIndex, selectedCountries);
    }, [currentDate, selectedCountries, holidaysIndex]);

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
        hasInteractedRef.current = true;
        setShouldScrollToMonth(false);
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

    const onShowSchoolHolidays = useCallback((state: boolean) => {
        const params = getParams();
        if (state) {
            params.set("school", "1");
        } else {
            params.delete("school");
        }
        window.location.hash = decodeURIComponent(params.toString());
        setShowSchoolHolidays(state);
    }, []);

    const handleModeChange = useCallback((newMode: CalendarMode, month: number): void => {
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
        hasInteractedRef.current = true;
        setShouldScrollToMonth(false);
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
        showSchoolHolidays,
        setShowSchoolHolidays: onShowSchoolHolidays,
        shouldScrollToMonth,
        clearShouldScrollToMonth,
    };
};
