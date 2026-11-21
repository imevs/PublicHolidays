import React, { useEffect, useState, useRef, useCallback } from "react";
import { countryOffsets, getLocalTime } from "../../utils/timeZones.ts";
import styles from "./CountryFilter.module.css";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { type CountryCode, CountryName, countryNames } from "../../data/countryNames.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";
import { CONTINENTS, ContinentId, ContinentMeta, loadContinent } from "./continents/index.ts";

export interface CountryFilterProps {
    selectedCountries: CountryCode[];
    onToggleCountry: (countryCode: CountryCode) => void;
    showAllCountries: boolean;
    setShowAllCountries: (showAllCountries: boolean) => void;
    setShowAllHolidays: (showAllHolidays: boolean) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
    selectedCountries,
    showAllCountries,
    onToggleCountry,
    setShowAllCountries,
    setShowAllHolidays,
}) => {
    const [showTimezones, setShowTimezones] = useState(false);
    const [showExtraHolidaysOnly, setShowExtraHolidaysOnly] = useState(false);
    const [activeContinent, setActiveContinent] = useState<ContinentId>("europe");
    const [continentDataCache, setContinentDataCache] = useState<Partial<Record<ContinentId, ContinentMeta>>>({});
    const [activeContinentMeta, setActiveContinentMeta] = useState<ContinentMeta | null>(null);

    const loadingRef = useRef<Record<string, boolean>>({});

    const fetchContinent = useCallback(async (id: ContinentId) => {
        if (continentDataCache[id]) {
            setActiveContinentMeta(continentDataCache[id]!);
            return;
        }
        if (loadingRef.current[id]) return;
        loadingRef.current[id] = true;
        try {
            const meta = await loadContinent(id);
            setContinentDataCache((prev) => ({ ...prev, [id]: meta }));
            setActiveContinentMeta(meta);
        } finally {
            loadingRef.current[id] = false;
        }
    }, [continentDataCache]);

    useEffect(() => {
        fetchContinent(activeContinent);
    }, [activeContinent, fetchContinent]);

    useEffect(() => {
        if (selectedCountries.length === 0) {
            setShowAllCountries(true);
        }
    }, [setShowAllCountries, selectedCountries]);

    useEffect(() => {
        setShowAllHolidays(!showExtraHolidaysOnly);
    }, [showExtraHolidaysOnly, setShowAllHolidays]);

    return (
        <div className={styles.controlGroup}>
            <label className={styles.controlGroupLabel}>Select Countries</label>
            <div className={styles.checkboxContainer}>
                <input
                    type="checkbox"
                    id="showExtraHolidaysOnly"
                    className={styles.checkbox}
                    checked={showExtraHolidaysOnly}
                    onChange={() => setShowExtraHolidaysOnly(!showExtraHolidaysOnly)}
                />
                <label htmlFor="showExtraHolidaysOnly" className={styles.checkboxLabel}>
                    Show only extra holidays
                </label>
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
                {showAllCountries ? (
                    <>
                        <div key={activeContinent} className={styles.continentChipContainer}>
                            {activeContinentMeta?.countries.map((code) => {
                                const countryName = countryNames[code];
                                if (!countryName) return null;
                                const isSelected = selectedCountries.includes(code);
                                return (
                                    <div
                                        key={code}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={isSelected}
                                        className={`${styles.countryChip} ${isSelected ? styles.active : ""}`}
                                        onClick={() => onToggleCountry(code)}
                                        onKeyDown={(e) => handleKeyboardActivation(e, () => onToggleCountry(code))}
                                        title={"Current time: " + getLocalTime(code)}
                                    >
                                        {getFlagEmoji(code)} {countryName}
                                        {showTimezones && (
                                            <span className={styles.offset}>
                                                {countryOffsets[code] ? ` (UTC${countryOffsets[code]})` : ""}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {CONTINENTS.map((cont) => {
                            if (cont.id === activeContinent) return null;
                            const selectedCount = cont.countries.filter((c) => selectedCountries.includes(c)).length;
                            return (
                                <div
                                    key={cont.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={false}
                                    className={styles.continentTag}
                                    onClick={() => setActiveContinent(cont.id)}
                                    onKeyDown={(e) => handleKeyboardActivation(e, () => setActiveContinent(cont.id))}
                                >
                                    {cont.emoji} {cont.name}
                                    {selectedCount > 0 && (
                                        <span className={styles.continentBadge}>{selectedCount}</span>
                                    )}
                                </div>
                            );
                        })}
                    </>
                ) : (
                    (Object.entries(countryNames) as [CountryCode, CountryName][])
                        .filter(([code]) => selectedCountries.includes(code))
                        .map(([code, countryName]) => (
                            <div
                                key={code}
                                role="button"
                                tabIndex={0}
                                aria-pressed={true}
                                className={`${styles.countryChip} ${styles.active}`}
                                onClick={() => onToggleCountry(code)}
                                onKeyDown={(e) => handleKeyboardActivation(e, () => onToggleCountry(code))}
                                title={"Current time: " + getLocalTime(code)}
                            >
                                {getFlagEmoji(code)} {countryName}
                                {showTimezones && (
                                    <span className={styles.offset}>
                                        {" - " + getLocalTime(code)}
                                    </span>
                                )}
                            </div>
                        ))
                )}
                <div
                    role="button"
                    tabIndex={0}
                    className={`${styles.toggleFilter}`}
                    onClick={() => setShowAllCountries(!showAllCountries)}
                    onKeyDown={(e) => handleKeyboardActivation(e, () => setShowAllCountries(!showAllCountries))}
                >
                    {showAllCountries ? "Hide inactive" : "Show all"}
                </div>
            </div>
        </div>
    );
};

export default CountryFilter;
