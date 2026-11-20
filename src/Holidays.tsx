import React, { useEffect, useState } from "react";

import { useCalendar } from "./hooks/useCalendar.ts";
import Controls from "./components/Controls/Controls.tsx";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid.tsx";
import styles from "./Holidays.module.css";
import { CalendarEvent } from "./types/index.ts";
import { convertEvents } from "./utils/convertEvents.ts";
import { EventsList } from "./components/EventsList/EventsList.tsx";
import CountryFilter from "./components/CountryFilter/CountryFilter.tsx";
import { ActionButtons } from "./components/EventsList/EventsListActionButtons.tsx";
import ThemeSelector from "./components/ThemeSelector/ThemeSelector.tsx";

export const Holidays: React.FC = () => {
    useEffect(() => {
        import("./data/holidays_v2/index.ts").then(({ allHolidays }) => {
            setHolidaysData(convertEvents(Object.values(allHolidays)));
        });
    }, []);
    const [holidaysData, setHolidaysData] = useState<CalendarEvent[]>([]);
    const [showAllHolidays, setShowAllHolidays] = useState(true);

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
    } = useCalendar(holidaysData, showAllHolidays);
    const [countryData, setCountryData] = useState({});

    useEffect(() => {
        import("./data/holidays_descriptions/all.ts").then(data => {
            setCountryData(data.descriptions);
        });
    }, []);

    return (
        <div className={styles.app}>
            <ThemeSelector />
            <div className={styles.header}>
                <h1>
                    <a href="./">
                        🌍 Public Holidays Calendar
                    </a>
                </h1>
                <p>Track public holidays across multiple countries</p>
            </div>

            <div className={styles.container}>
                <Controls
                    selectedDate={currentDate}
                    onDateChange={handleDateChange}
                    onNavigateMonth={navigateMonth}
                    extraControls={<CountryFilter
                        showAllCountries={showAllCountries}
                        setShowAllCountries={setShowAllCountries}
                        selectedCountries={selectedCountries}
                        onToggleCountry={toggleCountry}
                        setShowAllHolidays={setShowAllHolidays}
                    />}
                />
                <ActionButtons
                    selectedYearDays={selectedYearDays}
                    viewMode={mode}
                    toggleMode={() => handleModeChange(mode === "month" ? "year" : "month", currentDate.getMonth())}
                />

                <div id="calendar-grid-print-container">
                    <CalendarGrid
                        selectedYearDays={selectedYearDays}
                        selectedMonthDays={selectedMonthDays}
                        currentDate={currentDate}
                        mode={mode}
                        onModeChange={handleModeChange}
                        countryData={countryData}
                    />

                    <EventsList
                        selectedYearDays={selectedYearDays}
                        currentDate={currentDate}
                        mode={mode}
                        countryData={countryData}
                    />
                </div>
            </div>
        </div>
    );
};

export default Holidays;
