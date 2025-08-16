import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import { countriesMap } from "./countries";

type RawHoliday = {
    date: {
        iso: string;
        datetime: {
            day: number;
            month: number;
            year: number;
        };
    };
    description: string;
    name: string;
    primary_type: string;
    type: string[];
};

export type Holiday = {
    date: string;
    localName: string;
    name: string;
    primary_type: string;
    type: string[];
};

export type CountryHolidays = {
    countryCode: string;
    countryName: string;
    holidays: Holiday[];
};

const d = {
    "meta": {
        "code": 200
    },
    "response": {
        "holidays": [
            {
                "name": "New Year's Day (Suspended)",
                "description": "New Year’s Day is annually celebrated as a day off work in the Ukraine on January 1, marking the start of the New Year.",
                "country": {
                    "id": "ua",
                    "name": "Ukraine"
                },
                "date": {
                    "iso": "2025-01-01",
                    "datetime": {
                        "year": 2025,
                        "month": 1,
                        "day": 1
                    }
                },
                "type": [
                    "Observance"
                ],
                "primary_type": "Suspended National Holiday",
                "canonical_url": "https://calendarific.com/holiday/ukraine/new-year-day",
                "urlid": "ukraine/new-year-day",
                "locations": "All",
                "states": "All"
            },
        ]
    }
};


type Response = typeof d;

// Parse CLI args with simple custom logic
// Usage: ts-node fetchHolidays.ts 2024 2025 -- US DE --outDir=someFolder
function parseArgs() {
    const args = process.argv.slice(2);
    const separatorIndex = args.indexOf("--");

    if (separatorIndex === -1 || separatorIndex < 1) {
        throw new Error(
            "Usage: ts-node fetchHolidays.ts <year1> <year2> ... -- <countryCode1> <countryCode2> ... [--outDir=folder] --token=token"
        );
    }

    const years = args
        .slice(0, separatorIndex)
        .map((y) => {
            const n = Number(y);
            if (isNaN(n) || n < 1900 || n > 2100) {
                throw new Error(`Invalid year: ${y}`);
            }
            return n;
        });

    // Everything after '--' until another --outDir= or end
    const rest = args.slice(separatorIndex + 1);
    const countries: string[] = [];
    let outDir = "holidays";
    let token = "";

    for (const arg of rest) {
        if (arg.startsWith("--outDir=")) {
            outDir = arg.substring("--outDir=".length);
        if (arg.startsWith("--token=")) {
            token = arg.substring("--token=".length);
        } else if (arg.startsWith("--")) {
            // ignore unknown flags
        } else {
            countries.push(arg.toUpperCase());
        }
    }

    if (countries.length === 0) {
        throw new Error("No countries specified.");
    }

    return { years, countries, outDir, token };
}
const API_BASE = "https://calendarific.com/api/v2/";
// https://calendarific.com/api/v2/holidays?&api_key=&country=UA&year=2025

function cleanHolidayData(data: RawHoliday[]): Holiday[] {
    return data.map((item) => ({
        date: item.date.iso,
        localName: item.description,
        name: item.name,
        primary_type: item.primary_type,
        type: item.type,
    }));
}

async function fetchHolidays(year: number, country: string, token: string): Promise<Holiday[]> {
    const url = `${API_BASE}holidays?year=${year}&country=${country}&api_key=${token}`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error(url);
        throw new Error(
            `Failed to fetch holidays for ${country} in ${year}: ${res.statusText}`
        );
    }
    const json: Response = await res.json();
    return cleanHolidayData(json.response.holidays);
}

async function fetchAllYearsForCountry(
    country: string,
    years: number[],
    token: string,
): Promise<Holiday[]> {
    const results = await Promise.all(
        years.map(async (year) => {
            try {
                return await fetchHolidays(year, country, token);
            } catch (err) {
                console.error(`Failed fetching ${country} ${year}:`, (err as Error).message);
                return [];
            }
        })
    );
    return results.flat();
}

async function saveToTsFile(
    outDir: string,
    country: string,
    countryName: string,
    data: Holiday[]
): Promise<void> {
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, `${country}.ts`);

    const content = `import { CountryHolidays } from "./types";

export const holidays_${country}: CountryHolidays = {
  countryCode: "${country}",
  countryName: "${countryName}",
  holidays: ${JSON.stringify(data, null, 2)}
} as const;
`;

    await fs.writeFile(filePath, content, "utf-8");
    console.log(`Saved: ${filePath}`);
}

async function generateTypesFile(outDir: string): Promise<void> {
    const typesPath = path.join(outDir, "types.ts");

    const typeContent = `// Auto-generated types

export type Holiday = {
  date: string;
  localName: string;
  name: string;
  primary_type?: string;
  type?: string[];
};

export type CountryHolidays = {
  countryCode: string;
  countryName: string;
  holidays: Holiday[];
};
`;

    await fs.writeFile(typesPath, typeContent, "utf-8");
    console.log(`Saved: ${typesPath}`);
}

async function generateIndexFile(outDir: string): Promise<void> {
    const files = await fs.readdir(outDir);
    const countries = files
        .filter(
            (f) =>
                f.endsWith(".ts") && !["index.ts", "types.ts"].includes(f)
        )
        .map((f) => path.basename(f, ".ts"));

    const imports = countries
        .map((c) => `import { holidays_${c} } from "./${c}";`)
        .join("\n");

    const exports = `export const allHolidays = {\n${countries
        .map((c) => `  "${c}": holidays_${c}`)
        .join(",\n")}\n} as const;`;

    const indexPath = path.join(outDir, "index.ts");
    const content = `// Auto-generated index file
${imports}

${exports}
`;

    await fs.writeFile(indexPath, content, "utf-8");
    console.log(`Saved: ${indexPath}`);
}

async function main() {
    try {
        const { years, countries, outDir, token } = parseArgs();

        const countryMap = countriesMap;

        const processedCountries: string[] = [];

        for (const country of countries) {
            if (!countryMap[country]) {
                console.warn(`⚠️ Country code "${country}" not found in API — skipping.`);
                continue;
            }

            const allData = await fetchAllYearsForCountry(country, years, token);
            await saveToTsFile(outDir, country, countryMap[country], allData);
            processedCountries.push(country);
        }

        if (processedCountries.length > 0) {
            await generateTypesFile(outDir);
            await generateIndexFile(outDir);
        } else {
            console.log("No countries processed.");
        }
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
}

main();
