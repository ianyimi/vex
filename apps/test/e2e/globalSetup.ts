import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.QUALITY_BASE_URL ?? "http://localhost:3020";
const ADMIN_EMAIL = process.env.QUALITY_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.QUALITY_ADMIN_PASSWORD;
const STORAGE_STATE_PATH = path.join(__dirname, ".auth", "admin.json");

/**
 * Signs the quality-pass admin in and saves the session so every
 * `adminAxe`/`adminWidths` test starts authenticated.
 *
 * `apps/test` seeds no user, so the admin account is created by hand once and
 * its credentials live in `apps/test/.env.local` as `QUALITY_ADMIN_EMAIL` /
 * `QUALITY_ADMIN_PASSWORD` (loaded by `playwright.config.ts`).
 *
 * @returns Resolves once the session is saved.
 * @throws {Error} When the credentials are missing, sign-in fails, or the
 *   signed-in user is not an admin.
 */
export default async function globalSetup(): Promise<void> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set QUALITY_ADMIN_EMAIL and QUALITY_ADMIN_PASSWORD in apps/test/.env.local.");
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: BASE_URL });

  await page.goto("/auth/sign-in");
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^(login|sign in)$/i }).click();
  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/"), { timeout: 15_000 });
  } catch {
    await browser.close();
    throw new Error(
      `Signing in as ${ADMIN_EMAIL} on ${BASE_URL} failed — check QUALITY_ADMIN_EMAIL / ` +
        "QUALITY_ADMIN_PASSWORD in apps/test/.env.local.",
    );
  }

  await page.goto("/admin/collections");
  if (!new URL(page.url()).pathname.startsWith("/admin")) {
    await browser.close();
    throw new Error(
      `${ADMIN_EMAIL} signed in but /admin/collections redirected to ${page.url()} — the user ` +
        "isn't an admin on this deployment (promote it from an existing admin's user-management " +
        "view) or the backend is unreachable.",
    );
  }

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
