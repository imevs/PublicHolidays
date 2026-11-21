import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./EventPopup.module.css";
import type { OtherEvent } from "../../types/index.ts";
import type { DateString, DateTwoParts } from "../../utils/UTCDate.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";
import type { ColorKey } from "../../i18n/types.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";

interface EventPopupProps {
    initialDate: DateString;
    initialEvent?: OtherEvent | null;
    initialOneTime?: boolean;
    onNewEvent: (date: OtherEvent | null) => void;
    onDeleteEvent?: () => void;
}

const LEADING_EMOJI_REGEX = /^(?:(?:\p{Regional_Indicator}{2}|(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\p{Emoji_Modifier}?)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\p{Emoji_Modifier}?)*)\s*/u;

function clearFromEmoji(s: string): string {
    return s.replace(LEADING_EMOJI_REGEX, "");
}
const icons = [
    "🎈", "🎁", "🎂", "💍", "👸", "👴🏼", "👵", "😀", "😁", "😂",
    "🤣", "😊", "😍", "😎", "😏", "🤔", "😴", "😡", "😭", "🤯",
    "🤩", "😇", "🥰", "😤", "😈", "👻", "🔥", "🏖️", "✈️", "🏔️", "🏕️"
];

const RANGE_COLORS: readonly { key: ColorKey; value: string }[] = [
    { key: "teal", value: "#0d9488" },
    { key: "blue", value: "#2563eb" },
    { key: "purple", value: "#7c3aed" },
    { key: "amber", value: "#d97706" },
    { key: "rose", value: "#db2777" },
    { key: "green", value: "#059669" },
    { key: "red", value: "#dc2626" },
];

const EventPopup: React.FC<EventPopupProps> = ({
    initialDate,
    initialEvent,
    initialOneTime = false,
    onNewEvent,
    onDeleteEvent,
}) => {
    const { t, format } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const nameRef = useRef<HTMLInputElement | null>(null);
    const [name, setName] = useState(() => {
        if (!initialEvent) return "";
        return initialEvent.icon ? `${initialEvent.icon} ${initialEvent.name}` : initialEvent.name;
    });
    const [oneTime, setOneTime] = useState(initialOneTime);
    const [isRange, setIsRange] = useState(() => Boolean(initialEvent?.isRange && initialEvent?.endDate));
    const [endDate, setEndDate] = useState<string>(() => { if (!initialEvent?.endDate) return initialDate; return initialEvent.endDate.split("-").length === 3 ? initialEvent.endDate : `${initialDate.slice(0, 4)}-${initialEvent.endDate}`; });
    const [rangeColor, setRangeColor] = useState(initialEvent?.color || "#0d9488");
    const [icon, setIcon] = useState(initialEvent?.icon || "🎂");

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (typeof dialog.showModal === "function" && !dialog.open) {
            dialog.showModal();
        } else if (!dialog.hasAttribute("open")) {
            dialog.setAttribute("open", "");
        }
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        let downTarget: EventTarget | null = null;
        const handlePointerDown = (e: PointerEvent) => {
            downTarget = e.target;
        };
        const handlePointerUp = (e: PointerEvent) => {
            if (!dialog.open) return;
            const rect = dialog.getBoundingClientRect();
            const isInRect =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInRect && downTarget === e.target) {
                const hasClosedBy = "closedBy" in HTMLDialogElement.prototype;
                if (!hasClosedBy) {
                    onNewEvent(null);
                }
            }
            downTarget = null;
        };

        dialog.addEventListener("pointerdown", handlePointerDown);
        dialog.addEventListener("pointerup", handlePointerUp);
        return () => {
            dialog.removeEventListener("pointerdown", handlePointerDown);
            dialog.removeEventListener("pointerup", handlePointerUp);
        };
    }, [onNewEvent]);

    const handleSave = useCallback(() => {
        const startDateStr = oneTime ? initialDate : (initialDate.substring(5) as DateTwoParts);
        if (isRange && endDate > initialDate) {
            const endDateStr = oneTime ? (endDate as DateString) : (endDate.substring(5) as DateTwoParts);
            onNewEvent({ date: startDateStr, rangeStart: startDateStr, endDate: endDateStr, isRange: true, color: rangeColor, name: clearFromEmoji(name), icon, localName: "", kind: "other" });
        } else {
            onNewEvent({ date: startDateStr, name: clearFromEmoji(name), icon, localName: "", kind: "other" });
        }
    }, [onNewEvent, oneTime, initialDate, name, icon, isRange, endDate, rangeColor]);

    const selectIcon = useCallback((selectedIcon: string) => {
        setIcon(selectedIcon);
        setName((origin) => selectedIcon + " " + clearFromEmoji(origin));
        nameRef.current?.focus();
    }, []);

    const onIconClick = useCallback((e: React.MouseEvent<Element>) => {
        const el = e.target as Element;
        if (el.tagName === "SPAN" && el.textContent) {
            selectIcon(el.textContent);
        }
    }, [selectIcon]);

    const onIconKeyDown = useCallback((e: React.KeyboardEvent<Element>) => {
        const el = e.target as Element;
        if (el.tagName === "SPAN" && el.textContent) {
            const selectedIcon = el.textContent;
            handleKeyboardActivation(e, () => selectIcon(selectedIcon), { stopPropagation: true });
        }
    }, [selectIcon]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.defaultPrevented) {
            return;
        }
        if (e.key === "Enter" && name.trim()) {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            onNewEvent(null);
        }
    }, [handleSave, name, onNewEvent]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <dialog
            ref={dialogRef}
            className={styles.popup}
            {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
            aria-labelledby="event-popup-title"
            onClose={() => onNewEvent(null)}
            onCancel={() => onNewEvent(null)}
        >
            <div className={styles.header}>
                <h3 id="event-popup-title">
                    {format(
                        initialEvent ? t.eventPopup.editEventForDate : t.eventPopup.addEventForDate,
                        { date: initialDate }
                    )}
                </h3>
                <button
                    type="button"
                    className={styles.closeBtn}
                    aria-label={t.eventPopup.closeAria}
                    onClick={() => onNewEvent(null)}
                >
                    ✕
                </button>
            </div>
            <div className={styles.body}>
                <div className={styles.nameContainer}>
                    <label htmlFor="eventName">{t.eventPopup.nameLabel}</label>
                    <input
                        id="eventName"
                        ref={nameRef}
                        value={name}
                        required
                        type="text"
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div className={styles.emojiGrid} onClick={onIconClick} onKeyDown={onIconKeyDown}>
                    {icons.map((s, i) => (
                        <span
                            key={i}
                            role="button"
                            tabIndex={0}
                            className={`${styles.emojiItem} ${icon === s ? styles.emojiItemActive : ""}`}
                        >
                            {s}
                        </span>
                    ))}
                </div>

                <div className={styles.checkboxGroup}>
                    <div className={styles.checkboxRow}>
                        <input
                            type="checkbox"
                            id="oneTime"
                            className={styles.checkbox}
                            checked={oneTime}
                            onChange={(e) => setOneTime(e.target.checked)}
                        />
                        <label htmlFor="oneTime" className={styles.checkboxLabel}>{t.eventPopup.oneTimeLabel}</label>
                    </div>

                    <div className={styles.checkboxRow}>
                        <input type="checkbox" id="isRange" className={styles.checkbox} checked={isRange} onChange={(e) => setIsRange(e.target.checked)} />
                        <label htmlFor="isRange" className={styles.checkboxLabel}>{t.eventPopup.dateRangeLabel}</label>
                    </div>
                </div>

                {isRange && (
                    <>
                        <div className={styles.endDateContainer}>
                            <label htmlFor="eventEndDate">{t.eventPopup.endDateLabel}</label>
                            <input id="eventEndDate" type="date" min={initialDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className={styles.colorSection}>
                            <span className={styles.colorLabel}>{t.eventPopup.highlightColorLabel}</span>
                            <div className={styles.colorSwatches}>
                                {RANGE_COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        aria-label={t.eventPopup.colors[c.key]}
                                        aria-pressed={rangeColor.toLowerCase() === c.value}
                                        className={`${styles.colorSwatch} ${rangeColor.toLowerCase() === c.value ? styles.colorSwatchActive : ""}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => setRangeColor(c.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className={styles.footer}>
                <button type="button" className={styles.saveBtn} onClick={handleSave}>{t.eventPopup.saveButton}</button>
                {initialEvent && onDeleteEvent && (
                    <button type="button" className={styles.deleteBtn} onClick={onDeleteEvent}>{t.eventPopup.deleteButton}</button>
                )}
                <button type="button" className={styles.cancelBtn} onClick={() => onNewEvent(null)}>{t.eventPopup.cancelButton}</button>
            </div>
        </dialog>
    );
};

export default EventPopup;