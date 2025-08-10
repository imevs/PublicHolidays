import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '../hooks/useCalendar';

describe('useCalendar', () => {
  it('returns current date and selected countries', () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.currentDate).toBeInstanceOf(Date);
    expect(Array.isArray(result.current.selectedCountries)).toBe(true);
    expect(result.current.selectedCountries.length).toBeGreaterThan(0);
  });
});
