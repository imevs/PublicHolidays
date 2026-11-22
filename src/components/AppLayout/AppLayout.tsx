import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import styles from "../../Holidays.module.css";
import LanguageSelector from "../LanguageSelector/LanguageSelector.tsx";
import ThemeSelector from "../ThemeSelector/ThemeSelector.tsx";
import { APP_BASE_NAME } from "../../consts.ts";
import { updatePageMetadata } from "../../utils/seo.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";

export interface AppLayoutProps {
    title: string;
    subtitle: string;
    documentTitle: string;
    description: string;
    keywords: string;
    activeRoute: "Holidays" | "EditEvents";
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    title,
    subtitle,
    documentTitle,
    description,
    keywords,
    activeRoute,
    children,
}) => {
    const navigate = useNavigate();
    const { language, t } = useTranslation();

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
        updatePageMetadata({
            title: documentTitle,
            description,
            keywords,
        });
    }, [documentTitle, description, keywords]);

    return (
        <div className={styles.app}>
            <div className={styles.topUtilityBar}>
                <LanguageSelector />
                <ThemeSelector />
            </div>
            <header className={styles.header}>
                <h1>
                    <a href="./">
                        🌍 {title}
                    </a>
                </h1>
                <p>{subtitle}</p>
                <nav className={styles.primaryNav} aria-label={t.app.navAriaLabel}>
                    <a
                        href={`/${APP_BASE_NAME}/Holidays`}
                        aria-current={activeRoute === "Holidays" ? "page" : undefined}
                        className={styles.navLink}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${APP_BASE_NAME}/Holidays${window.location.hash}`);
                        }}
                    >
                        🌍 {t.app.navPublicHolidays}
                    </a>
                    <a
                        href={`/${APP_BASE_NAME}/EditEvents`}
                        aria-current={activeRoute === "EditEvents" ? "page" : undefined}
                        className={styles.navLink}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${APP_BASE_NAME}/EditEvents${window.location.hash}`);
                        }}
                    >
                        ✏️ {t.app.navCustomEvents}
                    </a>
                </nav>
            </header>

            <div className={styles.container}>
                {children}
            </div>
        </div>
    );
};
