import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

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
    base: "/PublicHolidays/",
    build: {
        outDir: "./dist/PublicHolidays",
    },
});
