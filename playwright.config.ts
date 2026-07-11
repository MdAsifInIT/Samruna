import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const browserExecutablePath = process.env.E2E_BROWSER_EXECUTABLE;
const dbPath = ".samruna/playwright-e2e.sqlite";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: browserExecutablePath ? { executablePath: browserExecutablePath } : undefined
      }
    }
  ],
  webServer: {
    command: `node --import tsx server/index.ts --serve-static --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    env: {
      SAMRUNA_DB_PATH: dbPath,
      SAMRUNA_RATE_LIMIT_GENERAL_PER_MINUTE: "10000",
      SAMRUNA_RATE_LIMIT_MUTATIONS_PER_MINUTE: "10000",
      SAMRUNA_RATE_LIMIT_EXPENSIVE_SESSION_PER_10_MINUTES: "10000",
      SAMRUNA_RATE_LIMIT_EXPENSIVE_IP_PER_10_MINUTES: "10000"
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
