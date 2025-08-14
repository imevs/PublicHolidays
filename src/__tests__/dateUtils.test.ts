// ...existing code...

import {
  monthNames,
  dayNames,
  generateYears,
  formatDateString,
  isSameDate,
} from '../utils/dateUtils';

describe('dateUtils', () => {
  it('monthNames contains 12 months', () => {
    expect(monthNames).toHaveLength(12);
    expect(monthNames[0]).toBe('January');
    expect(monthNames[11]).toBe('December');
  });

  it('dayNames contains 7 days', () => {
    expect(dayNames).toHaveLength(7);
    expect(dayNames[6]).toBe('Sun');
    expect(dayNames[5]).toBe('Sat');
  });

  it('generateYears returns 3 years including current', () => {
    const years = generateYears();
    const currentYear = new Date().getFullYear();
    expect(years).toEqual([currentYear - 1, currentYear, currentYear + 1]);
  });

  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(Date.UTC(2025, 7, 10)); // August 10, 2025
    expect(formatDateString(date)).toBe('2025-08-10');
  });

  it('isSameDate returns true for same date', () => {
    const d1 = new Date(2025, 7, 10);
    const d2 = new Date(2025, 7, 10);
    expect(isSameDate(d1, d2)).toBe(true);
  });

  it('isSameDate returns false for different dates', () => {
    const d1 = new Date(2025, 7, 10);
    const d2 = new Date(2025, 7, 11);
    expect(isSameDate(d1, d2)).toBe(false);
  });
});
