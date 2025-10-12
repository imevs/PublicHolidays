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
    const [name, setName] = useState("");
    const [oneTime, setOneTime] = useState(true);
    const [iconsVisible, setIconsVisible] = useState(false);
    const [icon, setIcon] = useState("🎉");

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
            date: oneTime ? initialDate.substring(5) as DateTwoParts : initialDate,
            name: clearFromEmoji(name),
            icon: icon,
            localName: "",
            kind: "other",
        });
    };

    const onIconClick = useCallback((e: React.MouseEvent<Element>) => {
        const el = e.target as Element;
        if (el.tagName === "SPAN") {
            setIconsVisible(false);
            setIcon(el.innerHTML);
            setName((origin) => {
                return el.innerHTML + " " + clearFromEmoji(origin);
            });
        }
    }, []);

    return (
        <div
            ref={ref}
            className={styles.popup}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
        >
            <p><b>Add new event for {initialDate}</b></p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label>
                    Name
                    <input value={name} required type="text" onChange={e => setName(e.target.value)}/>
                </label>
                <button className={styles["emoji-button"]} onClick={() => {
                    setIconsVisible(!iconsVisible);
                }}>😀 Icons</button>

                <div
                    className={styles["emoji-popup"]}
                    style={{ display: iconsVisible ? "block" : "none" }}
                    onClick={onIconClick}
                >
                    <span>😀</span><span>😁</span><span>😂</span><span>🤣</span><span>😊</span>
                    <span>😍</span><span>😎</span><span>😏</span><span>🤔</span><span>😴</span>
                    <span>😡</span><span>😭</span><span>🤯</span><span>🤩</span><span>😇</span>
                    <span>🥰</span><span>😤</span><span>😈</span><span>👻</span><span>🔥</span>
                </div>

                <label>
                    One-time
                    <input type="checkbox" checked={oneTime} onChange={e => setOneTime(e.target.checked)}/>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={handleSave}>Save</button>
                    <button type="button" onClick={() => onNewEvent(null)}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default EventPopup;