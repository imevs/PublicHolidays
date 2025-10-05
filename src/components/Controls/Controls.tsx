import React from "react";
import CountryFilter, { type CountryFilterProps } from "../CountryFilter/CountryFilter";
import { generateYears, getMonthName } from "../../utils/dateUtils";
import styles from "./Controls.module.css";
import { UTCDate } from "../../utils/UTCDate";

interface ControlsProps extends CountryFilterProps {
    selectedDate: UTCDate;
    onDateChange: (date: UTCDate) => void;
}

const Controls: React.FC<ControlsProps> = (props) => {
    const {
        selectedDate,
        onDateChange,
    } = props;
    const years = generateYears();
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const months = Array.from({ length: 12 }, (_, i) => i); // Generate an array of months (0-11)

    return (
        <div className={styles.controls}>
            <div className={styles.controlsGrid}>
                {/* Year Selection */}
                <div className={styles.controlGroup}>
                    <label className={styles.controlGroupLabel}>Select Year</label>
                    <select
                        className={styles.select}
                        value={selectedYear}
                        onChange={(e) => {
                            const newYear = parseInt(e.target.value);
                            const updatedDate = new UTCDate(selectedDate);
                            updatedDate.setFullYear(newYear);
                            onDateChange(updatedDate);
                        }}
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Month Selection */}
                <div className={styles.controlGroup}>
                    <label className={styles.controlGroupLabel}>Select Month</label>
                    <select
                        className={styles.select}
                        value={selectedMonth}
                        onChange={(e) => {
                            const newMonth = parseInt(e.target.value);
                            const updatedDate = new UTCDate(selectedDate);
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
                </div>

                <CountryFilter {...props} />
            </div>
        </div>
    );
};

export default Controls;
