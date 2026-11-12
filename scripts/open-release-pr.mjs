/**
 * Opens the internal `dev` → `master` release pull request without the
 * contributor template.
 *
 * GitHub fills `.github/PULL_REQUEST_TEMPLATE.md` into every pull request
 * opened from the web UI, and that template is written for fork
 * contributions. Passing an explicit body to `gh pr create` bypasses it, so
 * this script always sends one: the contents of `--body-file`, or an empty
 * body.
 *
 * Usage:
 *   pnpm pr:release --title "feat: what this release ships" [--body-file notes.md] [--draft]
 *
 * If a `dev` → `master` pull request is already open, prints its URL and
 * exits 0 instead of creating a second one.
 *
 * Exit codes: `0` created or already open; `1` `gh` failed; `2` bad
 * arguments.
 */

import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BASE_BRANCH = "master";
const HEAD_BRANCH = "dev";

/**
 * Parses this script's command-line flags.
 *
 * @param {object} props
 * @param {string[]} props.argv - Arguments after the script path.
 * @returns {{ title?: string, bodyFile?: string, draft: boolean, error?: string }}
 *   `error` names the first problem found.
 */
export function parseReleasePrArgs(props) {
  const result = { draft: false };
  const args = [...props.argv];
  while (args.length > 0) {
    const flag = args.shift();
    if (flag === "--draft") {
      result.draft = true;
    } else if (flag === "--title" || flag === "--body-file") {
      const value = args.shift();
      if (value === undefined || value.startsWith("--")) {
        return { ...result, error: `${flag} needs a value` };
      }
      if (flag === "--title") result.title = value;
      else result.bodyFile = value;
    } else {
      return { ...result, error: `unknown argument "${flag}"` };
    }
  }
  if (!result.title) return { ...result, error: "--title is required" };
  return result;
}

/**
 * Builds the `gh pr create` argument list for the release pull request.
 *
 * @param {object} props
 * @param {string} props.title - The pull request title.
 * @param {string} props.body - The pull request body; may be empty.
 * @param {boolean} props.draft - Whether to open it as a draft.
 * @returns {string[]} Arguments for `gh`, always including `--body`.
 */
export function buildReleasePrCreateArgs(props) {
  return [
    "pr",
    "create",
    "--base",
    BASE_BRANCH,
    "--head",
    HEAD_BRANCH,
    "--title",
    props.title,
    "--body",
    props.body,
    ...(props.draft ? ["--draft"] : []),
  ];
}

function gh(args) {
  return spawnSync("gh", args, { encoding: "utf-8" });
}

function main() {
  const parsed = parseReleasePrArgs({ argv: process.argv.slice(2) });
  if (parsed.error) {
    process.stderr.write(`open-release-pr: ${parsed.error}\n`);
    process.stderr.write(
      'usage: pnpm pr:release --title "feat: …" [--body-file notes.md] [--draft]\n',
    );
    process.exit(2);
  }

  const existing = gh([
    "pr",
    "list",
    "--base",
    BASE_BRANCH,
    "--head",
    HEAD_BRANCH,
    "--state",
    "open",
    "--json",
    "url",
    "--jq",
    ".[0].url // empty",
  ]);
  if (existing.status !== 0) {
    process.stderr.write(existing.stderr || "open-release-pr: `gh pr list` failed\n");
    process.exit(1);
  }
  if (existing.stdout.trim()) {
    process.stdout.write(`Already open: ${existing.stdout.trim()}\n`);
    process.exit(0);
  }

  const body = parsed.bodyFile ? fs.readFileSync(parsed.bodyFile, "utf-8") : "";
  const created = gh(buildReleasePrCreateArgs({ title: parsed.title, body, draft: parsed.draft }));
  if (created.status !== 0) {
    process.stderr.write(created.stderr || "open-release-pr: `gh pr create` failed\n");
    process.exit(1);
  }
  process.stdout.write(created.stdout);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
