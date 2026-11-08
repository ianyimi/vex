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

// Set by e2e/lighthouseCpuSlowdown.cjs from the host's benchmarkIndex; unset,
// Lighthouse keeps its default 4x.
const cpuSlowdownMultiplier = Number(process.env.LHCI_CPU_SLOWDOWN_MULTIPLIER) || undefined;

module.exports = {
  ci: {
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        // Performance and TBT are measured with CPU throttling calibrated to a
        // mid-tier phone (see collect.settings), where hydrating every page
        // blocks for hundreds of ms today. `/` is the worst and noisiest: two
        // calibrated CI runs measured TBT 929–1362 ms per run and performance
        // 0.75–0.79, so the TBT budget sits above that spread to catch real
        // regressions, not run-to-run variance. backlog.md § Hydration cost on
        // site pages tracks bringing both back to 0.9 / 200 ms.
        "categories:performance": ["error", { minScore: 0.75 }],
        ...previewAssertions,
        // Every site page holds an open Convex WebSocket for live content, which
        // Chrome blocks from the back/forward cache ("pending browser support").
        // Reported, not gating, until the client pauses on `pagehide` — see
        // backlog.md § Back/forward cache for live-data pages.
        "bf-cache": "warn",
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 1500 }],
        // Next ships no browser source maps, and every page carries framework
        // chunks Lighthouse counts as unused. The performance budgets above
        // already gate what that JavaScript costs.
        "unused-javascript": "off",
        "valid-source-maps": "off",
      },
      preset: "lighthouse:recommended",
    },
    collect: {
      numberOfRuns: 3,
      settings: {
        formFactor: "mobile",
        screenEmulation: { mobile: true },
        ...(cpuSlowdownMultiplier ? { throttling: { cpuSlowdownMultiplier } } : {}),
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
