import { AxeBuilder } from "@axe-core/playwright";
import { test } from "@playwright/test";

import { discoverAdminRoutes, QUALITY_THEMES } from "./adminRoutes";
import { writeAuditJson } from "./auditJson";
import { settlePage } from "./settlePage";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const THEME_STORAGE_KEY = "vex-theme";

interface RouteAxeResult {
  path: string;
  theme: (typeof QUALITY_THEMES)[number];
  violations: unknown[];
}

const results: RouteAxeResult[] = [];

test.describe.configure({ timeout: 10 * 60_000 });

for (const theme of QUALITY_THEMES) {
  test(`admin — ${theme}`, async ({ page }) => {
    await page.addInitScript(
      (entry) => {
        window.localStorage.setItem(entry.key, entry.value);
      },
      { key: THEME_STORAGE_KEY, value: theme },
    );
    const routes = await discoverAdminRoutes({ page });
    for (const routePath of routes) {
      await page.goto(routePath);
      await settlePage({ page });
      const axeResults = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      results.push({ path: routePath, theme, violations: axeResults.violations });
    }
  });
}

test.afterAll(() => {
  writeAuditJson({
    fileName: "admin-axe.json",
    data: {
      generated: new Date().toISOString(),
      baseURL: process.env.QUALITY_BASE_URL ?? "http://localhost:3020",
      tags: AXE_TAGS,
      results,
    },
  });
});
