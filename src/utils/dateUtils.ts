export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const generateYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
};

export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getMonthName = (month: number): string => {
  return new Date(0, month).toLocaleString('en-US', { month: 'long' });
};
