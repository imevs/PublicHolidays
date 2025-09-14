import React, { useEffect, useState } from "react";
import { useCalendar } from "./hooks/useCalendar";
import Controls from "./components/Controls/Controls";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import styles from "./App.module.css";
import { CalendarEvent } from "./types";
import { convertEvents } from "./utils/convertEvents";

const App: React.FC = () => {
    useEffect(() => {
        // setHolidaysData([
        //     {
        //         name: "Birthday",
        //         date: "2025-09-25",
        //         type: "other",
        //         localName: "День рождения",
        //     }
        // ]);
        import("./data/holidays_v2").then(({ allHolidays }) => {
            setHolidaysData(convertEvents(Object.values(allHolidays)));
        });
    }, []);
    const [holidaysData, setHolidaysData] = useState<CalendarEvent[]>([]);

    const {
        currentDate,
        selectedCountries,
        selectedMonthDays,
        selectedYearDays,
        mode,
        navigateMonth,
        toggleCountry,
        handleDateChange,
        handleModeChange,
        showAllCountries,
        setShowAllCountries,
    } = useCalendar(holidaysData);
    return (
        <div className={styles.app}>
            <div className={styles.header}>
                <h1>
                    <a href=".">
                        🌍 Public Holidays Calendar
                    </a>
                </h1>
                <p>Track public holidays across multiple countries</p>
            </div>

            <div className={styles.container}>
                <Controls
                    showAllCountries={showAllCountries}
                    setShowAllCountries={setShowAllCountries}
                    selectedDate={currentDate}
                    selectedCountries={selectedCountries}
                    onDateChange={handleDateChange}
                    onToggleCountry={toggleCountry}
                />

                <CalendarGrid
                    selectedYearDays={selectedYearDays}
                    selectedMonthDays={selectedMonthDays}
                    currentDate={currentDate}
                    mode={mode}
                    onModeChange={handleModeChange}
                    onNavigateMonth={navigateMonth}
                />
            </div>
        </div>
    );
};

export default App;
