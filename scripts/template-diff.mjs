#!/usr/bin/env node
/**
 * Diff a source app against the create-vexcms templates.
 *
 * Answers one question: what has drifted between the app we author in and the
 * templates users scaffold from? The templates are hand-maintained copies with
 * no extraction layer, so drift is silent until someone scaffolds and finds a
 * fix missing.
 *
 * Reports three buckets:
 *   - MISSING   in the app, absent from every template — a candidate addition
 *   - CHANGED   in both, contents differ — a candidate sync
 *   - ORPHANED  in a template, gone from the app — a candidate deletion
 *
 * When a file exists in both templates the overlay wins, because that is what
 * a marketing scaffold actually receives.
 *
 * Advisory only. It never writes: ownership (base vs overlay) and the
 * app→template translation rules are judgement calls the template-sync skill
 * makes. `ORPHANED` especially is often correct — base ships files the
 * marketing app deletes, which is exactly the route-collision fix.
 *
 * Usage:
 *   node scripts/template-diff.mjs [--app apps/www] [--json]
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATE_ROOT = path.join(REPO_ROOT, "packages/create-vexcms/templates");
const TEMPLATES = ["base-nextjs", "marketing-site"];

/** Trees that never cross into a template, or that carry per-project state. */
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  ".git",
  "public",
]);

/**
 * Files whose contents are expected to differ or are deployment-specific.
 * Listed rather than silently ignored so the exclusion is reviewable.
 */
const EXPECTED_DRIFT = new Set([
  "package.json", // versions are literals in templates, protocols in the app
  "README.md", // carries {{PROJECT_NAME}}
  "src/env.mjs", // carries installer markers
  "src/auth/client.tsx", // carries installer markers
  "convex/auth/options.ts", // carries installer markers
  "convex/auth/plugins/index.ts", // carries installer markers
  "next-env.d.ts",
  "tsconfig.json",
  "convex.json",
  "components.json",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "pnpm-lock.yaml",
]);

/**
 * Lists every tracked-ish file under a root, relative to it.
 *
 * @param {string} root - Directory to walk.
 * @returns {string[]} Relative POSIX paths.
 */
function listFiles(root) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(root)) return out;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.isDirectory()) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(path.relative(root, abs).split(path.sep).join("/"));
    }
  };
  walk(root);
  return out.sort();
}

/**
 * @param {string} file - Absolute path.
 * @returns {string} Content hash, whitespace-normalised at line ends.
 */
function hash(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").trimEnd();
  return crypto.createHash("sha1").update(text).digest("hex");
}

const args = process.argv.slice(2);
const appArg = args.includes("--app") ? args[args.indexOf("--app") + 1] : "apps/www";
const asJson = args.includes("--json");

const appRoot = path.join(REPO_ROOT, appArg);
if (!fs.existsSync(appRoot)) {
  console.error(`template-diff: no such app directory: ${appArg}`);
  process.exit(1);
}

const appFiles = listFiles(appRoot);
const templateFiles = new Map(
  TEMPLATES.map((name) => [name, new Set(listFiles(path.join(TEMPLATE_ROOT, name)))]),
);

const missing = [];
const changed = [];

for (const rel of appFiles) {
  if (EXPECTED_DRIFT.has(rel)) continue;

  const owners = TEMPLATES.filter((name) => templateFiles.get(name).has(rel));
  if (owners.length === 0) {
    missing.push(rel);
    continue;
  }

  // The overlay is applied over base, so when a file exists in both the
  // overlay's copy is what a marketing scaffold actually receives. Comparing
  // against base too would report every overlay-owned file as drifted.
  const effective = owners.includes("marketing-site") ? "marketing-site" : owners[0];

  if (hash(path.join(TEMPLATE_ROOT, effective, rel)) !== hash(path.join(appRoot, rel))) {
    changed.push({ file: rel, templates: [effective] });
  }
}

const appFileSet = new Set(appFiles);
const orphaned = [];
for (const name of TEMPLATES) {
  for (const rel of templateFiles.get(name)) {
    if (EXPECTED_DRIFT.has(rel)) continue;
    if (!appFileSet.has(rel)) orphaned.push({ file: rel, template: name });
  }
}

if (asJson) {
  console.log(JSON.stringify({ app: appArg, missing, changed, orphaned }, null, 2));
} else {
  const section = (title, rows) => {
    console.log(`\n${title} (${rows.length})`);
    if (rows.length === 0) console.log("  none");
    else for (const row of rows) console.log(`  ${row}`);
  };

  console.log(`template-diff: ${appArg} vs ${TEMPLATES.join(", ")}`);
  section("MISSING — in the app, in no template", missing);
  section(
    "CHANGED — present in both, contents differ",
    changed.map((c) => `${c.file}  [${c.templates.join(", ")}]`),
  );
  section(
    "ORPHANED — in a template, not in the app",
    orphaned.map((o) => `${o.file}  [${o.template}]`),
  );
  console.log(
    "\nAdvisory only. Ownership and translation are the template-sync skill's call;\n" +
      "ORPHANED is frequently correct (base ships files the marketing overlay drops).",
  );
}
