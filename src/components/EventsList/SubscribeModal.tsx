import React, { useEffect } from "react";
import { useTranslation } from "../../i18n/useTranslation.ts";
import type { CalendarEvent } from "../../types/index.ts";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { buildGoogleCalendarUrl } from "../../utils/generateICS.ts";
import { renderSubscribeModalDescription } from "../../utils/renderSubscribeModalDescription.tsx";
import styles from "./EventsListActionButtons.module.css";

interface SubscribeModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscribeDialogRef: React.RefObject<HTMLDivElement | null>;
    includeAlarm: boolean;
    setIncludeAlarm: (value: boolean) => void;
    onExportICS: (withAlarm: boolean) => void;
    onExportSeparateICS: (withAlarm: boolean) => void;
    onCopyShareLink: () => void;
    upcomingEvents: CalendarEvent[];
    isCustomEditor: boolean;
    countriesCount: number;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
    isOpen,
    onClose,
    subscribeDialogRef,
    includeAlarm,
    setIncludeAlarm,
    onExportICS,
    onExportSeparateICS,
    onCopyShareLink,
    upcomingEvents,
    isCustomEditor,
    countriesCount,
}) => {
    const { t, getCountryName } = useTranslation();

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div
                className={styles.modalBackdrop}
                onClick={onClose}
            />
            <div
                ref={subscribeDialogRef as React.RefObject<HTMLDivElement>}
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
                        onClick={onClose}
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
                            onClick={() => onExportICS(includeAlarm)}
                        >
                            {t.actionButtons.downloadIcsButton}
                        </button>
                        {!isCustomEditor && countriesCount > 1 && (
                            <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => onExportSeparateICS(includeAlarm)}
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
                            onClick={onCopyShareLink}
                        >
                            {t.actionButtons.copyShareableLink}
                        </button>
                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={onClose}
                        >
                            {t.actionButtons.close}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
