import React, { useEffect, useMemo, useSyncExternalStore } from "react";
import {
    getLanguageSnapshot,
    LanguageContext,
    setStoredLanguage,
    subscribeLanguage,
} from "./languageStore.ts";
import { DEFAULT_LANGUAGE } from "./locales/index.ts";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const language = useSyncExternalStore(
        subscribeLanguage,
        getLanguageSnapshot,
        () => DEFAULT_LANGUAGE
    );

    useEffect(() => {
        if (typeof document !== "undefined" && document.documentElement) {
            document.documentElement.lang = language;
        }
    }, [language]);

    const value = useMemo(() => ({
        language,
        setLanguage: setStoredLanguage,
    }), [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
