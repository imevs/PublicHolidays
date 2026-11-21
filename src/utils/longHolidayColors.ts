import type React from "react";
import type { CountryCode } from "../data/countryNames.ts";
import { getFlagEmoji } from "./countryFlags.ts";

export const LONG_HOLIDAY_PALETTE = [
    "#f59e0b",
    "#0ea5e9",
    "#10b981",
    "#ec4899",
    "#8b5cf6",
    "#ef4444",
] as const;

export function getLongHolidayStyle(
    colors?: string[],
    isYearView = false,
): React.CSSProperties | undefined {
    if (!colors || colors.length === 0) {
        return undefined;
    }
    const style: Record<string, string> = {
        "--long-holiday-color": colors[0],
    };
    if (colors.length > 1) {
        const stops = colors.map((c, idx) => {
            const start = Math.round((idx / colors.length) * 100);
            const end = Math.round(((idx + 1) / colors.length) * 100);
            return `color-mix(in srgb, ${c} 22%, transparent) ${start}%, color-mix(in srgb, ${c} 22%, transparent) ${end}%`;
        });
        style.backgroundImage = `linear-gradient(135deg, ${stops.join(", ")})`;
        style.boxShadow = colors
            .map((c, idx) => `inset 0 ${(isYearView ? -1 : 1) * (idx + 1) * 2}px 0 ${c}`)
            .join(", ");
    }
    return style as React.CSSProperties;
}

export function getLongHolidayTooltip(
    details: { countryCode?: string; days: number }[] | undefined,
    getCountryName: (code: CountryCode, fallback?: string) => string,
    format: (template: string, vars: Record<string, string | number>) => string,
    template: string,
    customTemplate: string,
): string | undefined {
    if (!details || details.length === 0) {
        return undefined;
    }
    return details
        .map((detail) => detail.countryCode
            ? format(template, {
                country: `${getFlagEmoji(detail.countryCode as CountryCode)} ${getCountryName(detail.countryCode as CountryCode, detail.countryCode)}`,
                days: detail.days,
            })
            : format(customTemplate, { days: detail.days }))
        .join("\n");
}

