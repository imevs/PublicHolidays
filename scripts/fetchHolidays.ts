import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Usage: ts-node fetchHolidays.ts <year1> <year2> ... -- <countryCode1> <countryCode2> ...
// Example: ts-node fetchHolidays.ts 2024 2025 -- US DE FR

const args = process.argv.slice(2);
const separatorIndex = args.indexOf("--");

if (separatorIndex === -1 || separatorIndex < 1 || separatorIndex === args.length - 1) {
    console.error("Usage: ts-node fetchHolidays.ts <year1> <year2> ... -- <countryCode1> <countryCode2> ...");
    process.exit(1);
}

const years = args.slice(0, separatorIndex).map(y => parseInt(y, 10));
const countries = args.slice(separatorIndex + 1);

const API_BASE = "https://date.nager.at/api/v3/PublicHolidays";

// ISO 3166-1 alpha-2 to country name mapping (short list, extend if needed)
const countryNames: Record<string, string> = {
    US: "United States",
    DE: "Germany",
    FR: "France",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    JP: "Japan",
    CN: "China",
    IT: "Italy",
    ES: "Spain",
    RU: "Russia",
    BR: "Brazil",
    IN: "India",
    MX: "Mexico"
    // Add more as needed
};

// Fields to exclude
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

async function fetchHolidays(year: number, country: string) {
    const url = `${API_BASE}/${year}/${country}`;
    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch holidays for ${country} in ${year}: ${res.statusText}`);
    }
    const json = await res.json();
    return cleanHolidayData(json);
}

async function saveToTsFile(country: string, data: Record<number, any>) {
    const dir = path.join(__dirname, "holidays");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${country}.ts`);

    const countryName = countryNames[country] || country;

    const tsContent =
        `
export const holidays_${country} = {
  countryCode: "${country}",
  countryName: "${countryName}",
  years: ${JSON.stringify(data, null, 2)}
} as const;
`;

    fs.writeFileSync(filePath, tsContent, "utf-8");
    console.log(`Saved: ${filePath}`);
}

async function main() {
    for (const country of countries) {
        const allData: Record<number, any> = {};
        for (const year of years) {
            try {
                const data = await fetchHolidays(year, country);
                allData[year] = data;
            } catch (err) {
                console.error(`Error for ${country} in ${year}:`, err);
            }
        }
        await saveToTsFile(country, allData);
    }
}

main();
