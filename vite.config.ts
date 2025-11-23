import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export const APP_BASE_NAME = "PublicHolidays";

export default defineConfig({
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: "./src/assets/404.html",
                    dest: "./"
                },
            ]
        }),
    ],
    base: `/${APP_BASE_NAME}/`,
    publicDir: "./src/assets",
    build: {
        outDir: "./dist/" + APP_BASE_NAME,
    },
});
