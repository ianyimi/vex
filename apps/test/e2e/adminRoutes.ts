import { expect, type Page } from "@playwright/test";

/**
 * Same width set `apps/www/e2e/routes.ts` audits, kept local to `apps/test`
 * since the two apps share no TypeScript path between their `e2e/` trees.
 */
export const QUALITY_WIDTHS = [375, 390, 640, 767, 768, 769, 1024, 1280, 1536] as const;

export { QUALITY_THEMES } from "./routes";

/**
 * Discovers every admin route reachable from the running admin's own
 * navigation, rather than importing `vex.config` — Playwright's CommonJS test
 * transform cannot `require()` the app's ESM-only workspace packages
 * (`@vexcms/better-auth/client`'s `exports` map declares no `require`
 * condition, by design).
 *
 * Collects the dashboard (`/admin`), every link inside the sidebar nav
 * (`packages/react/src/admin/AdminSidebar.tsx`'s `[data-slot="sidebar"]`,
 * which links every readable collection, media collection and global), and,
 * per discovered collection list route, the create-modal route
 * (`ListViewCreateAction.tsx`'s `+ New …` button, when enabled) and the
 * first row's edit route (`ListViewRowOpenAction.tsx`'s `Edit` menu item,
 * opened via that row's `[data-slot="row-actions"]` trigger).
 *
 * @param props - Input props.
 * @param props.page - An authenticated Playwright page.
 * @returns Every discovered admin route, deduplicated and sorted.
 */
export async function discoverAdminRoutes(props: { page: Page }): Promise<string[]> {
  const { page } = props;
  const routes = new Set<string>(["/admin"]);

  await page.goto("/admin");
  const navLinks = page.locator('[data-slot="sidebar"] a[href^="/admin"]');
  await navLinks.first().waitFor();
  const navHrefs = await navLinks.evaluateAll((elements) =>
    elements.map((element) => new URL((element as HTMLAnchorElement).href).pathname),
  );
  expect(navHrefs.length, "admin sidebar rendered no /admin links").toBeGreaterThan(0);
  for (const href of navHrefs) {
    routes.add(href);
  }

  const collectionRoutes = navHrefs.filter((href) => href.startsWith("/admin/collections/"));
  for (const collectionRoute of collectionRoutes) {
    await page.goto(collectionRoute);
    await expect(page.locator('tbody [data-slot="row-actions"] button[disabled]')).toHaveCount(0);

    const createButton = page.getByRole("button", { name: /^\+ New /i });
    if ((await createButton.count()) > 0 && (await createButton.isEnabled())) {
      routes.add(`${collectionRoute}?createNew=true`);
    }

    const rowActionsTrigger = page
      .locator("table tbody tr")
      .first()
      .locator('[data-slot="row-actions"] button');
    if ((await rowActionsTrigger.count()) > 0) {
      await rowActionsTrigger.click();
      const editMenuItem = page.getByRole("menuitem", { name: "Edit" });
      if ((await editMenuItem.count()) > 0) {
        const editHref = await editMenuItem.getAttribute("href");
        if (editHref) {
          routes.add(editHref);
        }
      }
      await page.keyboard.press("Escape");
    }
  }

  return Array.from(routes).sort();
}
