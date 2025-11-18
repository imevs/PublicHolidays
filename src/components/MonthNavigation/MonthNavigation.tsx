import React from "react";
import { monthNames } from "../../utils/dateUtils";
import styles from "./MonthNavigation.module.css";
import type { UTCDate } from "../../utils/UTCDate";

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
                onClick={onNavigateYear}
            >
                {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h2>
        </div>
    );
};

export default MonthNavigation;
