import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { type CountryCode, countryNames } from "../src/data/countryNames.ts";
import type { Holiday } from "../src/data/holidays_v2/types.ts";

const DEFAULT_OUT_DIR = "holidays_from_ics";
const DEFAULT_ACTUAL_DATA_DIR = "src/data/holidays_v2";
const DEFAULT_HOLIDAY_TYPE = "National holiday";
const USAGE =
    "Usage: node ./scripts/icsToTs.ts <icsDir> [--outDir=folder] [--append] [--years=2024,2025] [--countries=AL,US] [--defaultType=\"National holiday\"] (or --icsDir=<icsDir>)";

const COUNTRY_ALIASES: Record<string, CountryCode> = {
    "türkiye": "TR",
    "turkiye": "TR",
};

type CliOptions = {
    icsDir: string;
    outDir: string;
    append: boolean;
    years: Set<number> | null;
    countries: Set<CountryCode> | null;
    defaultType: string;
};

function parseCliArgs(): CliOptions {
    const { values, positionals } = parseArgs({
        options: {
            icsDir: { type: "string" },
            outDir: { type: "string" },
            append: { type: "boolean", short: "a" },
            years: { type: "string" },
            countries: { type: "string" },
            defaultType: { type: "string" },
            help: { type: "boolean", short: "h" },
        },
        allowPositionals: true,
        strict: true,
    });

    if (values.help) {
        console.log(USAGE);
        process.exit(0);
    }

    if (values.icsDir !== undefined && positionals.length > 0) {
        throw new Error(`Unexpected argument: ${positionals[0]}`);
    }
    if (positionals.length > 1) {
        throw new Error(`Unexpected argument: ${positionals[1]}`);
    }

    const icsDir = values.icsDir ?? positionals[0] ?? "";
    if (!icsDir) {
        throw new Error(USAGE);
    }

    const append = Boolean(values.append);
    const outDir = values.outDir ?? (append ? DEFAULT_ACTUAL_DATA_DIR : DEFAULT_OUT_DIR);
    if (!outDir) {
        throw new Error("--outDir cannot be empty.");
    }

    const defaultType = values.defaultType ?? DEFAULT_HOLIDAY_TYPE;

    let years: Set<number> | null = null;
    if (values.years !== undefined) {
        const rawYears = values.years.split(",").map(s => s.trim()).filter(Boolean);
        if (rawYears.length === 0) {
            throw new Error("--years requires at least one year.");
        }
        const parsed = rawYears.map((raw) => {
            const n = Number(raw);
            if (!Number.isInteger(n) || n < 1900 || n > 2100) {
                throw new Error(`Invalid year: ${raw}`);
            }
            return n;
        });
        years = new Set(parsed);
    }

    let countries: Set<CountryCode> | null = null;
    if (values.countries !== undefined) {
        const rawCodes = values.countries
            .split(",")
            .map(s => s.trim().toUpperCase())
            .filter(Boolean);
        if (rawCodes.length === 0) {
            throw new Error("--countries requires at least one country code.");
        }
        const validCodes: CountryCode[] = [];
        for (const code of rawCodes) {
            if (code in countryNames) {
                validCodes.push(code as CountryCode);
            } else {
                console.warn(`⚠️ Country code "${code}" not found in countryNames — ignoring.`);
            }
        }
        if (validCodes.length === 0) {
            throw new Error("No valid country codes specified in --countries.");
        }
        countries = new Set(validCodes);
    }

    return { icsDir, outDir, append, years, countries, defaultType };
}

function normalizeCountryKey(raw: string): string {
    return raw.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function buildNameToCodeMap(): Record<string, CountryCode> {
    const map: Record<string, CountryCode> = { ...COUNTRY_ALIASES };
    for (const [code, name] of Object.entries(countryNames)) {
        const typedCode = code as CountryCode;
        map[normalizeCountryKey(name)] = typedCode;
        map[code.toLowerCase()] = typedCode;
    }
    return map;
}

function unescapeIcsText(value: string): string {
    return value.replace(/\\(\\|[nN]|,|;)/g, (_, ch: string) =>
        ch === "n" || ch === "N" ? "\n" : ch
    );
}

function stripLeadingFlagEmoji(text: string): string {
    return text.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s+/u, "");
}

function formatIcsDate(raw: string): string | null {
    const match = raw.trim().match(/^(\d{4})(\d{2})(\d{2})/);
    if (!match) {
        return null;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function computeInclusiveEndDate(startDate: string, rawDtEnd: string): string | null {
    const match = rawDtEnd.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
    if (!match) {
        return null;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }
    const isExclusive = !match[4] || (match[4] === "00" && match[5] === "00" && match[6] === "00");
    let endDate: string;
    if (isExclusive) {
        const dt = new Date(Date.UTC(year, month - 1, day - 1));
        endDate = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    } else {
        endDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return endDate > startDate ? endDate : null;
}

function splitPropertyLine(line: string): { propName: string; propValue: string } | null {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === "\"") {
            inQuotes = !inQuotes;
        } else if (ch === ":" && !inQuotes) {
            const propPart = line.slice(0, i);
            const propName = propPart.split(";")[0]?.toUpperCase() ?? "";
            const propValue = line.slice(i + 1);
            return { propName, propValue };
        }
    }
    return null;
}

function parseIcsContent(content: string, defaultType: string): Holiday[] {
    // Unfold RFC 5545 folded lines (CRLF, LF, or CR followed by space or tab)
    const unfolded = content.replace(/(?:\r\n|\r|\n)[ \t]/g, "");
    const lines = unfolded.split(/\r\n|\r|\n/);

    const holidays: Holiday[] = [];
    let inEvent = false;
    let nestedDepth = 0;
    let date: string | null = null;
    let rawEndDate: string | null = null;
    let summary = "";
    let description = "";
    let status = "";
    let categories: string[] = [];

    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            inEvent = true;
            nestedDepth = 0;
            date = null;
            rawEndDate = null;
            summary = "";
            description = "";
            status = "";
            categories = [];
            continue;
        }

        if (line === "END:VEVENT") {
            if (inEvent && date && summary && status.toUpperCase() !== "CANCELLED") {
                const type = categories.length > 0
                    ? categories
                    : (defaultType ? [defaultType] : []);
                const endDate = rawEndDate ? computeInclusiveEndDate(date, rawEndDate) : null;
                const holiday: Holiday = {
                    date,
                    ...(endDate ? { endDate } : {}),
                    localName: description || summary,
                    name: summary,
                };
                if (type.length > 0) {
                    holiday.type = type;
                }
                holidays.push(holiday);
            }
            inEvent = false;
            nestedDepth = 0;
            continue;
        }

        if (!inEvent) {
            continue;
        }

        if (line.startsWith("BEGIN:")) {
            nestedDepth++;
            continue;
        }
        if (line.startsWith("END:")) {
            if (nestedDepth > 0) {
                nestedDepth--;
            }
            continue;
        }
        if (nestedDepth > 0) {
            continue;
        }

        const parsed = splitPropertyLine(line);
        if (!parsed) {
            continue;
        }

        const { propName, propValue } = parsed;
        if (propName === "DTSTART") {
            date = formatIcsDate(propValue);
        } else if (propName === "DTEND") {
            rawEndDate = propValue;
        } else if (propName === "SUMMARY") {
            summary = stripLeadingFlagEmoji(unescapeIcsText(propValue.trim()));
        } else if (propName === "DESCRIPTION") {
            description = unescapeIcsText(propValue.trim());
        } else if (propName === "STATUS") {
            status = propValue.trim();
        } else if (propName === "CATEGORIES") {
            const parsedCategories = propValue
                .split(/(?<!\\)(?:\\\\)*,/)
                .map(c => unescapeIcsText(c.trim()))
                .filter(Boolean);
            categories.push(...parsedCategories);
        }
    }

    return holidays;
}

function filterAndDedupeHolidays(holidays: Holiday[], years: Set<number> | null): Holiday[] {
    const filtered = years
        ? holidays.filter(h => years.has(Number(h.date.slice(0, 4))) || (h.endDate !== undefined && years.has(Number(h.endDate.slice(0, 4)))))
        : holidays;

    const seen = new Set<string>();
    const unique: Holiday[] = [];
    for (const h of filtered) {
        const key = `${h.date}|${h.name}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(h);
        }
    }

    return unique.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

async function readCountryHolidaysFromDir(
    dirPath: string,
    years: Set<number> | null,
    defaultType: string,
): Promise<Holiday[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const icsFiles = entries
        .filter(e => e.isFile() && e.name.endsWith(".ics"))
        .filter((e) => {
            if (!years) {
                return true;
            }
            const yearMatch = e.name.match(/^(\d{4})\.ics$/);
            return yearMatch ? years.has(Number(yearMatch[1])) : true;
        })
        .map(e => e.name)
        .sort();

    const all: Holiday[] = [];
    for (const file of icsFiles) {
        const raw = await fs.readFile(path.join(dirPath, file), "utf-8");
        all.push(...parseIcsContent(raw, defaultType));
    }

    return all;
}

function indentJsonBlock(value: unknown): string {
    const json = JSON.stringify(value, null, 4);
    return json
        .split("\n")
        .map((line, idx) => (idx === 0 ? line : `    ${line}`))
        .join("\n");
}

async function saveToTsFile(
    outDir: string,
    countryCode: CountryCode,
    countryName: string,
    data: Holiday[],
    logMessage?: string,
): Promise<void> {
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, `${countryCode}.ts`);

    const content = `import type { CountryHolidays } from "./types";

export const holidays_${countryCode}: CountryHolidays = {
    countryCode: "${countryCode}",
    countryName: "${countryName}",
    holidays: ${indentJsonBlock(data)}
} as const;
`;

    await fs.writeFile(filePath, content, "utf-8");
    console.log(logMessage ?? `Saved: ${filePath}`);
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function readExistingHolidays(
    outDir: string,
    countryCode: CountryCode,
): Promise<Holiday[] | null> {
    const filePath = path.join(outDir, `${countryCode}.ts`);
    if (!(await fileExists(filePath))) {
        return null;
    }

    const mod = await import(pathToFileURL(path.resolve(filePath)).href);
    const countryData = mod[`holidays_${countryCode}`];
    if (!countryData || !Array.isArray(countryData.holidays)) {
        throw new Error(`Invalid holiday data in ${filePath}: expected exported holidays_${countryCode}.holidays array.`);
    }
    return [...countryData.holidays];
}

async function generateTypesFile(outDir: string): Promise<void> {
    const typesPath = path.join(outDir, "types.ts");

    const typeContent = `// Auto-generated types

export type Holiday = {
    date: string;
    endDate?: string;
    localName: string;
    name: string;
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
        .filter(f => f.endsWith(".ts") && !["index.ts", "types.ts"].includes(f))
        .map(f => path.basename(f, ".ts"))
        .filter(c => c in countryNames)
        .sort();

    const imports = countries
        .map(c => `import { holidays_${c} } from "./${c}";`)
        .join("\n");

    const exports = `export const allHolidays = {\n${countries
        .map(c => `    "${c}": holidays_${c}`)
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
        const { icsDir, outDir, append, years, countries, defaultType } = parseCliArgs();
        const nameToCode = buildNameToCodeMap();
        const entries = await fs.readdir(icsDir, { withFileTypes: true });

        const holidaysByCountry = new Map<CountryCode, Holiday[]>();

        const addHolidays = (code: CountryCode, items: Holiday[]) => {
            const existing = holidaysByCountry.get(code);
            if (existing) {
                existing.push(...items);
            } else {
                holidaysByCountry.set(code, [...items]);
            }
        };

        // 1. Directory-per-country layout (e.g. ics_register/Albania/2024.ics)
        for (const entry of entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
            const countryCode = nameToCode[normalizeCountryKey(entry.name)];
            if (!countryCode) {
                console.warn(`⚠️ Country "${entry.name}" not found in countryNames — skipping.`);
                continue;
            }
            if (countries && !countries.has(countryCode)) {
                continue;
            }

            const holidays = await readCountryHolidaysFromDir(path.join(icsDir, entry.name), years, defaultType);
            addHolidays(countryCode, holidays);
        }

        // 2. Flat .ics file layout (e.g. Albania_calendar.ics or AL.ics)
        for (const entry of entries.filter(e => e.isFile() && e.name.endsWith(".ics")).sort((a, b) => a.name.localeCompare(b.name))) {
            const baseName = entry.name.replace(/_calendar\.ics$/i, "").replace(/\.ics$/i, "");
            const countryCode = nameToCode[normalizeCountryKey(baseName)];
            if (!countryCode) {
                console.warn(`⚠️ Country "${baseName}" (from ${entry.name}) not found in countryNames — skipping.`);
                continue;
            }
            if (countries && !countries.has(countryCode)) {
                continue;
            }

            const raw = await fs.readFile(path.join(icsDir, entry.name), "utf-8");
            addHolidays(countryCode, parseIcsContent(raw, defaultType));
        }

        const sortedCodes = [...holidaysByCountry.keys()].sort();
        let addedNewCountry = false;
        for (const countryCode of sortedCodes) {
            const countryName = countryNames[countryCode];
            const newHolidays = filterAndDedupeHolidays(holidaysByCountry.get(countryCode) ?? [], years);
            const filePath = path.join(outDir, `${countryCode}.ts`);

            if (append) {
                const existingHolidays = await readExistingHolidays(outDir, countryCode);
                if (existingHolidays !== null) {
                    const existingMap = new Map<string, Holiday>();
                    for (const eh of existingHolidays) {
                        existingMap.set(`${eh.date}|${eh.name}`, eh);
                    }
                    let updatedCount = 0;
                    const toAdd: Holiday[] = [];

                    for (const nh of newHolidays) {
                        const key = `${nh.date}|${nh.name}`;
                        const existing = existingMap.get(key);
                        if (existing) {
                            if (nh.endDate !== undefined && existing.endDate !== nh.endDate) {
                                existing.endDate = nh.endDate;
                                updatedCount++;
                            }
                        } else {
                            toAdd.push(nh);
                        }
                    }

                    if (toAdd.length === 0 && updatedCount === 0) {
                        console.log(`Skipped (no new holidays): ${filePath}`);
                        continue;
                    }
                    const merged = [...existingHolidays, ...toAdd];
                    const msgParts: string[] = [];
                    if (toAdd.length > 0) msgParts.push(`appended ${toAdd.length} holiday(s)`);
                    if (updatedCount > 0) msgParts.push(`updated ${updatedCount} holiday(s)`);
                    await saveToTsFile(outDir, countryCode, countryName, merged, `Appended/updated (${msgParts.join(", ")}) to: ${filePath}`);
                } else {
                    await saveToTsFile(outDir, countryCode, countryName, newHolidays);
                    addedNewCountry = true;
                }
            } else {
                await saveToTsFile(outDir, countryCode, countryName, newHolidays);
            }
        }

        if (sortedCodes.length > 0) {
            if (!append || !(await fileExists(path.join(outDir, "types.ts")))) {
                await generateTypesFile(outDir);
            }
            if (!append || addedNewCountry || !(await fileExists(path.join(outDir, "index.ts")))) {
                await generateIndexFile(outDir);
            }
            console.log(`Done! Processed ${sortedCodes.length} countries.`);
        } else {
            console.log("No countries processed.");
        }
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
}

main();
