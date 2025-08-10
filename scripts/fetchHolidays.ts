import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Usage: ts-node fetchHolidays.ts <year1> <year2> ... -- <countryCode1> <countryCode2> ...
// Example: ts-node fetchHolidays.ts 2024 2025 -- US DE FR

const args = process.argv.slice(2);
const separatorIndex = args.indexOf("--");
const dir = path.join(__dirname + "/../src/data/", "holidays");

if (separatorIndex === -1 || separatorIndex < 1 || separatorIndex === args.length - 1) {
    console.error("Usage: ts-node fetchHolidays.ts <year1> <year2> ... -- <countryCode1> <countryCode2> ...");
    process.exit(1);
}

const years = args.slice(0, separatorIndex).map(y => parseInt(y, 10));
const countries = args.slice(separatorIndex + 1);

const API_BASE = "https://date.nager.at/api/v3";

// Fields to exclude from holidays
const excludeFields = new Set(["fixed", "global", "counties", "launchYear", "types"]);

function cleanHolidayData(data: any[]): any[] {
    return data.map(item => {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(item)) {
            if (!excludeFields.has(key)) {
                cleaned[key] = value;
            }
        }
        return cleaned;
    });
}

async function fetchAvailableCountries(): Promise<Record<string, string>> {
    console.log(`Fetching available countries from ${API_BASE}/AvailableCountries`);
    const res = await fetch(`${API_BASE}/AvailableCountries`);
    if (!res.ok) {
        throw new Error(`Failed to fetch available countries: ${res.statusText}`);
    }
    const json: { countryCode: string; name: string }[] = await res.json();
    return Object.fromEntries(json.map(c => [c.countryCode, c.name]));
}

async function fetchHolidays(year: number, country: string) {
    const url = `${API_BASE}/PublicHolidays/${year}/${country}`;
    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch holidays for ${country} in ${year}: ${res.statusText}`);
    }
    const json = await res.json();
    return cleanHolidayData(json);
}

async function saveToTsFile(country: string, countryName: string, data: Record<number, any>) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${country}.ts`);

    const tsContent =
        `// Auto-generated holiday data for ${country}
// Source: https://date.nager.at

import { CountryHolidays } from "./types";

export const holidays_${country}: CountryHolidays = {
  countryCode: "${country}",
  countryName: "${countryName}",
  years: ${JSON.stringify(data, null, 2)}
} as const;
`;

    fs.writeFileSync(filePath, tsContent, "utf-8");
    console.log(`Saved: ${filePath}`);
}

function generateIndexFile(countries: string[]) {
    const indexPath = path.join(dir, "index.ts");

    const imports = countries
        .map(c => `import { holidays_${c} } from "./${c}";`)
        .join("\n");

    const exports = `export const allHolidays = {\n${countries
        .map(c => `  "${c}": holidays_${c}`)
        .join(",\n")}\n} as const;`;

    const indexContent =
        `// Auto-generated index file
${imports}

${exports}
`;

    fs.writeFileSync(indexPath, indexContent, "utf-8");
    console.log(`Saved: ${indexPath}`);
}

function generateTypesFile() {
    const typesPath = path.join(dir, "types.ts");

    const typeContent =
        `// Auto-generated types

export type Holiday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
};

export type CountryHolidays = {
  countryCode: string;
  countryName: string;
  years: {
    [year: number]: Holiday[];
  };
};
`;

    fs.writeFileSync(typesPath, typeContent, "utf-8");
    console.log(`Saved: ${typesPath}`);
}

async function main() {
    const countryMap = await fetchAvailableCountries();

    const processedCountries: string[] = [];

    for (const country of countries) {
        if (!countryMap[country]) {
            console.warn(`⚠️ Country code "${country}" not found in API — skipping.`);
            continue;
        }
        const allData: Record<number, any> = {};
        for (const year of years) {
            try {
                const data = await fetchHolidays(year, country);
                allData[year] = data;
            } catch (err) {
                console.error(`Error for ${country} in ${year}:`, err);
            }
        }
        await saveToTsFile(country, countryMap[country], allData);
        processedCountries.push(country);
    }

    if (processedCountries.length > 0) {
        generateTypesFile();
        generateIndexFile(processedCountries);
    }
}

main();
