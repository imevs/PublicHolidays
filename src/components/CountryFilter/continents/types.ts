import { CountryCode } from "../../../data/countryNames.ts";

export type ContinentId = "europe" | "asia" | "northAmerica" | "southAmerica" | "oceania";

export interface ContinentMeta {
    id: ContinentId;
    name: string;
    emoji: string;
    countries: CountryCode[];
}
