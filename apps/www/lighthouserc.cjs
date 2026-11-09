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

const assertions = {
  "categories:accessibility": ["error", { minScore: 1 }],
  "categories:best-practices": ["error", { minScore: 0.9 }],
  // Performance and LCP gate at the real targets: at Lighthouse's default
  // 4x they have passed on every CI run since the per-module split.
  // TBT alone swings with the runner's CPU (143–371 ms across routes on
  // one run, 8–77 ms on a fast Mac), so it warns and shows per route in
  // the job summary; today's site pages miss it on hydration cost
  // (backlog.md § Hydration cost on site pages).
  "categories:performance": ["error", { minScore: 0.9 }],
  ...previewAssertions,
  // Every site page holds an open Convex WebSocket for live content, which
  // Chrome blocks from the back/forward cache ("pending browser support").
  // Reported, not gating, until the client pauses on `pagehide` — see
  // backlog.md § Back/forward cache for live-data pages.
  "bf-cache": "warn",
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
  "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
  "total-blocking-time": ["warn", { maxNumericValue: 200 }],
  // Next ships no browser source maps, and every page carries framework
  // chunks Lighthouse counts as unused. CI's Site Bundle Budget step
  // gates what that JavaScript weighs.
  "unused-javascript": "off",
  "valid-source-maps": "off",
};

// `/tour` is the only audited page whose LCP element is an image (a
// screenshot). Lighthouse's simulation charges it every script requested
// before it painted, so its LCP flips between ~1.8 s and ~4.4 s with server
// response time while the observed paint stays ~200 ms. It warns there; every
// text-LCP route keeps the hard gate. The patterns are disjoint because LHCI
// evaluates each matrix entry on its own.
const TOUR_URL = "/tour/?$";

module.exports = {
  ci: {
    assert: {
      assertMatrix: [
        {
          assertions,
          matchingUrlPattern: `^(?!.*${TOUR_URL})`,
          preset: "lighthouse:recommended",
        },
        {
          assertions: {
            ...assertions,
            "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
          },
          matchingUrlPattern: TOUR_URL,
          preset: "lighthouse:recommended",
        },
      ],
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
