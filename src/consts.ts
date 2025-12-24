export const APP_BASE_NAME =
    typeof process !== "undefined"
        ? process.env.APP_BASE_NAME ?? "PublicHolidays/main"
        : "PublicHolidays/main";

export const STORAGE_KEY = "holidaysData";
export const dateLocale = "en-CA"; // Canadian English uses "YYYY-MM-DD, HH:mm" format