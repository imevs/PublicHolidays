import React from 'react';
import { CountryCode } from '../../types';
import CountryFilter from '../CountryFilter/CountryFilter';
import { generateYears } from '../../utils/dateUtils';
import styles from './Controls.module.css';

interface ControlsProps {
  selectedYear: number;
  selectedCountries: CountryCode[];
  onYearChange: (year: number) => void;
  onToggleCountry: (countryCode: CountryCode) => void;
}

const Controls: React.FC<ControlsProps> = ({
  selectedYear,
  selectedCountries,
  onYearChange,
  onToggleCountry
}) => {
  const years = generateYears();

  return (
    <div className={styles.controls}>
      <div className={styles.controlsGrid}>
        <div className={styles.controlGroup}>
          <label className={styles.controlGroupLabel}>Select Year</label>
          <select
            className={styles.select}
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <CountryFilter
          selectedCountries={selectedCountries}
          onToggleCountry={onToggleCountry}
        />
      </div>
    </div>
  );
};

export default Controls;
