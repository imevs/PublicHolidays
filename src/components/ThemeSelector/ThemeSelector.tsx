import React, { useEffect, useState } from "react";
import type { ThemeId } from "../../i18n/types.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import styles from "./ThemeSelector.module.css";

export interface Theme {
    id: ThemeId;
    icon: string;
}

const themes: Theme[] = [
    { id: "neutral", icon: "⚪" },
    { id: "dark", icon: "🌙" },
    { id: "ocean", icon: "🌊" },
    { id: "sunset", icon: "🌅" },
    { id: "ios", icon: "🍎" },
    { id: "material", icon: "🔷" },
    { id: "creme", icon: "☕" },
    { id: "pencil", icon: "✏️" },
    { id: "seasonal", icon: "🌍" },
    { id: "lightblue", icon: "❄️" },
    { id: "brightblue", icon: "❅" },
];

const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME: ThemeId = "neutral";

/**
 * Self-contained theme selector component that manages theme state,
 * localStorage persistence, and DOM updates internally.
 */
export const ThemeSelector: React.FC = () => {
    const { t } = useTranslation();
    // Initialize theme from localStorage or use default
    const [currentTheme, setCurrentTheme] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (saved && themes.some(t => t.id === saved)) {
                return saved;
            }
            return DEFAULT_THEME;
        } catch (error) {
            console.error("Failed to read theme from localStorage:", error);
            return DEFAULT_THEME;
        }
    });

    // Apply theme to DOM and save to localStorage whenever it changes
    useEffect(() => {
        // Update data-theme attribute on document root
        document.documentElement.setAttribute("data-theme", currentTheme);

        // Save to localStorage
        try {
            localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
        } catch (error) {
            console.error("Failed to save theme to localStorage:", error);
        }
    }, [currentTheme]);

    const handleThemeChange = (newTheme: string) => {
        setCurrentTheme(newTheme);
    };

    // const currentThemeData = themes.find(t => t.id === currentTheme) || themes[0];

    return (
        <div className={styles.themeSelector}>
            <label htmlFor="theme-select" className={styles.label}>
                <span className={styles.labelText}>{t.themeSelector.label}</span>
            </label>
            <select
                id="theme-select"
                value={currentTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className={styles.select}
                aria-label={t.themeSelector.ariaLabel}
            >
                {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                        {theme.icon} {t.themeSelector.themes[theme.id]}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ThemeSelector;