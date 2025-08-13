import React, { useState } from 'react';
import { CountryCode } from '../../types';
import { allHolidays as holidaysData } from '../../data/holidays/index';
import { countryOffsets } from '../../utils/timeZones';
import styles from './CountryFilter.module.css';

interface CountryFilterProps {
    selectedCountries: CountryCode[];
    onToggleCountry: (countryCode: CountryCode) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
                                                         selectedCountries,
                                                         onToggleCountry
                                                     }) => {
    const [showTimezones, setShowTimezones] = useState(false); // State to toggle timezone visibility
    return (
        <div className={styles.controlGroup}>
            <label>Select Countries</label>
            <div className={styles.countryFilter}>
                {(Object.entries(holidaysData) as [CountryCode, typeof holidaysData[keyof typeof holidaysData]][]).map(([code, data]) => (
                    <div
                        key={code}
                        className={`${styles.countryChip} ${selectedCountries.includes(code) ? styles.active : ''}`}
                        onClick={() => onToggleCountry(code)}
                    >
                        {data.countryName}
                        {showTimezones && (
                            <span className={styles.offset}>
                                {countryOffsets[code] ? ` (UTC${countryOffsets[code]})` : ''}
                            </span>
                        )}
                    </div>
                ))}
            </div>
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
        </div>
    );
};

export default CountryFilter;
