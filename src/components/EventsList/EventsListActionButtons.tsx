import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "../../i18n/useTranslation.ts";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";
import { formatDateString } from "../../utils/dateUtils.ts";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { exportCalendarToFile } from "../../utils/generateICS.ts";
import { APP_BASE_NAME, STORAGE_KEY } from "../../consts.ts";
import type { CalendarDay as CalendarDayType, CalendarEvent } from "../../types/index.ts";
import styles from "./EventsListActionButtons.module.css";
import { UTCDate } from "../../utils/UTCDate.ts";
import { EventListInputButtons } from "../EventListInput/EventListInputButtons.tsx";
import { useToolbarRovingTabIndex } from "../../hooks/useToolbarRovingTabIndex.ts";
import { SubscribeModal } from "./SubscribeModal.tsx";

interface ActionButtonsProps {
    selectedYearDays: CalendarDayType[];
    viewMode: "month" | "year";
    toggleMode(): void;
    onSetMode?: (mode: "month" | "year") => void;
    isCustomEditor?: boolean;
    setDataText?: (text: string) => void;
    setHolidaysData?: (data: CalendarEvent[]) => void;
}

function getCountriesNames(selectedYearDays: CalendarDayType[]) {
    return Array.from(new Set(
        (selectedYearDays ?? [])
            .flatMap(d => d.events
                .filter(event => event.kind === "publicHoliday")
                .map(ev => ev.country)
                .filter(Boolean)
            )
    ));
}



export const ActionButtons: React.FC<ActionButtonsProps> = ({
    selectedYearDays,
    viewMode,
    toggleMode,
    onSetMode,
    isCustomEditor = false,
    setDataText,
    setHolidaysData,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
    const [includeAlarm, setIncludeAlarm] = useState(true);
    const [statusMessage, setStatusMessage] = useState("");

    const toolbarRef = useRef<HTMLDivElement | null>(null);
    const subscribeDialogRef = useRef<HTMLDivElement | null>(null);

    const allEvents = useMemo((): CalendarEvent[] => {
        return (selectedYearDays ?? []).flatMap(d => d.events);
    }, [selectedYearDays]);

    const upcomingEvents = useMemo((): CalendarEvent[] => {
        const todayStr = formatDateString(new UTCDate());
        const future = allEvents.filter(e => e.date >= todayStr);
        return (future.length > 0 ? future : allEvents).slice(0, 5);
    }, [allEvents]);

    useToolbarRovingTabIndex(toolbarRef);

    const handleSelectMode = (targetMode: "month" | "year") => {
        if (onSetMode) {
            onSetMode(targetMode);
        } else if (viewMode !== targetMode) {
            toggleMode();
        }
    };

    const editEvents = () => {
        sessionStorage.setItem("skipMonthScroll", "1");
        const holidayLines = (selectedYearDays ?? [])
            .flatMap(day => day.events
                .filter(event => event.kind === "publicHoliday")
                .map(ev => `${formatDateString(day.date)} ${getFlagEmoji(ev.countryCode)} ${ev.country}: ${ev.name}`))
            .filter(Boolean);

        const existingRaw = localStorage.getItem(STORAGE_KEY) ?? "";
        const existingLines = existingRaw
            .split("\n")
            .map(l => l.trim())
            .filter(Boolean);

        const mergedSet = new Set([...existingLines, ...holidayLines]);
        localStorage.setItem(STORAGE_KEY, Array.from(mergedSet).join("\n"));
        navigate(`/${APP_BASE_NAME}/EditEvents${window.location.hash}`);
    };

    const exportCalendar = useCallback((withAlarm = false) => {
        const countries = getCountriesNames(selectedYearDays);
        const fileName = countries.length > 0 ? `${countries.join("_")}_calendar` : "custom_calendar";
        exportCalendarToFile(allEvents, fileName, { includeAlarm: withAlarm });
        setStatusMessage(t.actionButtons.combinedIcsDownloaded);
    }, [selectedYearDays, allEvents, t.actionButtons.combinedIcsDownloaded]);

    const exportAllCalendars = useCallback((withAlarm = false) => {
        const publicEvents = (selectedYearDays ?? [])
            .flatMap(d => d.events.filter(event => event.kind === "publicHoliday"));
        const countries = getCountriesNames(selectedYearDays);
        countries.forEach(country => {
            const countryEvents = publicEvents.filter(e => e.country === country);
            if (countryEvents.length) {
                exportCalendarToFile(countryEvents, `${country}_calendar`, { includeAlarm: withAlarm });
            }
        });
        setStatusMessage(t.actionButtons.separateIcsDownloaded);
    }, [selectedYearDays, t.actionButtons.separateIcsDownloaded]);

    const saveAsImage = async () => {
        const element = document.getElementById("calendar-grid-capture-container");
        if (!element) return;

        let bgColor = null;
        if (element.parentElement) {
            bgColor = getComputedStyle(element.parentElement).backgroundColor;
        }

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: bgColor,
                logging: false,
                useCORS: true,
                scale: 2,
                onclone: (documentClone) => {
                    const style = documentClone.createElement("style");
                    style.innerHTML = `
                        * {
                            animation: none !important;
                            transition: none !important;
                        }
                    `;
                    documentClone.body.appendChild(style);
                }
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            const timestamp = new Date().toISOString().split("T")[0];
            link.href = image;
            link.download = `calendar-${viewMode}-${timestamp}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setStatusMessage(t.actionButtons.calendarImageSaved);
        } catch (error) {
            console.error("Failed to capture calendar image:", error);
            alert(t.actionButtons.saveImageFailedAlert);
        }
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setStatusMessage(t.actionButtons.linkCopied);
        } catch {
            setStatusMessage(t.actionButtons.copyFailed);
        }
    };

    const countries = getCountriesNames(selectedYearDays);

    return (
        <>
            <div className={styles.stickyToolbarWrapper}>
                <div
                    ref={toolbarRef}
                    role="toolbar"
                    {...({ focusgroup: "toolbar wrap" } as React.HTMLAttributes<HTMLDivElement>)}
                    aria-label={t.actionButtons.calendarActionsAria}
                    className={styles.actionButtonContainer}
                >
                    <div role="group" aria-label={t.actionButtons.viewModeAria} className={styles.viewModeGroup}>
                        <button
                            type="button"
                            className={styles.modeButton}
                            aria-pressed={viewMode === "year"}
                            aria-label={t.actionButtons.yearView}
                            title={t.actionButtons.yearView}
                            onClick={() => handleSelectMode("year")}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">🗓️</span>
                            <span className={styles.modeLabel}>
                                <span className={styles.mobileLabel}>{t.actionButtons.yearShort}</span>
                                <span className={styles.desktopLabel}>{t.actionButtons.yearView}</span>
                            </span>
                        </button>
                        <button
                            type="button"
                            className={styles.modeButton}
                            aria-pressed={viewMode === "month"}
                            aria-label={t.actionButtons.monthView}
                            title={t.actionButtons.monthView}
                            onClick={() => handleSelectMode("month")}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">📅</span>
                            <span className={styles.modeLabel}>
                                <span className={styles.mobileLabel}>{t.actionButtons.monthShort}</span>
                                <span className={styles.desktopLabel}>{t.actionButtons.monthView}</span>
                            </span>
                        </button>
                    </div>

                    <span role="separator" aria-orientation="vertical" className={styles.separator} />

                    <div role="group" aria-label={t.actionButtons.exportAndSubscribeAria} className={styles.actionsGroup}>
                        <button
                            type="button"
                            className={styles.actionButton}
                            aria-label={t.actionButtons.subscribeAdd}
                            onClick={() => setSubscribeModalOpen(true)}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">🔔</span>
                            <span className={styles.mobileLabel}>{t.actionButtons.subscribeShort}</span>
                            <span className={styles.desktopLabel}>{t.actionButtons.subscribeAdd}</span>
                        </button>

                        <button
                            type="button"
                            className={styles.actionButton}
                            aria-label={t.actionButtons.saveAsImage}
                            onClick={saveAsImage}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">📷</span>
                            <span className={styles.mobileLabel}>{t.actionButtons.saveShort}</span>
                            <span className={styles.desktopLabel}>{t.actionButtons.saveAsImage}</span>
                        </button>

                        {isCustomEditor && setDataText && setHolidaysData && (
                            <EventListInputButtons
                                setDataText={setDataText}
                                setHolidaysData={setHolidaysData}
                                buttonClassName={styles.actionButton}
                            />
                        )}

                        {!isCustomEditor && (
                            <button
                                type="button"
                                className={`${styles.actionButton} ${styles.iconOnlyOnMobile}`}
                                aria-label={t.actionButtons.createCustomCalendar}
                                title={t.actionButtons.createCustomCalendar}
                                onClick={editEvents}
                            >
                                <span className={styles.buttonIcon} aria-hidden="true">✏️</span>
                                <span className={`${styles.customizeLabel} ${styles.mobileLabel}`}>{t.actionButtons.customizeShort}</span>
                                <span className={`${styles.customizeLabel} ${styles.desktopLabel}`}>{t.actionButtons.customizeCalendar}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <p role="status" className={styles.srStatus}>{statusMessage}</p>

            <SubscribeModal
                isOpen={subscribeModalOpen}
                onClose={() => setSubscribeModalOpen(false)}
                subscribeDialogRef={subscribeDialogRef}
                includeAlarm={includeAlarm}
                setIncludeAlarm={setIncludeAlarm}
                onExportICS={exportCalendar}
                onExportSeparateICS={exportAllCalendars}
                onCopyShareLink={copyShareLink}
                upcomingEvents={upcomingEvents}
                isCustomEditor={isCustomEditor}
                countriesCount={countries.length}
            />
        </>
    );
};
