declare global {
    interface ImportMetaEnv {
        readonly VITE_APP_BASE_NAME?: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

export {};
