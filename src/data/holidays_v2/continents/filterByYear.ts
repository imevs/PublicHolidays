export function isDateInYearOrBoundary(date: string, year: number, endDate?: string): boolean {
    if (!date) return false;
    const end = endDate ?? date;
    const prevYearStart = `${year - 1}-12-25`;
    const nextYearEnd = `${year + 1}-01-07`;
    return date <= nextYearEnd && end >= prevYearStart;
}

export function filterByYear<T extends { holidays: { date: string; endDate?: string }[] }>(
    countryHolidaysMap: Record<string, T>,
    year: number
): T[] {
    return Object.values(countryHolidaysMap).map(ch => ({
        ...ch,
        holidays: ch.holidays.filter(h => isDateInYearOrBoundary(h.date, year, h.endDate))
    }));
}

export function filterHolidaysMapByYear<T extends { countryCode: string; holidays: { date: string; endDate?: string }[] }>(
    countryHolidaysMap: Record<string, T>,
    year: number
): Record<string, T> {
    return Object.fromEntries(
        filterByYear(countryHolidaysMap, year).map(ch => [ch.countryCode, ch])
    );
}
