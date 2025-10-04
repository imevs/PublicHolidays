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

    getDay(): number {
        return this.date.getUTCDay();
    }

    getFullYear(): number {
        return this.date.getUTCFullYear();
    }

    getMonth(): number {
        return this.date.getUTCMonth();
    }

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
