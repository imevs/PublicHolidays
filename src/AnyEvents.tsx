import React, { useCallback, useEffect, useState } from "react";
import { useCalendar } from "./hooks/useCalendar.ts";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid.tsx";
import { CalendarEvent, type OtherEvent } from "./types/index.ts";
import { EventListInput } from "./components/EventListInput/EventListInput.tsx";
import Controls from "./components/Controls/Controls.tsx";
import { ActionButtons } from "./components/EventsList/EventsListActionButtons.tsx";
import { EventsList } from "./components/EventsList/EventsList.tsx";
import { STORAGE_KEY } from "./consts.ts";
import { useTranslation } from "./i18n/useTranslation.ts";
import { AppLayout } from "./components/AppLayout/AppLayout.tsx";
import { doesLineMatchEvent, formatEventLine } from "./utils/customEventDSL.ts";

const defaultData = `
2025-09-10 🎂 Birthday of Joe
2025-09-19 🎂 Birthday of Chuck
2025-09-27 🎂 Birthday of Dima
`;

export const AnyEvents: React.FC = () => {
    const { t, format } = useTranslation();
    const [holidaysData, setHolidaysData] = useState<CalendarEvent[]>([]);

    const {
        currentDate,
        selectedMonthDays,
        selectedYearDays,
        mode,
        navigateMonth,
        handleModeChange,
        handleDateChange,
        shouldScrollToMonth,
        clearShouldScrollToMonth,
    } = useCalendar(holidaysData);
    const [dataText, setDataText] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) ?? defaultData.trim();
    });

    const year = currentDate.getFullYear();
    const documentTitle = format(t.app.eventsDocumentTitle, { year });
    const description = format(t.app.eventsMetaDescription, { year });
    const keywords = format(t.app.eventsMetaKeywords, { year });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, dataText);
    }, [dataText]);

    const onNewEvent = useCallback((newEvent: OtherEvent) => {
        setDataText((prevState) => {
            const line = formatEventLine(newEvent);
            return prevState.trim() ? `${prevState}\n${line}` : line;
        });
    }, []);

    const onEditEvent = useCallback((originalEvent: OtherEvent, updatedEvent: OtherEvent) => {
        setDataText((prevState) => {
            const lines = prevState.split("\n");
            let replaced = false;
            const nextLines = lines.map((line) => {
                if (!replaced && doesLineMatchEvent(line, originalEvent)) {
                    replaced = true;
                    return formatEventLine(updatedEvent);
                }
                return line;
            });
            return replaced ? nextLines.join("\n") : `${prevState}\n${formatEventLine(updatedEvent)}`;
        });
    }, []);

    const onDeleteEvent = useCallback((eventToDelete: OtherEvent) => {
        setDataText((prevState) => {
            const lines = prevState.split("\n");
            let deleted = false;
            return lines
                .filter((line) => {
                    if (!deleted && doesLineMatchEvent(line, eventToDelete)) {
                        deleted = true;
                        return false;
                    }
                    return true;
                })
                .join("\n");
        });
    }, []);

    return (
        <AppLayout
            title={t.app.eventsTitle}
            subtitle={t.app.eventsSubtitle}
            documentTitle={documentTitle}
            description={description}
            keywords={keywords}
            activeRoute="EditEvents"
        >
            <Controls
                selectedDate={currentDate}
                onDateChange={handleDateChange}
                onNavigateMonth={navigateMonth}
            />

            <ActionButtons
                selectedYearDays={selectedYearDays}
                viewMode={mode}
                toggleMode={() => handleModeChange(mode === "month" ? "year" : "month", currentDate.getMonth())}
                onSetMode={(newMode) => handleModeChange(newMode, currentDate.getMonth())}
                isCustomEditor={true}
                setDataText={setDataText}
                setHolidaysData={setHolidaysData}
            />

            <div id="calendar-grid-print-container">
                <CalendarGrid
                    selectedYearDays={selectedYearDays}
                    selectedMonthDays={selectedMonthDays}
                    currentDate={currentDate}
                    mode={mode}
                    countryData={{}}
                    onModeChange={handleModeChange}
                    shouldScrollToMonth={shouldScrollToMonth}
                    onScrolledToMonth={clearShouldScrollToMonth}
                    onNewEvent={onNewEvent}
                    onEditEvent={onEditEvent}
                    onDeleteEvent={onDeleteEvent}
                />

                <EventsList
                    selectedYearDays={selectedYearDays}
                    currentDate={currentDate}
                    mode={mode}
                    countryData={{}}
                />
            </div>

            <EventListInput
                dataText={dataText}
                setDataText={setDataText}
                setHolidaysData={setHolidaysData}
                referenceYear={currentDate.getFullYear()}
            />
        </AppLayout>
    );
};
