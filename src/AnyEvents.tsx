import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useCalendar } from "./hooks/useCalendar.ts";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid.tsx";
import styles from "./Holidays.module.css";
import { CalendarEvent, type OtherEvent } from "./types/index.ts";
import { EventListInput } from "./components/EventListInput/EventListInput.tsx";
import Controls from "./components/Controls/Controls.tsx";
import { ActionButtons } from "./components/EventsList/EventsListActionButtons.tsx";
import { EventsList } from "./components/EventsList/EventsList.tsx";
import { APP_BASE_NAME, STORAGE_KEY } from "./consts.ts";
import ThemeSelector from "./components/ThemeSelector/ThemeSelector.tsx";
import LanguageSelector from "./components/LanguageSelector/LanguageSelector.tsx";
import { useTranslation } from "./i18n/useTranslation.ts";

const defaultData = `
2025-09-10 🎂 Birthday of Joe
2025-09-19 🎂 Birthday of Chuck
2025-09-27 🎂 Birthday of Dima
`;

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function isIcon(symbol: string): boolean {
    if (!symbol) return false;
    if (symbol.length === 1) return true;
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    return emojiRegex.test(symbol);
}

function doesLineMatchEvent(line: string, target: OtherEvent): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const [dateToken, second, ...rest] = trimmed.split(" ");
    const hasColor = HEX_COLOR_REGEX.test(second);
    const lineColor = hasColor ? second : undefined;
    const iconToken = hasColor ? rest[0] : second;
    const nameTokens = hasColor ? rest.slice(1) : rest;

    const hasIcon = isIcon(iconToken);
    const lineIcon = hasIcon ? iconToken : "";
    const lineName = hasIcon ? nameTokens.join(" ") : [iconToken, ...nameTokens].join(" ");
    const [lineStart, lineEnd] = dateToken.split("..");

    const colorMatches = lineColor === target.color || (!lineColor && !target.color);

    if (target.isRange && target.endDate) {
        const targetStart = target.rangeStart ?? target.date;
        const startMatches = lineStart === targetStart || lineStart === targetStart.substring(5);
        const endMatches = Boolean(lineEnd) && (lineEnd === target.endDate || lineEnd === target.endDate.substring(5));
        return startMatches && endMatches && colorMatches && lineIcon === target.icon && lineName === target.name;
    }
    const dateMatches = dateToken === target.date || dateToken === target.date.substring(5);
    return !lineEnd && dateMatches && colorMatches && lineIcon === target.icon && lineName === target.name;
}

function formatEventLine(ev: OtherEvent): string {
    const start = ev.rangeStart ?? ev.date;
    const datePart = ev.isRange && ev.endDate && ev.endDate !== start ? `${start}..${ev.endDate}` : ev.date;
    return [datePart, ev.isRange && ev.color ? ev.color : "", ev.icon, ev.name].filter(Boolean).join(" ");
}

export const AnyEvents: React.FC = () => {
    const navigate = useNavigate();
    const { language, t, format } = useTranslation();
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

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
        document.title = format(t.app.eventsDocumentTitle, {
            year: currentDate.getFullYear(),
        });
    }, [currentDate, t.app.eventsDocumentTitle, format]);

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
            <div className={styles.topUtilityBar}>
                <LanguageSelector />
                <ThemeSelector />
            </div>
            <header className={styles.header}>
                <h1>
                    <a href="./">
                        🌍 {t.app.eventsTitle}
                    </a>
                </h1>
                <p>{t.app.eventsSubtitle}</p>
                <nav className={styles.primaryNav} aria-label={t.app.navAriaLabel}>
                    <a
                        href={`/${APP_BASE_NAME}/Holidays`}
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
                        aria-current="page"
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
                        onNewEvent={onNewEvent}
                        onEditEvent={onEditEvent}
                        onDeleteEvent={onDeleteEvent}
                        shouldScrollToMonth={shouldScrollToMonth}
                        onScrolledToMonth={clearShouldScrollToMonth}
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
