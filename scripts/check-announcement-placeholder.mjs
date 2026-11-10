#!/usr/bin/env node

/**
 * D1 launch-morning pre-publish gate for the seeded VexCMS 0.1.0 announcement
 * post (`apps/www/convex/seed.ts`, the `post:vexcms-0-1-0` block under its
 * `// ── Posts ──` section).
 *
 * `seed.ts` ships that block with `PLACEHOLDER — replace before D1:`
 * paragraphs in both `excerpt` and `body` (Design Decision 21: it is seeded
 * as a draft, published from the admin panel on D1 morning) so the real copy
 * is written once, by hand, before publishing — this script is the
 * greppable proof that happened. Run it as the last step of the D1
 * launch-morning checklist, right before publishing the post from the admin:
 *
 *   node scripts/check-announcement-placeholder.mjs
 *
 * It statically scans `seed.ts`'s announcement block (not the live Convex
 * document — the real post is written in the admin panel's richtext editor,
 * which only a published/preview read can see, and that read needs an
 * authenticated admin session; nothing here can check it cheaply). Treat a
 * passing run as necessary, not sufficient: it only proves nobody shipped
 * the skeleton verbatim, not that the real copy is good.
 *
 * Exits 1 (with the offending snippets) while `PLACEHOLDER` still appears in
 * the block; exits 0 once it has been replaced.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const SEED_PATH = resolve(ROOT_DIR, "apps/www/convex/seed.ts");

const BLOCK_START = "// ── Posts ──";
const BLOCK_END = "// ── Testimonials ──";

/**
 * Slices the announcement post's seed block out of `seed.ts`'s source,
 * between its `// ── Posts ──` section comment and the next section's
 * `// ── Testimonials ──` comment.
 *
 * @param {string} source - The full text of `apps/www/convex/seed.ts`.
 * @returns {string} The text between (and including) the two markers.
 */
export function extractAnnouncementBlock(source) {
  const start = source.indexOf(BLOCK_START);
  const end = source.indexOf(BLOCK_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `could not find the announcement block between "${BLOCK_START}" and "${BLOCK_END}" in ${SEED_PATH} — ` +
        "has seed.ts's Posts section been renamed or reordered? Update this script's markers to match.",
    );
  }
  return source.slice(start, end);
}

/**
 * Finds every `PLACEHOLDER` occurrence in a block of text, each with its
 * 1-based line number within that block and the full line it appears on.
 *
 * @param {string} block - The text to scan.
 * @returns {{ line: number, text: string }[]} One entry per matching line.
 */
export function findPlaceholders(block) {
  return block
    .split("\n")
    .map((text, index) => ({ line: index + 1, text: text.trim() }))
    .filter(({ text }) => text.includes("PLACEHOLDER"));
}

function main() {
  const source = readFileSync(SEED_PATH, "utf8");
  const block = extractAnnouncementBlock(source);
  const matches = findPlaceholders(block);

  if (matches.length === 0) {
    console.log("✓ no PLACEHOLDER markers in the seeded announcement post — clear to publish.");
    return;
  }

  console.error(`✘ ${matches.length} PLACEHOLDER marker(s) remain in the seeded announcement post (apps/www/convex/seed.ts):`);
  for (const { line, text } of matches) {
    console.error(`  block line ${line}: ${text}`);
  }
  console.error("\nReplace the real copy in seed.ts's announcement block before publishing on D1.");
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
