import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
    envDir: "../..",
    resolve: { tsconfigPaths: true },
    plugins: [tanstackStart(), tailwindcss(), devtools()],
});

export default config;
