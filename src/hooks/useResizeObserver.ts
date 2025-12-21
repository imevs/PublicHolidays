import { useEffect, useRef, useState } from "react";

/**
 * Hook that detects if a container element width is below a specified breakpoint.
 * Uses ResizeObserver to react to container size changes (not just window resizes).
 * @param breakpoint - Width threshold in pixels (default: 600)
 * @returns boolean - true if container width is below breakpoint
 */
export function useResizeObserver(breakpoint: number = 600): [boolean, React.RefObject<HTMLDivElement>] {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNarrow, setIsNarrow] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                setIsNarrow(width < breakpoint);
            }
        });

        observer.observe(container);

        // Initial check
        const initialWidth = container.offsetWidth;
        setIsNarrow(initialWidth < breakpoint);

        return () => {
            observer.disconnect();
        };
    }, [breakpoint]);

    return [isNarrow, containerRef];
}
