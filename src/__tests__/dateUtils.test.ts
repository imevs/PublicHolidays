import { formatDateString } from '../utils/dateUtils';

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2025, 7, 10); // August 10, 2025
    expect(formatDateString(date)).toBe('2025-08-10');
  });
});
