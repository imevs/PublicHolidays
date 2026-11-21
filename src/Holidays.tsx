import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

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
import { APP_BASE_NAME } from "./consts.ts";

export const Holidays: React.FC = () => {
    const navigate = useNavigate();
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
        shouldScrollToMonth,
        clearShouldScrollToMonth,
    } = useCalendar(holidaysData, showAllHolidays);
    const [countryData, setCountryData] = useState({});

    useEffect(() => {
        document.title = `Public Holidays Calendar ${currentDate.getFullYear()}`;
    }, [currentDate]);

    useEffect(() => {
        import("./data/holidays_v2/index.ts").then(({ allHolidays }) => {
            setHolidaysData(convertEvents(Object.values(allHolidays)));
        });
    }, []);

    useEffect(() => {
        import("./data/holidays_descriptions/all.ts").then(data => {
            setCountryData(data.descriptions);
        });
    }, []);

    return (
        <div className={styles.app}>
            <ThemeSelector />
            <header className={styles.header}>
                <h1>
                    <a href="./">
                        🌍 Public Holidays Calendar
                    </a>
                </h1>
                <p>Track public holidays across multiple countries</p>
                <nav className={styles.primaryNav} aria-label="Primary">
                    <a
                        href={`/${APP_BASE_NAME}/Holidays`}
                        aria-current="page"
                        className={styles.navLink}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${APP_BASE_NAME}/Holidays${window.location.hash}`);
                        }}
                    >
                        🌍 Public Holidays
                    </a>
                    <a
                        href={`/${APP_BASE_NAME}/EditEvents`}
                        className={styles.navLink}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${APP_BASE_NAME}/EditEvents${window.location.hash}`);
                        }}
                    >
                        ✏️ Custom Events
                    </a>
                </nav>
            </header>

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
                    onSetMode={(newMode) => handleModeChange(newMode, currentDate.getMonth())}
                />

                <div id="calendar-grid-print-container">
                    <CalendarGrid
                        selectedYearDays={selectedYearDays}
                        selectedMonthDays={selectedMonthDays}
                        currentDate={currentDate}
                        mode={mode}
                        onModeChange={handleModeChange}
                        countryData={countryData}
                        shouldScrollToMonth={shouldScrollToMonth}
                        onScrolledToMonth={clearShouldScrollToMonth}
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
