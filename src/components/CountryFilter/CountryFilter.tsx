import React, { useEffect, useState, useRef, useCallback } from "react";
import { countryOffsets, getLocalTime } from "../../utils/timeZones.ts";
import styles from "./CountryFilter.module.css";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import { type CountryCode, CountryName, countryNames } from "../../data/countryNames.ts";
import { hasSchoolHolidayData } from "../../data/schoolHolidayCountries.ts";
import { handleKeyboardActivation } from "../../utils/a11y.ts";
import { CONTINENTS, ContinentId, ContinentMeta, loadContinent } from "./continents/index.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";

export interface CountryFilterProps {
    selectedCountries: CountryCode[];
    onToggleCountry: (countryCode: CountryCode) => void;
    showAllCountries: boolean;
    setShowAllCountries: (showAllCountries: boolean) => void;
    highlightLongHolidays?: boolean;
    setHighlightLongHolidays?: (highlight: boolean) => void;
    showSchoolHolidays?: boolean;
    setShowSchoolHolidays?: (show: boolean) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
    selectedCountries,
    showAllCountries,
    onToggleCountry,
    setShowAllCountries,
    highlightLongHolidays,
    setHighlightLongHolidays,
    showSchoolHolidays,
    setShowSchoolHolidays,
}) => {
    const { t, getCountryName, getContinentName } = useTranslation();
    const [showTimezones, setShowTimezones] = useState(false);
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

    return (
        <div className={styles.controlGroup}>
            <label className={styles.controlGroupLabel}>{t.countryFilter.selectCountries}</label>
            <div className={styles.checkboxContainer}>
                {setShowSchoolHolidays && (
                    <>
                        <input
                            type="checkbox"
                            id="showSchoolHolidays"
                            className={styles.checkbox}
                            checked={Boolean(showSchoolHolidays)}
                            onChange={() => setShowSchoolHolidays(!showSchoolHolidays)}
                        />
                        <label htmlFor="showSchoolHolidays" className={styles.checkboxLabel}>
                            {t.countryFilter.showSchoolHolidays}
                        </label>
                    </>
                )}
                {setHighlightLongHolidays && (
                    <>
                        <input
                            type="checkbox"
                            id="highlightLongHolidays"
                            className={styles.checkbox}
                            checked={Boolean(highlightLongHolidays)}
                            onChange={() => setHighlightLongHolidays(!highlightLongHolidays)}
                        />
                        <label htmlFor="highlightLongHolidays" className={styles.checkboxLabel}>
                            {t.countryFilter.highlightLongHolidays}
                        </label>
                    </>
                )}
                <input
                    type="checkbox"
                    id="showTimezones"
                    className={styles.checkbox}
                    checked={showTimezones}
                    onChange={() => setShowTimezones(!showTimezones)}
                />
                <label htmlFor="showTimezones" className={styles.checkboxLabel}>
                    {showAllCountries ? t.countryFilter.showTimezones : t.countryFilter.showLocalTime}
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
                                const noSchoolData = Boolean(showSchoolHolidays) && !hasSchoolHolidayData(code);
                                const isDisabled = noSchoolData && !isSelected;
                                return (
                                    <div
                                        key={code}
                                        role="button"
                                        tabIndex={isDisabled ? -1 : 0}
                                        aria-pressed={isSelected}
                                        aria-disabled={isDisabled || undefined}
                                        className={`${styles.countryChip} ${isSelected ? styles.active : ""} ${noSchoolData ? styles.disabled : ""}`}
                                        onClick={isDisabled ? undefined : () => onToggleCountry(code)}
                                        onKeyDown={isDisabled ? undefined : (e) => handleKeyboardActivation(e, () => onToggleCountry(code))}
                                        title={noSchoolData ? t.countryFilter.noSchoolHolidayData : `${t.countryFilter.currentTimePrefix} ${getLocalTime(code)}`}
                                    >
                                        {getFlagEmoji(code)} {getCountryName(code, countryName)}
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
                            const isContinentDisabled = Boolean(showSchoolHolidays) && !cont.countries.some(hasSchoolHolidayData);
                            return (
                                <div
                                    key={cont.id}
                                    role="button"
                                    tabIndex={isContinentDisabled ? -1 : 0}
                                    aria-expanded={false}
                                    aria-disabled={isContinentDisabled || undefined}
                                    className={`${styles.continentTag} ${isContinentDisabled ? styles.disabled : ""}`}
                                    onClick={isContinentDisabled ? undefined : () => setActiveContinent(cont.id)}
                                    onKeyDown={isContinentDisabled ? undefined : (e) => handleKeyboardActivation(e, () => setActiveContinent(cont.id))}
                                    title={isContinentDisabled ? t.countryFilter.noSchoolHolidayData : undefined}
                                >
                                    {cont.emoji} {getContinentName(cont.id)}
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
                        .map(([code, countryName]) => {
                            const noSchoolData = Boolean(showSchoolHolidays) && !hasSchoolHolidayData(code);
                            return (
                                <div
                                    key={code}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={true}
                                    className={`${styles.countryChip} ${styles.active} ${noSchoolData ? styles.disabled : ""}`}
                                    onClick={() => onToggleCountry(code)}
                                    onKeyDown={(e) => handleKeyboardActivation(e, () => onToggleCountry(code))}
                                    title={noSchoolData ? t.countryFilter.noSchoolHolidayData : `${t.countryFilter.currentTimePrefix} ${getLocalTime(code)}`}
                                >
                                    {getFlagEmoji(code)} {getCountryName(code, countryName)}
                                    {showTimezones && (
                                        <span className={styles.offset}>
                                            {" - " + getLocalTime(code)}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                )}
                <div
                    role="button"
                    tabIndex={0}
                    className={`${styles.toggleFilter}`}
                    onClick={() => setShowAllCountries(!showAllCountries)}
                    onKeyDown={(e) => handleKeyboardActivation(e, () => setShowAllCountries(!showAllCountries))}
                >
                    {showAllCountries ? t.countryFilter.hideInactive : t.countryFilter.showAll}
                </div>
            </div>
        </div>
    );
};

export default CountryFilter;
