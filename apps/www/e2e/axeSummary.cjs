/**
 * Renders `audit/www-axe.json` (written by the axe suite's global teardown) as
 * a Markdown job summary: one row per audited route and theme, then each
 * violation with its rule, impact and affected selectors. Appends to
 * `$GITHUB_STEP_SUMMARY` when set, otherwise prints to stdout. The raw JSON
 * ships separately as the `axe-results` artifact.
 */
const { appendFileSync, existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

// Same location `writeAuditJson` in auditJson.ts writes to (relative to the
// working directory, which `pnpm --filter www exec` sets to apps/www).
const reportPath = resolve(process.env.QUALITY_AUDIT_DIR ?? "audit", "www-axe.json");

/**
 * Builds the summary Markdown from the axe report on disk.
 *
 * @returns {string} The Markdown document.
 */
function renderSummary() {
  if (!existsSync(reportPath)) return "## axe\n\nNo `www-axe.json` was written.\n";

  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const total = report.results.reduce((sum, result) => sum + result.violations.length, 0);
  const lines = [
    "## axe",
    "",
    `${report.results.length} page checks against \`${report.baseURL}\` (${report.tags.join(", ")}): ` +
      (total === 0 ? "**no violations**." : `**${total} violation(s)**.`),
    "",
    "| Route | Theme | Status | Violations |",
    "|---|---|---|---|",
    ...report.results.map(
      (result) =>
        `| \`${result.path}\` | ${result.theme} | ${result.status} | ${result.violations.length || "—"} |`,
    ),
  ];

  for (const result of report.results.filter((r) => r.violations.length > 0)) {
    lines.push("", `### \`${result.path}\` (${result.theme})`, "");
    for (const violation of result.violations) {
      const targets = violation.nodes.map((node) => `\`${node.target.join(" ")}\``).join(", ");
      lines.push(
        `- **${violation.id}** (${violation.impact}): [${violation.help}](${violation.helpUrl}) — ${targets}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

const summary = renderSummary();
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
else process.stdout.write(summary);
