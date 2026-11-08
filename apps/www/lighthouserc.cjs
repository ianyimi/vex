const { QUALITY_ROUTES } = require("./e2e/routes.data.js");

const baseURL = process.env.QUALITY_BASE_URL ?? "http://localhost:3030";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const urls = QUALITY_ROUTES.filter((route) => !route.draft && !route.notFound).map(
  (route) => `${baseURL}${route.path}`,
);

// Every Vercel deployment except production carries `x-robots-tag: noindex`,
// so `is-crawlable` can never pass on one, and it caps the SEO category at
// about 0.66. The preset still asserts every other SEO audit individually.
const previewAssertions = bypassSecret
  ? { "categories:seo": "off", "is-crawlable": "off" }
  : { "categories:seo": ["error", { minScore: 0.9 }] };

module.exports = {
  ci: {
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:performance": ["error", { minScore: 0.9 }],
        ...previewAssertions,
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        // Next ships no browser source maps, and every page carries framework
        // chunks Lighthouse counts as unused. The performance budgets above
        // already gate what that JavaScript costs.
        "unused-javascript": "off",
        "valid-source-maps": "off",
        // Every site page holds an open Convex WebSocket for live content, which
        // Chrome blocks from the back/forward cache ("pending browser support").
        // Reported, not gating, until the client pauses on `pagehide` — see
        // backlog.md § Back/forward cache for live-data pages.
        "bf-cache": "warn",
      },
      preset: "lighthouse:recommended",
    },
    collect: {
      numberOfRuns: 3,
      settings: {
        formFactor: "mobile",
        screenEmulation: { mobile: true },
        ...(bypassSecret
          ? { extraHeaders: { "x-vercel-protection-bypass": bypassSecret } }
          : {}),
      },
      ...(bypassSecret ? { puppeteerScript: "./e2e/lighthouseBypassCookie.cjs" } : {}),
      url: urls,
    },
    upload: { outputDir: "./.lighthouseci", target: "filesystem" },
  },
};
