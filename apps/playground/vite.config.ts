import { URL, fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@bunstack/core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
      "@bunstack/utils": fileURLToPath(
        new URL("../../packages/utils/src/index.ts", import.meta.url),
      ),
      "@bunstack/hooks": fileURLToPath(
        new URL("../../packages/hooks/src/index.ts", import.meta.url),
      ),
      "@nktkas/hyperliquid": fileURLToPath(
        new URL(
          "../../../../88ups-interface/node_modules/@nktkas/hyperliquid",
          import.meta.url,
        ),
      ),
    },
  },
});
