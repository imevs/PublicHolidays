import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '../hooks/useCalendar';

describe('useCalendar', () => {
  it('returns current date and selected countries', () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.currentDate).toBeInstanceOf(Date);
    expect(Array.isArray(result.current.selectedCountries)).toBe(true);
    expect(result.current.selectedCountries.length).toBeGreaterThan(0);
  });

  it('updates year when handleYearChange is called', () => {
    const { result } = renderHook(() => useCalendar());
    act(() => {
      result.current.handleYearChange(2024);
    });
    expect(result.current.selectedYear).toBe(2024);
  });

  it('toggles countries using toggleCountry', () => {
    const { result } = renderHook(() => useCalendar());
    act(() => {
      result.current.toggleCountry('DE');
    });
    expect(result.current.selectedCountries).toContain('DE');
    act(() => {
      result.current.toggleCountry('DE');
    });
    expect(result.current.selectedCountries).not.toContain('DE');
  });

  it('navigates months using navigateMonth', () => {
    const { result } = renderHook(() => useCalendar());
    const initialMonth = result.current.currentDate.getMonth();
    act(() => {
      result.current.navigateMonth(1);
    });
    expect(result.current.currentDate.getMonth()).toBe((initialMonth + 1) % 12);
  });

  it('calendarDays returns 42 days', () => {
    const { result } = renderHook(() => useCalendar());
    expect(Array.isArray(result.current.calendarDays)).toBe(true);
    expect(result.current.calendarDays).toHaveLength(42);
  });
});
