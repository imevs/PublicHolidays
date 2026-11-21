import { createContext } from "react";
import type { LanguageCode } from "./types.ts";
import { DEFAULT_LANGUAGE, isSupportedLanguage, LANGUAGE_STORAGE_KEY } from "./locales/index.ts";

export interface LanguageContextValue {
    language: LanguageCode;
    setLanguage: (language: LanguageCode) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

let memoryLanguage: LanguageCode = DEFAULT_LANGUAGE;
let storageWriteFailed = false;
const listeners = new Set<() => void>();

export function getLanguageSnapshot(): LanguageCode {
    if (storageWriteFailed) {
        return memoryLanguage;
    }
    try {
        if (typeof localStorage !== "undefined") {
            const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (isSupportedLanguage(saved)) {
                memoryLanguage = saved;
                return saved;
            }
            memoryLanguage = DEFAULT_LANGUAGE;
            return DEFAULT_LANGUAGE;
        }
    } catch {
        return memoryLanguage;
    }
    return memoryLanguage;
}

export function setStoredLanguage(nextLanguage: LanguageCode): void {
    if (!isSupportedLanguage(nextLanguage)) {
        return;
    }
    memoryLanguage = nextLanguage;
    try {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
            storageWriteFailed = localStorage.getItem(LANGUAGE_STORAGE_KEY) !== nextLanguage;
        } else {
            storageWriteFailed = false;
        }
    } catch {
        storageWriteFailed = true;
    }
    if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.lang = nextLanguage;
    }
    listeners.forEach((listener) => listener());
}

export function subscribeLanguage(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
