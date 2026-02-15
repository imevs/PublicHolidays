import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { CountryHolidays, Holiday } from "../src/data/holidays_v2/types.ts";
import type { HolidayWithCountry } from "../src/types/index.ts";
import type { DateString } from "../src/utils/UTCDate.ts";

// Polyfill window for timeZones.ts which uses window.console
if (typeof globalThis.window === "undefined") {
    (globalThis as any).window = {
        console: console,
    };
}

// Relative imports from src.
// esbuild will resolve these correctly including TS files.
import { allHolidays } from "../src/data/holidays_v2/index.ts";
import { buildICS } from "../src/utils/generateICS.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICS_DIR = path.join(__dirname, "ics");

async function main() {
    try {
        await fs.mkdir(ICS_DIR, { recursive: true });
        console.log(`Ensured directory exists: ${ICS_DIR}`);

        console.log("Starting ICS generation...");

        // allHolidays is an object keyed by country code
        for (const [countryCode, fullData] of Object.entries(allHolidays)) {
            // fullData type: CountryHolidays (from src/data/holidays_v2/types)
            // It has .holidays array of simple Holiday objects { date, name, localName }

            // buildICS expects CalendarEvent[]
            // CalendarEvent = HolidayWithCountry | OtherEvent
            // We need to map the simple holiday data to the structure buildICS expects.

            const countryData = fullData as CountryHolidays;
            const holidays = countryData.holidays;
            if (!Array.isArray(holidays)) {
                console.warn(`No holidays array for ${countryCode}, skipping.`);
                continue;
            }

            const events: HolidayWithCountry[] = holidays
                .filter(h => h.type?.includes("National holiday") || h.name.includes("(Suspended)"))
                .map((h: Holiday) => ({
                date: h.date.split("T")[0] as DateString,
                name: h.name,
                localName: h.localName,
                kind: "publicHoliday" as const,
                // GenerateICS uses these properties
                country: countryData.countryName,
                countryCode: countryData.countryCode,
                type: h.type // Optional, but good to have if present
            }));

            const icsContent = buildICS(events);
            const filePath = path.join(ICS_DIR, `${countryData.countryName}_calendar.ics`);

            await fs.writeFile(filePath, icsContent, "utf-8");
            console.log(`Generated: ${filePath}`);
        }

        console.log("All ICS files generated successfully.");

    } catch (error) {
        console.error("Error generating ICS files:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();
