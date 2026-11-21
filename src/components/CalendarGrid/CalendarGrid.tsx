import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDay as CalendarDayType, type HolidayWithCountry, type OtherEvent } from "../../types/index.ts";
import CalendarDay from "../CalendarDay/CalendarDay.tsx";
import {
    convertDayToEUFormat,
    formatDateString,
    getDaysInMonth,
} from "../../utils/dateUtils.ts";
import styles from "./CalendarGrid.module.css";
import MonthNavigation from "../MonthNavigation/MonthNavigation.tsx";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { getLink } from "../../data/holidays_descriptions/getLink.ts";
import { type DateString, UTCDate } from "../../utils/UTCDate.ts";
import EventPopup from "../EventPopup/EventPopup.tsx";
import { usePrevious } from "./UsePrevious.tsx";
import type { Description } from "../../data/holidays_descriptions/all.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import { getLocalizedHolidayName } from "../../i18n/holidayNames.ts";

interface CalendarGridProps {
    onNewEvent?: (date: OtherEvent) => void; // if not defined will not show popup for new event
    onEditEvent?: (originalEvent: OtherEvent, updatedEvent: OtherEvent) => void;
    onDeleteEvent?: (eventToDelete: OtherEvent) => void;
    selectedYearDays: CalendarDayType[];
    selectedMonthDays: CalendarDayType[];
    currentDate: UTCDate;
    mode: "month" | "year";
    countryData: Record<string, Description>;
    onModeChange: (mode: "month" | "year", month: number) => void;
    shouldScrollToMonth?: boolean;
    onScrolledToMonth?: () => void;
    highlightLongHolidays?: boolean;
}

function cn(classes: string) {
    return classes.split("\n").map(line => line.trim()).filter(Boolean).join(" ");
}

const DaysOfWeeks = () => {
    const { t } = useTranslation();
    return t.dates.weekdaysShort.map((day, index) => (
        <div
            key={`${day}-${index}`}
            className={`${styles.calendarHeader} ${index === 5 || index === 6 ? styles.weekend : ""}`}
        >{day}</div>
    ));
};

type MonthViewProps = {
    shouldAnimate?: boolean;
    dateForPopup: UTCDate | null;
    isEditable: boolean;
    setDateForPopup: (date: UTCDate) => void;
    onSelectEvent?: (date: UTCDate, event: OtherEvent) => void;
    selectedDays: CalendarDayType[];
    currentDate: UTCDate;
    countryData: Record<string, Description>;
    onModeChange: (mode: "month" | "year", month: number) => void;
    highlightLongHolidays?: boolean;
};

const MonthView = (props: MonthViewProps) => {
    const {
        shouldAnimate,
        selectedDays,
        onModeChange,
        currentDate,
        dateForPopup,
        setDateForPopup,
        onSelectEvent,
        isEditable,
        countryData,
        highlightLongHolidays,
    } = props;

    const prevDays = usePrevious(selectedDays);
    const prevDate = usePrevious(currentDate);
    const classes = styles.calendarGrid + " " + (
        prevDate && shouldAnimate ? (
            prevDate.valueOf() < currentDate.valueOf()
                ? styles.animateHidingForward
                : styles.animateHidingBackward
        ) : styles.hidden
    );
    return <>
        <MonthNavigation
            currentDate={currentDate}
            onNavigateYear={() => onModeChange("year", 1)}
        />

        {prevDays && <div key={currentDate.valueOf()} className={classes}>
            <DaysOfWeeks />

            {prevDays.map((day, index) => (
                <CalendarDay
                    key={day.date + "" + index}
                    day={day}
                    setDateForPopup={setDateForPopup}
                    onSelectEvent={onSelectEvent}
                    isSelected={false}
                    isEditable={isEditable}
                    countryData={countryData}
                    highlightLongHolidays={highlightLongHolidays}
                />
            ))}
        </div>}

        <div className={styles.calendarGrid}>
            <DaysOfWeeks />

            {selectedDays.map((day, index) => (
                <CalendarDay
                    key={day.date + "" + index}
                    day={day}
                    setDateForPopup={setDateForPopup}
                    onSelectEvent={onSelectEvent}
                    isSelected={dateForPopup === day.date}
                    isEditable={isEditable}
                    countryData={countryData}
                    highlightLongHolidays={highlightLongHolidays}
                />
            ))}
        </div>
    </>;
};

const YearView = ({
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
    const { t, getMonthName } = useTranslation();
    const currentYear = currentDate.getFullYear();
    const [highlightedMonth, setHighlightedMonth] = useState<number | null>(null); // State for highlighted month
    const yearGridRef = useRef<HTMLDivElement | null>(null); // Ref for the year grid container
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
                                style={{
                                    borderRadius,
                                    ...(firstRangeEvent?.color ? { "--range-color": firstRangeEvent.color } : {}),
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

const CalendarGrid: React.FC<CalendarGridProps> = (props) => {
    const {
        selectedMonthDays,
        selectedYearDays,
        currentDate,
        mode,
        onModeChange,
        onNewEvent,
        onEditEvent,
        onDeleteEvent,
        countryData,
    } = props;
    const { t, getCountryName, format, language } = useTranslation();
    const prevMode = usePrevious(props)?.mode;
    const [selectedDay, setSelectedDay] = useState<UTCDate | null>(null); // State for selected day in popup
    const [dateForPopup, setDateForPopup] = useState<UTCDate | null>(null);
    const [editingEvent, setEditingEvent] = useState<OtherEvent | null>(null);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(prevMode === mode);
    const isEditable = onNewEvent !== undefined;

    const dayDialogRef = useRef<HTMLDialogElement | null>(null);

    const yearDaysByDate = useMemo(() => {
        const map = new Map<DateString, CalendarDayType>();
        for (const d of selectedYearDays) {
            map.set(formatDateString(d.date), d);
        }
        return map;
    }, [selectedYearDays]);

    const selectedDayEvents = selectedDay
        ? yearDaysByDate.get(formatDateString(selectedDay))?.events
        : undefined;

    useEffect(() => {
        const dialog = dayDialogRef.current;
        if (!dialog) return;

        if (selectedDay) {
            if (typeof dialog.showModal === "function" && !dialog.open) {
                dialog.showModal();
            } else if (!dialog.hasAttribute("open")) {
                dialog.setAttribute("open", "");
            }
        } else {
            if (dialog.open) {
                if (typeof dialog.close === "function") {
                    dialog.close();
                } else {
                    dialog.removeAttribute("open");
                }
            }
        }
    }, [selectedDay]);

    useEffect(() => {
        const dialog = dayDialogRef.current;
        if (!dialog) return;

        let downTarget: EventTarget | null = null;
        const handlePointerDown = (e: PointerEvent) => {
            downTarget = e.target;
        };
        const handlePointerUp = (e: PointerEvent) => {
            if (!dialog.open) return;
            const rect = dialog.getBoundingClientRect();
            const isInRect =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInRect && downTarget === e.target) {
                const hasClosedBy = "closedBy" in HTMLDialogElement.prototype;
                if (!hasClosedBy) {
                    setSelectedDay(null);
                }
            }
            downTarget = null;
        };

        dialog.addEventListener("pointerdown", handlePointerDown);
        dialog.addEventListener("pointerup", handlePointerUp);
        return () => {
            dialog.removeEventListener("pointerdown", handlePointerDown);
            dialog.removeEventListener("pointerup", handlePointerUp);
        };
    }, []);

    const handleOpenNewForDate = (date: UTCDate) => {
        setEditingEvent(null);
        setDateForPopup(date);
    };

    const handleStartEditEvent = (date: UTCDate, ev: OtherEvent) => {
        setSelectedDay(null);
        setEditingEvent(ev);
        setDateForPopup(date);
    };

    const handleDeleteFromDayPopup = (ev: OtherEvent) => {
        if (!onDeleteEvent) return;
        const remainingCount = (selectedDayEvents?.length ?? 0) - 1;
        onDeleteEvent(ev);
        if (remainingCount <= 0) {
            setSelectedDay(null);
        }
    };

    return (
        <div id="calendar-grid-capture-container" className={styles.calendarGridContainer}>
            {mode === "month"
                ? <MonthView
                    shouldAnimate={shouldAnimate}
                    selectedDays={selectedMonthDays}
                    onModeChange={onModeChange}
                    currentDate={currentDate}
                    dateForPopup={dateForPopup}
                    setDateForPopup={handleOpenNewForDate}
                    onSelectEvent={isEditable ? handleStartEditEvent : undefined}
                    isEditable={isEditable}
                    countryData={countryData}
                    highlightLongHolidays={props.highlightLongHolidays}
                />
                : <YearView
                    selectedDays={selectedYearDays}
                    onModeChange={(mode: "month" | "year", month) => { setShouldAnimate(false); onModeChange(mode, month); }}
                    currentDate={currentDate}
                    dateForPopup={dateForPopup}
                    setDateForPopup={handleOpenNewForDate}
                    isEditable={isEditable}
                    setSelectedDay={setSelectedDay}
                    countryData={countryData}
                    shouldScrollToMonth={props.shouldScrollToMonth}
                    onScrolledToMonth={props.onScrolledToMonth}
                    highlightLongHolidays={props.highlightLongHolidays}
                />}
            {dateForPopup && onNewEvent && (
                <EventPopup
                    initialDate={formatDateString(dateForPopup)}
                    initialEvent={editingEvent}
                    onNewEvent={(data) => {
                        if (data) {
                            if (editingEvent && onEditEvent) {
                                onEditEvent(editingEvent, data);
                            } else {
                                onNewEvent(data);
                            }
                        }
                        setEditingEvent(null);
                        setDateForPopup(null);
                    }}
                    onDeleteEvent={editingEvent && onDeleteEvent ? () => {
                        onDeleteEvent(editingEvent);
                        setEditingEvent(null);
                        setDateForPopup(null);
                    } : undefined}
                />
            )}
            <dialog
                ref={dayDialogRef}
                className={styles.popup}
                {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
                aria-labelledby="day-popup-title"
                onClose={() => setSelectedDay(null)}
                onCancel={() => setSelectedDay(null)}
            >
                {selectedDay && (
                    <>
                        <div className={styles.popupHeader}>
                            <h3 id="day-popup-title">
                                {format(t.calendarGrid.eventsOnDate, { date: formatDateString(selectedDay) })}
                            </h3>
                            <button
                                type="button"
                                className={styles.closeBtn}
                                aria-label={t.calendarGrid.close}
                                onClick={() => setSelectedDay(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.popupBody}>
                            <ul>
                                {selectedDayEvents
                                    ?.filter(h => h.kind === "publicHoliday")
                                    .map((holiday, index) => (
                                        <li key={index} className={styles.eventItem}>
                                            <span className={styles.eventBadge}>{getFlagEmoji(holiday.countryCode)}</span>
                                            <span className={styles.eventDetails}>
                                                <a target="_blank" href={getLink(undefined, holiday.country, "public holidays", countryData)}>
                                                    <strong>{getCountryName(holiday.countryCode, holiday.country)}</strong>
                                                </a>:{" "}
                                                <a target="_blank" href={getLink(holiday.date, holiday.country, holiday.name, countryData)}>{getLocalizedHolidayName(holiday.name, holiday.countryCode, language)}</a>
                                            </span>
                                        </li>
                                    ))}
                                {selectedDayEvents
                                    ?.filter((h): h is OtherEvent => h.kind === "other")
                                    .map((holiday, index) => (
                                        <li key={index} className={`${styles.eventItem} ${styles.customEventItem}`}>
                                            <span className={styles.eventBadge}>{holiday.icon}</span>
                                            <span className={styles.eventDetails}>
                                                {holiday.name}
                                                {holiday.isRange && holiday.rangeStart && holiday.endDate && (
                                                    <span className={styles.rangeSpan}> ({holiday.rangeStart} → {holiday.endDate})</span>
                                                )}
                                            </span>
                                            {isEditable && (
                                                <span className={styles.eventItemActions}>
                                                    {onEditEvent && (
                                                        <button
                                                            type="button"
                                                            className={styles.smallActionBtn}
                                                            aria-label={format(t.calendarGrid.editEventAria, { name: holiday.name })}
                                                            onClick={() => handleStartEditEvent(selectedDay, holiday)}
                                                        >
                                                            {t.calendarGrid.edit}
                                                        </button>
                                                    )}
                                                    {onDeleteEvent && (
                                                        <button
                                                            type="button"
                                                            className={`${styles.smallActionBtn} ${styles.deleteActionBtn}`}
                                                            aria-label={format(t.calendarGrid.deleteEventAria, { name: holiday.name })}
                                                            onClick={() => handleDeleteFromDayPopup(holiday)}
                                                        >
                                                            {t.calendarGrid.delete}
                                                        </button>
                                                    )}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                        <div className={styles.popupFooterActions}>
                            {isEditable && (
                                <button
                                    type="button"
                                    className={styles.primaryActionBtn}
                                    onClick={() => {
                                        const dayToAdd = selectedDay;
                                        setSelectedDay(null);
                                        handleOpenNewForDate(dayToAdd);
                                    }}
                                >
                                    {t.calendarGrid.addEvent}
                                </button>
                            )}
                            <button type="button" className={styles.secondaryActionBtn} onClick={() => setSelectedDay(null)}>
                                {t.calendarGrid.close}
                            </button>
                        </div>
                    </>
                )}
            </dialog>
        </div>
    );
};

export default CalendarGrid;