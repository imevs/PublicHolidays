const COUNTRY_HOLIDAY_FILE_RE = /src\/data\/holidays_v2\/[A-Z]{2}\.ts$/;
const HOLIDAYS_ARRAY_RE = /(holidays:\s*)(\[[\s\S]*\])(\s*\}\s*as const;?)/;

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

module.exports = {
    transformNationalHolidays,
};
