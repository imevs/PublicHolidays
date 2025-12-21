import React from "react";
import styles from "./SlidingPanel.module.css";

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
    return (
        <div
            id={id}
            className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}
            role="region"
            aria-label="Actions panel"
        >
            <div className={styles.panelHeader}>
                <button
                    className={styles.toggleButton}
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-label={toggleLabel}
                    title={toggleLabel}
                >
                    <span className={styles.toggleIcon}>{isOpen ? "✕" : "⚙️"}</span>
                </button>
            </div>
            <div className={styles.panelContent}>
                {children}
            </div>
        </div>
    );
};
