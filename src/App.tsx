import React from "react";
import { useCalendar } from "./hooks/useCalendar";
import Controls from "./components/Controls/Controls";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import styles from "./App.module.css";

const App: React.FC = () => {
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
    } = useCalendar();

    return (
        <div className={styles.app}>
            <div className={styles.header}>
                <h1>🌍 Public Holidays Calendar</h1>
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
