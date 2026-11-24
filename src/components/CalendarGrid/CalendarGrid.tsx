import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDay as CalendarDayType, type OtherEvent } from "../../types/index.ts";
import { formatDateString } from "../../utils/dateUtils.ts";
import styles from "./CalendarGrid.module.css";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { getLink } from "../../data/holidays_descriptions/getLink.ts";
import { type DateString, UTCDate } from "../../utils/UTCDate.ts";
import EventPopup from "../EventPopup/EventPopup.tsx";
import { usePrevious } from "./UsePrevious.tsx";
import type { Description } from "../../data/holidays_descriptions/all.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import { getLocalizedHolidayName } from "../../i18n/holidayNames.ts";
import { MonthView } from "./MonthView.tsx";
import { YearView } from "./YearView.tsx";

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
    const canAnimate = prevMode === mode;
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
                    shouldAnimate={canAnimate}
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
                    shouldAnimate={canAnimate}
                    selectedDays={selectedYearDays}
                    onModeChange={onModeChange}
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
                                                {holiday.isRange && holiday.rangeStart && holiday.endDate && (
                                                    <span className={styles.rangeSpan}> ({holiday.rangeStart} → {holiday.endDate})</span>
                                                )}
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