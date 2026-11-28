/** Set once the first audited URL has had its unmeasured warm-up load. */
let warmedUp = false;

/**
 * LHCI `puppeteerScript`: runs before each audited URL and sets Vercel's
 * protection-bypass cookie (`_vercel_jwt`) in the browser Lighthouse is about
 * to use.
 *
 * Sending `x-vercel-set-bypass-cookie` from Lighthouse itself makes the audited
 * request a 307 (fails `redirects`). Sending only `x-vercel-protection-bypass`
 * leaves requests Lighthouse makes without its extra headers, such as
 * `/robots.txt`, on Vercel's login page (fails `robots-txt`). Setting the
 * cookie here, outside the measured load, covers both. Lighthouse's storage
 * reset leaves cookies alone, so the cookie is still there when the audit runs.
 *
 * Before the first URL it also loads that page once, unmeasured. The first
 * Lighthouse run of a CI job is cold: in every job checked (2026-11-28, five
 * jobs back to 8d855a4f) it scored 0.55–0.87 with 540–3040 ms TBT, against
 * 0.89–0.97 for the same page's next two runs. LHCI drives one browser for
 * every run, so loading the page here absorbs that first-run cost. Without it
 * the first route (`/`) kept only two usable runs where every other route had
 * three, and failed the performance gate on code that had passed an hour
 * earlier (release PR #101, run 46120409200).
 *
 * @param {import("puppeteer-core").Browser} browser - The browser LHCI drives.
 * @param {{ url: string }} context - The URL about to be audited.
 */
module.exports = async (browser, context) => {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    "x-vercel-set-bypass-cookie": "true",
  });
  await page.goto(new URL("/robots.txt", context.url).href);
  if (!warmedUp) {
    await page.goto(context.url, { timeout: 60_000, waitUntil: "load" });
    warmedUp = true;
  }
  await page.close();
};
