import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./EventPopup.module.css";
import type { OtherEvent } from "../../types";
import type { DateString, DateTwoParts } from "../../utils/UTCDate";

interface EventPopupProps {
    initialDate: DateString;
    onNewEvent: (date: OtherEvent | null) => void;
}

function clearFromEmoji(s: string): string {
    return s.replace(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s/u, "");
}

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

    const handleSave = () => {
        onNewEvent({
            date: oneTime ? initialDate : initialDate.substring(5) as DateTwoParts,
            name: clearFromEmoji(name),
            icon: icon,
            localName: "",
            kind: "other",
        });
    };

    const onIconClick = useCallback((e: React.MouseEvent<Element>) => {
        const el = e.target as Element;
        if (el.tagName === "SPAN") {
            setIcon(el.innerHTML);
            setName((origin) => {
                return el.innerHTML + " " + clearFromEmoji(origin);
            });
            nameRef.current?.focus();
        }
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
        if (e.key === "Enter" && name.trim()) {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            onNewEvent(null);
        }
    }, [handleSave, name]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
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
                        onKeyDown={handleKeyDown}
                        id="eventName"
                        ref={nameRef}
                        value={name}
                        required
                        type="text"
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div
                    className={styles["emoji-popup"]}
                    style={{ display: "block" }}
                    onClick={onIconClick}
                >
                    <span>🎂</span><span>💍</span><span>👸</span><span>👴🏼</span><span>👵</span>
                    <span>😀</span><span>😁</span><span>😂</span><span>🤣</span><span>😊</span>
                    <span>😍</span><span>😎</span><span>😏</span><span>🤔</span><span>😴</span>
                    <span>😡</span><span>😭</span><span>🤯</span><span>🤩</span><span>😇</span>
                    <span>🥰</span><span>😤</span><span>😈</span><span>👻</span><span>🔥</span>
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
    );
};

export default EventPopup;