import { useTranslation } from "../../i18n/useTranslation.ts";
import styles from "./CalendarGrid.module.css";
import { CalendarDay as CalendarDayType, OtherEvent } from "../../types/index.ts";
import { UTCDate } from "../../utils/UTCDate.ts";
import { Description } from "../../data/holidays_descriptions/all.ts";
import CalendarDay from "../CalendarDay/CalendarDay.tsx";
import MonthNavigation from "../MonthNavigation/MonthNavigation.tsx";
import { usePrevious } from "./UsePrevious.tsx";
import { useIsBookTheme } from "./useIsBookTheme.ts";

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

    const isBookTheme = useIsBookTheme();
    const prevDays = usePrevious(selectedDays);
    const prevDate = usePrevious(currentDate);
    const isAnimating = Boolean(isBookTheme && prevDate && shouldAnimate && prevDate.valueOf() !== currentDate.valueOf());
    const isForward = Boolean(prevDate && prevDate.valueOf() < currentDate.valueOf());
    const overlayClasses = `${styles.flipOverlay} ${
        isForward ? styles.animateHidingForward : styles.animateHidingBackward
    }`;
    const activeClasses = `${styles.calendarGrid}${
        isAnimating
            ? ` ${isForward ? styles.animateShowingForward : styles.animateShowingBackward}`
            : ""
    }`;

    const renderMonthGridContent = (days: CalendarDayType[], isSnapshot: boolean) => (
        <>
            <DaysOfWeeks />

            {days.map((day, index) => (
                <CalendarDay
                    key={day.date + "" + index}
                    day={day}
                    setDateForPopup={setDateForPopup}
                    onSelectEvent={onSelectEvent}
                    isSelected={isSnapshot ? false : dateForPopup === day.date}
                    isEditable={isSnapshot ? false : isEditable}
                    countryData={countryData}
                    highlightLongHolidays={highlightLongHolidays}
                />
            ))}
        </>
    );

    if (!isBookTheme) {
        return <>
            <MonthNavigation
                currentDate={currentDate}
                onNavigateYear={() => onModeChange("year", 1)}
            />

            <div className={styles.calendarGrid}>
                {renderMonthGridContent(selectedDays, false)}
            </div>
        </>;
    }

    return <>
        <MonthNavigation
            currentDate={currentDate}
            onNavigateYear={() => onModeChange("year", 1)}
        />

        <div className={styles.flipStage}>
            {isAnimating && prevDays && (
                <div key={currentDate.valueOf()} aria-hidden="true" className={overlayClasses}>
                    <div className={`${styles.calendarGrid} ${styles.flipStationaryHalf}`}>
                        {renderMonthGridContent(prevDays, true)}
                    </div>
                    <div className={styles.flipCastShadow} />
                    <div className={styles.flipLeaf}>
                        <div className={`${styles.calendarGrid} ${styles.flipLeafFront}`}>
                            {renderMonthGridContent(prevDays, true)}
                        </div>
                        <div className={`${styles.calendarGrid} ${styles.flipLeafBack}`}>
                            {renderMonthGridContent(selectedDays, true)}
                        </div>
                    </div>
                </div>
            )}

            <div key={`active-${currentDate.valueOf()}`} className={activeClasses}>
                {renderMonthGridContent(selectedDays, false)}
            </div>
        </div>
    </>;
};
