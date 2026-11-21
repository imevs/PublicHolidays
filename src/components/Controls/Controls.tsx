import React from "react";
import { generateYears, getMonthName } from "../../utils/dateUtils.ts";
import styles from "./Controls.module.css";
import { UTCDate } from "../../utils/UTCDate.ts";

interface ControlsProps {
    selectedDate: UTCDate;
    onDateChange: (date: UTCDate) => void;
    extraControls?: React.ReactElement;
    onNavigateMonth: (direction: number) => void;
}

const Controls: React.FC<ControlsProps> = (props) => {
    const {
        selectedDate,
        onDateChange,
        onNavigateMonth,
    } = props;
    const selectedYear = selectedDate.getFullYear();
    const years = generateYears(selectedYear);
    const selectedMonth = selectedDate.getMonth();
    const months = Array.from({ length: 12 }, (_, i) => i); // Generate an array of months (0-11)

    return (
        <div className={styles.controls}>
            <div className={styles.controlsGrid}>
                {/* Year Selection */}
                <div className={styles.controlGroup}>
                    <label htmlFor="select-year" className={styles.controlGroupLabel}>Select Year</label>
                    <div className={styles.controlGroupItem}>
                        <button
                            type="button"
                            className={styles.navButton}
                            aria-label="Previous year"
                            onClick={() => onNavigateMonth(selectedDate.getMonth() - 12)}
                        >
                            ←<span className={styles.navButtonText}> Previous</span>
                        </button>
                        <select
                            id="select-year"
                            className={styles.select}
                            value={selectedYear}
                            onChange={(e) => {
                                const newYear = parseInt(e.target.value);
                                const updatedDate = new UTCDate(selectedDate);
                                updatedDate.setDate(1);
                                updatedDate.setFullYear(newYear);
                                onDateChange(updatedDate);
                            }}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className={styles.navButton}
                            aria-label="Next year"
                            onClick={() => onNavigateMonth(selectedDate.getMonth() + 12)}
                        >
                            <span className={styles.navButtonText}>Next </span>→
                        </button>
                    </div>
                </div>

                {/* Month Selection */}
                <div className={styles.controlGroup}>
                    <label htmlFor="select-month" className={styles.controlGroupLabel}>Select Month</label>
                    <div className={styles.controlGroupItem}>
                        <button
                            type="button"
                            className={styles.navButton}
                            aria-label="Previous month"
                            onClick={() => onNavigateMonth(selectedDate.getMonth() - 1)}
                        >
                            ←<span className={styles.navButtonText}> Previous</span>
                        </button>

                        <select
                            id="select-month"
                            className={styles.select}
                            value={selectedMonth}
                            onChange={(e) => {
                                const newMonth = parseInt(e.target.value);
                                const updatedDate = new UTCDate(selectedDate);
                                updatedDate.setDate(1);
                                updatedDate.setMonth(newMonth);
                                onDateChange(updatedDate);
                            }}
                        >
                            {months.map(month => (
                                <option key={month} value={month}>
                                    {getMonthName(month)}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className={styles.navButton}
                            aria-label="Next month"
                            onClick={() => onNavigateMonth(selectedDate.getMonth() + 1)}
                        >
                            <span className={styles.navButtonText}>Next </span>→
                        </button>
                    </div>
                </div>

                {props.extraControls}
            </div>
        </div>
    );
};

export default Controls;
