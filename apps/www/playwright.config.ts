import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.QUALITY_BASE_URL ?? "http://localhost:3030";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/**
 * `workers: 1` + `fullyParallel: false`: every suite here aggregates its
 * results into one committed JSON file per run (`e2e/auditJson.ts`), so a
 * single worker process is what makes that aggregation race-free — these are
 * audit reports, not a latency-sensitive CI gate.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  globalTeardown: "./e2e/globalTeardown.ts",
  reporter: "list",
  use: {
    baseURL,
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
