import { auditFragmentsDir, readAndClearAuditFragments, writeAuditJson } from "./auditJson";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Merges every frontend `axe.e2e.ts` per-test fragment (written so completed
 * results survive a worker restart after another test's failure) into the
 * committed `test-axe.json`, then clears the fragments directory. Runs once
 * after the whole Playwright run, regardless of how many workers it took or
 * whether a test failed.
 *
 * No-ops, leaving the previously-committed file untouched, when no
 * `axe.e2e.ts` test ran this invocation (e.g. an `adminAxe`/`adminWidths`-only
 * run) — there would be nothing to merge, and writing an empty result set
 * would overwrite a good prior audit with a useless one.
 *
 * @returns Resolves once the merged file is written, or immediately if there
 *   was nothing to merge.
 */
export default async function globalTeardown(): Promise<void> {
  const fragments = readAndClearAuditFragments({
    dir: auditFragmentsDir({ testDir: __dirname, suite: "test-axe" }),
  });
  if (fragments === null) {
    return;
  }
  writeAuditJson({
    fileName: "test-axe.json",
    data: {
      generated: new Date().toISOString(),
      baseURL: process.env.QUALITY_BASE_URL ?? "http://localhost:3020",
      tags: AXE_TAGS,
      results: fragments,
    },
  });
}
