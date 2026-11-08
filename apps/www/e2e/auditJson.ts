import fs from "node:fs";
import path from "node:path";

/**
 * Writes an audit report as pretty-printed JSON under the app's audit
 * directory, creating the directory if it does not exist.
 *
 * @param props - Input props.
 * @param props.fileName - Output file name, e.g. `"www-axe.json"`.
 * @param props.data - JSON-serializable report body.
 * @returns The path written to, relative to the app root.
 */
export function writeAuditJson(props: { fileName: string; data: unknown }): string {
  const outputDir = process.env.QUALITY_AUDIT_DIR ?? "audit";
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, props.fileName);
  fs.writeFileSync(outputPath, `${JSON.stringify(props.data, null, 2)}\n`);
  return outputPath;
}

/**
 * The directory one audit suite's per-test fragments live in — inside the
 * already-git-ignored `test-results/`, one level above `testDir` (`e2e/`).
 *
 * @param props - Input props.
 * @param props.testDir - The calling file's own directory (`import.meta.dirname`).
 * @param props.suite - A short suite id, e.g. `"www-axe"`.
 * @returns The fragments directory path.
 */
export function auditFragmentsDir(props: { testDir: string; suite: string }): string {
  return path.join(props.testDir, "..", "test-results", ".audit-fragments", props.suite);
}

/**
 * Writes one test's result as its own JSON file into a fragments directory,
 * so completed results survive a Playwright worker restart after another
 * test's failure — which resets any module-level in-memory array the next
 * worker process re-executes the test file with.
 *
 * @param props - Input props.
 * @param props.dir - Fragments directory (created if missing).
 * @param props.id - Unique fragment id; becomes the file name.
 * @param props.data - JSON-serializable fragment body.
 * @returns Nothing.
 */
export function writeAuditFragment(props: { dir: string; id: string; data: unknown }): void {
  fs.mkdirSync(props.dir, { recursive: true });
  fs.writeFileSync(path.join(props.dir, `${props.id}.json`), JSON.stringify(props.data));
}

/**
 * Reads every fragment `writeAuditFragment` wrote into `dir`, then removes
 * the directory. Returns `null`, writing nothing, when `dir` never existed —
 * meaning no test in this suite ran this invocation (e.g. a run filtered to
 * a different file), so the previously-committed audit file must be left
 * alone rather than overwritten with an empty result set.
 *
 * @param props - Input props.
 * @param props.dir - Fragments directory to read and remove.
 * @returns Every fragment's parsed body, or `null` if `dir` didn't exist.
 */
export function readAndClearAuditFragments(props: { dir: string }): unknown[] | null {
  if (!fs.existsSync(props.dir)) {
    return null;
  }
  const files = fs
    .readdirSync(props.dir)
    .filter((file) => file.endsWith(".json"))
    .sort();
  const fragments = files.map(
    (file) => JSON.parse(fs.readFileSync(path.join(props.dir, file), "utf8")) as unknown,
  );
  fs.rmSync(props.dir, { recursive: true, force: true });
  return fragments;
}
