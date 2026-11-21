import React from "react";
import { CalendarDay as CalendarDayType, type OtherEvent } from "../../types/index.ts";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import styles from "./CalendarDay.module.css";
import { getLink } from "../../data/holidays_descriptions/getLink.ts";
import { UTCDate } from "../../utils/UTCDate.ts";
import type { Description } from "../../data/holidays_descriptions/all.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import { getLocalizedHolidayName } from "../../i18n/holidayNames.ts";
import { getLongHolidayStyle, getLongHolidayTooltip } from "../../utils/longHolidayColors.ts";

interface CalendarDayProps {
    day: CalendarDayType;
    isSelected?: boolean;
    isEditable: boolean;
    countryData: Record<string, Description>;
    setDateForPopup(date: UTCDate): void;
    onSelectEvent?: (date: UTCDate, event: OtherEvent) => void;
    highlightLongHolidays?: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
    day,
    setDateForPopup,
    onSelectEvent,
    isSelected,
    isEditable,
    countryData,
    highlightLongHolidays,
}) => {
    const { getCountryName, language, t, format } = useTranslation();
    const hasRangeEvent = day.isCurrentMonth && day.events.some((e) => e.kind === "other" && e.isRange);
    const dayClasses = [
        styles.calendarDay,
        !day.isCurrentMonth && styles.otherMonth,
        day.isToday && styles.today,
        isSelected ? styles.selectedDate : "",
        isEditable ? styles.isClickable : "",
        day.isWeekend ? styles.holiday : "",
        hasRangeEvent && styles.hasRangeEvent,
        highlightLongHolidays && day.isLongHoliday && styles.longHoliday,
    ].filter(Boolean).join(" ");

    const monthNumber = day.date.getMonth() + 1; // 1-12
    const longHolidayTitle = highlightLongHolidays && day.isLongHoliday ? getLongHolidayTooltip(day.longHolidayDetails, getCountryName, format, t.calendarGrid.longHolidayTooltip, t.calendarGrid.longHolidayTooltipCustom) : undefined;

    return (
        <div
            key={day.date.toDateString()}
            className={dayClasses}
            data-month={monthNumber}
            title={longHolidayTitle}
            style={highlightLongHolidays && day.isLongHoliday ? getLongHolidayStyle(day.longHolidayColors, false) : undefined}
            role={isEditable ? "button" : undefined}
            tabIndex={isEditable ? 0 : undefined}
            onClick={() => setDateForPopup(day.date)}
            onKeyDown={isEditable ? (e) => handleKeyboardActivation(e, () => setDateForPopup(day.date), { selfOnly: true }) : undefined}
        >
            <div className={styles.dayNumber}>{day.dayNumber}</div>
            {day.isCurrentMonth && day.events.map((holiday, idx) => holiday.kind === "publicHoliday" ? (
                <a
                    key={idx}
                    href={getLink(holiday.date, holiday.country, holiday.name, countryData)}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <div className={styles.event} title={`${holiday.localName}`}>
                        {getFlagEmoji(holiday.countryCode)} {getCountryName(holiday.countryCode, holiday.country)}: {getLocalizedHolidayName(holiday.name, holiday.countryCode, language)}
                    </div>
                </a>
            ) : (
                (() => {
                    const rangePosClass = holiday.isRange
                        ? holiday.rangePosition === "start" ? styles.rangeStart
                            : holiday.rangePosition === "end" ? styles.rangeEnd
                                : holiday.rangePosition === "middle" ? styles.rangeMiddle
                                    : styles.rangeSingle
                        : "";
                    const eventClass = [styles.event, holiday.isRange ? styles.rangeEvent : "", rangePosClass].filter(Boolean).join(" ");
                    return (
                        <div
                            key={idx}
                            className={eventClass}
                            title={`${holiday.localName}`}
                            role={isEditable && onSelectEvent ? "button" : undefined}
                            tabIndex={isEditable && onSelectEvent ? 0 : undefined}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isEditable && onSelectEvent) {
                                    onSelectEvent(day.date, holiday);
                                }
                            }}
                            onKeyDown={isEditable && onSelectEvent
                                ? (e) => handleKeyboardActivation(e, () => onSelectEvent(day.date, holiday), { stopPropagation: true })
                                : undefined}
                        >
                            {holiday.icon} {holiday.name}
                        </div>
                    );
                })()
            ))}
        </div>
    );
};

export default CalendarDay;
