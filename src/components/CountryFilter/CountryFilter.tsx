import React from 'react';
import { CountryCode } from '../../types';
import { allHolidays as holidaysData } from '../../data/holidays/index';
import styles from './CountryFilter.module.css';
import countryColors from '../shared/countryColors.module.css';

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
        {(Object.entries(holidaysData) as [CountryCode, typeof holidaysData[keyof typeof holidaysData]][]).map(([code, data]) => {
          const isActive = selectedCountries.includes(code);
          const colorClass = isActive ? countryColors[`country-${code}`] : '';
          const activeClass = isActive ? styles.active : '';
          return (
            <div
              key={code}
              className={`${styles.countryChip} ${activeClass} ${colorClass}`}
              onClick={() => onToggleCountry(code)}
            >
              {data.countryName}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CountryFilter;
