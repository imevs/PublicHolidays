export function isDateInYearOrBoundary(date: string, year: number): boolean {
    if (!date) return false;
    return (
        date.startsWith(`${year}-`) ||
        (date >= `${year - 1}-12-25` && date <= `${year - 1}-12-31`) ||
        (date >= `${year + 1}-01-01` && date <= `${year + 1}-01-07`)
    );
}

export function filterByYear<T extends { holidays: { date: string }[] }>(
    countryHolidaysMap: Record<string, T>,
    year: number
): T[] {
    return Object.values(countryHolidaysMap).map(ch => ({
        ...ch,
        holidays: ch.holidays.filter(h => isDateInYearOrBoundary(h.date, year))
    }));
}

export function filterHolidaysMapByYear<T extends { countryCode: string; holidays: { date: string }[] }>(
    countryHolidaysMap: Record<string, T>,
    year: number
): Record<string, T> {
    return Object.fromEntries(
        filterByYear(countryHolidaysMap, year).map(ch => [ch.countryCode, ch])
    );
}
