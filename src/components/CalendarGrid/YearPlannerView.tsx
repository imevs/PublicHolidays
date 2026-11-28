import React from "react";
import { useTranslation } from "../../i18n/useTranslation.ts";
import styles from "./CalendarGrid.module.css";
import { CalendarDay as CalendarDayType } from "../../types/index.ts";
import { UTCDate, DateString } from "../../utils/UTCDate.ts";
import { getDaysInMonth, getISOWeekNumber, convertDayToEUFormat, isWeekend } from "../../utils/dateUtils.ts";
import { getLocalizedHolidayName } from "../../i18n/holidayNames.ts";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { DayIndexes } from "../../utils/dateUtils.ts";
import { getLongHolidayStyle, getLongHolidayTooltip } from "../../utils/longHolidayColors.ts";
import type { MonthViewProps } from "./MonthView.tsx";

export type YearPlannerViewProps = MonthViewProps & {
    setSelectedDay: (date: UTCDate | null) => void;
};

export const YearPlannerView: React.FC<YearPlannerViewProps> = ({
    dateForPopup,
    isEditable,
    setDateForPopup,
    selectedDays,
    currentDate,
    onModeChange,
    highlightLongHolidays,
    setSelectedDay,
}) => {
    const { t, language, getMonthName, getCountryName, format } = useTranslation();
    const currentYear = currentDate.getFullYear();
    const dateForPopupStr = dateForPopup ? `${dateForPopup.getFullYear()}-${String(dateForPopup.getMonth() + 1).padStart(2, "0")}-${String(dateForPopup.getDate()).padStart(2, "0")}` : null;

    const daysByDate = new Map<DateString, CalendarDayType>();
    for (const d of selectedDays) {
        if (d.date.getFullYear() === currentYear) {
            const key = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, "0")}-${String(d.date.getDate()).padStart(2, "0")}` as DateString;
            daysByDate.set(key, d);
        }
    }

    const uniquePublicHolidays = new Set<string>();
    let schoolHolidayCount = 0;
    for (const d of selectedDays) {
        if (d.date.getFullYear() === currentYear) {
            for (const ev of d.events) {
                if (ev.kind === "publicHoliday") {
                    if (ev.type?.includes("School Holiday")) {
                        schoolHolidayCount++;
                    } else {
                        uniquePublicHolidays.add((ev as any).countryCode);
                    }
                }
            }
        }
    }
    const hasMultipleCountries = uniquePublicHolidays.size > 1;
    const hasAnySchoolHolidays = schoolHolidayCount > 0;

    return (
        <>
            <style media="print">{`@page { size: A4 landscape; margin: 8mm; }`}</style>
            <h1 style={{ textAlign: "center", fontSize: "2rem" }}>{currentYear}</h1>
            <div
                tabIndex={0}
                role="region"
                aria-label={format(t.calendarGrid.plannerRegionAria, { year: currentYear })}
                className={styles.plannerWrapper}
            >
                <table className={styles.plannerTable}>
                    <thead>
                        <tr>
                            {Array.from({ length: 12 }, (_, month) => (
                                <th key={month} scope="col" className={styles.plannerMonthHeader}>
                                    <button
                                        type="button"
                                        className={styles.plannerMonthBtn}
                                        title={t.calendarGrid.clickToSwitchMonthView}
                                        onClick={() => onModeChange("month", month)}
                                    >
                                        {getMonthName(month)}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 31 }, (_, rowIdx) => {
                            const dayNum = rowIdx + 1;
                            return (
                                <tr key={dayNum}>
                                    {Array.from({ length: 12 }, (_, month) => {
                                        const daysInMonth = getDaysInMonth(currentYear, month);
                                        if (dayNum > daysInMonth) {
                                            return <td key={month} className={styles.plannerEmptyCell} aria-hidden="true" />;
                                        }

                                        const dateStr = `${currentYear}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}` as DateString;
                                        const currentDay = daysByDate.get(dateStr);
                                        const date = currentDay?.date ?? new UTCDate(dateStr);
                                        const euDay = convertDayToEUFormat(date.getDay());
                                        const weekdayShort = t.dates.weekdaysShort[euDay - 1];
                                        const isMonday = date.getDay() === DayIndexes.Monday;
                                        const weekNumber = isMonday ? getISOWeekNumber(date) : null;

                                        const dayEvents = currentDay?.events ?? [];
                                        const isSchoolHoliday = (h: any) => h.kind === "publicHoliday" && h.type?.includes("School Holiday") === true;
                                        const publicHolidays = dayEvents.filter((h: any) => h.kind === "publicHoliday" && !isSchoolHoliday(h));
                                        const schoolHolidays = dayEvents.filter((h: any) => isSchoolHoliday(h));
                                        const customEvents = dayEvents.filter((h: any) => h.kind === "other");
                                        const firstCustomRangeEvent = customEvents.find((h: any) => Boolean(h.isRange));

                                        let prevDayEvents: any[] = [];
                                        if (dayNum > 1) {
                                            const prevDateStr = `${currentYear}-${String(month + 1).padStart(2, "0")}-${String(dayNum - 1).padStart(2, "0")}` as DateString;
                                            prevDayEvents = daysByDate.get(prevDateStr)?.events ?? [];
                                        }

                                        const shouldShowEvent = (ev: any) => {
                                            if (dayNum === 1) return true;
                                            return !prevDayEvents.some(p => p.kind === ev.kind && p.name === ev.name && ("countryCode" in p && "countryCode" in ev ? p.countryCode === ev.countryCode : true));
                                        };

                                        const visiblePublicHolidays = publicHolidays.filter(shouldShowEvent);
                                        const visibleCustomEvents = customEvents.filter((h: any) => !h.isRange || shouldShowEvent(h));
                                        const visibleSchoolHolidays = schoolHolidays.filter(shouldShowEvent);

                                        let cellLabel = "";
                                        if (visiblePublicHolidays.length > 0) {
                                            cellLabel = visiblePublicHolidays
                                                .map((h: any) => `${hasMultipleCountries ? getFlagEmoji(h.countryCode) + " " : ""}${getLocalizedHolidayName(h.name, h.countryCode, language)}`)
                                                .join(", ");
                                        } else if (visibleCustomEvents.length > 0) {
                                            cellLabel = visibleCustomEvents
                                                .map((e: any) => `${e.icon ? e.icon + " " : ""}${e.name}`)
                                                .join(", ");
                                        } else if (visibleSchoolHolidays.length > 0) {
                                            cellLabel = visibleSchoolHolidays
                                                .map((h: any) => `${hasMultipleCountries ? getFlagEmoji(h.countryCode) + " " : ""}${getLocalizedHolidayName(h.name, h.countryCode, language)}`)
                                                .join(", ");
                                        }

                                        const isDayClickable = dayEvents.length > 0 || isEditable;
                                        const handleDaySelect = () => {
                                            if (dayEvents.length > 0) {
                                                setSelectedDay(date);
                                            } else {
                                                setDateForPopup(date);
                                            }
                                        };

                                        const tooltipParts = dayEvents.map(e => e.name);
                                        if (highlightLongHolidays && currentDay?.isLongHoliday && currentDay.longHolidayDetails) {
                                            tooltipParts.push(getLongHolidayTooltip(currentDay.longHolidayDetails, getCountryName, format, t.calendarGrid.longHolidayTooltip, t.calendarGrid.longHolidayTooltipCustom)!);
                                        }
                                        const title = tooltipParts.join(", ");

                                        const bgClass =
                                            publicHolidays.length > 0
                                                ? styles.plannerHoliday
                                                : firstCustomRangeEvent
                                                    ? styles.plannerRangeDay
                                                    : customEvents.length > 0
                                                        ? styles.plannerCustomEvent
                                                        : schoolHolidays.length > 0
                                                            ? styles.plannerSchoolHoliday
                                                            : currentDay?.isWeekend || isWeekend(date.getDay())
                                                                ? styles.plannerWeekend
                                                                : "";

                                        const cellClassName = [
                                            styles.plannerCell,
                                            bgClass,
                                            currentDay?.isToday ? styles.plannerToday : "",
                                            dateForPopupStr === dateStr ? styles.selectedDate : "",
                                            isDayClickable ? styles.isClickable : "",
                                            highlightLongHolidays && currentDay?.isLongHoliday ? styles.plannerLongHoliday : "",
                                        ].filter(Boolean).join(" ");

                                        const rangeColor = (firstCustomRangeEvent as any)?.color;
                                        const cellStyle: React.CSSProperties = {
                                            ...(rangeColor ? { "--range-color": rangeColor } as any : {}),
                                            ...(highlightLongHolidays && currentDay?.isLongHoliday ? getLongHolidayStyle(currentDay.longHolidayColors, true) : {}),
                                        };

                                        return (
                                            <td
                                                key={month}
                                                className={cellClassName}
                                                style={Object.keys(cellStyle).length > 0 ? cellStyle : undefined}
                                                title={title || undefined}
                                                role={isDayClickable ? "button" : undefined}
                                                tabIndex={isDayClickable ? 0 : undefined}
                                                onClick={isDayClickable ? handleDaySelect : undefined}
                                                onKeyDown={isDayClickable ? (e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        handleDaySelect();
                                                    }
                                                } : undefined}
                                            >
                                                <div className={styles.plannerCellInner}>
                                                    <span className={styles.plannerDayNum}>{dayNum}</span>
                                                    <span className={styles.plannerWeekday}>{weekdayShort}</span>
                                                    {cellLabel && <span className={styles.plannerEventLabel}>{cellLabel}</span>}
                                                    {weekNumber !== null && <span className={styles.plannerWeekNum}>{weekNumber}</span>}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className={styles.plannerLegend}>
                {hasAnySchoolHolidays && (
                    <span className={styles.plannerLegendItem}>
                        <span className={`${styles.plannerLegendSwatch} ${styles.plannerSchoolHoliday}`} aria-hidden="true" />
                        <span>{t.calendarGrid.legendSchoolHoliday}</span>
                    </span>
                )}
                <span className={styles.plannerLegendItem}>
                    <span className={`${styles.plannerLegendSwatch} ${styles.plannerHoliday}`} aria-hidden="true" />
                    <span>{t.calendarGrid.legendHoliday}</span>
                </span>
                <span className={styles.plannerLegendItem}>
                    <span className={`${styles.plannerLegendSwatch} ${styles.plannerWeekend}`} aria-hidden="true" />
                    <span>{t.calendarGrid.legendWeekend}</span>
                </span>
            </div>
        </>
    );
};
