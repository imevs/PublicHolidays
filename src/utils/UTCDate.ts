export class UTCDate {
    public date: Date;

    constructor(d?: UTCDate | string) {
        if (d instanceof UTCDate) {
            this.date = new Date(d.valueOf());
        } else if (typeof d === "string") {
            // "2025-12-25T00:00:00.000Z"
            const [year, month, day] = d.split("T")[0].split("-");
            // Use 12:00 as a starting time so day zone changes do not affect dates
            this.date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
        } else {
            this.date = new Date();
        }
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
