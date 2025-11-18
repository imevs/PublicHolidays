import React from "react";
import { useNavigate } from "react-router";
import { formatDateString } from "../../utils/dateUtils";
import { getFlagEmoji } from "../../utils/countryFlags";
import { exportCalendarToFile } from "../../utils/generateICS";
import { APP_BASE_NAME, STORAGE_KEY } from "../../consts";
import type { CalendarDay as CalendarDayType } from "../../types";
import styles from "./EventsListActionButtons.module.css";

interface ActionButtonsProps {
    selectedYearDays: CalendarDayType[];
}

function getCountriesNames(selectedYearDays: CalendarDayType[]) {
    return Array.from(new Set(
        (selectedYearDays ?? [])
            .flatMap(d => d.events
                .filter(event => event.kind === "publicHoliday")
                .map(ev => ev.country)
                .filter(Boolean)
            )
    ));
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedYearDays }) => {
    const navigate = useNavigate();

    const editEvents = () => {
        const dataText = (selectedYearDays ?? [])
            .flatMap(day => day.events
                .filter(event => event.kind === "publicHoliday")
                .map(ev => `${formatDateString(day.date)} ${getFlagEmoji(ev.countryCode)} ${ev.country}: ${ev.name}`))
            .filter(Boolean)
            .join("\n");
        localStorage.setItem(STORAGE_KEY, dataText);
        navigate(`/${APP_BASE_NAME}/EditEvents`);
    };

    const exportCalendar = () => {
        const countries = getCountriesNames(selectedYearDays);

        const data = selectedYearDays.map(d => d.events).flat();
        exportCalendarToFile(data, countries.join("_") + "_calendar");
    };

    const exportAllCalendars = () => {
        const allEvents = (selectedYearDays ?? [])
            .flatMap(d => d.events.filter(event => event.kind === "publicHoliday"));
        const countries = getCountriesNames(selectedYearDays);
        countries.forEach(country => {
            const countryEvents = allEvents.filter(e => e.country === country);
            if (countryEvents.length) {
                exportCalendarToFile(countryEvents, country + "_calendar");
            }
        });
    };

    return (
        <div className={styles.actionButtonContainer}>
            <button className={styles.actionButton} onClick={exportAllCalendars}>Download separate .ics files for selected countries</button>
            <button className={styles.actionButton} onClick={exportCalendar}>Download combined .ics file</button>
            <button className={styles.actionButton} onClick={editEvents} style={{ right: 120 }}>Create custom calendar</button>
        </div>
    );
};
