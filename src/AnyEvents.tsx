import React, { useState } from "react";
import { useCalendar } from "./hooks/useCalendar";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import styles from "./Holidays.module.css";
import { CalendarEvent } from "./types";
import { EventListInput } from "./components/EventListInput/EventListInput";
import Controls from "./components/Controls/Controls";

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
    return (
        <div className={styles.app}>
            <div className={styles.header}>
                <h1>
                    <a href="./Holidays">
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
                />

                <EventListInput setHolidaysData={setHolidaysData} />
            </div>
        </div>
    );
};

export default AnyEvents;
