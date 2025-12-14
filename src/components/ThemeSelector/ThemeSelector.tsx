import React, { useEffect, useState } from "react";
import styles from "./ThemeSelector.module.css";

export interface Theme {
    id: string;
    name: string;
    icon: string;
}

export const themes: Theme[] = [
    { id: "neutral", name: "Neutral", icon: "⚪" },
    { id: "vibrant", name: "Vibrant", icon: "🎨" },
    { id: "dark", name: "Dark", icon: "🌙" },
    { id: "ocean", name: "Ocean", icon: "🌊" },
    { id: "sunset", name: "Sunset", icon: "🌅" },
    { id: "ios", name: "iOS", icon: "🍎" },
    { id: "material", name: "Material", icon: "🔷" },
];

const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME = "neutral";

/**
 * Self-contained theme selector component that manages theme state,
 * localStorage persistence, and DOM updates internally.
 */
export const ThemeSelector: React.FC = () => {
    // Initialize theme from localStorage or use default
    const [currentTheme, setCurrentTheme] = useState<string>(() => {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
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
                <span className={styles.labelText}>Theme</span>
            </label>
            <select
                id="theme-select"
                value={currentTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className={styles.select}
                aria-label="Select theme"
            >
                {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                        {theme.icon} {theme.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ThemeSelector;
