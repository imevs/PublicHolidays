import React from "react";
import styles from "./MonthNavigation.module.css";
import type { UTCDate } from "../../utils/UTCDate.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";

interface MonthNavigationProps {
    currentDate: UTCDate;
    onNavigateYear: () => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
    currentDate,
    onNavigateYear
}) => {
    const { t, getMonthName } = useTranslation();

    return (
        <div className={styles.monthNavigation}>
            <h2
                title={t.monthNavigation.clickToSeeWholeYear}
                className={styles.monthTitle}
                role="button"
                tabIndex={0}
                onClick={onNavigateYear}
                onKeyDown={(e) => handleKeyboardActivation(e, onNavigateYear)}
            >
                {`${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`}
            </h2>
        </div>
    );
};

export default MonthNavigation;
