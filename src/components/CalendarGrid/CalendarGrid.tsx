import React, { useState, useEffect, useRef } from "react";
import { CalendarDay as CalendarDayType } from "../../types";
import CalendarDay from "../CalendarDay/CalendarDay";
import { dayNames, formatDateString, getDaysInMonth, getMonthName, isSameDate } from "../../utils/dateUtils";
import styles from "./CalendarGrid.module.css";
import MonthNavigation from "../MonthNavigation/MonthNavigation";
import { getFlagEmoji } from "../../utils/countryFlags";
import { getLink } from "../../data/holidays_descriptions/all";

interface CalendarGridProps {
    selectedYearDays: CalendarDayType[];
    selectedMonthDays: CalendarDayType[];
    currentDate: Date;
    mode: "month" | "year";
    onModeChange: (mode: "month" | "year") => void;
    onNavigateMonth: (direction: number) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
    selectedMonthDays,
    selectedYearDays,
    currentDate,
    mode,
    onModeChange,
    onNavigateMonth
}) => {
    const [selectedDay, setSelectedDay] = useState<Date | null>(null); // State for selected day in popup
    const [highlightedMonth, setHighlightedMonth] = useState<number | null>(null); // State for highlighted month
    const yearGridRef = useRef<HTMLDivElement | null>(null); // Ref for the year grid container

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

    const currentMonth = currentDate.getMonth();
    useEffect(() => {
        if (mode === "year" && yearGridRef.current) {
            const monthElement = yearGridRef.current.querySelectorAll(`.${styles.monthContainer}`)[currentMonth];
            if (monthElement) {
                monthElement.scrollIntoView({ behavior: "smooth", block: "center" });
                setHighlightedMonth(currentMonth);
            }
        }
    }, [mode, currentMonth]);

    const renderMonthView = () => (
        <>
            <MonthNavigation
                currentDate={currentDate}
                onNavigateMonth={onNavigateMonth}
                onNavigateYear={() => onModeChange("year")}
            />

            <div className={styles.calendarGrid}>
                {dayNames.map(day => (
                    <div
                        key={day}
                        className={`${styles.calendarHeader} ${["Sat", "Sun"].includes(day) ? styles.weekend : ""}`}
                    >
                        {day}
                    </div>
                ))}

                {selectedMonthDays.map((day, index) => (
                    <CalendarDay key={index} day={day}/>
                ))}
            </div>
        </>
    );

    const renderYearView = () => {
        const currentYear = currentDate.getFullYear();
        return (
            <div ref={yearGridRef} className={styles.yearGrid}>
                {Array.from({ length: 12 }, (_, month) => {
                    const daysInMonth = getDaysInMonth(currentYear, month);
                    const monthName = getMonthName(month);
                    const firstDay = new Date(Date.UTC(currentYear, month, 1));
                    const dayOfWeek = firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1;

                    return (
                        <div
                            key={month}
                            className={`${styles.monthContainer} ${highlightedMonth === month ? styles.highlightedMonth : ""}`}
                        >
                            <div
                                className={styles.monthHeader}
                                title="Click to switch on month view"
                                onClick={() => {
                                    onModeChange("month");
                                    onNavigateMonth(month);
                                }}
                            >
                                {monthName}
                            </div>
                            <div className={styles.monthGrid}>
                                {Array.from({ length: dayOfWeek }, (_, day) => <div key={day} />)}
                                {Array.from({ length: daysInMonth }, (_, day) => {
                                    const date = new Date(Date.UTC(currentYear, month, day + 1));
                                    const currentDay = selectedYearDays.find(d => isSameDate(d.date, date));
                                    const dayHolidays = currentDay?.holidays || [];
                                    const seen = new Set<string>();
                                    const dayHolidaysUnique = dayHolidays.filter(h => {
                                        if (seen.has(h.countryCode)) { return false; }
                                        seen.add(h.countryCode);
                                        return true;
                                    });
                                    return (
                                        <div
                                            key={day}
                                            className={`
                                                ${currentDay?.isToday ? styles.today : ""} 
                                                ${styles.dayCell} 
                                                ${dayHolidays.length > 0 || currentDay?.isWeekend ? styles.holiday : ""}`
                                            }
                                            onClick={() => dayHolidays.length > 0 && setSelectedDay(date)}
                                        >
                                            {day + 1}
                                            <div className={styles.holidayIndicatorsList}>
                                                {dayHolidaysUnique.map((holiday) => (
                                                    <div key={holiday.countryCode + holiday.name}
                                                        className={styles.holidayIndicator}>
                                                        {getFlagEmoji(holiday.countryCode)}
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

    return (
        <div style={{ width: "100%" }}>
            {mode === "month" ? renderMonthView() : renderYearView()}

            {selectedDay && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <h3>Holidays on {formatDateString(selectedDay)}</h3>
                        <ul>
                            {selectedYearDays.find(d => isSameDate(d.date, selectedDay))?.holidays?.map((holiday, index) => (
                                <li key={index} data-flag={getFlagEmoji(holiday.countryCode)}>
                                    <a target="_blank" href={getLink(undefined, holiday.country, "public holidays")}><strong>{holiday.country}</strong></a>:{" "}
                                    <a target="_blank" href={getLink(holiday.date, holiday.country, holiday.name)}>{holiday.name}</a>
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
