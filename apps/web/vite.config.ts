import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
    envDir: "../..",
    resolve: { tsconfigPaths: true },
    plugins: [tanstackStart(), nitro(), tailwindcss(), devtools(), viteReact()],
});

export default config;
