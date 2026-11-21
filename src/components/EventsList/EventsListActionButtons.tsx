import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "../../i18n/useTranslation.ts";

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

function renderSubscribeModalDescription(template: string): React.ReactNode {
    const parts = template.split(/(\{google\}|\{apple\}|\{outlook\})/g);
    return parts.map((part, index) => {
        if (part === "{google}") {
            return <strong key={index}>Google Calendar</strong>;
        }
        if (part === "{apple}") {
            return <strong key={index}>Apple Calendar</strong>;
        }
        if (part === "{outlook}") {
            return <strong key={index}>Outlook</strong>;
        }
        return <Fragment key={index}>{part}</Fragment>;
    });
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
    const { t, getCountryName } = useTranslation();
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
                            <h3 id="subscribe-modal-title">{t.actionButtons.subscribeModalTitle}</h3>
                            <button
                                type="button"
                                className={styles.closeIconBtn}
                                aria-label={t.actionButtons.closeDialogAria}
                                onClick={() => setSubscribeModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <p className={styles.modalDescription}>
                            {renderSubscribeModalDescription(t.actionButtons.subscribeModalDesc)}
                        </p>

                        <div className={styles.modalSection}>
                            <h4>{t.actionButtons.sectionDownloadTitle}</h4>
                            <label className={styles.alarmCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={includeAlarm}
                                    onChange={(e) => setIncludeAlarm(e.target.checked)}
                                />
                                <span>{t.actionButtons.includeReminderLabel}</span>
                            </label>
                            <div className={styles.modalButtonRow}>
                                <button
                                    type="button"
                                    className={styles.actionButton}
                                    onClick={() => exportCalendar(includeAlarm)}
                                >
                                    {t.actionButtons.downloadIcsButton}
                                </button>
                                {!isCustomEditor && countries.length > 1 && (
                                    <button
                                        type="button"
                                        className={styles.actionButton}
                                        onClick={() => exportAllCalendars(includeAlarm)}
                                    >
                                        {t.actionButtons.downloadSeparateIcsButton}
                                    </button>
                                )}
                            </div>
                        </div>

                        {upcomingEvents.length > 0 && (
                            <div className={styles.modalSection}>
                                <h4>{t.actionButtons.sectionGoogleTitle}</h4>
                                <ul className={styles.upcomingList}>
                                    {upcomingEvents.map((ev, idx) => (
                                        <li key={`${ev.date}-${ev.name}-${idx}`} className={styles.upcomingItem}>
                                            <span>
                                                <strong>{ev.date}</strong>{" "}
                                                {ev.kind === "publicHoliday"
                                                    ? `${getFlagEmoji(ev.countryCode)} ${getCountryName(ev.countryCode, ev.country)}: ${ev.name}`
                                                    : `${ev.icon} ${ev.name}`}
                                            </span>
                                            <a
                                                href={buildGoogleCalendarUrl(ev)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.gcalLink}
                                            >
                                                {t.actionButtons.addToGoogleCalendar}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className={styles.modalSection}>
                            <h4>{t.actionButtons.sectionShareTitle}</h4>
                            <div className={styles.modalButtonRow}>
                                <button
                                    type="button"
                                    className={styles.actionButton}
                                    onClick={copyShareLink}
                                >
                                    {t.actionButtons.copyShareableLink}
                                </button>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => setSubscribeModalOpen(false)}
                                >
                                    {t.actionButtons.close}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};
