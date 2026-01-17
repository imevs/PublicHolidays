import React, { useEffect, useRef, useState } from "react";
import { CalendarDay as CalendarDayType, type HolidayWithCountry, type OtherEvent } from "../../types";
import CalendarDay from "../CalendarDay/CalendarDay";
import {
    convertDayToEUFormat,
    dayNames,
    formatDateString,
    getDaysInMonth,
    getMonthName,
    isSameDate,
    isWeekend,
} from "../../utils/dateUtils";
import styles from "./CalendarGrid.module.css";
import MonthNavigation from "../MonthNavigation/MonthNavigation";
import { getFlagEmoji } from "../../utils/countryFlags";
import { getLink } from "../../data/holidays_descriptions/getLink";
import { UTCDate } from "../../utils/UTCDate";
import EventPopup from "../EventPopup/EventPopup";
import { usePrevious } from "./UsePrevious";
import type { Description } from "../../data/holidays_descriptions/all";

interface CalendarGridProps {
    onNewEvent?: (date: OtherEvent) => void; // if not defined will not show popup for new event
    selectedYearDays: CalendarDayType[];
    selectedMonthDays: CalendarDayType[];
    currentDate: UTCDate;
    mode: "month" | "year";
    countryData: Record<string, Description>;
    onModeChange: (mode: "month" | "year", month: number) => void;
}

function cn(classes: string) {
    return classes.split("\n").map(line => line.trim()).filter(Boolean).join(" ");
}

const DaysOfWeeks = () => dayNames.map(day => (
    <div
        key={day}
        className={`${styles.calendarHeader} ${isWeekend(day) ? styles.weekend : ""}`}
    >{day}</div>
));

type MonthViewProps = {
    shouldAnimate?: boolean;
    dateForPopup: UTCDate | null;
    isEditable: boolean;
    setDateForPopup: (date: UTCDate) => void;
    selectedDays: CalendarDayType[];
    currentDate: UTCDate;
    countryData: Record<string, Description>;
    onModeChange: (mode: "month" | "year", month: number) => void;
};

const MonthView = (props: MonthViewProps) => {
    const {
        shouldAnimate,
        selectedDays,
        onModeChange,
        currentDate,
        dateForPopup,
        setDateForPopup,
        isEditable,
        countryData,
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
            <DaysOfWeeks/>

            {prevDays.map((day, index) => (
                <CalendarDay
                    key={day.date + "" + index}
                    day={day}
                    setDateForPopup={setDateForPopup}
                    isSelected={false}
                    isEditable={isEditable}
                    countryData={countryData}
                />
            ))}
        </div>}

        <div className={styles.calendarGrid}>
            <DaysOfWeeks/>

            {selectedDays.map((day, index) => (
                <CalendarDay
                    key={day.date + "" + index}
                    day={day}
                    setDateForPopup={setDateForPopup}
                    isSelected={dateForPopup === day.date}
                    isEditable={isEditable}
                    countryData={countryData}
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
}: MonthViewProps & { setSelectedDay: (date: UTCDate | null) => void; }) => {
    const currentYear = currentDate.getFullYear();
    const [highlightedMonth, setHighlightedMonth] = useState<number | null>(null); // State for highlighted month
    const yearGridRef = useRef<HTMLDivElement | null>(null); // Ref for the year grid container

    const currentMonth = currentDate.getMonth();
    useEffect(() => {
        if (yearGridRef.current) {
            const monthElement = yearGridRef.current.querySelectorAll(`.${styles.monthContainer}`)[currentMonth];
            if (monthElement && !currentDate.isToday()) {
                monthElement.scrollIntoView({ behavior: "smooth", block: "center" });
                setHighlightedMonth(currentMonth);
            }
        }
    }, [currentMonth]);

    return (
        <div ref={yearGridRef} className={styles.yearGrid}>
            {Array.from({ length: 12 }, (_, month) => {
                const daysInMonth = getDaysInMonth(currentYear, month);
                const monthName = getMonthName(month);
                const firstDay = new UTCDate(`${currentYear}-${String(month + 1).padStart(2, "0")}-01`);
                const dayOfWeek = convertDayToEUFormat(firstDay.getDay()) - 1;
                const emptyCells = Array.from({ length: dayOfWeek }, (_, day) => <div key={day} />);

                return (
                    <div
                        key={month}
                        className={`${styles.monthContainer} ${highlightedMonth === month ? styles.highlightedMonth : ""}`}
                    >
                        <div
                            className={styles.monthHeader}
                            title="Click to switch on month view"
                            onClick={() => {
                                onModeChange("month", month);
                            }}
                        >
                            {monthName}
                        </div>
                        <div className={styles.monthGrid}>
                            {emptyCells}
                            {Array.from({ length: daysInMonth }, (_, day) => {
                                const date = new UTCDate(`${currentYear}-${String(month + 1).padStart(2, "0")}-${day + 1}`);
                                const currentDay = selectedDays.find(d => isSameDate(d.date, date));
                                const dayHolidays = currentDay?.events || [];
                                const seen = new Set<string>();
                                const dayCountryHolidaysUnique = dayHolidays.filter((h): h is HolidayWithCountry => {
                                    if (h.kind !== "publicHoliday") { return false; }
                                    if (seen.has(h.countryCode)) { return false; }
                                    seen.add(h.countryCode);
                                    return true;
                                });
                                return (
                                    <div
                                        key={day}
                                        className={cn(`
                                                ${currentDay?.isToday ? styles.today : ""}
                                                ${dateForPopup?.valueOf() === date.valueOf() ? styles.selectedDate : ""} 
                                                ${styles.dayCell} 
                                                ${dayHolidays.length > 0 || currentDay?.isWeekend ? styles.holiday : ""}
                                                ${dayHolidays.length > 0 || isEditable ? styles.isClickable : ""}
                                            `)}
                                        data-month={month + 1}
                                        style={{
                                            borderRadius: `${day === 0 ? 10 : 0}px 0px ${day === daysInMonth - 1 ? 10 : 0}px 0px`,
                                        }}
                                        onClick={() => dayHolidays.length > 0 ? setSelectedDay(date) : setDateForPopup(date)}
                                    >
                                        {day + 1}
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
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
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
        countryData,
    } = props;
    const prevMode = usePrevious(props)?.mode;
    const [selectedDay, setSelectedDay] = useState<UTCDate | null>(null); // State for selected day in popup
    const [dateForPopup, setDateForPopup] = useState<UTCDate | null>(null);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(prevMode === mode);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const popupElement = document.querySelector(`.${styles.popup}`);
            if (popupElement && !popupElement.contains(event.target as Node)) {
                setSelectedDay(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.calendarGridContainer}>
            {mode === "month"
                ? <MonthView
                    shouldAnimate={shouldAnimate}
                    selectedDays={selectedMonthDays}
                    onModeChange={onModeChange}
                    currentDate={currentDate}
                    dateForPopup={dateForPopup}
                    setDateForPopup={setDateForPopup}
                    isEditable={onNewEvent !== undefined}
                    countryData={countryData}
                />
                : <YearView
                    selectedDays={selectedYearDays}
                    onModeChange={(mode: "month" | "year", month) => { setShouldAnimate(false); onModeChange(mode, month); }}
                    currentDate={currentDate}
                    dateForPopup={dateForPopup}
                    setDateForPopup={setDateForPopup}
                    isEditable={onNewEvent !== undefined}
                    setSelectedDay={setSelectedDay}
                    countryData={countryData}
                />}
            {dateForPopup && onNewEvent && (
                <EventPopup
                    initialDate={formatDateString(dateForPopup)}
                    onNewEvent={(data) => { if (data) { onNewEvent(data); } setDateForPopup(null); }}
                />
            )}
            {selectedDay && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <h3>Events on {formatDateString(selectedDay)}</h3>
                        <ul>
                            {selectedYearDays.find(d => isSameDate(d.date, selectedDay))
                                ?.events
                                .filter(h => h.kind === "publicHoliday")
                                ?.map((holiday, index) => (
                                    <li key={index} data-flag={getFlagEmoji(holiday.countryCode)}>
                                        <a target="_blank" href={getLink(undefined, holiday.country, "public holidays", countryData)}><strong>{holiday.country}</strong></a>:{" "}
                                        <a target="_blank" href={getLink(holiday.date, holiday.country, holiday.name, countryData)}>{holiday.name}</a>
                                    </li>
                                ))}
                            {selectedYearDays.find(d => isSameDate(d.date, selectedDay))
                                ?.events
                                .filter(h => h.kind === "other")
                                ?.map((holiday, index) => (
                                    <li key={index} data-flag={holiday.icon}>
                                        <span>{holiday.name}</span>
                                    </li>
                                ))}
                        </ul>
                        <button onClick={() => setSelectedDay(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarGrid;
