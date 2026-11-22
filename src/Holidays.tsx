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
import LanguageSelector from "./components/LanguageSelector/LanguageSelector.tsx";
import { APP_BASE_NAME } from "./consts.ts";
import { updatePageMetadata } from "./utils/seo.ts";
import { useTranslation } from "./i18n/useTranslation.ts";

export const Holidays: React.FC = () => {
    const navigate = useNavigate();
    const { language, t, format } = useTranslation();
    const [holidaysData, setHolidaysData] = useState<CalendarEvent[]>([]);
    const [highlightLongHolidays, setHighlightLongHolidays] = useState(false);

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
    } = useCalendar(holidaysData);
    const [countryData, setCountryData] = useState({});

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
        const year = currentDate.getFullYear();
        updatePageMetadata({
            title: format(t.app.holidaysDocumentTitle, { year }),
            description: format(t.app.holidaysMetaDescription, { year }),
            keywords: format(t.app.holidaysMetaKeywords, { year }),
        });
    }, [currentDate, t.app.holidaysDocumentTitle, t.app.holidaysMetaDescription, t.app.holidaysMetaKeywords, format]);

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
            <div className={styles.topUtilityBar}>
                <LanguageSelector />
                <ThemeSelector />
            </div>
            <header className={styles.header}>
                <h1>
                    <a href="./">
                        🌍 {t.app.holidaysTitle}
                    </a>
                </h1>
                <p>{t.app.holidaysSubtitle}</p>
                <nav className={styles.primaryNav} aria-label={t.app.navAriaLabel}>
                    <a
                        href={`/${APP_BASE_NAME}/Holidays`}
                        aria-current="page"
                        className={styles.navLink}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${APP_BASE_NAME}/Holidays${window.location.hash}`);
                        }}
                    >
                        🌍 {t.app.navPublicHolidays}
                    </a>
                    <a
                        href={`/${APP_BASE_NAME}/EditEvents`}
                        className={styles.navLink}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${APP_BASE_NAME}/EditEvents${window.location.hash}`);
                        }}
                    >
                        ✏️ {t.app.navCustomEvents}
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
                        highlightLongHolidays={highlightLongHolidays}
                        setHighlightLongHolidays={setHighlightLongHolidays}
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
                        highlightLongHolidays={highlightLongHolidays}
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
