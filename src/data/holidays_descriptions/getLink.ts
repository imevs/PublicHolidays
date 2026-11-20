import type { Description } from "./all.ts";
import type { CountryName } from "../countryNames.ts";

function googleSearchUrl(name: string, country: CountryName): string {
    return `https://www.google.com/search?q=${encodeURIComponent(name + " " + country)}`;
}

export function getLink(date: string | undefined | null, country: CountryName, name: string, descriptions: Record<string, Description>): string | undefined {
    if (Object.keys(descriptions).length === 0) {
        return undefined;
    }
    if (!date) {
        const wiki = descriptions[country]?.wiki;
        return wiki ? "https://en.wikipedia.org/wiki/" + wiki : googleSearchUrl(name, country);
    }
    const link = descriptions[country]?.holidays?.find(item => {
        const dayOfMonth = parseInt(item.date.split("-")[0], 10);
        const month = parseInt(item.date.split("-")[1], 10);
        return month === parseInt(date.split("-")[1], 10) && dayOfMonth === parseInt(date.split("-")[2], 10);
    })?.l;
    return link ? "https://en.wikipedia.org/wiki/" + link : googleSearchUrl(name, country);
}
