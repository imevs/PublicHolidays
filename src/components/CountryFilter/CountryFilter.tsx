import React, { useState } from 'react';
import { CountryCode } from '../../types';
import { allHolidays as holidaysData } from '../../data/holidays/index';
import { countryOffsets, countryTimeZones } from '../../utils/timeZones';
import styles from './CountryFilter.module.css';
import { getFlagEmoji } from "../../utils/countryFlags";

interface CountryFilterProps {
    selectedCountries: CountryCode[];
    onToggleCountry: (countryCode: CountryCode) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
                                                         selectedCountries,
                                                         onToggleCountry
                                                     }) => {
    const [showTimezones, setShowTimezones] = useState(false); // State to toggle timezone visibility

    // Function to get the local time for a given timezone
    const getLocalTime = (timeZone: string) => {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        return formatter.format(new Date());
    };

    return (
        <div className={styles.controlGroup}>
            <label className={styles.controlGroupLabel}>Select Countries</label>
            <div className={styles.checkboxContainer}>
                <input
                    type="checkbox"
                    id="showTimezones"
                    className={styles.checkbox}
                    checked={showTimezones}
                    onChange={() => setShowTimezones(!showTimezones)}
                />
                <label htmlFor="showTimezones" className={styles.checkboxLabel}>
                    Show Timezones
                </label>
            </div>
            <div className={styles.countryFilter}>
                {(Object.entries(holidaysData) as [CountryCode, typeof holidaysData[keyof typeof holidaysData]][]).map(([code, data]) => (
                    <div
                        key={code}
                        className={`${styles.countryChip} ${selectedCountries.includes(code) ? styles.active : ''}`}
                        onClick={() => onToggleCountry(code)}
                        title={"Local time: " + getLocalTime(countryTimeZones[code])}
                    >
                        {getFlagEmoji(code)} {data.countryName}
                        {showTimezones && (
                            <span className={styles.offset}>
                                {countryOffsets[code] ? ` (UTC${countryOffsets[code]})` : ''}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CountryFilter;
