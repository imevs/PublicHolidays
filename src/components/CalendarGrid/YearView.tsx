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
import { usePrevious } from "./UsePrevious.tsx";
import { useIsBookTheme } from "./useIsBookTheme.ts";

function cn(classes: string) {
    return classes.split("\n").map(line => line.trim()).filter(Boolean).join(" ");
}

export const YearView = ({
    shouldAnimate,
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

    const isBookTheme = useIsBookTheme();
    const prevDate = usePrevious(currentDate);
    const prevDays = usePrevious(selectedDays);
    const prevYear = prevDate?.getFullYear();
    const isAnimatingYear = Boolean(isBookTheme && shouldAnimate && prevYear !== undefined && prevYear !== currentYear);
    const isForward = Boolean(prevYear !== undefined && prevYear < currentYear);

    const currentMonth = currentDate.getMonth();
    const daysByDate = useMemo(() => {
        const map = new Map<DateString, CalendarDayType>();
        for (const d of selectedDays) {
            map.set(formatDateString(d.date), d);
        }
        return map;
    }, [selectedDays]);
    const prevDaysByDate = useMemo(() => {
        if (!prevDays) return null;
        const map = new Map<DateString, CalendarDayType>();
        for (const d of prevDays) {
            map.set(formatDateString(d.date), d);
        }
        return map;
    }, [prevDays]);
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

    const renderYearMonths = (
        targetYear: number,
        targetDaysByDate: Map<DateString, CalendarDayType>,
        isSnapshot = false,
    ) => Array.from({ length: 12 }, (_, month) => {
        const daysInMonth = getDaysInMonth(targetYear, month);
        const monthName = getMonthName(month);
        const firstDay = new UTCDate(`${targetYear}-${String(month + 1).padStart(2, "0")}-01`);
        const dayOfWeek = convertDayToEUFormat(firstDay.getDay()) - 1;

        const renderYearDayCell = (dateStr: DateString, dayNumber: number, borderRadius: string, isOtherMonth: boolean, key: string) => {
            const currentDay = targetDaysByDate.get(dateStr);
            const dayHolidays = currentDay?.events || [];
            const seen = new Set<string>();
            const dayCountryHolidaysUnique = dayHolidays.filter((h): h is HolidayWithCountry => {
                if (h.kind !== "publicHoliday") { return false; }
                if (seen.has(h.countryCode)) { return false; }
                seen.add(h.countryCode);
                return true;
            });
            const isDayClickable = !isSnapshot && (dayHolidays.length > 0 || isEditable);
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
                        ${!isSnapshot && dateForPopupStr === dateStr ? styles.selectedDate : ""} 
                        ${styles.dayCell} 
                        ${isOtherMonth ? styles.otherMonth : ""}
                        ${dayHolidays.length > 0 || currentDay?.isWeekend ? styles.holiday : ""}
                        ${isDayClickable ? styles.isClickable : ""}
                        ${firstRangeEvent ? styles.rangeDay : ""}
                        ${highlightLongHolidays && currentDay?.isLongHoliday ? styles.longHoliday : ""}
                    `)}
                    data-month={isSnapshot ? undefined : month + 1}
                    title={longHolidayTitle}
                    style={{
                        borderRadius,
                        ...(firstRangeEvent?.color ? { "--range-color": firstRangeEvent.color } : {}),
                        ...(highlightLongHolidays && currentDay?.isLongHoliday ? getLongHolidayStyle(currentDay.longHolidayColors, true) : undefined),
                    } as React.CSSProperties}
                    role={isDayClickable ? "button" : undefined}
                    tabIndex={isDayClickable ? 0 : undefined}
                    onClick={isSnapshot ? undefined : handleDaySelect}
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
                className={`${styles.monthContainer} ${!isSnapshot && highlightedMonth === month ? styles.highlightedMonth : ""}`}
            >
                <div
                    className={styles.monthHeader}
                    title={isSnapshot ? undefined : t.calendarGrid.clickToSwitchMonthView}
                    role={isSnapshot ? undefined : "button"}
                    tabIndex={isSnapshot ? undefined : 0}
                    onClick={isSnapshot ? undefined : () => {
                        onModeChange("month", month);
                    }}
                    onKeyDown={isSnapshot ? undefined : (e) => handleKeyboardActivation(e, () => onModeChange("month", month))}
                >
                    {monthName}
                </div>
                <div className={styles.monthGrid}>
                    {(() => {
                        const firstDayStr = formatDateString(firstDay);
                        const lastDay = new UTCDate(`${targetYear}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`);
                        const lastDayStr = formatDateString(lastDay);
                        const maxTrailing = 7 - convertDayToEUFormat(lastDay.getDay());

                        let visibleLeadingCount = 0;
                        if (highlightLongHolidays && dayOfWeek > 0 && targetDaysByDate.get(firstDayStr)?.isLongHoliday) {
                            for (let offset = 1; offset <= dayOfWeek; offset++) {
                                const prev = new UTCDate(firstDay);
                                prev.setDate(firstDay.getDate() - offset);
                                if (targetDaysByDate.get(formatDateString(prev))?.isLongHoliday) {
                                    visibleLeadingCount++;
                                } else {
                                    break;
                                }
                            }
                        }
                        const firstVisibleLeadingIdx = dayOfWeek - visibleLeadingCount;

                        let visibleTrailingCount = 0;
                        if (highlightLongHolidays && maxTrailing > 0 && targetDaysByDate.get(lastDayStr)?.isLongHoliday) {
                            for (let offset = 1; offset <= maxTrailing; offset++) {
                                const next = new UTCDate(lastDay);
                                next.setDate(lastDay.getDate() + offset);
                                if (targetDaysByDate.get(formatDateString(next))?.isLongHoliday) {
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
                                    const prev = new UTCDate(firstDay);
                                    prev.setDate(firstDay.getDate() - (dayOfWeek - idx));
                                    const prevDateStr = formatDateString(prev);
                                    const topLeft = idx === firstVisibleLeadingIdx ? 10 : 0;
                                    return renderYearDayCell(prevDateStr, prev.getDate(), `${topLeft}px 0px 0px 0px`, true, `prev-${idx}`);
                                })}
                                {Array.from({ length: daysInMonth }, (_, day) => {
                                    const dateStr = `${targetYear}-${String(month + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}` as DateString;
                                    const topLeft = visibleLeadingCount === 0 && day === 0 ? 10 : 0;
                                    const bottomRight = visibleTrailingCount === 0 && day === daysInMonth - 1 ? 10 : 0;
                                    return renderYearDayCell(dateStr, day + 1, `${topLeft}px 0px ${bottomRight}px 0px`, false, `${day}`);
                                })}
                                {Array.from({ length: visibleTrailingCount }, (_, idx) => {
                                    const next = new UTCDate(lastDay);
                                    next.setDate(lastDay.getDate() + idx + 1);
                                    const nextDateStr = formatDateString(next);
                                    const bottomRight = idx === visibleTrailingCount - 1 ? 10 : 0;
                                    return renderYearDayCell(nextDateStr, next.getDate(), `0px 0px ${bottomRight}px 0px`, true, `next-${idx}`);
                                })}
                            </>
                        );
                    })()}
                </div>
            </div>
        );
    });

    if (!isBookTheme) {
        return (
            <>
                <h1 style={{ textAlign: "center", fontSize: "2rem" }}>{currentYear}</h1>
                <div ref={yearGridRef} className={styles.yearGrid}>
                    {renderYearMonths(currentYear, daysByDate)}
                </div>
            </>
        );
    }

    return (
        <>
            <h1 style={{ textAlign: "center", fontSize: "2rem" }}>{currentYear}</h1>
            <div className={styles.flipStage}>
                {isAnimatingYear && prevDaysByDate && prevYear !== undefined && (
                    <div
                        key={`year-prev-${currentYear}`}
                        aria-hidden="true"
                        className={`${styles.flipOverlay} ${isForward ? styles.animateHidingForward : styles.animateHidingBackward}`}
                    >
                        <div className={`${styles.yearGrid} ${styles.flipStationaryHalf}`}>
                            {renderYearMonths(prevYear, prevDaysByDate, true)}
                        </div>
                        <div className={styles.flipCastShadow} />
                        <div className={styles.flipLeaf}>
                            <div className={`${styles.yearGrid} ${styles.flipLeafFront}`}>
                                {renderYearMonths(prevYear, prevDaysByDate, true)}
                            </div>
                            <div className={`${styles.yearGrid} ${styles.flipLeafBack}`}>
                                {renderYearMonths(currentYear, daysByDate, true)}
                            </div>
                        </div>
                    </div>
                )}
                <div
                    ref={yearGridRef}
                    key={`year-${currentYear}`}
                    className={`${styles.yearGrid}${isAnimatingYear ? ` ${isForward ? styles.animateShowingForward : styles.animateShowingBackward}` : ""}`}
                >
                    {renderYearMonths(currentYear, daysByDate)}
                </div>
            </div>
        </>
    );
};
