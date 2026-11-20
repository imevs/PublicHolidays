import type React from "react";

/**
 * Invokes `callback` on Enter or Space keydown for interactive non-button elements.
 */
export function handleKeyboardActivation(
    e: React.KeyboardEvent,
    callback: () => void,
    options?: { selfOnly?: boolean; stopPropagation?: boolean },
): void {
    if (options?.selfOnly && e.target !== e.currentTarget) {
        return;
    }
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (options?.stopPropagation) {
            e.stopPropagation();
        }
        callback();
    }
}
