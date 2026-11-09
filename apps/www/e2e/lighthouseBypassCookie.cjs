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
  await page.close();
};
