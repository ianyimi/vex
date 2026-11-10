/**
 * Syncs GitHub repo labels from `.github/labels.yml`, the single source of
 * truth for the label taxonomy.
 *
 * Modes, selected by CLI flag (default with no flag: upsert):
 * - (no flag): `gh label create --force` for every entry in the file — creates
 *   missing labels, updates the color/description of existing ones. Never
 *   deletes.
 * - `--prune`: upsert, then deletes every repo label absent from the file.
 * - `--check`: reports drift and exits non-zero without changing anything.
 *   Drift is (a) any repo label whose name/description/color doesn't match
 *   the file, any label in the file missing from the repo, or any extra repo
 *   label the file doesn't declare; and (b) any `labels:` entry in
 *   `.github/ISSUE_TEMPLATE/*.yml` that isn't in the file — the silent-skip
 *   GitHub documents for a form label the repo doesn't have.
 *
 * Exit codes: `0` clean/success; `1` drift found under `--check`; `2` `gh`
 * is not installed, or a `gh` call failed (e.g. not authenticated/no repo
 * access).
 *
 * Repo target: `process.env.GITHUB_REPOSITORY`, or `gh repo view --json
 * nameWithOwner` when unset (local runs outside CI).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { parse as parseYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const labelsPath = path.join(root, ".github/labels.yml");
const issueTemplateDir = path.join(root, ".github/ISSUE_TEMPLATE");

/**
 * Runs a `gh` subcommand, exiting `2` with a one-line diagnostic when `gh`
 * is missing or the call itself fails (auth, access, etc).
 *
 * @param {string} cmdLabel - human-readable command, e.g. `"gh label list"`.
 * @param {string[]} args - argv passed to `gh`.
 * @param {{ repo?: string } & import("node:child_process").ExecFileSyncOptions} [opts]
 * @returns {string | Buffer}
 */
function runGh(cmdLabel, args, { repo, ...execOpts } = {}) {
  try {
    return execFileSync("gh", args, {
      cwd: root,
      encoding: "utf-8",
      ...execOpts,
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(
        "sync-labels: gh is not installed — https://cli.github.com",
      );
      process.exit(2);
    }
    console.error(
      `sync-labels: gh failed (${cmdLabel}): run \`gh auth login\` and check access to ${repo ?? "this repo"}`,
    );
    process.exit(2);
  }
}

/**
 * Reads and parses `.github/labels.yml`.
 *
 * @returns {Array<{ name: string, description: string, color: string }>}
 */
function readLabelsFile() {
  const raw = fs.readFileSync(labelsPath, "utf-8");
  return parseYaml(raw);
}

/**
 * Resolves the `owner/repo` slug to operate on.
 *
 * @returns {string}
 */
function resolveRepoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const out = runGh("gh repo view", ["repo", "view", "--json", "nameWithOwner"]);
  return JSON.parse(out).nameWithOwner;
}

/**
 * Fetches the repo's current labels via `gh label list`.
 *
 * @param {string} repo - `owner/repo`.
 * @returns {Array<{ name: string, description: string, color: string }>}
 */
function fetchRepoLabels(repo) {
  const out = runGh(
    "gh label list",
    [
      "label",
      "list",
      "--repo",
      repo,
      "--limit",
      "200",
      "--json",
      "name,description,color",
    ],
    { repo },
  );
  return JSON.parse(out);
}

/**
 * Creates or updates every label from the file. Idempotent: `--force` makes
 * a repeat run a no-op diff.
 *
 * @param {string} repo - `owner/repo`.
 * @param {Array<{ name: string, description: string, color: string }>} labels
 */
function upsertLabels(repo, labels) {
  for (const label of labels) {
    runGh(
      "gh label create",
      [
        "label",
        "create",
        label.name,
        "--repo",
        repo,
        "--description",
        label.description,
        "--color",
        label.color,
        "--force",
      ],
      { repo, stdio: "inherit" },
    );
  }
}

/**
 * Deletes every repo label not present in the file.
 *
 * @param {string} repo - `owner/repo`.
 * @param {Array<{ name: string }>} fileLabels
 * @param {Array<{ name: string }>} repoLabels
 */
function pruneLabels(repo, fileLabels, repoLabels) {
  const fileNames = new Set(fileLabels.map((l) => l.name));
  for (const repoLabel of repoLabels) {
    if (fileNames.has(repoLabel.name)) continue;
    runGh(
      "gh label delete",
      ["label", "delete", repoLabel.name, "--repo", repo, "--yes"],
      { repo, stdio: "inherit" },
    );
  }
}

/**
 * Diffs the file against the repo's current labels.
 *
 * @param {Array<{ name: string, description: string, color: string }>} fileLabels
 * @param {Array<{ name: string, description: string, color: string }>} repoLabels
 * @returns {string[]} human-readable violations; empty means no drift.
 */
function diffLabels(fileLabels, repoLabels) {
  const violations = [];
  const repoByName = new Map(repoLabels.map((l) => [l.name, l]));
  const fileNames = new Set(fileLabels.map((l) => l.name));

  for (const fileLabel of fileLabels) {
    const repoLabel = repoByName.get(fileLabel.name);
    if (!repoLabel) {
      violations.push(`missing from repo: "${fileLabel.name}"`);
      continue;
    }
    if (
      repoLabel.description !== fileLabel.description ||
      repoLabel.color.toUpperCase() !== fileLabel.color.toUpperCase()
    ) {
      violations.push(
        `drifted: "${fileLabel.name}" repo={description: ${repoLabel.description}, color: ${repoLabel.color}} file={description: ${fileLabel.description}, color: ${fileLabel.color}}`,
      );
    }
  }

  for (const repoLabel of repoLabels) {
    if (!fileNames.has(repoLabel.name)) {
      violations.push(`extra in repo, not in file: "${repoLabel.name}"`);
    }
  }

  return violations;
}

/**
 * Parses every `.github/ISSUE_TEMPLATE/*.yml` form and asserts each of its
 * `labels:` entries exists in the taxonomy file — the check for the failure
 * mode GitHub itself does not surface: a form label the repo doesn't have is
 * silently skipped when the issue is created.
 *
 * @param {Set<string>} knownLabelNames
 * @returns {string[]} human-readable violations; empty means every form label
 *   resolves.
 */
function checkFormLabels(knownLabelNames) {
  const violations = [];
  if (!fs.existsSync(issueTemplateDir)) return violations;
  const files = fs
    .readdirSync(issueTemplateDir)
    .filter((f) => f.endsWith(".yml") && f !== "config.yml");

  for (const file of files) {
    const raw = fs.readFileSync(path.join(issueTemplateDir, file), "utf-8");
    const form = parseYaml(raw);
    const formLabels = Array.isArray(form.labels) ? form.labels : [];
    for (const labelName of formLabels) {
      if (!knownLabelNames.has(labelName)) {
        violations.push(`"${file}" references unknown label "${labelName}"`);
      }
    }
  }

  return violations;
}

const cliArgs = process.argv.slice(2);
const check = cliArgs.includes("--check");
const prune = cliArgs.includes("--prune");

const fileLabels = readLabelsFile();
const repo = resolveRepoSlug();

if (check) {
  const repoLabels = fetchRepoLabels(repo);
  const violations = [
    ...diffLabels(fileLabels, repoLabels),
    ...checkFormLabels(new Set(fileLabels.map((l) => l.name))),
  ];
  if (violations.length > 0) {
    console.error(`sync-labels --check found ${violations.length} issue(s):`);
    for (const violation of violations) console.error(`  - ${violation}`);
    process.exit(1);
  }
  console.log("sync-labels --check: no drift");
  process.exit(0);
}

upsertLabels(repo, fileLabels);

if (prune) {
  const repoLabels = fetchRepoLabels(repo);
  pruneLabels(repo, fileLabels, repoLabels);
}

console.log(
  `sync-labels: synced ${fileLabels.length} label(s) to ${repo}${prune ? " (pruned extras)" : ""}`,
);
