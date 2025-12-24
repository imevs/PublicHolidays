const getBaseName = (): string => {
    if (process.env.NODE_ENV === "test") {
        return "PublicHolidays";
    }
    // Use eval to hide import.meta from Jest's static parser
    // This will only run in the browser where Vite has processed the code
    return eval("import.meta")?.env?.VITE_APP_BASE_NAME ?? "PublicHolidays";
};

export const APP_BASE_NAME = getBaseName();

export const STORAGE_KEY = "holidaysData";
export const dateLocale = "en-CA"; // Canadian English uses "YYYY-MM-DD, HH:mm" format