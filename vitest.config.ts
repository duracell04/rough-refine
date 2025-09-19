import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

const webRoot = path.resolve(__dirname, "apps/web");

export default defineConfig({
  root: webRoot,
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    globals: true,
    css: false,
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(webRoot, "src"),
      "@roughrefine/brand": path.resolve(__dirname, "packages/brand/src"),
      "@roughrefine/bisync": path.resolve(__dirname, "packages/bisync/src"),
    },
  },
});
