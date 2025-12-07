import React, { useEffect, useState } from "react";

import { useCalendar } from "./hooks/useCalendar";
import Controls from "./components/Controls/Controls";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import styles from "./Holidays.module.css";
import { CalendarEvent } from "./types";
import { convertEvents } from "./utils/convertEvents";
import { EventsList } from "./components/EventsList/EventsList";
import CountryFilter from "./components/CountryFilter/CountryFilter";
import { ActionButtons } from "./components/EventsList/EventsListActionButtons";

export const Holidays: React.FC = () => {
    useEffect(() => {
        import("./data/holidays_v2").then(({ allHolidays }) => {
            setHolidaysData(convertEvents(Object.values(allHolidays)));
        });
    }, []);
    const [holidaysData, setHolidaysData] = useState<CalendarEvent[]>([]);
    const [showAllHolidays, setShowAllHolidays] = useState(false);

    // Theme state
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light");
    };

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
        import("./data/holidays_descriptions/all").then(data => {
            setCountryData(data.descriptions);
        });
    }, []);

    return (
        <div className={styles.app}>
            <button
                className={styles.themeToggle}
                onClick={toggleTheme}
                title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
                aria-label="Toggle Theme"
            >
                {theme === "light" ? "🌙" : "☀️"}
            </button>
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
    );
};

export default Holidays;
