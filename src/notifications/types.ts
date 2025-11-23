import type { CountryCode } from "../data/countryNames";

export interface HolidayDTO {
    date: string;
    name: string;
    localName: string;
    country: string;
    countryCode: CountryCode;
    shown?: boolean;
}

export const startNotificationsCommand = "START_NOTIFICATIONS";
export const stopNotificationsCommand = "STOP_NOTIFICATIONS";
export const getNotificationsStatusCommand = "CHECK_NOTIFICATIONS";
export const notificationsWereSet = "NOTIFICATIONS_SET";
