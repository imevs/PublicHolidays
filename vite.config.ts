import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

import { APP_BASE_NAME } from "./src/consts";

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
    build: {
        outDir: "./dist/" + APP_BASE_NAME,
    },
});
