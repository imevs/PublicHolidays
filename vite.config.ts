import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "fs";
import path from "path";
import { transformNationalHolidays, transformEuropeYearModule } from "./src/utils/filterNationalHolidays";

export function filterNationalHolidaysPlugin(): Plugin {
    return {
        name: "filter-national-holidays",
        enforce: "pre",
        transform(code, id) {
            return transformEuropeYearModule(code, id, fs, path) ?? transformNationalHolidays(code, id);
        },
    };
}

export default ({ mode }: { mode: string }) => {
    const env = loadEnv(mode, process.cwd());

    const APP_BASE_NAME = process.env.APP_BASE_NAME || env.APP_BASE_NAME || env.VITE_APP_BASE_NAME || "PublicHolidays";

    return defineConfig({
        plugins: [
            filterNationalHolidaysPlugin(),
            react(),
            viteStaticCopy({
                targets: [
                    {
                        src: "./src/assets/404.html",
                        dest: "../"
                    },
                ]
            }),
            {
                name: "replace-app-base-name",
                apply: "build",
                enforce: "post",
                closeBundle() {
                    const targets = [
                        path.join(process.cwd(), "dist/404.html"),
                        path.join(process.cwd(), "dist", APP_BASE_NAME, "404.html"),
                    ];
                    for (const filePath of targets) {
                        if (fs.existsSync(filePath)) {
                            let content = fs.readFileSync(filePath, "utf-8");
                            content = content.replace(/APP_BASE_NAME_PLACEHOLDER/g, APP_BASE_NAME);
                            fs.writeFileSync(filePath, content, "utf-8");
                        }
                    }
                }
            }
        ],
        define: {
            "process.env.APP_BASE_NAME": JSON.stringify(APP_BASE_NAME),
            __APP_BASE_NAME__: JSON.stringify(APP_BASE_NAME),
        },
        base: `/${APP_BASE_NAME}/`,
        publicDir: "./src/assets",
        build: {
            outDir: "./dist/" + APP_BASE_NAME,
        },
    });
};