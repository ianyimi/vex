const { QUALITY_ROUTES } = require("./e2e/routes.data.js");

const baseURL = process.env.QUALITY_BASE_URL ?? "http://localhost:3030";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const urls = QUALITY_ROUTES.filter((route) => !route.draft && !route.notFound).map(
  (route) => `${baseURL}${route.path}`,
);

module.exports = {
  ci: {
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
      },
      preset: "lighthouse:recommended",
    },
    collect: {
      numberOfRuns: 3,
      settings: {
        formFactor: "mobile",
        screenEmulation: { mobile: true },
        ...(bypassSecret
          ? {
              extraHeaders: {
                "x-vercel-protection-bypass": bypassSecret,
                "x-vercel-set-bypass-cookie": "true",
              },
            }
          : {}),
      },
      url: urls,
    },
    upload: { outputDir: "./.lighthouseci", target: "filesystem" },
  },
};
