import React, { useEffect } from "react";
import styles from "./SlidingPanel.module.css";
import { useTranslation } from "../../i18n/useTranslation.ts";

interface SlidingPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    toggleLabel: string;
    children: React.ReactNode;
    id: string;
}

/**
 * Reusable sliding panel component that slides out from the left side.
 * Panel is fixed position and appears over content.
 * @param isOpen - Controls whether panel is visible
 * @param onToggle - Callback when toggle button is clicked
 * @param toggleLabel - Label for the toggle button
 * @param children - Content to render inside the panel
 * @param id - Unique id for the panel (used for accessibility)
 */
export const SlidingPanel: React.FC<SlidingPanelProps> = ({
    isOpen,
    onToggle,
    toggleLabel,
    children,
    id,
}) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onToggle();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onToggle]);

    return (
        <>
            {isOpen && (
                <div
                    className={styles.backdrop}
                    data-testid="sliding-panel-backdrop"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}
            <div
                id={id}
                className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}
                role="region"
                aria-label={t.slidingPanel.actionsPanelAria}
            >
                <div className={styles.panelHeader}>
                    {isOpen && (
                        <span className={styles.panelTitle}>{toggleLabel}</span>
                    )}
                    <button
                        type="button"
                        className={styles.toggleButton}
                        onClick={onToggle}
                        aria-expanded={isOpen}
                        aria-label={toggleLabel}
                        title={toggleLabel}
                    >
                        <span className={styles.toggleIcon}>{isOpen ? "✕" : "⚙️"}</span>
                        {!isOpen && (
                            <span className={styles.toggleText}>{toggleLabel}</span>
                        )}
                    </button>
                </div>
                <div className={styles.panelContent}>
                    {children}
                </div>
            </div>
        </>
    );
};
