const COUNTRY_HOLIDAY_FILE_RE = /src\/data\/holidays_v2\/[A-Z]{2}\.ts$/;
const EUROPE_YEAR_FILE_RE = /src\/data\/holidays_v2\/continents\/europe-(\d{4})\.ts$/;
const HOLIDAYS_ARRAY_RE = /(holidays:\s*)(\[[\s\S]*\])(\s*\}\s*as const;?)/;
const EUROPE_COUNTRIES = [
    "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ",
    "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU",
    "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
    "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE",
    "SI", "SK", "TR", "UA",
];

/**
 * Filters a country holiday TypeScript module so only "National holiday" entries remain.
 * @param {string} code
 * @param {string} id
 * @returns {{ code: string, map: null } | null}
 */
function transformNationalHolidays(code, id) {
    const normalizedId = id.replace(/\\/g, "/");
    if (!COUNTRY_HOLIDAY_FILE_RE.test(normalizedId)) {
        return null;
    }

    const match = HOLIDAYS_ARRAY_RE.exec(code);
    if (!match) {
        return null;
    }

    let parsed;
    try {
        parsed = JSON.parse(match[2]);
    } catch {
        return null;
    }

    if (!Array.isArray(parsed)) {
        return null;
    }

    const filtered = parsed.filter(
        (h) =>
            typeof h === "object" &&
            h !== null &&
            Array.isArray(h.type) &&
            h.type.includes("National holiday")
    );

    const start = match.index + match[1].length;
    const end = start + match[2].length;
    const transformedCode =
        code.slice(0, start) + JSON.stringify(filtered) + code.slice(end);

    return {
        code: transformedCode,
        map: null,
    };
}

function transformEuropeYearModule(_code, id, fsModule, pathModule) {
    const normalizedId = id.replace(/\\/g, "/");
    const yearMatch = EUROPE_YEAR_FILE_RE.exec(normalizedId);
    if (!yearMatch) {
        return null;
    }

    const year = Number(yearMatch[1]);
    const yearPrefix = `${yearMatch[1]}-`;
    const prevYearStart = `${year - 1}-12-25`;
    const prevYearEnd = `${year - 1}-12-31`;
    const nextYearStart = `${year + 1}-01-01`;
    const nextYearEnd = `${year + 1}-01-07`;
    const result = {};

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

        let parsed;
        try {
            parsed = JSON.parse(arrayMatch[2]);
        } catch {
            continue;
        }
        if (!Array.isArray(parsed)) {
            continue;
        }

        const filtered = parsed.filter(
            (h) =>
                typeof h === "object" &&
                h !== null &&
                Array.isArray(h.type) &&
                h.type.includes("National holiday") &&
                typeof h.date === "string" &&
                (h.date.startsWith(yearPrefix) ||
                    (h.date >= prevYearStart && h.date <= prevYearEnd) ||
                    (h.date >= nextYearStart && h.date <= nextYearEnd))
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

module.exports = {
    transformNationalHolidays,
    transformEuropeYearModule,
};
