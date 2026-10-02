import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths, so the same build runs at a site root or in a
  // subfolder (greycell.app serves it from /run/open-dice/).
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@open-dice/dice-engine": fileURLToPath(new URL("../../packages/dice-engine/src/index.ts", import.meta.url)),
      "@open-dice/dice-notation": fileURLToPath(new URL("../../packages/dice-notation/src/index.ts", import.meta.url)),
    },
  },
});
