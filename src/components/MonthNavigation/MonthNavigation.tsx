import React from "react";
import { monthNames } from "../../utils/dateUtils.ts";
import styles from "./MonthNavigation.module.css";
import type { UTCDate } from "../../utils/UTCDate.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";

interface MonthNavigationProps {
    currentDate: UTCDate;
    onNavigateYear: () => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
    currentDate,
    onNavigateYear
}) => {
    return (
        <div className={styles.monthNavigation}>
            <h2
                title="Click to see whole year"
                className={styles.monthTitle}
                role="button"
                tabIndex={0}
                onClick={onNavigateYear}
                onKeyDown={(e) => handleKeyboardActivation(e, onNavigateYear)}
            >
                {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h2>
        </div>
    );
};

export default MonthNavigation;
