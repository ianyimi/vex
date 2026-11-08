import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { auditFragmentsDir, writeAuditFragment } from "./auditJson";
import { QUALITY_ROUTES, QUALITY_THEMES, type QualityRoute } from "./routes";
import { settlePage } from "./settlePage";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const THEME_STORAGE_KEY = "vex-theme";
const FRAGMENTS_DIR = auditFragmentsDir({ testDir: __dirname, suite: "www-axe" });

interface RouteAxeResult {
  path: string;
  theme: (typeof QUALITY_THEMES)[number];
  status: number | null;
  violations: unknown[];
}

const routes: QualityRoute[] = QUALITY_ROUTES.filter(
  (route) => !(process.env.CI && route.draft),
);

for (const route of routes) {
  for (const theme of QUALITY_THEMES) {
    test(`${route.path} — ${theme}`, async ({ page }) => {
      await page.addInitScript(
        (entry) => {
          window.localStorage.setItem(entry.key, entry.value);
        },
        { key: THEME_STORAGE_KEY, value: theme },
      );
      const response = await page.goto(route.path);
      await settlePage({ page });
      const axeResults = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      const result: RouteAxeResult = {
        path: route.path,
        theme,
        status: response?.status() ?? null,
        violations: axeResults.violations,
      };
      writeAuditFragment({
        dir: FRAGMENTS_DIR,
        id: `${route.path.replace(/\//g, "_")}-${theme}`,
        data: result,
      });
      if (!route.draft) {
        expect(response?.status(), `${route.path} HTTP status`).toBe(
          route.notFound ? 404 : 200,
        );
      }
      expect(axeResults.violations, JSON.stringify(axeResults.violations, null, 2)).toEqual([]);
    });
  }
}
