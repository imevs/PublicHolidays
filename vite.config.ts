import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "fs";
import path from "path";

export default ({ mode }: { mode: string }) => {
    const env = loadEnv(mode, process.cwd());

    const APP_BASE_NAME = process.env.APP_BASE_NAME || env.APP_BASE_NAME || env.VITE_APP_BASE_NAME || "PublicHolidays";

    return defineConfig({
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
            {
                name: "replace-app-base-name",
                apply: "build",
                enforce: "post",
                closeBundle() {
                    const notFoundPath = path.join(process.cwd(), `dist/${APP_BASE_NAME}/404.html`);
                    if (fs.existsSync(notFoundPath)) {
                        let content = fs.readFileSync(notFoundPath, "utf-8");
                        content = content.replace(/APP_BASE_NAME_PLACEHOLDER/g, APP_BASE_NAME);
                        fs.writeFileSync(notFoundPath, content, "utf-8");
                    }
                }
            }
        ],
        define: {
            "import.meta.env.VITE_APP_BASE_NAME": JSON.stringify(APP_BASE_NAME)
        },
        base: `/${APP_BASE_NAME}/`,
        publicDir: "./src/assets",
        build: {
            outDir: "./dist/" + APP_BASE_NAME,
        },
    });
};