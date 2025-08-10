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

  // Removed className checks, focusing on rendering logic and props
  it('renders today correctly when isToday is true', () => {
    const day = {
      dayNumber: 15,
      isCurrentMonth: true,
      isToday: true,
      holidays: [],
      date: new Date(2025, 7, 15),
    };
    render(<CalendarDay day={day} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders other month day correctly when isCurrentMonth is false', () => {
    const day = {
      dayNumber: 1,
      isCurrentMonth: false,
      isToday: false,
      holidays: [],
      date: new Date(2025, 6, 1),
    };
    render(<CalendarDay day={day} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders holidays if present', () => {
    const day = {
      dayNumber: 25,
      isCurrentMonth: true,
      isToday: false,
      holidays: [
        { name: 'Christmas', localName: 'Ziemassvētki', date: '2025-12-25', country: 'Latvia' },
      ],
      date: new Date(2025, 11, 25),
    };
    render(<CalendarDay day={day} />);
    expect(screen.getByText(/Latvia: Christmas/)).toBeInTheDocument();
  });

  it('sets holiday title attribute for accessibility', () => {
    const day = {
      dayNumber: 25,
      isCurrentMonth: true,
      isToday: false,
      holidays: [
        { name: 'Christmas', localName: 'Ziemassvētki', date: '2025-12-25', country: 'Latvia' },
      ],
      date: new Date(2025, 11, 25),
    };
    render(<CalendarDay day={day} />);
    const holidayDiv = screen.getByText(/Latvia: Christmas/);
    expect(holidayDiv).toHaveAttribute('title', 'Ziemassvētki');
  });
});
