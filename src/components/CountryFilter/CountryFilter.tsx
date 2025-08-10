import React from 'react';
import { CountryCode } from '../../types';
import { holidaysData } from '../../data/holidays';
import styles from './CountryFilter.module.css';

interface CountryFilterProps {
  selectedCountries: CountryCode[];
  onToggleCountry: (countryCode: CountryCode) => void;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
  selectedCountries,
  onToggleCountry
}) => {
  return (
    <div className={styles.controlGroup}>
      <label>Select Countries</label>
      <div className={styles.countryFilter}>
        {(Object.entries(holidaysData) as [CountryCode, typeof holidaysData[CountryCode]][]).map(([code, data]) => (
          <div
            key={code}
            className={`${styles.countryChip} ${selectedCountries.includes(code) ? styles.active : ''}`}
            onClick={() => onToggleCountry(code)}
          >
            {data.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountryFilter;
