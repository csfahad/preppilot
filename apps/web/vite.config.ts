import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
    envDir: "../..",
    resolve: { tsconfigPaths: true },
    plugins: [tanstackStart(), tailwindcss(), devtools(), nitro()],
});

export default config;
