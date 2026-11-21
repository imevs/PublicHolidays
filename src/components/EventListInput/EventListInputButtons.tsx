import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parseICS } from "../../utils/generateICS.ts";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import type { CalendarEvent } from "../../types/index.ts";
import styles from "./EventListInputButtons.module.css";
import { useSearchParams } from "react-router";
import { useTranslation } from "../../i18n/useTranslation.ts";

interface EventListInputButtonsProps {
    setDataText: (text: string) => void;
    setHolidaysData: (data: CalendarEvent[]) => void;
    buttonClassName?: string;
}
const proxy = "https://api.codetabs.com/v1/proxy/?quest=";

function loadExternalCalendar(url: string): Promise<string> {
    return fetch(proxy + encodeURIComponent(url))
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.text();
        })
        .catch(e => {
            console.error(e);
            return "";
        });
}

function isCalendarStateHash(hash: string): boolean {
    const cleanHash = hash.replace(/^#/, "");
    if (!cleanHash) {
        return true;
    }
    const hashParams = new URLSearchParams(cleanHash);
    return (
        /^(date|countries|mode|all)=/.test(cleanHash)
        || hashParams.has("date")
        || hashParams.has("countries")
        || hashParams.has("mode")
        || hashParams.has("all")
    );
}

export const EventListInputButtons: React.FC<EventListInputButtonsProps> = ({
    setDataText,
    setHolidaysData,
    buttonClassName,
}) => {
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const icsLinkRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const importButtonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const urlDialogRef = useRef<HTMLDialogElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const [icsUrl, setIcsUrl] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [urlModalOpen, setUrlModalOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

    const handleICS = useCallback((text: string) => {
        if (!text || !text.includes("BEGIN:VCALENDAR")) {
            return;
        }
        const parsed = parseICS(text);
        setHolidaysData(parsed);
        const lines = parsed.map(ev =>
            `${ev.date} ${ev.kind === "other" ? ev.icon : getFlagEmoji(ev.countryCode)} ${ev.name}`
        ).join("\n");
        setDataText(lines);
    }, [setDataText, setHolidaysData]);

    useEffect(() => {
        const ics = searchParams?.get("ics");
        if (ics) {
            const hash = window.location.hash;
            const rawUrl = isCalendarStateHash(hash) ? ics : ics + hash;
            const url = encodeURI(rawUrl).replace(/#/g, "%23").replace(/@/g, "%40");
            setIcsUrl(rawUrl);
            loadExternalCalendar(url).then(handleICS);
        }
    }, [searchParams, handleICS]);

    useLayoutEffect(() => {
        if (!menuOpen) {
            setMenuPos(null);
            return;
        }
        const updatePos = () => {
            if (!importButtonRef.current) return;
            const rect = importButtonRef.current.getBoundingClientRect();
            const menuWidth = menuRef.current?.offsetWidth || 220;
            const menuHeight = menuRef.current?.offsetHeight || 106;
            const vw = document.documentElement.clientWidth;
            const vh = window.innerHeight;

            let left = rect.right - menuWidth;
            left = Math.max(10, Math.min(left, vw - menuWidth - 10));

            let top = rect.bottom + 6;
            if (top + menuHeight > vh - 10 && rect.top - menuHeight - 6 >= 10) {
                top = rect.top - menuHeight - 6;
            }
            top = Math.max(10, Math.min(top, vh - menuHeight - 10));

            setMenuPos({ top, left });
        };
        updatePos();

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                !(menuRef.current && menuRef.current.contains(target)) &&
                !(wrapperRef.current && wrapperRef.current.contains(target))
            ) {
                setMenuOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMenuOpen(false);
            }
        };

        window.addEventListener("resize", updatePos);
        window.addEventListener("scroll", updatePos, true);
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("resize", updatePos);
            window.removeEventListener("scroll", updatePos, true);
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    useEffect(() => {
        const dialog = urlDialogRef.current;
        if (!dialog) return;
        if (urlModalOpen) {
            if (typeof dialog.showModal === "function" && !dialog.open) {
                dialog.showModal();
            } else if (!dialog.hasAttribute("open")) {
                dialog.setAttribute("open", "");
            }
        } else {
            if (dialog.open) {
                dialog.close();
            } else if (dialog.hasAttribute("open")) {
                dialog.removeAttribute("open");
            }
        }
    }, [urlModalOpen]);

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            handleICS(String(reader.result || ""));
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const loadCalendar = useCallback(() => {
        const url = icsLinkRef.current?.value || icsUrl;
        if (url) {
            loadExternalCalendar(url).then(handleICS);
        }
    }, [icsUrl, handleICS]);

    return (
        <div ref={wrapperRef} className={styles.dropdownWrapper}>
            <button
                ref={importButtonRef}
                type="button"
                className={buttonClassName || styles.importButton}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(prev => !prev)}
            >
                <span className={styles.buttonIcon} aria-hidden="true">📥</span>
                {t.eventListInputButtons.importButton}
            </button>

            {menuOpen && menuPos && typeof document !== "undefined" && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label={t.eventListInputButtons.importOptionsAria}
                    className={styles.dropdownMenu}
                    style={{ top: menuPos.top, left: menuPos.left }}
                >
                    <button
                        type="button"
                        role="menuitem"
                        className={styles.dropdownItem}
                        onClick={() => {
                            setMenuOpen(false);
                            fileInputRef.current?.click();
                        }}
                    >
                        {t.eventListInputButtons.importIcsFile}
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className={styles.dropdownItem}
                        onClick={() => {
                            setMenuOpen(false);
                            setUrlModalOpen(true);
                        }}
                    >
                        {t.eventListInputButtons.loadIcsFromLink}
                    </button>
                </div>,
                document.body
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                style={{ display: "none" }}
                onChange={handleImportFile}
            />

            {urlModalOpen && (
                <dialog
                    ref={urlDialogRef}
                    className={styles.urlDialog}
                    {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
                    aria-labelledby="url-modal-title"
                    onClose={() => setUrlModalOpen(false)}
                    onCancel={() => setUrlModalOpen(false)}
                >
                    <div className={styles.modalHeader}>
                        <h3 id="url-modal-title">{t.eventListInputButtons.urlModalTitle}</h3>
                        <button
                            type="button"
                            className={styles.closeBtn}
                            aria-label={t.eventListInputButtons.closeAria}
                            onClick={() => setUrlModalOpen(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <label htmlFor="icsLinkInput">{t.eventListInputButtons.calendarIcsUrlLabel}</label>
                        <input
                            id="icsLinkInput"
                            ref={icsLinkRef}
                            value={icsUrl}
                            type="url"
                            autoFocus
                            onChange={e => setIcsUrl(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    loadCalendar();
                                    setUrlModalOpen(false);
                                }
                            }}
                            placeholder={t.eventListInputButtons.urlPlaceholder}
                        />
                    </div>
                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => {
                                loadCalendar();
                                setUrlModalOpen(false);
                            }}
                        >
                            {t.eventListInputButtons.loadIcsButton}
                        </button>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setUrlModalOpen(false)}
                        >
                            {t.eventListInputButtons.cancelButton}
                        </button>
                    </div>
                </dialog>
            )}
        </div>
    );
};
