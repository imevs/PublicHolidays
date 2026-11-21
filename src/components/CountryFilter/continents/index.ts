import { ContinentId, ContinentMeta } from "./types.ts";
import { type CountryCode } from "../../../data/countryNames.ts";

export * from "./types.ts";

export const CONTINENTS: ContinentMeta[] = [
    { id: "europe", name: "Europe", emoji: "🇪🇺", countries: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "CH", "NO"] as CountryCode[] },
    { id: "asia", name: "Asia", emoji: "🌏", countries: ["CN", "JP", "IN", "SG", "KR", "HK", "TW", "ID", "MY", "PH", "TH", "VN"] as CountryCode[] },
    { id: "northAmerica", name: "North America", emoji: "🌎", countries: ["US", "CA", "MX"] as CountryCode[] },
    { id: "southAmerica", name: "South America", emoji: "🌎", countries: ["BR", "AR", "CL", "CO", "PE"] as CountryCode[] },
    { id: "oceania", name: "Oceania", emoji: "🌏", countries: ["AU", "NZ"] as CountryCode[] }
];

export async function loadContinent(id: ContinentId): Promise<ContinentMeta> {
    switch (id) {
        case "europe":
            return (await import("./europe.ts")).europe;
        case "asia":
            return (await import("./asia.ts")).asia;
        case "northAmerica":
            return (await import("./northAmerica.ts")).northAmerica;
        case "southAmerica":
            return (await import("./southAmerica.ts")).southAmerica;
        case "oceania":
            return (await import("./oceania.ts")).oceania;
        default:
            throw new Error(`Unknown continent id: ${id}`);
    }
}
