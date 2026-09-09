#!/usr/bin/env node
/**
 * Runs one or more vitest test files and records the result into the
 * active spec's findings.md, distinguishing the two failure modes the
 * Test Authoring Protocol depends on:
 *
 *   - A FAILING ASSERTION is a discovered UI defect — the intended output of
 *     that spec. It is recorded as a finding; the script still exits 0.
 *   - A TEST FILE THAT CANNOT RUN (transform/import error, a factory that
 *     throws during collection, zero tests collected) is a defect in the
 *     spec's OWN work, not a finding. The script exits non-zero so the
 *     implement loop's normal 2-attempt fix protocol applies.
 *
 * Protocol (verified against the repo's vitest 4.1.10):
 *   1. `vitest list <paths>` — collects without running. A clean, cheap proof
 *      that every file transforms and yields at least one test. Non-zero
 *      exit here means the file itself is broken; treated as a hard failure.
 *   2. `vitest run <paths> --reporter=json --outputFile=<tmp>` — runs the
 *      suite. The JSON report's shape:
 *        { numTotalTests, numFailedTests, testResults: [
 *          { name, status, message, assertionResults: [
 *            { fullName, title, status, failureMessages } ] } ] }
 *      `testResults[n].status === "fail"` with an EMPTY `assertionResults`
 *      is a suite-level collection error, not an assertion failure, and is
 *      also a hard failure even though stage 1 passed.
 *
 * Findings are written to
 * `.agent/docs/specs/<spec>/findings.md` as a markdown table. Re-running
 * this script for a file replaces that file's previous rows — idempotent.
 * `<spec>` is the spec slug: `--spec <slug>` or the `VEX_FINDINGS_SPEC` env
 * var, defaulting to `2026-09-08-react-coverage-expansion` so a bare
 * invocation still works for this spec's own steps. The resolved spec's
 * directory MUST already exist under `.agent/docs/specs/` — this never
 * creates it, so a stale default after this spec ships fails loudly
 * instead of silently writing into the wrong findings.md.
 *
 * Usage:
 *   node scripts/record-test-findings.mjs [--spec <slug>] <testFile> [testFile...]
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const DEFAULT_FINDINGS_SPEC = "2026-09-08-react-coverage-expansion";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const rawArgs = process.argv.slice(2);
const specFlagIndex = rawArgs.indexOf("--spec");
const FINDINGS_SPEC =
  specFlagIndex === -1
    ? (process.env.VEX_FINDINGS_SPEC ?? DEFAULT_FINDINGS_SPEC)
    : rawArgs[specFlagIndex + 1];
if (specFlagIndex !== -1 && !FINDINGS_SPEC) {
  console.error("usage: node scripts/record-test-findings.mjs [--spec <slug>] <testFile> [testFile...]");
  process.exit(2);
}
const targets =
  specFlagIndex === -1 ? rawArgs : [...rawArgs.slice(0, specFlagIndex), ...rawArgs.slice(specFlagIndex + 2)];
const specDir = path.join(REPO_ROOT, ".agent/docs/specs", FINDINGS_SPEC);
if (!fs.existsSync(specDir)) {
  console.error(
    `spec directory not found: .agent/docs/specs/${FINDINGS_SPEC} — pass --spec <slug> ` +
      "(or set VEX_FINDINGS_SPEC) naming an existing spec; this script never creates the spec directory.",
  );
  process.exit(2);
}
const FINDINGS_PATH = path.join(specDir, "findings.md");
if (targets.length === 0) {
  console.error("usage: node scripts/record-test-findings.mjs [--spec <slug>] <testFile> [testFile...]");
  process.exit(2);
}

/**
 * Expands a target that carries glob metacharacters against the repo root.
 * A quoted glob reaches this script unexpanded (the shell never touches it),
 * so the script owns expansion — Step 8's Verify line passes
 * `"packages/react/src/**\/*.test.ts?(x)"` deliberately quoted, since an
 * unquoted expansion would also match the two non-test `*.test.ts?(x)`-shaped
 * directories under `components/fields`.
 *
 * @param {string} target - A path or glob pattern, relative to the repo root.
 * @returns {string[]} Absolute paths; a non-glob target resolves to itself.
 */
function expandTarget(target) {
  if (!/[*?[\]{}]/.test(target)) return [path.resolve(REPO_ROOT, target)];
  const matches = fs
    .globSync(target, { cwd: REPO_ROOT })
    .map((match) => path.resolve(REPO_ROOT, match))
    .sort();
  if (matches.length === 0) {
    console.error(`no files matched: ${target}`);
    process.exit(2);
  }
  return matches;
}

const absTargets = targets.flatMap(expandTarget);
for (const abs of absTargets) {
  if (!fs.existsSync(abs)) {
    console.error(`not found: ${path.relative(REPO_ROOT, abs)}`);
    process.exit(2);
  }
}
const relTargets = absTargets.map((abs) => path.relative(REPO_ROOT, abs));

/**
 * Finds the nearest ancestor directory holding a vitest config, so vitest
 * runs with the right root/plugins regardless of which package a test file
 * lives in.
 *
 * @param {string} startDir - Absolute directory to start searching from.
 * @returns {string} Absolute directory to run vitest in.
 */
function findVitestRoot(startDir) {
  let dir = startDir;
  while (dir.startsWith(REPO_ROOT)) {
    const hasConfig = ["ts", "js", "mts", "mjs"].some((ext) =>
      fs.existsSync(path.join(dir, `vitest.config.${ext}`)),
    );
    if (hasConfig) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return REPO_ROOT;
}

const vitestRoot = findVitestRoot(path.dirname(absTargets[0]));

/**
 * Runs a vitest subcommand from `vitestRoot`, tolerating a non-zero exit
 * (the caller decides what a given exit code means).
 *
 * @param {string[]} args - Arguments passed to `vitest`.
 * @returns {{ status: number, output: string }}
 */
function runVitest(args) {
  try {
    const output = execFileSync("pnpm", ["exec", "vitest", ...args], {
      cwd: vitestRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (err) {
    return {
      status: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

// Stage 1: prove every target collects.
const listResult = runVitest(["list", ...absTargets]);
if (listResult.status !== 0) {
  console.error(`vitest list failed (exit ${listResult.status}) — test file does not collect:`);
  console.error(listResult.output);
  process.exit(1);
}

// Stage 2: run and capture the JSON report.
const outFile = path.join(os.tmpdir(), `vitest-findings-${crypto.randomUUID()}.json`);
const runResult = runVitest([
  "run",
  ...absTargets,
  "--reporter=json",
  `--outputFile=${outFile}`,
]);

if (!fs.existsSync(outFile)) {
  console.error(`vitest run produced no report (exit ${runResult.status}):`);
  console.error(runResult.output);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(outFile, "utf-8"));
fs.rmSync(outFile, { force: true });

const totalTests = report.numTotalTests ?? 0;
const failedTests = report.numFailedTests ?? 0;

if (totalTests === 0) {
  console.error("zero tests collected — treating as a defect in this spec's own work");
  process.exit(1);
}

/** @returns {string} the first non-empty line of a message, table-cell-safe. */
function firstLine(message) {
  const line = (message ?? "").split("\n").find((l) => l.trim().length > 0) ?? "unknown";
  return line.trim().replace(/\|/g, "\\|");
}

/** @type {Array<{ file: string, test: string, failure: string }>} */
const findings = [];
let collectionError = false;

for (const testResult of report.testResults ?? []) {
  const file = path.relative(REPO_ROOT, testResult.name);
  const assertionResults = testResult.assertionResults ?? [];

  if (testResult.status === "fail" && assertionResults.length === 0) {
    collectionError = true;
    findings.push({
      file,
      test: "(collection)",
      failure: firstLine(testResult.message ?? "unknown collection error"),
    });
    continue;
  }

  for (const assertion of assertionResults) {
    if (assertion.status !== "failed") continue;
    findings.push({
      file,
      test: assertion.fullName || assertion.title,
      failure: firstLine(assertion.failureMessages?.[0]),
    });
  }
}

recordFindings(relTargets, findings);

console.log(`${totalTests} tests, ${failedTests} failed — recorded to findings.md`);

if (collectionError) {
  console.error(
    "a testResults[] entry failed with empty assertionResults — collection error, not a discovered defect",
  );
  process.exit(1);
}

process.exit(0);

/**
 * Replaces the rows belonging to `files` in findings.md with `findings`,
 * leaving every other file's rows untouched. Idempotent: re-running for the
 * same file(s) never duplicates rows.
 *
 * @param {string[]} files - Repo-root-relative test file paths just run.
 * @param {Array<{ file: string, test: string, failure: string }>} findings
 */
function recordFindings(files, findings) {
  const existing = fs.existsSync(FINDINGS_PATH) ? fs.readFileSync(FINDINGS_PATH, "utf-8") : "";
  const lines = existing.split("\n");

  const headerIndex = lines.findIndex((l) => l.trim().startsWith("| file"));
  const header =
    headerIndex === -1
      ? ["| file | test | failure |", "| --- | --- | --- |"]
      : lines.slice(headerIndex, headerIndex + 2);
  const preamble =
    headerIndex === -1
      ? [
          "# Test Findings",
          "",
          "Generated by `scripts/record-test-findings.mjs` — do not edit by hand. Running the",
          "script for a test file replaces that file's rows. Every row is a failing assertion",
          "discovered by the comprehensive per-field tests: a real UI defect, not a test bug.",
          `Fixing these is out of scope for the ${FINDINGS_SPEC} spec.`,
          "",
        ]
      : lines.slice(0, headerIndex);

  const bodyStart = headerIndex === -1 ? 0 : headerIndex + 2;
  const existingRows = headerIndex === -1 ? [] : lines.slice(bodyStart);
  const keptRows = existingRows.filter((row) => {
    if (!row.trim().startsWith("|")) return false;
    const file = row.split("|")[1]?.trim();
    return file && !files.includes(file);
  });

  const newRows = findings.map((f) => `| ${f.file} | ${f.test} | ${f.failure} |`);
  const allRows = [...keptRows, ...newRows].sort();

  const content = [...preamble, ...header, ...allRows, ""].join("\n");
  fs.mkdirSync(path.dirname(FINDINGS_PATH), { recursive: true });
  fs.writeFileSync(FINDINGS_PATH, content);
}
