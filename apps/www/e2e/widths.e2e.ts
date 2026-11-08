import { test } from "@playwright/test";

import { writeAuditJson } from "./auditJson";
import { QUALITY_ROUTES, QUALITY_WIDTHS, type QualityRoute } from "./routes";
import { settlePage } from "./settlePage";

interface OffscreenControl {
  t: string;
  l: number;
  r: number;
}

interface WidthMeasurement {
  overflowX: number;
  culpritsOutsideScrollRegions: number;
  offscreenControls: OffscreenControl[];
}

/**
 * Measures the current viewport for document-level horizontal overflow and
 * any visible, text-bearing or interactive leaf element that extends past the
 * viewport while NOT nested inside a horizontally scrollable ancestor
 * (`overflow-x: auto|scroll`) — an element inside a real scroll region is
 * reachable by scrolling and is not a culprit.
 *
 * @returns The width's overflow measurement.
 */
function measureOverflow(): WidthMeasurement {
  const interactiveTags = ["a", "button", "input", "select", "textarea"];
  const viewportWidth = document.documentElement.clientWidth;
  const overflowX =
    document.documentElement.scrollWidth > document.documentElement.clientWidth ? 1 : 0;
  const offscreenControls: OffscreenControl[] = [];

  const isScrollRegion = (element: Element) => {
    const style = window.getComputedStyle(element);
    return style.overflowX === "auto" || style.overflowX === "scroll";
  };
  const insideScrollRegion = (element: Element) => {
    let node = element.parentElement;
    while (node) {
      if (isScrollRegion(node)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  };

  const candidates = document.querySelectorAll(
    "a, button, input, select, textarea, [tabindex], [role], p, span, li, h1, h2, h3, h4, h5, h6",
  );
  for (const element of candidates) {
    if (element.children.length > 0) {
      continue;
    }
    const text = (element.textContent ?? "").trim();
    const isInteractive = interactiveTags.includes(element.tagName.toLowerCase());
    if (text.length === 0 && !isInteractive) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      continue;
    }
    if ((rect.right > viewportWidth + 1 || rect.left < -1) && !insideScrollRegion(element)) {
      offscreenControls.push({
        t: text.slice(0, 40),
        l: Math.round(rect.left),
        r: Math.round(rect.right),
      });
    }
  }

  return { overflowX, culpritsOutsideScrollRegions: offscreenControls.length, offscreenControls };
}

const routes: QualityRoute[] = QUALITY_ROUTES.filter(
  (route) => !(process.env.CI && route.draft),
);
const results: Record<string, Record<number, WidthMeasurement>> = {};

for (const route of routes) {
  test.describe(route.path, () => {
    for (const width of QUALITY_WIDTHS) {
      test(`${route.path} @${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route.path);
        await settlePage({ page });
        const measurement = await page.evaluate(measureOverflow);
        results[route.path] ??= {};
        results[route.path][width] = measurement;
      });
    }
  });
}

test.afterAll(() => {
  writeAuditJson({
    fileName: "www-width-matrix.json",
    data: {
      generated: new Date().toISOString(),
      method:
        "document.documentElement.scrollWidth vs clientWidth for overflowX; each visible, " +
        "text-bearing or interactive leaf element overflowing the viewport and not inside a " +
        "horizontally-scrollable ancestor counts toward culpritsOutsideScrollRegions, with its " +
        "trimmed text and left/right bounds recorded in offscreenControls.",
      routes: routes.map((route) => route.path),
      widths: QUALITY_WIDTHS,
      results,
      findings: [],
      fixes: [],
    },
  });
});
