/**
 * Renders the LHCI results in `.lighthouseci/` as a Markdown job summary: one
 * row per audited URL (best and worst of its runs for the budgeted metrics),
 * then every failed `error`-level assertion and every missed timing target
 * (those warn rather than fail). Appends to
 * `$GITHUB_STEP_SUMMARY` when set, otherwise prints to stdout. The full
 * per-run HTML/JSON reports ship separately as the `lighthouse-reports`
 * artifact.
 */
const { appendFileSync, existsSync, readdirSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

const resultsDir = join(__dirname, "..", ".lighthouseci");

// Timing budgets lighthouserc.cjs reports as warnings instead of failing (TBT
// everywhere, LCP on `/tour`); only warn-level misses are listed here.
const TIMING_AUDITS = new Set(["largest-contentful-paint", "total-blocking-time"]);

/**
 * Formats the spread of one metric across runs as `best` or `best–worst`.
 *
 * @param {number[]} values - One value per run.
 * @param {(value: number) => string} format - Renders a single value.
 * @param {"low" | "high"} better - Which end of the range is the better run.
 * @returns {string} The rendered range.
 */
function range(values, format, better) {
  const sorted = [...values].sort((a, b) => a - b);
  const [best, worst] = better === "low" ? [sorted[0], sorted.at(-1)] : [sorted.at(-1), sorted[0]];
  return format(best) === format(worst) ? format(best) : `${format(best)}–${format(worst)}`;
}

/**
 * Builds the summary Markdown from the LHRs and assertion results on disk.
 *
 * @returns {string} The Markdown document.
 */
function renderSummary() {
  if (!existsSync(resultsDir)) return "## Lighthouse\n\nNo `.lighthouseci/` results were written.\n";

  const runsByPath = new Map();
  for (const file of readdirSync(resultsDir).filter((name) => /^lhr-.*\.json$/.test(name))) {
    const lhr = JSON.parse(readFileSync(join(resultsDir, file), "utf8"));
    const path = new URL(lhr.requestedUrl).pathname;
    if (!runsByPath.has(path)) runsByPath.set(path, []);
    runsByPath.get(path).push(lhr);
  }

  const lines = [
    "## Lighthouse",
    "",
    "| Route | Runs | Performance | TBT (ms) | LCP (ms) | CLS | CPU × |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const [path, runs] of runsByPath) {
    const pick = (read) => runs.map(read);
    lines.push(
      [
        "",
        `\`${path}\``,
        runs.length,
        range(pick((r) => r.categories.performance.score), (v) => v.toFixed(2), "high"),
        range(pick((r) => r.audits["total-blocking-time"].numericValue), (v) => String(Math.round(v)), "low"),
        range(pick((r) => r.audits["largest-contentful-paint"].numericValue), (v) => String(Math.round(v)), "low"),
        range(pick((r) => r.audits["cumulative-layout-shift"].numericValue), (v) => v.toFixed(3), "low"),
        runs[0].configSettings.throttling.cpuSlowdownMultiplier,
        "",
      ].join(" | ").trim(),
    );
  }

  const assertionsPath = join(resultsDir, "assertion-results.json");
  const missed = existsSync(assertionsPath)
    ? JSON.parse(readFileSync(assertionsPath, "utf8")).filter((a) => !a.passed)
    : [];
  // Scores are 0–1 and keep two decimals; millisecond values round to integers.
  const num = (v) => (Math.abs(v) <= 1 ? v.toFixed(2) : String(Math.round(v)));
  const describe = (a) => {
    const audit = a.auditProperty ? `${a.auditId}.${a.auditProperty}` : a.auditId;
    return `- \`${new URL(a.url).pathname}\` **${audit}**: ${num(a.actual)} (target ${a.operator} ${a.expected}; runs: ${a.values.map(num).join(", ")})`;
  };

  const failures = missed.filter((a) => a.level === "error");
  lines.push("", failures.length ? "### Failed assertions" : "All `error`-level assertions passed.", "");
  lines.push(...failures.map(describe));

  const timing = missed.filter(
    (a) => a.level === "warn" && TIMING_AUDITS.has(a.auditProperty ? `${a.auditId}.${a.auditProperty}` : a.auditId),
  );
  if (timing.length) {
    lines.push("", "### Timing targets missed (reported, not gating)", "", ...timing.map(describe));
  }
  return `${lines.join("\n")}\n`;
}

const summary = renderSummary();
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
else process.stdout.write(summary);
