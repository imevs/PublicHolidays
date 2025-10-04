export class UTCDate {
    public date: Date;

    constructor(year?: number | UTCDate | string, monthIndex?: number, date?: number/*, hours = 0, minutes = 0, seconds = 0, ms = 0*/) {
        if (year instanceof UTCDate) {
            this.date = new Date(year.valueOf());
        } else if (typeof year === "string") {
            // "2025-12-25T00:00:00.000Z"
            this.date = new Date(year);
            // this.date = new Date(Date.UTC(year, monthIndex, date, hours, minutes, seconds, ms));
        } else if (typeof year === "number") {
            // "2025-12-25T00:00:00.000Z"
            // this.date = new Date(`${year}-${String(monthIndex ?? 0).padStart(2, "0")}-${String(date).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(3, "0")}Z`);
            if (monthIndex !== undefined) {
                this.date = new Date(year, monthIndex, date);
            } else {
                this.date = new Date(year);
            }
        } else {
            this.date = new Date();
        }
    }

    static fromDate(date: Date): UTCDate {
        return new UTCDate(date.getFullYear(), date.getMonth(), date.getDate());
    }

    toISOString(): string {
        return this.date.toISOString();
    }

    getTimezoneOffset(): number {
        return this.date.getTimezoneOffset();
    }

    getTime(): number {
        return this.date.getTime();
    }

    getUTCFullYear(): number {
        return this.date.getUTCFullYear();
    }

    getFullYear(): number {
        return this.date.getFullYear();
    }

    getUTCMonth(): number {
        return this.date.getUTCMonth();
    }

    getMonth(): number {
        return this.date.getMonth();
    }

    getUTCDate(): number {
        return this.date.getUTCDate();
    }

    getUTCDay(): number {
        return this.date.getUTCDay();
    }

    getDate(): number {
        return this.date.getDate();
    }

    getUTCHours(): number {
        return this.date.getUTCHours();
    }

    getUTCMinutes(): number {
        return this.date.getUTCMinutes();
    }

    getUTCSeconds(): number {
        return this.date.getUTCSeconds();
    }

    toDateString(): string {
        return this.date.toDateString();
    }

    setFullYear(year: number): void {
        this.date.setFullYear(year);
    }

    setUTCFullYear(year: number): void {
        this.date.setUTCFullYear(year);
    }

    setMonth(month: number): void {
        this.date.setMonth(month);
    }

    setUTCMonth(month: number): void {
        this.date.setUTCMonth(month);
    }

    setDate(date: number): void {
        this.date.setDate(date);
    }

    setUTCDate(date: number): void {
        this.date.setUTCDate(date);
    }

    setUTCHours(hours: number): void {
        this.date.setUTCHours(hours);
    }

    valueOf(): number {
        return this.date.valueOf();
    }
}
