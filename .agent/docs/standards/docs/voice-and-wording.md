---
applies_to: ["apps/docs/src/content/docs/**", "README.md", "packages/*/README.md", "packages/create-vexcms/templates/*/README.md", "CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md", ".github/ISSUE_TEMPLATE/**", ".github/PULL_REQUEST_TEMPLATE.md", "apps/www/convex/seed.ts", "apps/test/convex/seed.ts", "packages/create-vexcms/templates/*/convex/seed.ts", "apps/*/src/vexcms/blocks/*/config.ts", ".changeset/*.md", "**/public-copy.md", "**/launch-kit.md", "**/launch-post-examples.md", "**/release-notes.md"]
---
# Voice and wording — every public sentence

Voice and wording rules for all public copy: docs pages (`apps/docs/src/content/docs/**`), READMEs
(root, packages, templates), www (seeded pages and block defaults), GitHub (community files, issue
forms, starter issues, Discussions posts), changesets and release notes, and the launch posts.
**Not JSDoc**: comments in `packages/*/src` follow `jsdoc-conventions.md`, not this file.

- `public-copy.md` (`.agent/docs/specs/2026-11-06-public-presence/`) holds the verbatim strings;
  this file holds the rules for everything written around them.
- Launch posts are written by the developer (HN bans AI-generated and AI-edited text). Agents
  apply these rules to the surfaces they edit and use them to lint, never to rewrite post text.
- **How the log grows:** every piece of wording or voice feedback from the developer becomes a
  `VW` entry here in the same turn it's given, and the agent applies it to every surface it
  affects (`rg` the old wording across the surfaces above). Feedback that corrects an agent
  mistake goes to `anti-patterns.md` as an `AP` entry instead.
- Entries marked **inferred, unconfirmed** were read off existing copy on 2026-11-09, not given
  by the developer. Confirming or overruling one is a new entry that names it; entries are never
  edited or deleted.

Format: `- VW-NNN (date) rule — before → after — why`

## Log

- VW-001 (2026-11-09) Quote `public-copy.md` strings byte for byte; to change one, edit `public-copy.md` first, then every surface that quotes it — a paraphrased paid-work line → the exact "Paid add-ons may come later, as separate packages, after the free roadmap. …" — `public-copy.md`'s own header; L's consistency matrix treats drift as a blocker. *inferred, unconfirmed*
- VW-002 (2026-11-09) Never name a paid tier, paid feature, price or customer on a public surface; the paid-work line is the only thing said about paid work — "an enterprise tier with SSO" → (omit; quote the paid-work line) — `public-copy.md` header; L blocker class. *inferred, unconfirmed*
- VW-003 (2026-11-09) The product is "VexCMS" in prose; `vex` only as the CLI command or in code — "Vex is in alpha" → "VexCMS is in alpha" — docs use VexCMS 91× vs Vex 6×; the GitHub repo name `vex` is not the product name. *inferred, unconfirmed*
- VW-004 (2026-11-09) Plain, factual claims; no superlatives or hype words ("blazing", "revolutionary", "the best", "#1", "powerful") — "a blazing-fast CMS" → "a headless CMS built on Convex" — dang: "Drop any language that sounds like marketing"; PH: "Skip hype"; the docs never use them. *inferred, unconfirmed*
- VW-005 (2026-11-09) Docs address the reader as "you"; maintainer-voiced copy (posts, Sponsors bio, release notes) is first person singular "I", never "we" or "our team" — "We built VexCMS" → "I build VexCMS" — one developer builds it (`public-copy.md` § Who builds this); "we" implies a team (prepared answer Q5's don't-say). *inferred, unconfirmed*
- VW-006 (2026-11-09) Headings in sentence case — "Server-Side Field Validation" → "Server-side field validation" — every docs guide heading. *inferred, unconfirmed*
- VW-007 (2026-11-09) Code identifiers, commands, flags, file paths and package names go in backticks — "run vex generate" → "run `vex generate`" — docs convention throughout. *inferred, unconfirmed*
- VW-008 (2026-11-09) Every claim is checkable: link the docs page, file or command that proves it; say what isn't done yet instead of implying it is — "full localization support" → (cite the roadmap: "Localization" is after 0.1.0) — the roadmap's Shipped / After-0.1.0 / Not-planned split; L blocks false or unsupported claims. *inferred, unconfirmed*
- VW-009 (2026-11-09) One product one-liner, varied only in length: "type-safe headless CMS built (natively) on Convex" — "Convex-powered content platform" → "type-safe headless CMS built on Convex" — GitHub description, docs `index.mdx` and the Sponsors bio share the noun phrase; L's matrix row "product one-liner". *inferred, unconfirmed*
- VW-010 (2026-11-09) Em dash with spaces for a definition or aside; a list item that defines a term reads `**Term** — Sentence.` — "Plugin system: the extension points…" → "**Plugin system** — The extension points…" — `public-copy.md` roadmap list; ~1000 em dashes across the docs. *inferred, unconfirmed*
- VW-011 (2026-11-09) Spelling: "licence" for the noun in prose, "Apache-2.0 licensed" for the adjective, `LICENSE` for the file — "see the license" → "see the licence" — `public-copy.md` (§ Licence line, footer "Licence") and `compare.mdx` use it; **conflict:** other docs pages use "license" 11×, and the rest of the docs spell American ("behavior", "color"). Needs a developer ruling. *inferred, unconfirmed*
- VW-012 (2026-11-09) Serial (Oxford) comma in docs prose — "fields, relationships and blocks" → "fields, relationships, and blocks" — docs use it ~32× vs ~7× without; **conflict:** `public-copy.md` strings omit it ("sponsorship, partnership and business enquiries"), and those stay verbatim either way (VW-001). Needs a developer ruling. *inferred, unconfirmed*
- VW-013 (2026-11-09) Canonical URLs only, exactly as `public-copy.md` § Canonical URLs writes them; docs URLs keep the trailing slash — "docs.vexcms.dev/roadmap" → "https://docs.vexcms.dev/roadmap/" — one form per target keeps link checks and the matrix's "canonical URLs" row clean. *inferred, unconfirmed*
- VW-014 (2026-11-09) Never ask for votes, stars or boosts; ask people to try it and give feedback — "please upvote" → "try the demo and tell me what breaks" (shape only; posts are the developer's words) — HN and PH both ban vote solicitation (`launch-kit-final-review/sources.md` §1.2, §2.4). *inferred, unconfirmed*
