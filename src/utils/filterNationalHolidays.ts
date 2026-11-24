const COUNTRY_HOLIDAY_FILE_RE = /src\/data\/holidays_v2\/[A-Z]{2}\.ts$/;
const EUROPE_YEAR_FILE_RE = /src\/data\/holidays_v2\/continents\/europe-(\d{4})\.ts$/;
const HOLIDAYS_ARRAY_RE = /(holidays:\s*)(\[[\s\S]*\])(\s*\}\s*as const;?)/;
const INCLUDED_HOLIDAY_TYPES = new Set(["National holiday", "School Holiday"]);
const EUROPE_COUNTRIES = [
    "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ",
    "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU",
    "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
    "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE",
    "SI", "SK", "TR", "UA",
];

export interface TransformResult {
    code: string;
    map: null;
}

export interface FsLike {
    existsSync: (path: string) => boolean;
    readFileSync: (path: string, encoding: "utf-8") => string;
}

export interface PathLike {
    join: (...paths: string[]) => string;
}

function isNationalHoliday(entry: unknown): entry is { date?: unknown; type: unknown[] } {
    if (typeof entry !== "object" || entry === null) {
        return false;
    }
    const { type } = entry as { type?: unknown };
    return Array.isArray(type) && type.some((t) => typeof t === "string" && INCLUDED_HOLIDAY_TYPES.has(t));
}

function isNationalHolidayWithDate(entry: unknown): entry is { date: string; endDate?: unknown; type: unknown[] } {
    return isNationalHoliday(entry) && typeof entry.date === "string";
}

/**
 * Filters a country holiday TypeScript module so only "National holiday" and "School Holiday" entries remain.
 */
export function transformNationalHolidays(code: string, id: string): TransformResult | null {
    const normalizedId = id.replace(/\\/g, "/");
    if (!COUNTRY_HOLIDAY_FILE_RE.test(normalizedId)) {
        return null;
    }

    const match = HOLIDAYS_ARRAY_RE.exec(code);
    if (!match) {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(match[2]) as unknown;
    } catch {
        return null;
    }

    if (!Array.isArray(parsed)) {
        return null;
    }

    const filtered = (parsed as unknown[]).filter(isNationalHoliday);

    const start = match.index + match[1].length;
    const end = start + match[2].length;
    const transformedCode =
        code.slice(0, start) + JSON.stringify(filtered) + code.slice(end);

    return {
        code: transformedCode,
        map: null,
    };
}

/**
 * Generates per-year Europe holiday bundles filtered to national and school holidays within the year and week-boundary window.
 */
export function transformEuropeYearModule(
    _code: string,
    id: string,
    fsModule: FsLike,
    pathModule: PathLike
): TransformResult | null {
    const normalizedId = id.replace(/\\/g, "/");
    const yearMatch = EUROPE_YEAR_FILE_RE.exec(normalizedId);
    if (!yearMatch) {
        return null;
    }

    const year = Number(yearMatch[1]);
    const prevYearStart = `${year - 1}-12-25`;
    const nextYearEnd = `${year + 1}-01-07`;
    const result: Record<string, { countryCode: string; countryName: string; holidays: unknown[] }> = {};

    for (const countryCode of EUROPE_COUNTRIES) {
        const filePath = pathModule.join(process.cwd(), "src/data/holidays_v2", `${countryCode}.ts`);
        if (!fsModule.existsSync(filePath)) {
            continue;
        }
        const fileCode = fsModule.readFileSync(filePath, "utf-8");
        const nameMatch = /countryName:\s*"([^"]+)"/.exec(fileCode);
        const arrayMatch = HOLIDAYS_ARRAY_RE.exec(fileCode);
        if (!nameMatch || !arrayMatch) {
            continue;
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(arrayMatch[2]) as unknown;
        } catch {
            continue;
        }
        if (!Array.isArray(parsed)) {
            continue;
        }

        const filtered = (parsed as unknown[]).filter(
            (h): h is { date: string; endDate?: unknown; type: unknown[] } => {
                if (!isNationalHolidayWithDate(h)) {
                    return false;
                }
                const endDate = typeof h.endDate === "string" ? h.endDate : h.date;
                return h.date <= nextYearEnd && endDate >= prevYearStart;
            }
        );

        result[countryCode] = {
            countryCode,
            countryName: nameMatch[1],
            holidays: filtered,
        };
    }

    return {
        code: `export const holidays = ${JSON.stringify(result)};`,
        map: null,
    };
}
