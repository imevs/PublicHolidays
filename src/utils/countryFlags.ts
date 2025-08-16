import type { CountryCode } from "../types";

// Function to convert a country code to a flag emoji
export const getFlagEmoji = (countryCode: CountryCode) => {
    return countryCode
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
};
