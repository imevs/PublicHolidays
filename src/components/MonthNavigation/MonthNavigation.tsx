import React from 'react';
import { monthNames } from '../../utils/dateUtils';
import styles from './MonthNavigation.module.css';

interface MonthNavigationProps {
    currentDate: Date;
    onNavigateYear: () => void;
    onNavigateMonth: (direction: number) => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
    currentDate,
    onNavigateYear,
    onNavigateMonth
}) => {
    return (
        <div className={styles.monthNavigation}>
            <button
                className={styles.navButton}
                onClick={() => onNavigateMonth(currentDate.getMonth() - 1)}
            >
                ← Previous
            </button>

            <h2
                title="Click to see whole year"
                className={styles.monthTitle}
                onClick={onNavigateYear}
            >
                {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h2>

            <button
                className={styles.navButton}
                onClick={() => onNavigateMonth(currentDate.getMonth() + 1)}
            >
                Next →
            </button>
        </div>
    );
};

export default MonthNavigation;
