import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? [["line"]] : [["list"]],
  use: {
    baseURL: process.env.E2E_API_URL || "http://127.0.0.1:5000",
    extraHTTPHeaders: { Accept: "application/json" },
  },
});
