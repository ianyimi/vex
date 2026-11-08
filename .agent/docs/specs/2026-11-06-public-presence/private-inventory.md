# Private planning inventory — 2026-11-06-public-presence

Read-only search over `git ls-files` (2,605 tracked files, re-run 2026-11-07; first run 2026-11-06, 2,540 files). Terms: `\$[0-9]`, `\bPro\b`, `Agency`, `Enterprise`, `licen[cs]e key`, `ENT-0`, `ENT-P`, `maprios`, `business model`, `pitch`. Scope: `.agent/` planning
documents naming tiers, prices, licence enforcement or customer specifics. All of `.agent/` leaves
the repo (option A), so this list is the record of what was exposed, for the history-rewrite
decision below. Public-surface paid copy (`README.md`, `apps/docs/.../roadmap.md`,
`apps/www`/`apps/test` seed FAQs) is a separate sweep, owned by steps 9–11.

## Exposed files

| Path | What's private | Hits | Lines |
|---|---|---:|---:|
| `.agent/docs/research/pitch-deck/04-business-model.md` | Tier prices, unit economics | 73 | 182 |
| `.agent/docs/research/pitch-deck/sources/business-model-comps.md` | Competitor pricing comps backing the tier design | 91 | 244 |
| `.agent/docs/research/pitch-deck/sources/convex-ecosystem.md` | Convex-cost assumptions behind the pricing model | 41 | 199 |
| `.agent/docs/research/pitch-deck/sources/market-size.md` | Market-sizing math feeding the business model | 46 | 230 |
| `.agent/docs/research/pitch-deck/sources/competitors.md` | Competitor-pricing research | 37 | 255 |
| `.agent/docs/research/pitch-deck/DESIGN-AGENT-PROMPT.md` | Pitch-deck brief naming tiers and asks | 37 | 155 |
| `.agent/docs/research/pitch-deck/03-competition.md` | Competitive pricing positioning | 17 | 124 |
| `.agent/docs/research/pitch-deck/README.md` | Pitch-deck index naming every file above | 16 | 88 |
| `.agent/docs/research/pitch-deck/07-gaps-and-asks.md` | Funding ask, ENT-P paperwork gaps | 12 | 78 |
| `.agent/docs/research/pitch-deck/06-traction-roadmap-team.md` | ENT-0/ENT-P roadmap, team/traction numbers | 8 | 89 |
| `.agent/docs/research/pitch-deck/02-market-why-now.md` | Market timing tied to the pricing model | 9 | 64 |
| `.agent/docs/research/pitch-deck/05-platform-convex.md` | Convex cost structure behind pricing | 7 | 90 |
| `.agent/docs/research/pitch-deck/01-problem-solution-product.md` | Weak hits (2) — keep with the set for one coherent deck | 2 | 136 |
| `.agent/docs/product/post-v0.1.0-plan.md` | Tier design, licence enforcement, customer specifics (named in Design Decision 25) | 35 | 448 |
| `.agent/docs/product/maprios-roadmap-gaps.md` | Named customer (maprios) gap analysis | 12 | 197 |
| `.agent/docs/research/legacy-planning/multi-component-implementation.md` | Multi-component workspace tier design | 36 | 586 |
| `.agent/docs/research/legacy-planning/maprios-migration-todo.md` | Named customer (maprios) migration checklist | 22 | 330 |
| `.agent/docs/research/legacy-planning/roadmap-monetization-strategy-v2.md` | Monetization strategy, tiers | 13 | 686 |
| `.agent/docs/research/legacy-planning/maprios-migration-analysis.md` | Named customer (maprios) site analysis | 5 | 517 |
| `.agent/docs/design/claude-design/www/pages.jsx` | Pricing-page UI mock with tier names/prices | 11 | 795 |
| `.agent/docs/research/legacy-planning/README.md` | Index pointing at the maprios/monetization files above | 1 | 23 |
| `.agent/docs/research/legacy-planning/v0.1.0-launch-roadmap.md` | One "enterprise moat" row in a feature table | 1 | 450 |
| `.agent/docs/research/legacy-planning/multi-component-architecture.md` | One "Post-Enterprise" phase label | 1 | 605 |
| `.agent/docs/product/v0.1.0-launch-plan.md` | Tier names in the Q section and item 16's intro; the customer name in a non-goals list | 6 | 1947 |
| `.agent/docs/product/roadmap.md` | Tier names in an otherwise-public milestone roadmap | 16 | 110 |
| `.agent/docs/specs/2026-11-06-public-presence/` | Steps 15 and 19 and this file quote the lines above | — | — |
| `.agent/docs/specs/2026-11-06-launch-*/` | Sibling launch specs quote the same tier names and the customer name | — | — |

Other `.agent/` hits were reviewed and are not private: third-party vendor prices in research notes
(`research/cdn-edge-caching-options.md`, `research/db-adapter-feasibility.md`), competitor pricing in
the launch specs' `sources.md`/`competitors.md`, and incidental words in session logs and
`standards/directory-structure.md`.

Outside `.agent/` (`rg -n '\$995|\$2,500|Agency tier|maprios' $(git ls-files | rg -v '^\.agent/')`), the customer name
appears 4 times. Moving `.agent/` doesn't remove these:

| Path | Line | What |
|---|---:|---|
| `apps/test/convex/seed.ts` | 1681, 1688 | A seeded `case_studies` document with slug `maprios` and `clientUrl: "https://maprios.com"` |
| `packages/core/CHANGELOG.md` | 1321 | "Enables the maprios public patterns" — also in every published `@vexcms/core` tarball since that release |
| `packages/core/src/access/hasPermission.test.ts` | 896 | A test comment: "Mirrors the maprios …" |

No price or tier name matches outside `.agent/`.

## History rewrite — record the decision

`git filter-repo` + force-push removes the files from every commit in this repo's history,
not just HEAD. **Record which was chosen, and why:**

- [ ] Rewrite history: forks and existing clones keep the old history until they re-fetch
      (GitHub's cached blob/commit views may serve old content for a time even after the
      force-push); every other worktree of this bare repo must `git fetch` + reset rather
      than merge. Destructive — the developer's explicit call, not a default.
- [ ] Do not rewrite history: the files stop appearing in new clones and on `ref=dev`/`ref=master`
      going forward, but anyone who already cloned, or who checks out an old commit SHA, still
      has them. Decide this is acceptable (pricing details stale by launch, no live credentials
      in the inventoried files) or escalate to a rewrite.

Decision: _______________________________________________ (filled in by the developer at this step)
