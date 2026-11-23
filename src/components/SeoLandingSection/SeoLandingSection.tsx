import React from "react";
import { useNavigate } from "react-router";
import { APP_BASE_NAME } from "../../consts.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import styles from "./SeoLandingSection.module.css";

interface SeoLandingSectionProps {
    activeRoute: "Holidays" | "EditEvents";
    onHighlightLongHolidays?: () => void;
}

interface PresetConfig {
    key: "baltic" | "dach" | "ukUsCa" | "nordic" | "westernEurope" | "southernEurope" | "asiaPacific";
    countries: string;
}

const PRESETS: readonly PresetConfig[] = [
    { key: "baltic", countries: "LV,EE,LT" },
    { key: "dach", countries: "DE,AT,CH" },
    { key: "ukUsCa", countries: "GB,US,CA" },
    { key: "nordic", countries: "SE,NO,FI,DK,IS" },
    { key: "westernEurope", countries: "FR,DE,NL,BE,LU" },
    { key: "southernEurope", countries: "ES,IT,PT,GR" },
    { key: "asiaPacific", countries: "JP,KR,AU,NZ,IN" },
];

export const SeoLandingSection: React.FC<SeoLandingSectionProps> = ({
    activeRoute,
    onHighlightLongHolidays,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const seo = t.seoLanding;

    const features = [
        {
            key: "multiCountry",
            title: seo.features.multiCountryTitle,
            desc: seo.features.multiCountryDesc,
        },
        {
            key: "longWeekends",
            title: seo.features.longWeekendsTitle,
            desc: seo.features.longWeekendsDesc,
        },
        {
            key: "printableExport",
            title: seo.features.printableExportTitle,
            desc: seo.features.printableExportDesc,
        },
        {
            key: "customBuilder",
            title: seo.features.customBuilderTitle,
            desc: seo.features.customBuilderDesc,
        },
    ];

    const faqs = [
        {
            question: seo.faqs.compareQuestion,
            answer: seo.faqs.compareAnswer,
        },
        {
            question: seo.faqs.longWeekendsQuestion,
            answer: seo.faqs.longWeekendsAnswer,
        },
        {
            question: seo.faqs.exportPrintQuestion,
            answer: seo.faqs.exportPrintAnswer,
        },
        {
            question: seo.faqs.customCalendarQuestion,
            answer: seo.faqs.customCalendarAnswer,
        },
    ];

    const handlePresetClick = (e: React.MouseEvent<HTMLAnchorElement>, countries: string) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.hash.replace("#", ""));
        params.set("countries", countries);
        const nextHash = decodeURIComponent(params.toString());

        sessionStorage.setItem("skipMonthScroll", "1");
        if (activeRoute === "EditEvents") {
            navigate(`/${APP_BASE_NAME}/Holidays#${nextHash}`);
        } else {
            window.location.hash = nextHash;
        }
    };

    const handleLongWeekendsClick = () => {
        if (onHighlightLongHolidays) {
            onHighlightLongHolidays();
            return;
        }
        if (activeRoute === "EditEvents") {
            sessionStorage.setItem("enableLongHolidays", "1");
            navigate(`/${APP_BASE_NAME}/Holidays${window.location.hash}`);
        }
    };

    return (
        <section className={styles.seoSection} aria-label={seo.sectionAriaLabel}>
            <div className={styles.sectionInner}>
                <div>
                    <h2 className={styles.sectionHeading}>{seo.featuresHeading}</h2>
                    <div className={styles.featuresGrid}>
                        {features.map((feature) => (
                            <article key={feature.key} className={styles.featureCard}>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDesc}>{feature.desc}</p>
                                {feature.key === "longWeekends" && (
                                    <button
                                        type="button"
                                        className={styles.featureActionButton}
                                        onClick={handleLongWeekendsClick}
                                    >
                                        {t.countryFilter.highlightLongHolidays}
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className={styles.subHeading}>{seo.presetsHeading}</h3>
                    <p className={styles.presetsDesc}>{seo.presetsDesc}</p>
                    <div className={styles.presetsList}>
                        {PRESETS.map((preset) => (
                            <a
                                key={preset.key}
                                href={`/${APP_BASE_NAME}/Holidays#countries=${preset.countries}`}
                                className={styles.presetPill}
                                onClick={(e) => handlePresetClick(e, preset.countries)}
                            >
                                <span>{seo.presets[preset.key]}</span>
                                <span className={styles.presetCodes}>{preset.countries}</span>
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className={styles.subHeading}>{seo.faqHeading}</h3>
                    <div className={styles.faqList}>
                        {faqs.map((faq) => (
                            <details key={faq.question} className={styles.faqItem}>
                                <summary className={styles.faqQuestion}>{faq.question}</summary>
                                <p className={styles.faqAnswer}>{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
