import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarDay from '../components/CalendarDay/CalendarDay';

describe('CalendarDay', () => {
  it('renders the day number', () => {
    const day = {
      dayNumber: 10,
      isCurrentMonth: true,
      isToday: false,
      holidays: [],
      date: new Date(2025, 7, 10),
    };
    render(<CalendarDay day={day} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
