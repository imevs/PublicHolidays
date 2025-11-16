import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import { APP_BASE_NAME } from "../src/consts";

type RawHoliday = {
    date: string;
    localName: string;
    name: string;
    fixed?: boolean;
    global?: boolean;
    counties?: string[] | null;
    launchYear?: number | null;
    types?: string[];
};

export type Holiday = {
    date: string;
    localName: string;
    name: string;
};

export type CountryHolidays = {
    countryCode: string;
    countryName: string;
    holidays: Holiday[];
};

interface AvailableCountry {
    countryCode: string;
    name: string;
}

// Parse CLI args with simple custom logic
// Usage: ts-node fetchHolidays.ts 2024 2025 -- US DE --outDir=someFolder
function parseArgs() {
    const args = process.argv.slice(2);
    const separatorIndex = args.indexOf("--");

    if (separatorIndex === -1 || separatorIndex < 1) {
        throw new Error(
            "Usage: ts-node fetchHolidays.ts <year1> <year2> ... -- <countryCode1> <countryCode2> ... [--outDir=folder]"
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

    for (const arg of rest) {
        if (arg.startsWith("--outDir=")) {
            outDir = arg.substring("--outDir=".length);
        } else if (arg.startsWith("--")) {
            // ignore unknown flags
        } else {
            countries.push(arg.toUpperCase());
        }
    }

    if (countries.length === 0) {
        throw new Error("No countries specified.");
    }

    return { years, countries, outDir };
}

const API_BASE = "https://date.na" + "ger.at/api/v3";

function cleanHolidayData(data: RawHoliday[]): Holiday[] {
    return data.map((item) => ({
        date: item.date,
        localName: item.localName,
        name: item.name,
    }));
}

async function fetchAvailableCountries(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/AvailableCountries`);
    if (!res.ok) {
        throw new Error(`Failed to fetch available countries: ${res.statusText}`);
    }
    const json: AvailableCountry[] = await res.json();
    return Object.fromEntries(json.map((c) => [c.countryCode, c.name]));
}

async function fetchHolidays(year: number, country: string): Promise<Holiday[]> {
    const url = `${API_BASE}/${APP_BASE_NAME}/${year}/${country}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `Failed to fetch holidays for ${country} in ${year}: ${res.statusText}`
        );
    }
    const json: RawHoliday[] = await res.json();
    return cleanHolidayData(json);
}

async function fetchAllYearsForCountry(
    country: string,
    years: number[]
): Promise<Holiday[]> {
    const results = await Promise.all(
        years.map(async (year) => {
            try {
                return await fetchHolidays(year, country);
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
        const { years, countries, outDir } = parseArgs();

        const countryMap = await fetchAvailableCountries();

        const processedCountries: string[] = [];

        for (const country of countries) {
            if (!countryMap[country]) {
                console.warn(`⚠️ Country code "${country}" not found in API — skipping.`);
                continue;
            }

            const allData = await fetchAllYearsForCountry(country, years);
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
