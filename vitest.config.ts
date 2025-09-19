import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@roughrefine/brand": path.resolve(__dirname, "./packages/brand/src"),
      "@roughrefine/bisync": path.resolve(__dirname, "./packages/bisync/src"),
    },
  },
});
