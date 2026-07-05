import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const githubPagesBase = repositoryName ? `/${repositoryName}/` : "/";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? githubPagesBase,
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.WGF_BACKEND_PORT ?? "8787"}`,
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts"
  }
});
