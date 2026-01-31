import React, { useCallback, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";
import { formatDateString } from "../../utils/dateUtils";
import { getFlagEmoji } from "../../utils/countryFlags";
import { exportCalendarToFile } from "../../utils/generateICS";
import { APP_BASE_NAME, STORAGE_KEY } from "../../consts";
import type { CalendarDay as CalendarDayType } from "../../types";
import styles from "./EventsListActionButtons.module.css";
import { SlidingPanel } from "../SlidingPanel/SlidingPanel";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import {
    hasServiceWorker,
    registerNotifications,
    stopNotifications,
} from "../../notifications/notifications";

interface ActionButtonsProps {
    selectedYearDays: CalendarDayType[];
    viewMode: "month" | "year";
    toggleMode(): void;
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

export const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedYearDays, viewMode, toggleMode }) => {
    const navigate = useNavigate();
    const [notificationsEnabled, enableNotification] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [isNarrow, containerRef] = useResizeObserver(600);

    useEffect(() => {
        registerNotifications([], true, enableNotification);
    }, []);

    const editEvents = () => {
        const dataText = (selectedYearDays ?? [])
            .flatMap(day => day.events
                .filter(event => event.kind === "publicHoliday")
                .map(ev => `${formatDateString(day.date)} ${getFlagEmoji(ev.countryCode)} ${ev.country}: ${ev.name}`))
            .filter(Boolean)
            .join("\n");
        localStorage.setItem(STORAGE_KEY, dataText);
        navigate(`/${APP_BASE_NAME}/EditEvents`);
    };

    const exportCalendar = () => {
        const countries = getCountriesNames(selectedYearDays);

        const data = selectedYearDays.map(d => d.events).flat();
        exportCalendarToFile(data, countries.join("_") + "_calendar");
    };

    const exportAllCalendars = () => {
        const allEvents = (selectedYearDays ?? [])
            .flatMap(d => d.events.filter(event => event.kind === "publicHoliday"));
        const countries = getCountriesNames(selectedYearDays);
        countries.forEach(country => {
            const countryEvents = allEvents.filter(e => e.country === country);
            if (countryEvents.length) {
                exportCalendarToFile(countryEvents, country + "_calendar");
            }
        });
    };

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
        } catch (error) {
            console.error("Failed to capture calendar image:", error);
            alert("Failed to save calendar image. Please try again.");
        }
    };

    const getNotifications = useCallback(() => {
        if (notificationsEnabled) {
            stopNotifications();
        } else {
            registerNotifications(selectedYearDays.flatMap(
                d => d.events.filter(e => e.kind === "publicHoliday"),
            ), false, enableNotification);
        }
    }, [notificationsEnabled, enableNotification]);

    const actionButtonsContent = (
        <>
            {hasServiceWorker && (
                <button className={styles.actionButton} onClick={getNotifications}>
                    <span className={styles.buttonIcon}>{notificationsEnabled ? "🔕" : "🔔"}</span>
                    {notificationsEnabled ? "Disable notifications" : "Get notifications"}
                </button>
            )}
            <button className={styles.actionButton} onClick={toggleMode}>
                <span className={styles.buttonIcon}>{viewMode === "month" ? "🗓️" : "📅"}</span>
                {viewMode === "month" ? "Switch to year mode" : "Switch to month mode"}
            </button>
            <button className={styles.actionButton} onClick={exportAllCalendars}>
                <span className={styles.buttonIcon}>📥</span>
                Download separate ICS files
            </button>
            <button className={styles.actionButton} onClick={exportCalendar}>
                <span className={styles.buttonIcon}>📥</span>
                Download combined ICS file
            </button>
            <button className={styles.actionButton} onClick={saveAsImage}>
                <span className={styles.buttonIcon}>📷</span>
                Save as Image
            </button>
            <button className={styles.actionButton} onClick={editEvents} style={{ right: 120 }}>
                <span className={styles.buttonIcon}>✏️</span>
                Create custom calendar
            </button>
        </>
    );

    return (
        <div ref={containerRef}>
            {isNarrow ? (
                <SlidingPanel
                    isOpen={panelOpen}
                    onToggle={() => setPanelOpen(!panelOpen)}
                    toggleLabel="Actions"
                    id="actions-panel"
                >
                    <div className={`${styles.actionButtonContainer} ${styles.panel}`}>
                        {actionButtonsContent}
                    </div>
                </SlidingPanel>
            ) : (
                <div className={styles.actionButtonContainer}>
                    {actionButtonsContent}
                </div>
            )}
        </div>
    );
};
