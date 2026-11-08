import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

const envLocalPath = path.join(__dirname, ".env.local");
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

const baseURL = process.env.QUALITY_BASE_URL ?? "http://localhost:3020";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/**
 * Local only — nothing in `.github/workflows/` runs this project. `workers: 1`
 * for the same single-process JSON-aggregation reason as `apps/www`'s config.
 * `QUALITY_ADMIN_EMAIL`/`QUALITY_ADMIN_PASSWORD` load from `.env.local` here
 * (when present) so `e2e/globalSetup.ts`, which runs in this same process,
 * never needs them exported manually.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/globalSetup.ts",
  globalTeardown: "./e2e/globalTeardown.ts",
  reporter: "list",
  use: {
    baseURL,
    storageState: "e2e/.auth/admin.json",
    ...(bypassSecret
      ? {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": bypassSecret,
            "x-vercel-set-bypass-cookie": "true",
          },
        }
      : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
