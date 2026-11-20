const buildTimeBaseName = typeof __APP_BASE_NAME__ !== "undefined" ? __APP_BASE_NAME__ : undefined;
const runtimeEnvBaseName = (globalThis as { process?: { env?: { APP_BASE_NAME?: string } } }).process?.env?.APP_BASE_NAME;

export const APP_BASE_NAME = buildTimeBaseName || runtimeEnvBaseName || "PublicHolidays";

export const STORAGE_KEY = "holidaysData";
export const dateLocale = "en-CA"; // Canadian English uses "YYYY-MM-DD, HH:mm" format