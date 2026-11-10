// End-to-end tests (Stack_Decision_Record S-17): the web app at the three design widths against the running API.
// Locally they use the installed Chrome; CI installs Playwright's own Chromium.
import { defineConfig, devices } from "@playwright/test";

try { process.loadEnvFile(".env"); } catch { /* CI passes the variables directly */ }

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:5173", screenshot: "only-on-failure", ...(process.env.CI ? {} : { channel: "chrome" }) },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tablet", use: { viewport: { width: 834, height: 1112 }, hasTouch: true } },
    { name: "phone", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: [
    { command: "pnpm --filter @sgsi/api dev", url: "http://localhost:4000/api/health", reuseExistingServer: true, timeout: 60_000 },
    { command: "pnpm --filter @sgsi/web dev", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000 },
  ],
});
