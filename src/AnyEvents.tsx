import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useCalendar } from "./hooks/useCalendar.ts";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid.tsx";
import styles from "./Holidays.module.css";
import { CalendarEvent, type OtherEvent } from "./types/index.ts";
import { EventListInput } from "./components/EventListInput/EventListInput.tsx";
import Controls from "./components/Controls/Controls.tsx";
import { EventListInputButtons } from "./components/EventListInput/EventListInputButtons.tsx";
import { ActionButtons } from "./components/EventsList/EventsListActionButtons.tsx";
import { EventsList } from "./components/EventsList/EventsList.tsx";
import { APP_BASE_NAME, STORAGE_KEY } from "./consts.ts";
import ThemeSelector from "./components/ThemeSelector/ThemeSelector.tsx";

const defaultData = `
2025-09-10 🎂 Birthday of Joe
2025-09-19 🎂 Birthday of Chuck
2025-09-27 🎂 Birthday of Dima
`;

function isIcon(symbol: string): boolean {
    if (!symbol) return false;
    if (symbol.length === 1) return true;
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    return emojiRegex.test(symbol);
}

function doesLineMatchEvent(line: string, target: OtherEvent): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const [date, icon, ...name] = trimmed.split(" ");
    const hasIcon = isIcon(icon);
    const lineIcon = hasIcon ? icon : "";
    const lineName = hasIcon ? name.join(" ") : [icon, ...name].join(" ");
    const dateMatches = date === target.date || date === target.date.substring(5);
    return dateMatches && lineIcon === target.icon && lineName === target.name;
}

function formatEventLine(ev: OtherEvent): string {
    return [ev.date, ev.icon, ev.name].filter(Boolean).join(" ");
}

export const AnyEvents: React.FC = () => {
    const navigate = useNavigate();
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
    const [dataText, setDataText] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) ?? defaultData.trim();
    });

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
        <div className={styles.app}>
            <ThemeSelector />
            <header className={styles.header}>
                <h1>
                    <a href="./">
                        🌍 Events Calendar
                    </a>
                </h1>
                <p>Create, import, and customize your own calendar events</p>
                <nav className={styles.primaryNav} aria-label="Primary">
                    <a
                        href={`/${APP_BASE_NAME}/Holidays`}
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
                        aria-current="page"
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
                />

                <ActionButtons
                    selectedYearDays={selectedYearDays}
                    viewMode={mode}
                    toggleMode={() => handleModeChange(mode === "month" ? "year" : "month", currentDate.getMonth())}
                    onSetMode={(newMode) => handleModeChange(newMode, currentDate.getMonth())}
                    isCustomEditor={true}
                />

                <EventListInputButtons
                    setDataText={setDataText}
                    setHolidaysData={setHolidaysData}
                    holidaysParsed={holidaysData}
                />

                <div id="calendar-grid-print-container">
                    <CalendarGrid
                        selectedYearDays={selectedYearDays}
                        selectedMonthDays={selectedMonthDays}
                        currentDate={currentDate}
                        mode={mode}
                        countryData={{}}
                        onModeChange={handleModeChange}
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

                <EventListInput setHolidaysData={setHolidaysData} dataText={dataText} setDataText={setDataText} />
            </div>
        </div>
    );
};

export default AnyEvents;
