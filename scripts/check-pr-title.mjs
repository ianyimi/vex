/**
 * Checks a pull request title against the Conventional Commits shape this
 * repo squash-merges with: `type(scope)!: description`. The scope is
 * optional and may list several comma-separated lowercase names; `!` marks
 * a breaking change.
 *
 * Reads the title from `PR_TITLE` (set by `.github/workflows/pr-checks.yml`
 * from the event payload, never interpolated into the shell), or from the
 * first CLI argument when run by hand.
 *
 * Exit codes: `0` valid; `1` invalid, printing a GitHub `::error::`
 * annotation that names the expected shape; `2` no title given.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const PR_TITLE_TYPES = [
  "feat",
  "fix",
  "refactor",
  "perf",
  "test",
  "docs",
  "style",
  "chore",
  "build",
  "ci",
  "ops",
  "revert",
];

const PR_TITLE_PATTERN = new RegExp(
  `^(?:${PR_TITLE_TYPES.join("|")})(?:\\([a-z0-9-]+(?:,[a-z0-9-]+)*\\))?!?: \\S.*$`,
);

/**
 * Validates one pull request title.
 *
 * @param {object} props
 * @param {string} props.title - The pull request title as GitHub stores it.
 * @returns {{ valid: true } | { valid: false, reason: string }} `reason` is a
 *   one-line message addressed to the contributor.
 */
export function checkPrTitle(props) {
  const { title } = props;
  if (!PR_TITLE_PATTERN.test(title)) {
    return {
      valid: false,
      reason: `"${title}" is not \`type(scope): description\`. Types: ${PR_TITLE_TYPES.join(", ")}. Example: \`fix(react): show a toast when a media upload fails\`.`,
    };
  }
  if (title.endsWith(".")) {
    return { valid: false, reason: `"${title}" ends with a period. Drop it.` };
  }
  return { valid: true };
}

function main() {
  const title = process.env.PR_TITLE ?? process.argv[2];
  if (!title) {
    process.stderr.write(
      "check-pr-title: no title. Set PR_TITLE or pass the title as the first argument.\n",
    );
    process.exit(2);
  }
  const result = checkPrTitle({ title });
  if (!result.valid) {
    process.stdout.write(`::error title=Pull request title::${result.reason}\n`);
    process.exit(1);
  }
  process.stdout.write(`check-pr-title: "${title}" is valid.\n`);
}

if (fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
