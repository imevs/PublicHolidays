import React, { useCallback, useEffect, useState } from "react";
import { useCalendar } from "./hooks/useCalendar";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import styles from "./Holidays.module.css";
import { CalendarEvent, type OtherEvent } from "./types";
import { EventListInput } from "./components/EventListInput/EventListInput";
import Controls from "./components/Controls/Controls";

const defaultData = `
2025-09-10 🎂 Birthday of Joe
2025-09-19 🎂 Birthday of Chuck
2025-09-27 🎂 Birthday of Dima
`;

const AnyEvents: React.FC = () => {
    const [holidaysData, setHolidaysData] = useState<CalendarEvent[]>([]);

    const {
        currentDate,
        selectedMonthDays,
        selectedYearDays,
        mode,
        navigateMonth,
        handleModeChange,
        handleDateChange,
    } = useCalendar(holidaysData);
    const [dataText, setDataText] = useState<string>(defaultData.trim());
    useEffect(() => {
        const data = localStorage.getItem("holidaysData");
        if (data !== null) {
            setDataText(data);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("holidaysData", dataText);
    }, [dataText]);

    const onNewEvent = useCallback((newEvent: OtherEvent) => {
        setDataText((prevState) => {
            return prevState + "" + "\n" + (newEvent.date + " " + newEvent.icon + " " + newEvent.name);
        });
    }, []);

    return (
        <div className={styles.app}>
            <div className={styles.header}>
                <h1>
                    <a href="./">
                        🌍 Events Calendar
                    </a>
                </h1>
            </div>

            <div className={styles.container}>
                <Controls
                    selectedDate={currentDate}
                    onDateChange={handleDateChange}
                />

                <CalendarGrid
                    selectedYearDays={selectedYearDays}
                    selectedMonthDays={selectedMonthDays}
                    currentDate={currentDate}
                    mode={mode}
                    onModeChange={handleModeChange}
                    onNavigateMonth={navigateMonth}
                    onNewEvent={onNewEvent}
                />

                <EventListInput setHolidaysData={setHolidaysData} dataText={dataText} setDataText={setDataText} />
            </div>
        </div>
    );
};

export default AnyEvents;
