import React, { useEffect } from "react";

/**
     * Roving tabindex fallback for toolbar when native focusgroup is unsupported.
     */
export function useToolbarRovingTabIndex(toolbarRef: React.RefObject<HTMLDivElement | null>): void {
    useEffect(() => {
        const bar = toolbarRef.current;
        if (!bar || ("focusGroup" in HTMLElement.prototype)) {
            return;
        }
        const getItems = () => Array.from(
            bar.querySelectorAll<HTMLButtonElement>("button:not([data-export-item])")
        );
        const items = getItems();
        items.forEach((b, i) => {
            b.tabIndex = i === 0 ? 0 : -1;
        });

        const onFocusIn = (e: FocusEvent) => {
            const currentItems = getItems();
            const target = e.target as HTMLButtonElement;
            if (currentItems.includes(target)) {
                currentItems.forEach(b => {
                    b.tabIndex = b === target ? 0 : -1;
                });
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const currentItems = getItems();
            const idx = currentItems.indexOf(document.activeElement as HTMLButtonElement);
            if (idx < 0) return;

            const rtl = getComputedStyle(bar).direction === "rtl";
            const steps: Record<string, number> = {
                ArrowRight: rtl ? -1 : 1,
                ArrowLeft: rtl ? 1 : -1,
            };

            let nextIdx = -1;
            if (e.key in steps) {
                nextIdx = (idx + steps[e.key] + currentItems.length) % currentItems.length;
            } else if (e.key === "Home") {
                nextIdx = 0;
            } else if (e.key === "End") {
                nextIdx = currentItems.length - 1;
            }

            if (nextIdx >= 0) {
                e.preventDefault();
                currentItems[nextIdx]?.focus();
            }
        };

        bar.addEventListener("focusin", onFocusIn);
        bar.addEventListener("keydown", onKeyDown);
        return () => {
            bar.removeEventListener("focusin", onFocusIn);
            bar.removeEventListener("keydown", onKeyDown);
        };
    }, [toolbarRef]);
}
