# Prompt for the design agent — VexCMS seed pitch deck

> Paste everything below the line into the design agent, and upload every file in
> `.agent/docs/research/pitch-deck/` (the 7 numbered docs, `README.md`, and the four files in
> `sources/`). Prepared 2026-10-17.

---

You are designing a seed-stage investor pitch deck for **VexCMS**, a code-first, open-source
(Apache-2.0) CMS built natively on **Convex** (a reactive TypeScript backend). The founder
is a solo engineer. I have uploaded the full research pack; treat it as the only source of
facts. Do not invent numbers, customers, logos, quotes, or traction.

## Files and what they feed

| File | Use it for |
|---|---|
| `README.md` | Slide outline (Sequoia 10 + demo/traction/ask), key-numbers cheat sheet, verification notes |
| `01-problem-solution-product.md` | Purpose, problem, solution, product, technology, demo assets, honest "not yet shipped" list |
| `02-market-why-now.md` | Why now (5 drivers), TAM / SAM / SOM, ecosystem numbers |
| `03-competition.md` | Payload + BaseHub profiles, BaseHub feature matrix with tiers, market map (an SVG is included), differentiation table |
| `04-business-model.md` | §4 pricing tiers and launch ramp, §5 five-year revenue scenarios and mix sensitivity, revenue streams |
| `05-platform-convex.md` | Convex as partner and risk, npm growth table, partnership asks, platform-risk FAQ |
| `06-traction-roadmap-team.md` | Timeline, traction metrics (with caveats), roadmap mermaid + table, team |
| `07-gaps-and-asks.md` | Founder-only open questions, risks to pre-empt, use-of-funds buckets |
| `sources/*.md` | Citations for the appendix; never put raw analyst ranges on a main slide without the source |

## Deliverable

- A **16:9 deck of 13 main slides + appendix**, following the outline in `README.md`
  ("Suggested deck outline"). One idea per slide, headline as a full-sentence claim, ≤ 30
  words of body text per slide.
- **Speaker notes on every slide** with the supporting facts and the source file + section.
- A **source footnote** (small, bottom) on any slide that states a number.
- Export-ready for Google Slides or Keynote; charts as native, editable charts where possible.

## Brand

- Product name: **VexCMS** (one word, capital V, "CMS" caps). Site: vexcms.dev; public
  read-only admin demo: vexcms.dev/admin.
- Typeface: **Geist** (Geist Mono for code).
- Theme "Stark × Ember": near-monochrome neutrals with one ember-orange accent —
  light primary `oklch(60.5% 0.175 42)`, dark primary `oklch(68% 0.178 40)`. Use the accent
  sparingly (one highlight per slide). On dark backgrounds, text on the accent must be
  near-black, not white (white fails contrast).
- Code samples: dark code pane, even on light slides.
- Tone: evidence-first, plain, technical-founder voice. No hype words ("revolutionary",
  "game-changing"), no emoji.

## Slide-by-slide content

1. **Company purpose** — "The content backend for everything Convex." Subline: one TS
   config → Convex schema, types, validators, and a live admin panel. (01)
2. **Problem** — CMSs sit beside the backend (second database, API layer, polling/webhooks);
   Convex has no CMS of its own. (01, 02)
3. **Solution** — config → generated schema/types → real-time admin; show a short
   `defineCollection` code snippet beside a screenshot placeholder of the admin. (01)
4. **Product / demo** — what has shipped (13 field types incl. rich text, versioning &
   drafts, live preview of unsaved edits, field-level access control compiled into indexed
   queries, lifecycle hooks, SEO prerendering). Include the honest "not yet" line. QR/link to
   vexcms.dev/admin. (01)
5. **Why now** — the five drivers in 02: category M&A (Figma→Payload, Vercel→BaseHub,
   Salesforce→Contentful ~$1.5B), both named competitors absorbed by platforms with other
   priorities, Convex growth (~10k paying teams, $57M Series B, `convex` npm 12× YoY),
   TypeScript + AI agents, developer CMS dissatisfaction (67.5%). (02)
6. **Market** — bottom-up first: SOM ≈ **$0.53–2.2M ARR at today's Convex size**, growing
   with Convex; TAM/SAM as small context only (headless CMS ~$1.6–1.8B, 2025). Label every
   assumption. (02, 04 §5, 05)
7. **Competition** — market map (code-first ↔ UI-first × real-time ↔ request/response; SVG in
   03) and the differentiation table, **including the honest maturity row (8 GitHub stars vs
   45k for Payload)**. (03)
8. **Business model** — open core: Community free (Apache-2.0) · Pro **$995/yr** · Agency
   **$2,500/yr** · Enterprise **$9.5k / $18k / $30k per year** by company size. Per company,
   never per seat; self-hosted licences, no hosting, near-100% gross margin; renewing
   customers keep their price. Show tier cards with 3–5 features each, from 04 §4. Add the
   launch-price ramp as a small table. (04)
9. **Revenue scenarios** — the five-year ARR chart (data below) plus one line on the mix
   sensitivity: "Enterprise is ~5% of customers but ~37% of base-case revenue in year 5."
   (04 §5)
10. **Traction** — timeline (first commit Feb 2026 → npm Mar 2026 → Convex meetup Sep 2026 →
    Discord → live preview → drafts + rich text Oct 2026), velocity (40 npm versions, ~1.9k
    tests, 14 ADRs), design partner (maprios migration). **Do not present npm downloads as
    users** — 06 explains why. Leave marked placeholders for anything 07-A3/A4 lists as
    founder-only. (06, 07)
11. **Roadmap** — v0.1.0 → maprios migration (Payload → VexCMS case study) → brownfield
    adoption for existing Convex apps → Pro → Agency → Enterprise; Community features run in
    parallel. Use the mermaid flow in 06 as the structure. No dates — leave a placeholder
    row "Target quarter: [founder]". (06)
12. **Team** — founder card with placeholders for bio, background, and hiring plan (07-A1,
    A6). (06, 07)
13. **Ask / use of funds** — placeholders for amount and instrument; the five buckets from
    07-E (engineering, devrel/community, paid-tier infrastructure, enterprise readiness,
    runway). (07)

**Appendix:** platform-risk FAQ (05), BaseHub feature matrix with tiers (03), pricing
comparables (04 §2), mix-sensitivity table (04 §5), launch-price ramp (04 §4), architecture/ADR
list (01), full source list (sources/).

## Chart data (use exactly these numbers)

**Five-year ARR by tier — stacked bars, one chart per scenario, or one chart with a scenario
toggle.** Colour by tier: Pro = neutral dark, Agency = mid-grey, Enterprise = ember accent.
Annotate year-5 totals. Footnote: "Scenarios, not forecasts. Assumes yearly cohorts at
locked prices, churn Pro 20% / Agency 15% / Enterprise 10%. Source: 04 §5."

| Scenario | Year | Pro | Agency | Enterprise | Total |
|---|---|---|---|---|---|
| Conservative | 1 | $6k | $0 | $0 | $6k |
| Conservative | 2 | $29k | $4k | $7k | $39k |
| Conservative | 3 | $83k | $15k | $37k | $135k |
| Conservative | 4 | $146k | $38k | $99k | $282k |
| Conservative | 5 | $216k | $62k | $180k | $458k |
| Base | 1 | $15k | $0 | $0 | $15k |
| Base | 2 | $83k | $10k | $21k | $114k |
| Base | 3 | $266k | $39k | $101k | $405k |
| Base | 4 | $491k | $95k | $287k | $873k |
| Base | 5 | $741k | $168k | $545k | $1.45M |
| Strong | 1 | $30k | $0 | $0 | $30k |
| Strong | 2 | $202k | $25k | $41k | $268k |
| Strong | 3 | $659k | $101k | $223k | $983k |
| Strong | 4 | $1.22M | $236k | $657k | $2.12M |
| Strong | 5 | $1.87M | $401k | $1.24M | $3.52M |

**Mix sensitivity (appendix)** — grouped bars, ARR at list price by total customers:

| Customers | Pro-heavy 90/7/3 | Balanced 80/12/8 | Enterprise-leaning 70/15/15 |
|---|---|---|---|
| 100 | $146k | $214k | $303k |
| 250 | $366k | $535k | $757k |
| 500 | $731k | $1.07M | $1.51M |
| 1,000 | $1.46M | $2.14M | $3.03M |
| 2,000 | $2.92M | $4.28M | $6.06M |

**Convex growth (slide 5 or 6)** — line chart of monthly `convex` npm downloads from the table
in 05 ("Growth trajectory"); caption that npm counts are a proxy, not customers.

## Rules

1. **Honesty over polish.** Keep every `[ASSUMPTION]`, `[HYPOTHESIS]`, and "unverified"
   label from the source files as a visible footnote. Revenue figures are scenarios, never
   forecasts.
2. **Placeholders, not inventions.** Anything listed in `07-gaps-and-asks.md` §A as a
   founder-only answer (bio, raise amount, event outcomes, design-partner relationship)
   becomes a clearly marked `[FOUNDER: …]` placeholder.
3. **No logos or testimonials** — there are none to show. Competitor logos only on the
   market map and comparison table.
4. **Licence is Apache-2.0**, never MIT. Hosting is never offered: VexCMS runs in the
   customer's own Convex deployment.
5. **Free stays free:** localization, presence, drafts, live preview, RBAC, hooks are
   Community features — never place them in a paid tier.
6. Where two files disagree, prefer the later-dated statement (2026-10-17 decisions in 04 §4–5
   and 03's tier column supersede older text) and list the conflict in your notes back to me.

When done, return: the deck, a list of every placeholder you left, and any facts you could
not place or found contradictory.
