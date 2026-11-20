import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./EventPopup.module.css";
import type { OtherEvent } from "../../types/index.ts";
import type { DateString, DateTwoParts } from "../../utils/UTCDate.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";

interface EventPopupProps {
    initialDate: DateString;
    onNewEvent: (date: OtherEvent | null) => void;
}

const LEADING_EMOJI_REGEX = /^(?:(?:\p{Regional_Indicator}{2}|(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\p{Emoji_Modifier}?)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\p{Emoji_Modifier}?)*)\s*/u;

function clearFromEmoji(s: string): string {
    return s.replace(LEADING_EMOJI_REGEX, "");
}
const icons = [
    "🎈", "🎁", "🎂", "💍", "👸", "👴🏼", "👵", "😀", "😁", "😂",
    "🤣", "😊", "😍", "😎", "😏", "🤔", "😴", "😡", "😭", "🤯",
    "🤩", "😇", "🥰", "😤", "😈", "👻", "🔥"
];

const Emoji = () => icons.map((s, i) => <span key={i} role="button" tabIndex={0}>{s}</span>);

const EventPopup: React.FC<EventPopupProps> = ({ initialDate, onNewEvent }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const nameRef = useRef<HTMLInputElement | null>(null);
    const [name, setName] = useState("");
    const [oneTime, setOneTime] = useState(false);
    const [icon, setIcon] = useState("🎂");

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onNewEvent(null);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [onNewEvent]);

    const handleSave = useCallback(() => {
        onNewEvent({
            date: oneTime ? initialDate : initialDate.substring(5) as DateTwoParts,
            name: clearFromEmoji(name),
            icon: icon,
            localName: "",
            kind: "other",
        });
    }, [onNewEvent, oneTime, initialDate, name, icon]);

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
        <>
            <div className={styles.shadow} />
            <div
                ref={ref}
                className={styles.popup}
                onClick={(e) => { e.stopPropagation(); }}
                role="dialog"
                aria-modal="true"
            >
                <p><b>Add new event for {initialDate}</b></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className={styles.nameContainer}>
                        <label htmlFor="eventName">Name</label>
                        <input
                            id="eventName"
                            ref={nameRef}
                            value={name}
                            required
                            type="text"
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className={styles["emoji-popup"]} onClick={onIconClick} onKeyDown={onIconKeyDown}>
                        <Emoji />
                    </div>

                    <input
                        type="checkbox"
                        id="oneTime"
                        className={styles.checkbox}
                        checked={oneTime}
                        onChange={(e) => setOneTime(e.target.checked)}
                    />
                    <label htmlFor="oneTime" className={styles.checkboxLabel}>One-time</label>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={handleSave}>Save (Enter)</button>
                        <button type="button" onClick={() => onNewEvent(null)}>Cancel (Esc)</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EventPopup;