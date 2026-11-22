import { useTranslation } from "../../i18n/useTranslation.ts";
import styles from "./CalendarGrid.module.css";
import { CalendarDay as CalendarDayType, OtherEvent } from "../../types/index.ts";
import { UTCDate } from "../../utils/UTCDate.ts";
import { Description } from "../../data/holidays_descriptions/all.ts";
import CalendarDay from "../CalendarDay/CalendarDay.tsx";
import MonthNavigation from "../MonthNavigation/MonthNavigation.tsx";
import { usePrevious } from "./UsePrevious.tsx";

export type MonthViewProps = {
    shouldAnimate?: boolean;
    dateForPopup: UTCDate | null;
    isEditable: boolean;
    setDateForPopup: (date: UTCDate) => void;
    onSelectEvent?: (date: UTCDate, event: OtherEvent) => void;
    selectedDays: CalendarDayType[];
    currentDate: UTCDate;
    countryData: Record<string, Description>;
    onModeChange: (mode: "month" | "year", month: number) => void;
    highlightLongHolidays?: boolean;
};

export const DaysOfWeeks = () => {
    const { t } = useTranslation();
    return t.dates.weekdaysShort.map((day, index) => (
        <div
            key={`${day}-${index}`}
            className={`${styles.calendarHeader} ${index === 5 || index === 6 ? styles.weekend : ""}`}
        >
            {day}
        </div>
    ));
};

export const MonthView = (props: MonthViewProps) => {
    const {
        shouldAnimate,
        selectedDays,
        onModeChange,
        currentDate,
        dateForPopup,
        setDateForPopup,
        onSelectEvent,
        isEditable,
        countryData,
        highlightLongHolidays,
    } = props;

    const prevDays = usePrevious(selectedDays);
    const prevDate = usePrevious(currentDate);
    const classes = styles.calendarGrid + " " + (
        prevDate && shouldAnimate ? (
            prevDate.valueOf() < currentDate.valueOf()
                ? styles.animateHidingForward
                : styles.animateHidingBackward
        ) : styles.hidden
    );
    return <>
        <MonthNavigation
            currentDate={currentDate}
            onNavigateYear={() => onModeChange("year", 1)}
        />

        {prevDays && <div key={currentDate.valueOf()} className={classes}>
            <DaysOfWeeks />

            {prevDays.map((day, index) => (
                <CalendarDay
                    key={day.date + "" + index}
                    day={day}
                    setDateForPopup={setDateForPopup}
                    onSelectEvent={onSelectEvent}
                    isSelected={false}
                    isEditable={isEditable}
                    countryData={countryData}
                    highlightLongHolidays={highlightLongHolidays}
                />
            ))}
        </div>}

        <div className={styles.calendarGrid}>
            <DaysOfWeeks />

            {selectedDays.map((day, index) => (
                <CalendarDay
                    key={day.date + "" + index}
                    day={day}
                    setDateForPopup={setDateForPopup}
                    onSelectEvent={onSelectEvent}
                    isSelected={dateForPopup === day.date}
                    isEditable={isEditable}
                    countryData={countryData}
                    highlightLongHolidays={highlightLongHolidays}
                />
            ))}
        </div>
    </>;
};
