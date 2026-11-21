import React from "react";
import { SUPPORTED_LANGUAGES } from "../../i18n/locales/index.ts";
import type { LanguageCode } from "../../i18n/types.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import styles from "./LanguageSelector.module.css";

export const LanguageSelector: React.FC = () => {
    const { language, setLanguage, t } = useTranslation();

    return (
        <div className={styles.languageSelector}>
            <label htmlFor="language-select" className={styles.label}>
                <span className={styles.icon} aria-hidden="true">🌐</span>
                <span className={styles.labelText}>{t.languageSelector.label}</span>
            </label>
            <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className={styles.select}
                aria-label={t.languageSelector.ariaLabel}
            >
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} lang={lang.code}>
                        {lang.flag} {lang.nativeName}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;
