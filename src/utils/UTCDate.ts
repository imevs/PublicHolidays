// type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type DatePart = number | string;
export type DateString = DateTwoParts | DateThreeParts;
export type DateTwoParts = `${DatePart}-${DatePart}`;
export type DateThreeParts = `${DatePart}-${DatePart}-${DatePart}`;
export class UTCDate {
    protected isYearDefined = true;
    private date: Date;

    constructor(d?: UTCDate | DateThreeParts) {
        if (d instanceof UTCDate) {
            this.date = new Date(d.valueOf());
        } else if (typeof d === "string") {
            // "2025-12-25T00:00:00.000Z"
            const parts = d.split("T")[0].split("-");
            if (parts.length === 3) {
                const [year, month, day] = parts;
                // Use 12:00 as a starting time so day zone changes do not affect dates
                this.date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
            } else {
                const [month, day] = parts;
                // Use 12:00 as a starting time so day zone changes do not affect dates
                this.date = new Date(Date.UTC(2025, Number(month) - 1, Number(day), 12));
            }
        } else {
            this.date = new Date();
        }
    }

    static fromMonthAndDay(d: DateString, defaultYear: number): UTCDate {
        const r = new UTCDate(d.split("-").length === 3 ? d as DateThreeParts : `${defaultYear}-${d}`);
        r.isYearDefined = d.split("-").length === 3;
        return r;
    }

    toISOString(): string {
        return this.date.toISOString();
    }

    getTimezoneOffset(): number {
        return this.date.getTimezoneOffset();
    }

    getHours(): number {
        return this.date.getUTCHours();
    }

    getMinutes(): number {
        return this.date.getUTCMinutes();
    }

    getSeconds(): number {
        return this.date.getUTCSeconds();
    }

    getTime(): number {
        return this.date.getTime();
    }

    /**
     * An integer corresponding to the day of the week for the given date according to universal time: 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on.
     */
    getDay(): number {
        return this.date.getUTCDay();
    }

    getFullYear(): number {
        return this.date.getUTCFullYear();
    }

    /**
     * Starts from 0
     */
    getMonth(): number {
        return this.date.getUTCMonth();
    }

    /**
     * An integer, between 1 and 31
     */
    getDate(): number {
        return this.date.getUTCDate();
    }

    toDateString(): string {
        return this.date.toDateString();
    }

    setFullYear(year: number): void {
        this.date.setUTCFullYear(year);
    }

    setMonth(month: number): void {
        this.date.setUTCMonth(month);
    }

    setDate(date: number): void {
        this.date.setUTCDate(date);
    }

    valueOf(): number {
        return this.date.valueOf();
    }
}
