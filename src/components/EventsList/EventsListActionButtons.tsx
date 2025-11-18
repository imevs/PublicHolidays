import React from "react";
import { useNavigate } from "react-router";
import { formatDateString } from "../../utils/dateUtils";
import { getFlagEmoji } from "../../utils/countryFlags";
import { exportCalendarToFile } from "../../utils/generateICS";
import { APP_BASE_NAME } from "../../consts";
import type { CalendarDay as CalendarDayType } from "../../types";
import styles from "./EventsListActionButtons.module.css";

interface ActionButtonsProps {
    selectedYearDays: CalendarDayType[];
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedYearDays }) => {
    const navigate = useNavigate();

    const editEvents = () => {
        let dataText = "";
        (selectedYearDays ?? [])
            .filter(day => day.events.length)
            .map((date) => {
                date.events.forEach(event => {
                    dataText += event.kind === "publicHoliday"
                        ? formatDateString(date.date) + " " +
                        getFlagEmoji(event.countryCode) + " " +
                        event.country + ": " + event.name + "\n"
                        : "";
                });
            });
        localStorage.setItem("holidaysData", dataText);
        navigate(`/${APP_BASE_NAME}/EditEvents`);
    };

    const exportCalendar = () => {
        const data = selectedYearDays.map(d => d.events).flat();
        exportCalendarToFile(data);
    };

    return (
        <>
            <button className={styles.actionButton} onClick={exportCalendar}>Export to .ics</button>
            <button className={styles.actionButton} onClick={editEvents} style={{ right: 120 }}>Create custom calendar</button>
        </>
    );
};
