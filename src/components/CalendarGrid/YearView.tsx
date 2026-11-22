import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDay as CalendarDayType, type HolidayWithCountry, type OtherEvent } from "../../types/index.ts";
import {
    convertDayToEUFormat,
    formatDateString,
    getDaysInMonth,
} from "../../utils/dateUtils.ts";
import styles from "./CalendarGrid.module.css";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { type DateString, UTCDate } from "../../utils/UTCDate.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import { getLongHolidayStyle, getLongHolidayTooltip } from "../../utils/longHolidayColors.ts";
import type { MonthViewProps } from "./MonthView.tsx";

function cn(classes: string) {
    return classes.split("\n").map(line => line.trim()).filter(Boolean).join(" ");
}

export const YearView = ({
    selectedDays,
    onModeChange,
    currentDate,
    dateForPopup,
    setDateForPopup,
    isEditable,
    setSelectedDay,
    shouldScrollToMonth,
    onScrolledToMonth,
    highlightLongHolidays,
}: MonthViewProps & {
    setSelectedDay: (date: UTCDate | null) => void;
    shouldScrollToMonth?: boolean;
    onScrolledToMonth?: () => void;
}) => {
    const { t, getMonthName, getCountryName, format } = useTranslation();
    const currentYear = currentDate.getFullYear();
    const [highlightedMonth, setHighlightedMonth] = useState<number | null>(null);
    const yearGridRef = useRef<HTMLDivElement | null>(null);
    const isFirstRenderRef = useRef(true);

    const currentMonth = currentDate.getMonth();
    const daysByDate = useMemo(() => {
        const map = new Map<DateString, CalendarDayType>();
        for (const d of selectedDays) {
            map.set(formatDateString(d.date), d);
        }
        return map;
    }, [selectedDays]);
    const dateForPopupStr = dateForPopup ? formatDateString(dateForPopup) : null;

    useEffect(() => {
        if (shouldScrollToMonth && yearGridRef.current) {
            const monthElement = yearGridRef.current.querySelectorAll(`.${styles.monthContainer}`)[currentMonth];
            if (monthElement && !currentDate.isToday()) {
                monthElement.scrollIntoView({ behavior: "smooth", block: "center" });
                setHighlightedMonth(currentMonth);
            }
            onScrolledToMonth?.();
        } else if (!isFirstRenderRef.current) {
            setHighlightedMonth(currentMonth);
        }
        isFirstRenderRef.current = false;
    }, [currentMonth, shouldScrollToMonth, currentDate, onScrolledToMonth]);

    return (
        <>
            <h1 style={{ textAlign: "center", fontSize: "2rem" }}>{currentYear}</h1>
            <div ref={yearGridRef} className={styles.yearGrid}>
                {Array.from({ length: 12 }, (_, month) => {
                    const daysInMonth = getDaysInMonth(currentYear, month);
                    const monthName = getMonthName(month);
                    const firstDay = new UTCDate(`${currentYear}-${String(month + 1).padStart(2, "0")}-01`);
                    const dayOfWeek = convertDayToEUFormat(firstDay.getDay()) - 1;

                    const renderYearDayCell = (dateStr: DateString, dayNumber: number, borderRadius: string, isOtherMonth: boolean, key: string) => {
                        const currentDay = daysByDate.get(dateStr);
                        const dayHolidays = currentDay?.events || [];
                        const seen = new Set<string>();
                        const dayCountryHolidaysUnique = dayHolidays.filter((h): h is HolidayWithCountry => {
                            if (h.kind !== "publicHoliday") { return false; }
                            if (seen.has(h.countryCode)) { return false; }
                            seen.add(h.countryCode);
                            return true;
                        });
                        const isDayClickable = dayHolidays.length > 0 || isEditable;
                        const firstRangeEvent = dayHolidays.find((h): h is OtherEvent => h.kind === "other" && Boolean(h.isRange));
                        const longHolidayTitle = highlightLongHolidays && currentDay?.isLongHoliday ? getLongHolidayTooltip(currentDay.longHolidayDetails, getCountryName, format, t.calendarGrid.longHolidayTooltip, t.calendarGrid.longHolidayTooltipCustom) : undefined;
                        const handleDaySelect = () => {
                            const date = currentDay?.date ?? new UTCDate(dateStr);
                            if (dayHolidays.length > 0) {
                                setSelectedDay(date);
                            } else {
                                setDateForPopup(date);
                            }
                        };
                        return (
                            <div
                                key={key}
                                className={cn(`
                                    ${currentDay?.isToday ? styles.today : ""}
                                    ${dateForPopupStr === dateStr ? styles.selectedDate : ""} 
                                    ${styles.dayCell} 
                                    ${isOtherMonth ? styles.otherMonth : ""}
                                    ${dayHolidays.length > 0 || currentDay?.isWeekend ? styles.holiday : ""}
                                    ${isDayClickable ? styles.isClickable : ""}
                                    ${firstRangeEvent ? styles.rangeDay : ""}
                                    ${highlightLongHolidays && currentDay?.isLongHoliday ? styles.longHoliday : ""}
                                `)}
                                data-month={month + 1}
                                title={longHolidayTitle}
                                style={{
                                    borderRadius,
                                    ...(firstRangeEvent?.color ? { "--range-color": firstRangeEvent.color } : {}),
                                    ...(highlightLongHolidays && currentDay?.isLongHoliday ? getLongHolidayStyle(currentDay.longHolidayColors, true) : undefined),
                                } as React.CSSProperties}
                                role={isDayClickable ? "button" : undefined}
                                tabIndex={isDayClickable ? 0 : undefined}
                                onClick={handleDaySelect}
                                onKeyDown={isDayClickable ? (e) => handleKeyboardActivation(e, handleDaySelect) : undefined}
                            >
                                {dayNumber}
                                <div className={styles.holidayIndicatorsList}>
                                    {dayCountryHolidaysUnique.map((holiday) => (
                                        <div key={holiday.countryCode + holiday.name} className={styles.holidayIndicator}>
                                            {getFlagEmoji(holiday.countryCode)}
                                        </div>
                                    ))}
                                    {dayHolidays.filter((h) => h.kind === "other").map(h => (
                                        <div key={h.name} className={styles.holidayIndicator}>
                                            {h.icon}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    };

                    return (
                        <div
                            key={month}
                            className={`${styles.monthContainer} ${highlightedMonth === month ? styles.highlightedMonth : ""}`}
                        >
                            <div
                                className={styles.monthHeader}
                                title={t.calendarGrid.clickToSwitchMonthView}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    onModeChange("month", month);
                                }}
                                onKeyDown={(e) => handleKeyboardActivation(e, () => onModeChange("month", month))}
                            >
                                {monthName}
                            </div>
                            <div className={styles.monthGrid}>
                                {(() => {
                                    const firstDayStr = formatDateString(firstDay);
                                    const lastDay = new UTCDate(`${currentYear}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`);
                                    const lastDayStr = formatDateString(lastDay);
                                    const maxTrailing = 7 - convertDayToEUFormat(lastDay.getDay());

                                    let visibleLeadingCount = 0;
                                    if (highlightLongHolidays && dayOfWeek > 0 && daysByDate.get(firstDayStr)?.isLongHoliday) {
                                        for (let offset = 1; offset <= dayOfWeek; offset++) {
                                            const prevDate = new UTCDate(firstDay);
                                            prevDate.setDate(firstDay.getDate() - offset);
                                            if (daysByDate.get(formatDateString(prevDate))?.isLongHoliday) {
                                                visibleLeadingCount++;
                                            } else {
                                                break;
                                            }
                                        }
                                    }
                                    const firstVisibleLeadingIdx = dayOfWeek - visibleLeadingCount;

                                    let visibleTrailingCount = 0;
                                    if (highlightLongHolidays && maxTrailing > 0 && daysByDate.get(lastDayStr)?.isLongHoliday) {
                                        for (let offset = 1; offset <= maxTrailing; offset++) {
                                            const nextDate = new UTCDate(lastDay);
                                            nextDate.setDate(lastDay.getDate() + offset);
                                            if (daysByDate.get(formatDateString(nextDate))?.isLongHoliday) {
                                                visibleTrailingCount++;
                                            } else {
                                                break;
                                            }
                                        }
                                    }

                                    return (
                                        <>
                                            {Array.from({ length: dayOfWeek }, (_, idx) => {
                                                if (idx < firstVisibleLeadingIdx) {
                                                    return <div key={`empty-${idx}`} />;
                                                }
                                                const prevDate = new UTCDate(firstDay);
                                                prevDate.setDate(firstDay.getDate() - (dayOfWeek - idx));
                                                const prevDateStr = formatDateString(prevDate);
                                                const topLeft = idx === firstVisibleLeadingIdx ? 10 : 0;
                                                return renderYearDayCell(prevDateStr, prevDate.getDate(), `${topLeft}px 0px 0px 0px`, true, `prev-${idx}`);
                                            })}
                                            {Array.from({ length: daysInMonth }, (_, day) => {
                                                const dateStr = `${currentYear}-${String(month + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}` as DateString;
                                                const topLeft = visibleLeadingCount === 0 && day === 0 ? 10 : 0;
                                                const bottomRight = visibleTrailingCount === 0 && day === daysInMonth - 1 ? 10 : 0;
                                                return renderYearDayCell(dateStr, day + 1, `${topLeft}px 0px ${bottomRight}px 0px`, false, `${day}`);
                                            })}
                                            {Array.from({ length: visibleTrailingCount }, (_, idx) => {
                                                const nextDate = new UTCDate(lastDay);
                                                nextDate.setDate(lastDay.getDate() + idx + 1);
                                                const nextDateStr = formatDateString(nextDate);
                                                const bottomRight = idx === visibleTrailingCount - 1 ? 10 : 0;
                                                return renderYearDayCell(nextDateStr, nextDate.getDate(), `0px 0px ${bottomRight}px 0px`, true, `next-${idx}`);
                                            })}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
