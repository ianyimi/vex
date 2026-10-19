# VexCMS pitch-deck research pack

**Question:** What material does someone need to build a standard seed/pre-seed pitch deck for
VexCMS, sourced from the repo, its history, and current market research?

**Answer:** Seven slide-oriented docs plus four raw research dossiers with full citations.
Compiled 2026-10-12 at `0.1.0-alpha.23`. Short version: VexCMS is the first serious CMS for
Convex, a backend growing ~12× YoY that has no CMS of its own. Its two named competitors were
both just absorbed by larger platforms (Payload → Figma; BaseHub → Vercel), and the category is
consolidating (Salesforce is buying Contentful for ~$1.5B). Traction is pre-seed level. Pricing
was decided 2026-10-17 (Community free · Pro $995/yr · Agency $2,500/yr · Enterprise
$9.5–30k/yr, `04-business-model.md` §4). `07-gaps-and-asks.md` lists what to fix first.

## Files

| File | Slides it feeds |
|---|---|
| `01-problem-solution-product.md` | Company purpose, Problem, Solution, Product/Demo, Technology |
| `02-market-why-now.md` | Why now, Market potential (TAM/SAM/SOM) |
| `03-competition.md` | Competition, Positioning map, Differentiation, **BaseHub feature adoption matrix** |
| `04-business-model.md` | Business model, Pricing, Go-to-market; monetization history from legacy docs |
| `05-platform-convex.md` | Platform partner, Partnership asks, Platform-risk FAQ |
| `06-traction-roadmap-team.md` | Traction, Milestones/Roadmap, Team |
| `07-gaps-and-asks.md` | Founder questions, metrics to collect, risks to pre-empt, use-of-funds template |
| `sources/market-size.md` | Analyst market sizes, adoption surveys, developer/AI trends, TAM inputs |
| `sources/competitors.md` | 15-company master table, Payload + BaseHub deep dives, Convex-native landscape |
| `sources/convex-ecosystem.md` | Convex funding/growth/pricing/programs, platform analogies, risk |
| `sources/business-model-comps.md` | Open-core comps, SSO-tax data, cloud/FSL analysis, fundraising benchmarks, grants, deck-structure guidance |
| `DESIGN-AGENT-PROMPT.md` | Ready-to-paste brief for a design agent: slide-by-slide content, brand, exact chart data, honesty rules |

## Suggested deck outline (Sequoia's 10 sections + demo/traction/ask)

| # | Slide | Core content | Source |
|---|---|---|---|
| 1 | Company purpose | "The content backend for everything Convex." | 01 |
| 2 | Problem | CMSs sit beside the backend: second DB, API layer, polling. Convex has no CMS | 01, 02 |
| 3 | Solution | One TS config → Convex schema, types, validators, live admin panel | 01 |
| 4 | Demo / product | Public read-only admin at vexcms.dev/admin; config→schema code showcase | 01 |
| 5 | Why now | Platform M&A (Figma/Payload, Vercel/BaseHub, Salesforce/Contentful); Convex 12× growth and $57M Series B; TypeScript #1 language plus AI agents | 02 |
| 6 | Market | Bottom-up beachhead → headless CMS TAM range | 02 |
| 7 | Competition | Market map, differentiation table, honest maturity row | 03 |
| 8 | Business model | Apache-2.0 core; self-hosted Pro / Agency / Enterprise licences priced per company by size, never per seat; five-year ARR scenarios $0.46M / $1.45M / $3.52M. No hosting, so licence margins are close to 100% | 04 |
| 9 | Traction | Timeline, shipping velocity, design partner, meetup/Discord (fill in from 07-A3/A4) | 06, 07 |
| 10 | Roadmap | v0.1.0 → maprios migration → brownfield adoption → Pro → Agency → Enterprise | 06, 03 |
| 11 | Team | Founder (+ hiring plan) | 06, 07 |
| 12 | Ask / use of funds | Template in 07-E | 07 |
| 13 | Vision | Content layer for reactive, agent-built apps | 02, 05 |
| Appx | Platform risk FAQ, architecture/ADR list, comps tables | 05, 01, sources |

## Key numbers cheat sheet (all as of 2026-10-12 unless noted)

| Number | Value | Source |
|---|---|---|
| Convex Series B | $57M, Insight Partners, 2026-08-04; ~$110.5M total | [PR Newswire](https://www.prnewswire.com/news-releases/convex-raises-57m-series-b-led-by-insight-partners-to-scale-the-reliable-backend-for-the-ai-era-302841686.html) |
| Convex scale | ~2M apps, ~500k devs; ~10k paying teams | same; [Convex 2026-04-02](https://news.convex.dev/enterprise-launch/) |
| `convex` npm growth | 1.70M/wk vs 139k/wk a year earlier (12.2×) | npm API |
| Headless CMS market | ~$1.6–1.8B (2025), ~17–20% CAGR (wide analyst spread) | Mordor, Grand View |
| Payload | Acquired by Figma 2025-06-17; Cloud paused for new projects; 45.2k★ | Figma blog; Payload FAQ |
| BaseHub | Joined Vercel 2026-06-02; "not planning to enter the CMS space" | [BaseHub blog](https://basehub.com/blog/basehub-is-joining-vercel) |
| Contentful | Salesforce, ~$1.5B | [SEC 10-Q](https://www.sec.gov/Archives/edgar/data/0001108524/000110852426000190/crm-20260731.htm) |
| Dev pain | 67.5% say their CMS holds them back | Storyblok/Sago 2025 |
| Pricing (2026-10-17) | Pro $995 · Agency $2,500 · Enterprise $9.5k / $18k / $30k per year | `04-business-model.md` §4 |
| Year-5 ARR scenarios | $0.46M conservative · $1.45M base · $3.52M strong | `04-business-model.md` §5 |
| Beachhead ceiling at today's Convex size | ~$0.53–2.2M ARR | `04-business-model.md` §5 |
| VexCMS | 8 packages, 40 versions, ~1.9k tests, 14 ADRs, 8★ | repo; GitHub API |

## Verification notes

- **Hand-verified against primary sources (2026-10-12):** Convex Series B release,
  BaseHub→Vercel post, Salesforce→Contentful (SEC filing + press), and Payload access
  constraints (docs). Everything else in `sources/` was gathered by research sub-agents. Each
  item cites a URL, but re-open any number before it goes on a slide.
- **Treat with caution:** analyst market sizes (opaque methodology, >10× spread); third-party
  revenue estimates (Latka, Vendr, getlatka); the Carta seed medians (secondary source); the
  Directus licence (the two dossiers disagree: BSL 1.1 vs MSCL 1.0 since Apr 2026); "Tailwind
  Plus acquired by Shopify" (third-party blog only; irrelevant to the deck, so don't use it);
  Convex headcount (aggregators disagree, 31–43).
- **Corrected during synthesis:** the competitor dossier's VexCMS-status cells overstated
  multiplayer (VexCMS has live subscriptions, not co-editing). Access-rules-in-query and
  live preview of unsaved state are **parity with Payload**, not unique. The synthesized docs
  reflect both corrections.
- **Superseded internal claim:** `legacy-planning/roadmap-monetization-strategy-v2.md` says MIT;
  the project is Apache-2.0 since Aug 2026 (decision D9).

## Open questions

See `07-gaps-and-asks.md` § A. The top three: founder bio and the maprios relationship, what the
Convex meetup and Discord post produced, and the raise amount and milestones.
