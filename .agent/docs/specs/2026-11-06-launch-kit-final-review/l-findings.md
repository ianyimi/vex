# L findings — VexCMS 0.1.0 launch

> One row per finding from steps 14–21. `blocker` = a cross-surface contradiction, a false or
> unsupported claim, a broken link or route on a launch path, a paid tier/price/customer named
> anywhere, or alpha wording outside `copy-flip.patch`'s scope. Everything else is `backlog`.
> Every finding is applied in the session unless the developer defers it; a `blocker` can't be
> deferred. No open `blocker` survives this file at sign-off. Wording findings also carry their
> `VW-NNN` (or `AP-NNN`) id in the evidence cell.
>
> Rows L-001…L-014 come from the agent pre-pass (steps 12–13, 2026-11-10), before the
> developer's read. Step = the L step that reviews it.

| id | surface | severity | evidence | fix commit | re-check | backlog entry |
|---|---|---|---|---|---|---|
| L-001 | docs `guides/conditional-fields-and-masks.mdx:132` (step 14) | blocker | `use-mask-input` linked `github.com/vireshvekariya/use-mask-input` → 404; npm `repository` is `eduardoborges/use-mask-input` | applied in tree 2026-11-10 (uncommitted) | 200, 2026-11-10 |  |
| L-002 | template `base-nextjs/src/auth/access.ts:25` (step 18) | blocker | `@see https://vexcms.dev/docs/access-control` → 404 in every scaffold | applied in tree 2026-11-10 → `docs.vexcms.dev/guides/access-control/` | 200, 2026-11-10 |  |
| L-003 | `Footer/config.ts` default `socialLinks` (www, apps/test, marketing-site template) (steps 16, 18) | blocker | `https://x.com/vexcms` → 404; no X account exists (spec decision 6: X not used). Decide: drop the entry or replace it |  |  |  |
| L-004 | docs `compare.mdx` footnote `[^p6]` (step 14) | backlog | cites `payloadcms.com/pricing`, annotated "(404, attempted 2026-11-06)"; still 404. Keep the annotation or drop the URL |  |  |  |
| L-005 | packed manifests ×8 (step 15) | backlog | `bugs` and `engines` are `null` in all 8 (`l-prepass.md` § Packed manifests); scaffolds require Node `>=22.0.0` but no package says so |  |  |  |
| L-006 | GitHub repo description (step 19) | blocker | says "ABAC"; docs, README, topics (`rbac`) and roadmap say RBAC — cross-surface contradiction. Fix is `gh repo edit` (developer approves the text) |  |  |  |
| L-007 | product name in prose: README Quick Start ("+ Vex project"), `better-auth` README ("VEX CMS", "Vex collections"), `guides/auth.mdx` ("Vex field"), www block defaults (Header/Footer/CTA/FAQ/Roadmap "Vex CMS"), www seed ("Vex generates") (steps 14–16) | backlog until VW-003 confirmed | VW-003 (inferred, unconfirmed): "VexCMS" in prose. 32 hits, `l-prepass.md` § VexCMS vs Vex |  |  |  |
| L-008 | install command (steps 16, 21) | blocker | FAQ + HowItWorks block defaults (www, apps/test, template) say `npx create-vexcms`; every other surface says `pnpm create vexcms` |  |  |  |
| L-009 | marketing-site template seed roadmap + FAQ (step 18) | blocker | false claims on template output: versioning "in active development", richtext/json/email "planned", FAQ "12 field types today" (shipped: 16, drafts, live preview). `copy-flip.patch` fixes the FAQ answer only; the roadmap items need the shipped state |  |  |  |
| L-010 | `copy-flip.patch` (step 21) | review item | agent-written replacement copy: the "Is it production ready?" answer (www, apps/test, template seeds), roadmap stats description, roadmap hero subheadings, `create-vexcms` README § Versioning, SECURITY supported-versions line. Read before marking the patch reviewed |  |  |  |
| L-011 | `launch-kit.md` LinkedIn + PH briefs (step 20) | applied | re-fetch: LinkedIn has an official 3,000-char cap + anti-automation clause (premise "no official doc" was wrong); PH §2.8 "ready for use or have a clear path to launch" + new "Waitlisted products" exclusion. Briefs + lint limits updated | applied 2026-11-10 | `sources.md` Re-fetch log |  |
| L-012 | live GitHub labels (step 19) | backlog | live-only `planned`, `roadmap: p0–p2`, `type: feature`, `javascript` vs `labels.yml`; clears with the queued `sync-labels.mjs --prune` (DEP-7 / CW-8) |  |  |  |
| L-013 | banned-term sweep hits in example data (steps 14, 16) | backlog — developer's call | `fields/select.mdx:60` "Enterprise" option; www + apps/test seeds `plan: free/pro/enterprise` union and "Wayne Enterprises"; apps/test seed "Maprios" case study (customer name; PP-15 decision) |  |  |  |
| L-014 | site copy voice: Roadmap block default + template seed "What we've shipped…", "where we're headed" (steps 16, 18) | backlog until ruled | VW-005 covers maintainer copy ("I"); site copy saying "we" is unruled |  |  |  |

## Fix loop

For each finding that isn't deferred (every `blocker`, plus every `backlog` row the developer wants applied now):

1. The agent fixes it in the session, on every surface it affects, and logs the VW/AP entry (Design Decision 25).
2. Re-check the surface it was found on, and every `surface-review.md` consistency-matrix row
   it feeds — not only the one row that caught it.
3. If the fix touched a file `copy-flip.patch` covers, regenerate the patch and re-run step
   21's line-by-line read on the new patch.
4. Advance the reviewed SHA in `surface-review.md`'s Review record to the fix commit.
5. Re-run step 12's refresh commands and step 13's evidence commands for the touched surfaces
   only, not the full pre-pass; append the new output to `l-prepass.md` under the existing
   section for that surface, dated.
6. Mark the `re-check` column `pass` with the new commit SHA.

For each `backlog` row, step 23 adds one `backlog.md` entry carrying this row's `id`; record the
entry's heading in the `backlog entry` column.
