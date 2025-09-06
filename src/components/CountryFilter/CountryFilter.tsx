import React, { useEffect, useState } from "react";
import { CountryCode } from "../../types";
import { allHolidays as holidaysData } from "../../data/holidays/index";
import { countryOffsets, getLocalTime } from "../../utils/timeZones";
import styles from "./CountryFilter.module.css";
import { getFlagEmoji } from "../../utils/countryFlags";

export interface CountryFilterProps {
    selectedCountries: CountryCode[];
    onToggleCountry: (countryCode: CountryCode) => void;
    showAllCountries: boolean;
    setShowAllCountries: (showAllCountries: boolean) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
    selectedCountries,
    showAllCountries,
    onToggleCountry,
    setShowAllCountries,
}) => {
    const [showTimezones, setShowTimezones] = useState(false); // State to toggle timezone visibility

    useEffect(() => {
        if (selectedCountries.length === 0) {
            setShowAllCountries(true);
        }
    }, [setShowAllCountries, selectedCountries]);

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
                    {showAllCountries ? "Show timezones" : "Show local time"}
                </label>
            </div>
            <div className={styles.countryFilter}>
                {(Object.entries(holidaysData) as [CountryCode, typeof holidaysData[keyof typeof holidaysData]][])
                    .filter(([code]) => showAllCountries || selectedCountries.includes(code))
                    .map(([code, data]) => (
                        <div
                            key={code}
                            className={`${styles.countryChip} ${selectedCountries.includes(code) ? styles.active : ""}`}
                            onClick={() => onToggleCountry(code)}
                            title={"Current time: " + getLocalTime(code)}
                        >
                            {getFlagEmoji(code)} {data.countryName}
                            {showTimezones && (
                                <span className={styles.offset}>
                                    {showAllCountries ? (countryOffsets[code] ? ` (UTC${countryOffsets[code]})` : "") : " - " + getLocalTime(code)}
                                </span>
                            )}
                        </div>
                    ))}
                <div
                    className={`${styles.toggleFilter}`}
                    onClick={() => setShowAllCountries(!showAllCountries)}
                >
                    {showAllCountries ? "Hide inactive" : "Show all"}
                </div>
            </div>
        </div>
    );
};

export default CountryFilter;
