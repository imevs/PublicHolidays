import React, { useEffect, useState, useRef } from "react";
import { useCalendar } from "./hooks/useCalendar.ts";
import Controls from "./components/Controls/Controls.tsx";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid.tsx";
import { CalendarEvent } from "./types/index.ts";
import { convertEvents } from "./utils/convertEvents.ts";
import { EventsList } from "./components/EventsList/EventsList.tsx";
import CountryFilter from "./components/CountryFilter/CountryFilter.tsx";
import { ActionButtons } from "./components/EventsList/EventsListActionButtons.tsx";
import { useTranslation } from "./i18n/useTranslation.ts";
import { AppLayout } from "./components/AppLayout/AppLayout.tsx";
import { loadContinentHolidays, getMissingContinents, ContinentId } from "./data/holidays_v2/continents";

export const Holidays: React.FC = () => {
    const { t, format } = useTranslation();
    const [holidaysData, setHolidaysData] = useState<CalendarEvent[]>([]);
    const [highlightLongHolidays, setHighlightLongHolidays] = useState(false);
    const loadedContinentsRef = useRef<Set<ContinentId>>(new Set());

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

    const year = currentDate.getFullYear();
    const documentTitle = format(t.app.holidaysDocumentTitle, { year });
    const description = format(t.app.holidaysMetaDescription, { year });
    const keywords = format(t.app.holidaysMetaKeywords, { year });

    useEffect(() => {
        let isMounted = true;
        const missing = getMissingContinents(selectedCountries, loadedContinentsRef.current);
        if (missing.length > 0) {
            Promise.all(missing.map(c => loadContinentHolidays(c))).then(results => {
                if (!isMounted) return;
                for (const m of missing) {
                    loadedContinentsRef.current.add(m);
                }
                const newCountryHolidays = results.flat();
                const converted = convertEvents(newCountryHolidays);
                setHolidaysData(prev => {
                    const existingKeys = new Set(prev.map(e => `${("countryCode" in e ? e.countryCode : "")}-${e.date}-${e.name}`));
                    const uniqueNew = converted.filter(e => !existingKeys.has(`${("countryCode" in e ? e.countryCode : "")}-${e.date}-${e.name}`));
                    return [...prev, ...uniqueNew];
                });
            });
        }
        return () => {
            isMounted = false;
        };
    }, [selectedCountries]);

    useEffect(() => {
        import("./data/holidays_descriptions/all.ts").then(data => {
            setCountryData(data.descriptions);
        });
    }, []);

    return (
        <AppLayout
            title={t.app.holidaysTitle}
            subtitle={t.app.holidaysSubtitle}
            documentTitle={documentTitle}
            description={description}
            keywords={keywords}
            activeRoute="Holidays"
        >
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
        </AppLayout>
    );
};
