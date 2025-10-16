import { useNavigate, useSearchParams } from "react-router";
import React, { useEffect, useState } from "react";

import { useCalendar } from "./hooks/useCalendar";
import Controls from "./components/Controls/Controls";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import styles from "./Holidays.module.css";
import { CalendarEvent } from "./types";
import { convertEvents } from "./utils/convertEvents";
import { EventsList } from "./components/EventsList/EventsList";
import CountryFilter from "./components/CountryFilter/CountryFilter";

const baseName = "PublicHolidays"; //import.meta.env.VITE_SITE_BASE

const Holidays: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const path = searchParams?.get("path");
        if (path?.includes(baseName)) {
            navigate(path + location.hash);
        }
    }, [])

    useEffect(() => {
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
                    extraControls={<CountryFilter
                        showAllCountries={showAllCountries}
                        setShowAllCountries={setShowAllCountries}
                        selectedCountries={selectedCountries}
                        onToggleCountry={toggleCountry}
                    />}
                />

                <CalendarGrid
                    selectedYearDays={selectedYearDays}
                    selectedMonthDays={selectedMonthDays}
                    currentDate={currentDate}
                    mode={mode}
                    onModeChange={handleModeChange}
                    onNavigateMonth={navigateMonth}
                />

                <EventsList
                    selectedYearDays={selectedYearDays}
                    currentDate={currentDate}
                    mode={mode}
                />
            </div>
        </div>
    );
};

export default Holidays;
