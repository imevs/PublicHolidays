import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";
import { formatDateString } from "../../utils/dateUtils.ts";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { buildGoogleCalendarUrl, exportCalendarToFile } from "../../utils/generateICS.ts";
import { APP_BASE_NAME, STORAGE_KEY } from "../../consts.ts";
import type { CalendarDay as CalendarDayType, CalendarEvent } from "../../types/index.ts";
import styles from "./EventsListActionButtons.module.css";
import { UTCDate } from "../../utils/UTCDate.ts";
import { EventListInputButtons } from "../EventListInput/EventListInputButtons.tsx";

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

    // Roving tabindex fallback for toolbar when native focusgroup is unsupported
    useEffect(() => {
        const bar = toolbarRef.current;
        if (!bar || ("focusGroup" in HTMLElement.prototype)) {
            return;
        }
        const getItems = () => Array.from(
            bar.querySelectorAll<HTMLButtonElement>("button:not([data-export-item])")
        );
        const items = getItems();
        items.forEach((b, i) => {
            b.tabIndex = i === 0 ? 0 : -1;
        });

        const onFocusIn = (e: FocusEvent) => {
            const currentItems = getItems();
            const target = e.target as HTMLButtonElement;
            if (currentItems.includes(target)) {
                currentItems.forEach(b => {
                    b.tabIndex = b === target ? 0 : -1;
                });
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const currentItems = getItems();
            const idx = currentItems.indexOf(document.activeElement as HTMLButtonElement);
            if (idx < 0) return;

            const rtl = getComputedStyle(bar).direction === "rtl";
            const steps: Record<string, number> = {
                ArrowRight: rtl ? -1 : 1,
                ArrowLeft: rtl ? 1 : -1,
            };

            let nextIdx = -1;
            if (e.key in steps) {
                nextIdx = (idx + steps[e.key] + currentItems.length) % currentItems.length;
            } else if (e.key === "Home") {
                nextIdx = 0;
            } else if (e.key === "End") {
                nextIdx = currentItems.length - 1;
            }

            if (nextIdx >= 0) {
                e.preventDefault();
                currentItems[nextIdx]?.focus();
            }
        };

        bar.addEventListener("focusin", onFocusIn);
        bar.addEventListener("keydown", onKeyDown);
        return () => {
            bar.removeEventListener("focusin", onFocusIn);
            bar.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    // Close subscribe modal on Escape
    useEffect(() => {
        if (!subscribeModalOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSubscribeModalOpen(false);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [subscribeModalOpen]);

    const handleSelectMode = (targetMode: "month" | "year") => {
        if (onSetMode) {
            onSetMode(targetMode);
        } else if (viewMode !== targetMode) {
            toggleMode();
        }
    };

    const editEvents = () => {
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
        setStatusMessage("Combined ICS file downloaded");
    }, [selectedYearDays, allEvents]);

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
        setStatusMessage("Separate ICS files downloaded");
    }, [selectedYearDays]);

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
            setStatusMessage("Calendar image saved");
        } catch (error) {
            console.error("Failed to capture calendar image:", error);
            alert("Failed to save calendar image. Please try again.");
        }
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setStatusMessage("Calendar link copied to clipboard");
        } catch {
            setStatusMessage("Copy failed");
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
                    aria-label="Calendar actions"
                    className={styles.actionButtonContainer}
                >
                    <div role="group" aria-label="View mode" className={styles.viewModeGroup}>
                        <button
                            type="button"
                            className={styles.modeButton}
                            aria-pressed={viewMode === "year"}
                            aria-label="Year view"
                            title="Year view"
                            onClick={() => handleSelectMode("year")}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">🗓️</span>
                            <span className={styles.modeLabel}>Year<span className={styles.desktopLabel}>&nbsp;view</span></span>
                        </button>
                        <button
                            type="button"
                            className={styles.modeButton}
                            aria-pressed={viewMode === "month"}
                            aria-label="Month view"
                            title="Month view"
                            onClick={() => handleSelectMode("month")}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">📅</span>
                            <span className={styles.modeLabel}>Month<span className={styles.desktopLabel}>&nbsp;view</span></span>
                        </button>
                    </div>

                    <span role="separator" aria-orientation="vertical" className={styles.separator} />

                    <div role="group" aria-label="Export and subscribe" className={styles.actionsGroup}>
                        <button
                            type="button"
                            className={styles.actionButton}
                            aria-label="Subscribe / Add to Calendar"
                            onClick={() => setSubscribeModalOpen(true)}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">🔔</span>
                            Subscribe<span className={styles.desktopLabel}>&nbsp;/ Add to Calendar</span>
                        </button>

                        <button
                            type="button"
                            className={styles.actionButton}
                            onClick={saveAsImage}
                        >
                            <span className={styles.buttonIcon} aria-hidden="true">📷</span>
                            Save<span className={styles.desktopLabel}>&nbsp;as Image</span>
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
                                aria-label="Create custom calendar"
                                title="Create custom calendar"
                                onClick={editEvents}
                            >
                                <span className={styles.buttonIcon} aria-hidden="true">✏️</span>
                                <span className={styles.customizeLabel}>Customize</span><span className={styles.desktopLabel}>&nbsp;calendar</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <p role="status" className={styles.srStatus}>{statusMessage}</p>

            {subscribeModalOpen && (
                <>
                    <div
                        className={styles.modalBackdrop}
                        onClick={() => setSubscribeModalOpen(false)}
                    />
                    <div
                        ref={subscribeDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="subscribe-modal-title"
                        className={styles.subscribeModal}
                    >
                        <div className={styles.modalHeader}>
                            <h3 id="subscribe-modal-title">📅 Subscribe / Add to Calendar</h3>
                            <button
                                type="button"
                                className={styles.closeIconBtn}
                                aria-label="Close dialog"
                                onClick={() => setSubscribeModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <p className={styles.modalDescription}>
                            Import events into <strong>Google Calendar</strong>, <strong>Apple Calendar</strong>, or <strong>Outlook</strong> for reliable native notifications across all your devices.
                        </p>

                        <div className={styles.modalSection}>
                            <h4>1. Download Calendar Feed (.ics) with Reminders</h4>
                            <label className={styles.alarmCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={includeAlarm}
                                    onChange={(e) => setIncludeAlarm(e.target.checked)}
                                />
                                <span>Include native reminder (9:00 AM the day before each holiday)</span>
                            </label>
                            <div className={styles.modalButtonRow}>
                                <button
                                    type="button"
                                    className={styles.actionButton}
                                    onClick={() => exportCalendar(includeAlarm)}
                                >
                                    📥 Download .ics for Calendar Import
                                </button>
                                {!isCustomEditor && countries.length > 1 && (
                                    <button
                                        type="button"
                                        className={styles.actionButton}
                                        onClick={() => exportAllCalendars(includeAlarm)}
                                    >
                                        🗂️ Download separate .ics per country
                                    </button>
                                )}
                            </div>
                        </div>

                        {upcomingEvents.length > 0 && (
                            <div className={styles.modalSection}>
                                <h4>2. Quick-Add Upcoming Holidays to Google Calendar</h4>
                                <ul className={styles.upcomingList}>
                                    {upcomingEvents.map((ev, idx) => (
                                        <li key={`${ev.date}-${ev.name}-${idx}`} className={styles.upcomingItem}>
                                            <span>
                                                <strong>{ev.date}</strong>{" "}
                                                {ev.kind === "publicHoliday"
                                                    ? `${getFlagEmoji(ev.countryCode)} ${ev.country}: ${ev.name}`
                                                    : `${ev.icon} ${ev.name}`}
                                            </span>
                                            <a
                                                href={buildGoogleCalendarUrl(ev)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.gcalLink}
                                            >
                                                + Google Calendar
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className={styles.modalSection}>
                            <h4>3. Share or Bookmark View</h4>
                            <div className={styles.modalButtonRow}>
                                <button
                                    type="button"
                                    className={styles.actionButton}
                                    onClick={copyShareLink}
                                >
                                    🔗 Copy Shareable Link
                                </button>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => setSubscribeModalOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};
