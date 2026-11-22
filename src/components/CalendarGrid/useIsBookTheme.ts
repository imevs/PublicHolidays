import { useEffect, useState } from "react";

function getIsBookTheme(): boolean {
    if (typeof document === "undefined") {
        return false;
    }
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr !== null) {
        return attr === "book";
    }
    try {
        return typeof localStorage !== "undefined" && localStorage.getItem("theme") === "book";
    } catch {
        return false;
    }
}

export function useIsBookTheme(): boolean {
    const [isBookTheme, setIsBookTheme] = useState<boolean>(getIsBookTheme);

    useEffect(() => {
        setIsBookTheme(getIsBookTheme());

        if (typeof MutationObserver === "undefined") {
            return;
        }

        const observer = new MutationObserver(() => {
            setIsBookTheme(getIsBookTheme());
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, []);

    return isBookTheme;
}
