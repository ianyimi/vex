# VexCMS Competitor Research — Market Landscape

> **Provenance:** compiled 2026-10-12 by a research sub-agent; kept verbatim as the citation
> source for `../03-competition.md`. **The "VexCMS status" cells in §4.1 and §8 are superseded**
> by the repo-verified status in `../03-competition.md` (e.g. VexCMS has live subscriptions but
> no multiplayer co-editing/presence yet). Directus licence: this file says BSL 1.1;
> `business-model-comps.md` §1 says relicensed to MSCL 1.0 in Apr 2026 — verify before citing.

*Compiled 2026-10-12. All figures carry inline citations + as-of/publish dates. Items that could not be verified are marked "not found" or placed in the final "Unverified / conflicting" section. Third-party estimates (Latka, CB Insights, Tracxn, PitchBook) are explicitly flagged as such — they are not company-disclosed primary figures.*

---

## 0. Five-line summary (pitch-relevant)

1. **Payload** (MIT, self-host, Next.js-native, 45.2K ★) was **acquired by Figma on 2025-06-17**; Payload Cloud hosting is now **paused for new projects**, pushing more Payload users toward pure self-hosting — a tailwind for any self-hosted alternative, but Payload still dwarfs VexCMS in maturity, ecosystem (360+ plugins), and GitHub stars.
2. **BaseHub** (closed-source SaaS, the real-time/branching leader) was **folded into Vercel on 2026-06-02**; the founder moved to Vercel's v0 team and BaseHub's roadmap is now "we'll share more soon" — real continuity risk for its customers, and BaseHub itself publicly admitted (Dec 2025) its proprietary Postgres content model was a maintenance burden it's trying to escape via a Git-native rewrite.
3. **Contentful was acquired by Salesforce for ~$1.5B, closing 2026-09-01** — the second major headless-CMS M&A event in four months, strong evidence big platforms see durable strategic value in owning a content layer, and it removes a major independent SaaS competitor from the field.
4. **Convex-native CMS is effectively greenfield**: no official Convex-team CMS exists, the 175-entry Convex Components directory has zero CMS category, and the handful of third-party attempts (`obkaro/convex-cms`, `@cms-subir/*`, etc.) are single-digit-star, unmaintained hobby projects — VexCMS can credibly claim first-mover status in its specific niche.
5. **TypeScript code-first schema + true real-time collaboration together is rare**: Sanity/Strapi/TinaCMS/Keystatic have TS config but Strapi/TinaCMS/Keystatic lack true multiplayer; Sanity/Storyblok/DatoCMS/Builder.io/BaseHub have real-time but only BaseHub+Sanity+Strapi+TinaCMS+Keystatic are TS-code-first — **no competitor combines TS-code-first schema + Convex-grade real-time + field-level RBAC compiled into indexed queries + Apache-2.0 self-host**, which is VexCMS's structural gap to fill.

---

## 1. Master comparison table

| Company | Category | Licence (+ changes) | Data layer | Real-time collab | TS code-first schema | Pricing today | Funding / M&A | Traction |
|---|---|---|---|---|---|---|---|---|
| **Payload** | Code-first OSS, self-host, Next.js-native | MIT, unchanged post-acquisition ([FAQ](https://payloadcms.com/payload-has-joined-figma), 2026-10-12) | MongoDB or Postgres (self-managed) | No true multiplayer today; "Multi-Player Editing" listed **"Coming Soon"** on Enterprise page ([enterprise/multi-player-editing](https://payloadcms.com/enterprise/multi-player-editing), 2026-10-12) | Yes — `payload.config.ts` | Self-host free; Cloud **paused for new projects**; Enterprise = sales-led, no public price ([enterprise](https://payloadcms.com/enterprise), 2026-10-12) | $4.7M seed, Nov 2022 ([TechCrunch](https://techcrunch.com/2022/11/15/payload-raises-4-7m-for-its-developer-first-headless-cms), 2022-11-15); **acquired by Figma, 2025-06-17, terms undisclosed** ([Figma blog](https://www.figma.com/blog/payload-joins-figma/)) | 45,205 ★ / 4,288 forks ([GitHub API](https://github.com/payloadcms/payload), fetched 2026-10-12); ~998K weekly npm downloads ([npm](https://www.npmjs.com/package/payload), 2026-10-12); customers Microsoft, ASICS, Blue Origin ([enterprise page](https://payloadcms.com/enterprise)) |
| **BaseHub** | Hosted SaaS, Git-inspired branching + real-time | Proprietary closed SaaS; **planned OSS "BaseHub Core"** not yet shipped ([Dec 2025 post](https://basehub.com/blog/files-agents-and-the-future-of-basehub)) | Proprietary (Postgres-based today; migrating to Git/Markdoc files) | **Yes** — multiplayer since launch, yjs CRDT for rich text, presence indicators ([pricing](https://basehub.com/pricing), 2026-10-12) | No — schema authored via dashboard blocks, not a `.ts` file (consumed via generated TS SDK) | Personal free; Team $15/user/mo; Unlimited $350/mo flat (no named "Enterprise") ([pricing](https://basehub.com/pricing), 2026-10-12) | No confirmed VC round found; Vercel CEO personally held a passive pre-acquisition stake; **acquired/absorbed by Vercel, 2026-06-02, terms undisclosed** ([blog](https://basehub.com/blog/basehub-is-joining-vercel)) | Not OSS, no star count; ~14K weekly npm downloads of `basehub` SDK ([npm](https://www.npmjs.com/package/basehub), 2026-10-12); customer logos not extracted — not found |
| **Sanity** | Hosted SaaS (Studio code is OSS) | Studio/CLI MIT; **Content Lake proprietary, no self-host** ([sanity.io/answers](https://www.sanity.io/answers/using-external-databases-with-content-lake-in-sanity-io)) | Proprietary "Content Lake" | Yes — flagship real-time multiplayer Studio | Yes — `.ts`/`.js` schema files | Free (2 datasets/2 users); Growth ~$15/seat/mo; Enterprise custom ([pricing](https://www.sanity.io/pricing), 2026-10-12) | $180.49M total raised (CB Insights); $87.18M Series C, 2025-05-08, led by ICONIQ Growth ([Cooley](https://www.cooley.com/news/coverage/2025/2025-05-14-sanity-closes-%2485-million-series-c)); valuation not found | 6,352 ★ ([GitHub API](https://api.github.com/repos/sanity-io/sanity), fetched 2026-10-12); customers Figma, Puma, Burger King, AT&T; ~$27M est. ARR 2024 (Latka, 3rd-party est.) |
| **Strapi** | Code-first OSS, self-host (open-core) | MIT core, proprietary Enterprise add-ons ([pricing](https://strapi.io/pricing-cms), 2026-10-12) | Postgres/MySQL/SQLite (self-managed) | No — "no real-time co-editing, no presence indicators" ([dxpscorecard.com](https://www.dxpscorecard.com/platform/strapi)); content locking Enterprise-only | Yes — TS/JS content-type schema files | Self-host free; Cloud Starter ~$35/mo, Pro ~$90/mo, Business ~$450/mo; Enterprise custom ([pricing](https://strapi.io/pricing-cloud), 2026-10-12) | $31M Series B, 2022-06-22, led by CRV + Index Ventures ([Businesswire](https://www.businesswire.com/news/home/20220622005234/en/Strapi-Secures-24-Million-in-Series-B-Funding)); total raised/valuation not found | 73,297 ★ ([GitHub API](https://api.github.com/repos/strapi/strapi), fetched 2026-10-12); customers NASA, Walmart, IBM, Toyota |
| **Contentful** | Hosted SaaS, API-first | Proprietary closed SaaS; **acquired by Salesforce, closed 2026-09-01, ~$1.5B cash** ([SEC 8-K](https://www.sec.gov/Archives/edgar/data/0001108524/000110852426000187/crm-q2fy27xexhibit991.htm)) | Proprietary content repository | No true multiplayer — optimistic locking only ([headlesscms.guide](https://headlesscms.guide/guides/top-5-headless-cms-platforms-with-real-time-collaboration)) | No — UI/Management-API model config | Free (10 users, 100K API calls/mo); Lite $300/mo; Premium/Enterprise custom ([pricing](https://www.contentful.com/pricing), 2026-10-12) | $333.3M total raised (Latka est.); last round $175M Series F at ~$3B valuation, 2021-07-28, Tiger Global ([TechCrunch](https://techcrunch.com/2021/07/28/contenful-raises-175m-from)); **acquired by Salesforce, ~$1.5B, 2026-09-01** | Not OSS; used by ~30% of Fortune 500 / 4,800+ brands per Salesforce announcement ([salesforce.com/news](https://www.salesforce.com/news/stories/salesforce-signs-definitive-agreement-to-acquire-contentful/)) |
| **Directus** | Code-first OSS "backend-as-CMS" wrapping your own DB | **BSL 1.1** (relicensed from GPLv3) — free under $5M/yr revenue, converts to GPLv3 after 3 yrs ([hub.docker.com](https://hub.docker.com/r/directus/directus)) | **Your own** Postgres/MySQL/SQLite/MSSQL/Oracle | No native real-time co-editing found | No — Studio UI reads existing DB schema, not a `.ts` file | Self-host free; Cloud Professional $99/mo; Enterprise $499/mo ([toolradar.com](https://toolradar.com/tools/directus/pricing), 2026-05) | $7M Series A, Nov 2022, True Ventures + Handshake Ventures ([PR Newswire](https://www.prnewswire.com/news-releases/open-source-software-company-directus-lands-7-million-in-series-a-funding-301673718.html)); total raised/valuation not found | 38,419 ★ ([GitHub API](https://api.github.com/repos/directus/directus), fetched 2026-10-12); customers/ARR not found |
| **Storyblok** | Hosted SaaS, visual/component editor | Proprietary closed SaaS, no self-host | Proprietary content repository | Yes — real-time Visual Editor + comments | No — UI-configured components | Free Community (1-2 seats); Growth €99/mo; Growth Plus €349/mo; Premium/Elite custom ([Capterra](https://www.capterra.com/p/213991/Storyblok/)) | $80M Series C, announced 2024-06, Brighton Park Capital ([storyblok.com](https://www.storyblok.com/mp/series-c)); ≈$140M+ total raised; valuation not found | Not OSS; customers Disney, Netflix, Adidas, Tesla; 120,000+ projects ([MACH Alliance](https://machalliance.org/members/storyblok)) |
| **Hygraph** (ex-GraphCMS) | Hosted SaaS, GraphQL-native federation | Proprietary closed SaaS | Proprietary, GraphQL-only | No native real-time co-editing found | No — UI-configured models | Free Hobby (3 seats, 1K entries); Growth $199/mo; Enterprise custom (up to 200 seats) ([stackscored.com](https://www.stackscored.com/pricing/headless-cms/hygraph)) | $30M Series B, 2023-03-29, One Peak ([TheSaaSNews](https://www.thesaasnews.com/news/hygraph-raises-30-million-in-series-b)); ~$43.7M total since 2018 seed; valuation not found | Not OSS; customers/ARR not found |
| **TinaCMS** | Git-based OSS, live visual editing | Apache-2.0 core; TinaCloud proprietary; **acquired by SSW (dev agency), 2024-05-14, terms undisclosed** ([tina.io/blog](https://tina.io/blog/Tina-Joins-SSW)) | Git (Markdown/MDX/JSON); TinaCloud adds hosted GraphQL layer | Yes, but git-commit-based click-to-edit, not true multiplayer | Yes — `tina/config.ts` | Free (2 users); Team $29/mo; Business $299/mo; Enterprise custom ([luckymedia.dev](https://www.luckymedia.dev/insights/tina-cms) citing tina.io/pricing) | $776K seed, April 2017, no VC rounds since ([checkthat.ai](https://checkthat.ai/brands/tinacms) citing Crunchbase); acquired by SSW May 2024 | 13,826 ★ ([GitHub API](https://api.github.com/repos/tinacms/tinacms), fetched 2026-10-12); customers/ARR not found |
| **Keystatic** | Git-based OSS, no-database, built into your app | MIT, no feature gating on core ([GitHub discussion](https://github.com/Thinkmill/keystatic/discussions/107)) | Git only (Markdown/YAML/JSON), zero DB | No — "multiplayer editing" only an experimental Cloud-Pro roadmap item ([luckymedia.dev](https://www.luckymedia.dev/compare/keystatic-vs-sanity)) | **Yes** — headline feature, `keystatic.config.ts` | Core self-host free forever; optional Cloud: Free / Solo $9/mo / Team $29/mo / Pro $79/mo ([luckymedia.dev](https://www.luckymedia.dev/insights/keystatic)) | Built/maintained by Thinkmill (Sydney agency); no external VC found | 2,444 ★ ([GitHub API](https://api.github.com/repos/Thinkmill/keystatic), fetched 2026-10-12); small/early (released 2023), customers/ARR not found |
| **Builder.io** | Hosted SaaS visual/AI page builder + headless CMS | SDKs MIT; platform/editor proprietary | Proprietary content repository | Yes — collaborative visual editor | No — dashboard-configured models (JSON under the hood) | Free (1-5 users); Pro $24/user/mo; Team $40/user/mo; Enterprise custom ([101aitools.com](https://101aitools.com/tool/builder-io/)) | $37.3M total: $3.2M seed (2020-10), $14M Series A (2021-10, Greylock, [builder.io/blog](https://www.builder.io/blog/14m-series-a-funding-builder)), $20M venture round led by M12/Microsoft (2024-04) | 8,864 ★ ([GitHub API](https://api.github.com/repos/BuilderIO/builder), fetched 2026-10-12); customers/ARR not found |
| **Prismic** | Hosted SaaS, "slice"-based page builder | Proprietary closed SaaS | Proprietary content repository | Not confirmed as true multiplayer — not found | No — Slice Machine UI + JS components | Free Starter (1 user); Small $15/mo; Medium $100/mo; Platinum $500/mo; Enterprise custom ([dev.to pricing breakdown](https://dev.to/nayankyada/prismic-pricing-2026-free-tier-limits-per-seat-costs-when-to-upgrade-63o)) | Bootstrapped/profitable since 2016; $20M Series A, 2021-05-26, Eurazeo + Aglaé Ventures ([TechCrunch](https://techcrunch.com/2021/05/26/prismic-raises-20-million-for-its-headless-cms)); valuation not found | Not OSS; ~4,000 customers, ~$15M est. revenue (Latka, 3rd-party) |
| **DatoCMS** | Hosted SaaS, structured content | Proprietary closed SaaS | Proprietary content repository | Yes — presence indicators + exclusive record locking (optimistic locking, not char-level co-editing) ([datocms.com/blog](https://www.datocms.com/blog/new-collaboration-tools)) | No — UI-configured models | Free forever (2 editors, 300 records); Professional €149/mo annual; Enterprise custom ([saaspartout.com](https://saaspartout.com/marketplace/datocms/)) | **Fully bootstrapped, $0 VC** — "we don't want venture capital funding" ([datocms.com/about](https://www.datocms.com/company/about)); ~$1.3M revenue, 12-person team (2025 est., Latka) | Not OSS; customer Vercel cited by DatoCMS itself |
| **Decap CMS** (ex-Netlify CMS) | Git-based OSS, static-site CMS | MIT; rebranded (not relicensed) from Netlify CMS, Feb 2023, when Netlify handed it to the community ([netlify.com/blog](https://www.netlify.com/blog/netlify-cms-to-become-decap-cms/)) | Git (Markdown/YAML/JSON) | No — "concurrent edits simply error" ([astro4b.com](https://astro4b.com/en/blog/decap-cms/)) | No — `config.yml` (YAML), no TS config | Free, self-hosted, $0, no commercial tier ([decapcms.org/docs](https://decapcms.org/docs/intro/)) | No independent funding; community project maintained by agency partner PM | 19,425 ★ ([GitHub API](https://api.github.com/repos/decaporg/decap-cms), fetched 2026-10-12); 3-person maintainer team, latest release 3.16.0 (Aug 2026, [busyless.space](https://busyless.space/headless-cms/decap-cms)) |
| **Ghost** *(OSS business-model precedent only)* | Hosted SaaS (Ghost Pro) + OSS self-hosted non-profit publishing platform | MIT; non-profit foundation, structurally cannot be sold ([ghost.org/docs/license](https://ghost.org/docs/license/)) | MySQL/SQLite (self-managed) | N/A (blogging platform) | No — not a structured-content CMS | Self-host free; Ghost(Pro) Starter $15/mo annual; Publisher $29/mo; Business $199/mo ([luxethemes.com](https://luxethemes.com/resources/ghost-pricing-guide)) | **$0 external VC — non-profit model**; crossed **~$10M ARR in March 2026** fully bootstrapped ([ghost.org/about](https://ghost.org/about/) live counter $11.13M, accessed 2026-10-12) | 55,518 ★ ([GitHub API](https://api.github.com/repos/TryGhost/Ghost), fetched 2026-10-12); 30,547 active paying customers, 100M+ installs ([ghost.org/about](https://ghost.org/about/)) |

*GitHub stats for all OSS rows fetched live via `api.github.com/repos/<org>/<repo>` on 2026-10-12.*

---

## 2. Short per-company notes (non-Payload/BaseHub)

- **Sanity**: Vendor lock-in risk — GROQ query language + Portable Text format only work against proprietary Content Lake, no export path to Postgres/Mongo ([buildwithmatija.com](https://www.buildwithmatija.com/blog/cms-vendor-lock-in-sanity-payload-2026)). Real-time multiplayer is genuinely strong — closest competitor to VexCMS on the real-time axis among TS-schema tools.
- **Strapi**: Largest OSS star count (73K) but v4→v5 upgrade removed `@strapi/helper-plugin` entirely, breaking admin plugins, and the official upgrade tool doesn't auto-fix it ([GitHub #21086](https://github.com/strapi/strapi/issues/21086)).
- **Contentful**: Now a Salesforce business unit. Historically criticized for API rate caps (CDA 78 req/sec) and a hard jump from free to $300/mo Lite tier ([contentstack.com](https://www.contentstack.com/blog/all-about-headless/9-disadvantages-of-contentful-real-users-reveal-the-biggest-issues)).
- **Directus**: Uniquely wraps *your own* existing SQL database rather than owning the data layer — closest philosophical sibling to VexCMS's "no separate DB to operate" pitch, but inverted (Directus adds a layer on top of a DB you still operate; VexCMS removes DB ops entirely since Convex is managed). Relicensed to BSL 1.1 in 2023, a cautionary precedent for VexCMS's pledge to stay Apache-2.0.
- **TinaCMS / Keystatic / Decap CMS**: All git-based, so none has true real-time by architecture (commits ≠ live). Keystatic is the closest spiritual sibling to VexCMS (MIT, TS-config, zero-DB) but has no multiplayer and is agency-maintained, not funded.
- **Ghost**: Included purely as an OSS-sustainability precedent — proof a fully open (MIT), non-profit-structured project can self-fund to eight-figure ARR without VC, which is directly relevant to VexCMS's "Apache-2.0 core forever + paid add-ons" framing.

---

## 3. Deep dive: Payload CMS

*All data as of 2026-10-12 unless noted.*

### 3.1 Figma acquisition
- **Date**: Announced 2025-06-17 ([Figma blog](https://www.figma.com/blog/payload-joins-figma/); [Payload's own post](https://payloadcms.com/posts/blog/payload-is-joining-figma); [GitHub Discussion #12843](https://github.com/payloadcms/payload/discussions/12843)).
- **Deal terms**: Not disclosed in any open source found (price, equity, valuation all unverifiable; PitchBook has a profile but is paywalled — [pitchbook.com/profiles/company/470610-73](https://pitchbook.com/profiles/company/470610-73)).
- **Figma's stated rationale**: Figma CTO Kris Rasmussen said Figma wants to be "a central hub for digital product creation" and had already announced a CMS for Figma Sites at Config 2025; Payload gives Figma "a powerful, customizable backend... plus an intuitive admin panel for editors," citing Payload's use by "several Fortune 100 companies" ([Figma blog, 2025-06-17](https://www.figma.com/blog/payload-joins-figma/)).
- **Licence**: Still MIT, confirmed in repo metadata and reaffirmed in the post-acquisition FAQ: "Is Payload still open source? Absolutely." ([FAQ](https://payloadcms.com/payload-has-joined-figma), live 2026-10-12).
- **Payload Cloud status — materially changed**: "Deployment of new projects is currently paused." Existing customers continue; self-hosting remains fully supported. "Will I need to migrate my project? Yes, eventually... we are planning to build something better" ([FAQ](https://payloadcms.com/payload-has-joined-figma)). Corroborated: [techsy.io](https://techsy.io/en/blog/payload-cms-guide) ("Payload Cloud paused new sign-ups"); [FocusReactive](https://focusreactive.com/payload-cms-overview/) ("discontinued for new projects shortly after the acquisition").

### 3.2 Current feature set (docs.payloadcms.com, live 2026-10-12)
Collections/Globals/Blocks config-driven modeling; auto-generated, extensible Admin Panel; Mongo **or** Postgres with migrations/transactions/indexing; REST + GraphQL + local Node API; built-in Authentication; document/field/operation-level Access Control; File Uploads with image resizing/focal-point crop; Lexical rich text (supports custom React components inline); Versions & Drafts with rollback; Live Preview; native field-level Localization (no plugin); Jobs Queue (parallel task execution since v3.54); 360+ community plugins / 160+ catalogued ([Payload Plugin Directory](https://www.payloaddirectory.dev/)); Next.js-native architecture since v3.0 (installs directly into any Next.js app) ([Payload 3.0 announcement](https://payloadcms.com/posts/blog/payload-30-the-first-cms-that-installs-directly-into-any-nextjs-app)).

### 3.3 Enterprise tier
Sales-led, **no public numeric pricing** ([payloadcms.com/enterprise](https://payloadcms.com/enterprise)). Contents: SSO (SAML/OAuth2), Audit Logs & Version Control, Visual Editor (**"Coming Soon"**), Multi-Player Editing (**"Coming Soon"**), AI Auto-Embedding/RAG framework, Enterprise AI (translation/image-gen/writing assistant), Publishing Workflows (approvals/notifications), Static A/B Variant Testing, field-level Access Control. Case-study customers: Microsoft, ASICS, Blue Origin, Hello Bello, Tekton.

### 3.4 Traction
- **GitHub**: 45,205 ★ / 4,288 forks / 1,291 open issues / last push 2026-10-10 ([api.github.com](https://api.github.com/repos/payloadcms/payload), fetched 2026-10-12).
- **npm**: ~998,000 weekly downloads, latest v3.90.2 ([npmjs.com/package/payload](https://www.npmjs.com/package/payload), 2026-10-12).
- **Pre-acquisition funding**: $4.7M seed, 2022-11-15 ([TechCrunch](https://techcrunch.com/2022/11/15/payload-raises-4-7m-for-its-developer-first-headless-cms)); Gradient Ventures/MongoDB cited as investors only by aggregator Tracxn, **not independently confirmed on a primary source** — treat as low-confidence. Founders: James Mikrut, Elliot DeNolf, Dan Ribbens; founded 2018, Grand Rapids, MI (Tracxn). Valuation never disclosed.

### 3.5 Post-acquisition community concerns
- Payload's own [GitHub Discussion #12843](https://github.com/payloadcms/payload/discussions/12843) (jmikrut, 2025-06-17) is the primary community venue; addressed "what does/doesn't change."
- HN threads: ["Payload Is Joining Figma"](https://news.ycombinator.com/item?id=44299989); ["When Figma starts designing us"](https://news.ycombinator.com/item?id=44479502) (~2025-07).
- techsy.io: "Some developers worry about the 'acquired-then-abandoned' pattern that plagues open-source projects, though the MIT license mitigates the worst-case scenario" ([techsy.io](https://techsy.io/en/blog/payload-cms-guide)).
- CMSWire: "open-source developers will be watching Figma's future moves closely to determine if Payload will remain flexible and community-driven" ([CMSWire](https://www.cmswire.com/digital-experience/when-cms-meets-ux-design-what-figmas-payload-deal-really-means/)).
- The one **concrete, realized** concern is the Payload Cloud pause for new projects (§3.1) — repeatedly cited as evidence of strategic shift.

### 3.6 Known developer complaints (independent of acquisition)
- **Next.js coupling**: deliberate since v3.0 — ties projects to Next's ecosystem/versioning; reported React-18.3.1 peer-dependency conflicts breaking the admin panel ([DEV.to](https://dev.to/ashujojo/resolving-dependency-error-in-a-nextjs-15-and-payload-cms-3-project-1dgo)).
- **MongoDB operational overhead**: "always a pain in the ass to set up MongoDB especially for junior developers" ([GitHub Discussion #287](https://github.com/payloadcms/payload/discussions/287)).
- **v2→v3 migration bugs**: MongoDB string-ID→ObjectId conversion skips some "versions" collections, leaving inconsistent ID types ([GitHub #10753](https://github.com/payloadcms/payload/issues/10753)).
- **Azure Cosmos DB (Mongo API) issues**: migration/composite-index failures ([GitHub #10136](https://github.com/payloadcms/payload/issues/10136), [#4273](https://github.com/payloadcms/payload/issues/4273)).
- **Data-migration friction**: "I mostly miss an easy way to migrate data... makes it hard [to use in] enterprise products" ([GitHub Discussion #625](https://github.com/payloadcms/payload/discussions/625)).

---

## 4. Deep dive: BaseHub

*All data as of 2026-10-12 unless noted.*

### 4.0 Headline: BaseHub is now part of Vercel
On **2026-06-02**, founder Julian Benegas announced BaseHub is joining Vercel; he personally joined Vercel's v0 team. "For BaseHub customers, nothing changes for now. Vercel is not planning to enter the CMS space, and BaseHub will continue to work as it does today... We'll share more information soon." Disclosed conflict: an investment fund associated with Vercel CEO Guillermo Rauch held a passive pre-acquisition stake in BaseHub; the deal was approved by an independent M&A committee excluding Rauch ([BaseHub Is Joining Vercel, 2026-06-02](https://basehub.com/blog/basehub-is-joining-vercel)).

Separately, on **2025-12-23**, BaseHub announced a planned architecture pivot ("Files, Agents, and the Future of BaseHub") — moving from a proprietary Postgres content/commit model to **Git + filesystem-native storage** (`.basehub/*.bshb` files on Markdoc) with a plan to **open-source "BaseHub Core"** for self-hosting — explicitly in response to Vercel's own Lee Robinson publicly advocating migration off headless CMSs to markdown+Git. As of 2026-10-12 this had **not shipped** ("We're still in active development") and it is **not found** whether the Vercel acquisition absorbed or superseded this plan ([Dec 2025 post](https://basehub.com/blog/files-agents-and-the-future-of-basehub)).

### 4.1 Feature inventory (BaseHub feature → what it does → tier → VexCMS status → build-on-Convex note)

| BaseHub feature | What it does | BaseHub tier/price | VexCMS status | Build-on-Convex note |
|---|---|---|---|---|
| **Branching / Commits / Merge** | Git-inspired version control: immutable Commits, isolated Branches, "Head Commit" resolves queries ([Platform Overview](https://docs.basehub.com/documentation/platform-overview)) | All tiers, core primitive | — | Could map to Convex document versioning + a branch-scoped table; no native Convex primitive for this today |
| **Block Milestones / history, diff & time-travel** | Per-block History tab; filter by date/author; browse any past commit; one-click restore ([changelog, 2025-03-26](https://basehub.com/changelog/block-milestones)) | All tiers ("Diff View" included) | — | Convex's transaction log / `_creationTime` + a custom audit table could approximate this |
| **Hidden Blocks / WIP staging** | Draft "work in progress" changes not committed/published until ready ([changelog](https://basehub.com/changelog/hidden-blocks)) | All tiers | — | Maps naturally to a `status: draft/published` field pattern already common in Convex schemas |
| **Real-time multiplayer collaboration** | Live multiplayer editing, presence, "follow mode"; yjs CRDT for rich text ([pricing](https://basehub.com/pricing)) | All tiers (always-included) | **Shipped** — real-time by default via Convex subscriptions is VexCMS's core architectural bet | This is VexCMS's structural advantage: Convex gives real-time subscriptions for free at the DB layer, vs. BaseHub building CRDT/presence on top of Postgres |
| **AI Chat** | In-dashboard AI assistant | All tiers incl. free ([pricing](https://basehub.com/pricing)) | — | — |
| **MCP Server** | Per-repo MCP server exposing query/create/update/delete/commit/branch tools to Cursor/Claude ([docs](https://docs.basehub.com/ai/mcp), launched 2025-07-14) | Not explicitly tier-gated | — | Convex's typed function layer is well-suited to auto-generating an MCP server |
| **@START AI agent** | Schema/content-aware AI teammate invoked via ⌘S or @-mention | Free in beta ([changelog](https://basehub.com/changelog/ai-week-day-2-start), 2025-07-15) | — | — |
| **AI Workflows (Autofill, Apply Variant)** | Auto-populate related fields; generate localization/A/B content variants | Not explicitly tier-gated ([changelog](https://basehub.com/changelog/ai-week-day-3-workflow-block-overhaul), 2025-07-16) | — | — |
| **Custom AI Agents** | Multiple custom agents w/ system prompts, tool-access controls, deployable via Comments/Embeds/Slack/Workflows | Free in beta ([changelog](https://basehub.com/changelog/ai-week-day-4-agents), 2025-07-17) | — | — |
| **Analytics / Event Block** | Event tracking w/ table + time-series views; typed `sendEvent`/`getEvents` | Metered: 10K free / 25K Team / 1M Unlimited, $1/10K extra ([pricing](https://basehub.com/pricing)) | — | — |
| **Forms / submissions** | Built on the Event Block primitive; demoed w/ Resend integration | Metered "Email" line: 500 free / 5K Team / 50K Unlimited ([pricing](https://basehub.com/pricing)) | — | — |
| **Workflow Block (automation/webhooks)** | Triggers on commits/row changes/events → webhook or internal notification | Included, webhooks always-included ([changelog, 2025-01-08](https://basehub.com/changelog/collect-track-automate)) | **Shipped (partial)** — VexCMS ships lifecycle hooks | Convex `onUpdate`/action triggers map directly to this pattern |
| **Search (Typesense-backed)** | Instant search over indexed Blocks, `useSearch` hook + `<SearchBox>` | Free in Beta, all tiers ([docs](https://docs.basehub.com/extras/search); confirmed via [npm dependency `typesense: ^1.8.2`](https://www.npmjs.com/package/basehub)) | — | Would require bundling/self-hosting Typesense or building search on Convex's own indexes |
| **Localization / Variants** | `/variants` block (e.g. "Language"), queried via GraphQL `(variants: { language: es })` | Core, not tier-gated ([docs](https://docs.basehub.com/extras/localization)) | — | Planned enterprise add-on per VexCMS monetization plan |
| **Approval workflows** | No discrete named feature found — closest equivalents are Workflow Block triggers + AI "suggestion vs auto-commit" changeType | N/A — **not found** as a distinct product area | Planned enterprise add-on per VexCMS monetization plan | — |
| **Webhooks** | Always-included on every tier | All tiers incl. free ([pricing](https://basehub.com/pricing)) | **Shipped** — lifecycle hooks | Native Convex scheduled functions / HTTP actions |
| **GraphQL API / `basehub` npm SDK** | Proprietary GraphQL API + generated TS SDK; SDK v9 removed mandatory generation step | Core, included; ~14K weekly npm downloads ([npm](https://www.npmjs.com/package/basehub), 2026-10-12) | **Shipped (different approach)** — VexCMS generates typed Convex queries/mutations directly, no separate GraphQL layer | Convex's own typed client replaces the need for a GraphQL layer entirely |
| **`<Pump />` live-update/streaming** | RSC that re-executes a Server Action in real time on content change via Pusher-triggered refetch, no client JS needed (~2KB server code) | Core, included; Next.js-only ([blog, 2024-03-06](https://basehub.com/blog/pump)) | **Shipped equivalent** — Convex's `useQuery` gives live-updating data natively, no Pusher/polling layer needed | This is the single clearest proof point that building on Convex *structurally obsoletes* a feature BaseHub had to hand-build |
| **`<Toolbar />` / Draft Mode / visual editing** | Manages Next.js Draft Mode + branch switching in previews | Core, included ([Next.js reference](https://docs.basehub.com/api-reference/javascript-sdk/next)) | **Shipped** — live preview of unsaved state | — |
| **Media Block (image/video/audio/file + CDN)** | Unified asset pipeline, Asset Explorer gallery, on-the-fly transforms, `assets.basehub.com` CDN | Metered: 25GB/1M req (free) → 5TB/50M (Unlimited) ([pricing](https://basehub.com/pricing)) | **Shipped (partial)** — VexCMS has media handling | — |
| **Templates / starter kits** | Deployable starter templates, cross-repo block copy/paste | All tiers incl. free ([pricing](https://basehub.com/pricing)) | — | — |
| **Undo/Redo** | Repo-wide, session-persistent, integrates w/ yjs undo manager | Core, included ([changelog, 2024-10-31](https://basehub.com/changelog/undo-redo)) | — | — |
| **View Only Mode** | Read-only access role | All tiers ([pricing](https://basehub.com/pricing)) | **Shipped equivalent** — field-level RBAC | Convex indexed-query-based RBAC is a superset of a single "view-only" role |

**Not found**: a discrete "Approval Workflow" feature; full changelog coverage July 2025 → June 2026 (only two 2026 blog posts were retrieved, not the dashboard changelog itself for that window).

### 4.2 Pricing (basehub.com/pricing, observed 2026-10-12)

| Tier | Price | API Requests | Asset Storage | Analytics events | Email/forms |
|---|---|---|---|---|---|
| Personal | Free | 75,000/mo | 25GB (bullet list) **/ 256GB (comparison table — internal inconsistency observed on the live page)** | 10,000/mo | 500/mo |
| Team | $15/user/mo | 500,000/mo | 500GB | 25,000/mo | 5,000/mo |
| Unlimited | $350/mo flat | 5,000,000/mo | 5TB | 1,000,000/mo | 50,000/mo |

No named "Enterprise" tier — Unlimited ($350/mo flat, incl. dedicated success manager) is the de facto top tier; no custom-contract option visible on the page.

### 4.3 Company
- **Founder**: Julian Benegas ([@julianbenegas8](https://x.com/julianbenegas8)); co-author on the Dec-2025 architecture post: Santiago Galán ([@sgalanb](https://x.com/sgalanb)).
- **Founding date**: not reliably verified — Tracxn says 2023 (low-confidence, shows "1 employee" which is clearly stale); earliest changelog entry is v0.2.0, 2023-09-11, used here as a best-available proxy.
- **Funding**: **no confirmed institutional round, amount, or named VC was found.** Only concrete data point: Vercel's CEO personally held a passive pre-acquisition investment via a fund ([acquisition blog](https://basehub.com/blog/basehub-is-joining-vercel)). Acquisition price undisclosed.
- **Team size**: not found (no official headcount page retrieved).
- **Changelog cadence**: sampled v1.4.10→v1.4.19 (2025-03-26 → 2025-07-18, ~114 days) shows roughly **one named release every 11–12 days**, accelerating to 5 major releases in 5 consecutive days during "AI Week" (2025-07-14 to 07-18). Cadence from Aug 2025 through the June 2026 acquisition is **not found** (not retrieved in this pass).
- **Customers**: no dedicated case-study page content retrieved; only founder-adjacent testimonials found (ReactMiami conference, Evan Stewart, Resend customer story) — full "Trusted by" logo list not extracted (images, not text) — not found.

### 4.4 Known weaknesses / complaints
- No substantive Reddit/HN criticism threads found (searches were dominated by an unrelated app, "Base44").
- One documented **GraphQL API performance incident** on BaseHub's public status page ([statuspage.incident.io](https://statuspage.incident.io/basehub/incidents/01K1H1CEBTXDE4KH5DHH4AEAAK)).
- **First-party admission**: the Dec-2025 post itself says the original Postgres/Git-data-model approach caused them to spend "a lot of time fixing bugs and building new features that Git already had," with "really complex" SQL as a result ([blog](https://basehub.com/blog/files-agents-and-the-future-of-basehub)) — a direct admission that the proprietary backend was a maintenance burden.
- **GraphQL-only, proprietary API surface** — no REST alternative is documented; this is an architectural fact, not a sourced complaint ([INFERENCE]).
- **Pricing-page internal inconsistency**: Personal tier asset storage stated as both "25GB" (bullet list) and "256GB" (comparison table) on the same live page, observed 2026-10-12.
- **Post-acquisition continuity risk**: the roadmap is now explicitly contingent on Vercel ("we'll share more information soon"), with the founder having moved to an unrelated internal team (v0) — an open, unaddressed question about who leads BaseHub's engineering/support going forward.

---

## 5. Payload + BaseHub vs. VexCMS

| Dimension | Payload | BaseHub | VexCMS |
|---|---|---|---|
| Core DX | TS-code-first config → admin panel, DB schema, typed API ([docs](https://payloadcms.com/docs/getting-started/what-is-payload)) | Dashboard-authored blocks → generated TS SDK, not TS-first config | TS-code-first config → generated Convex schema + typed queries/mutations (same DX family as Payload) |
| Real-time | None today; "Multi-Player Editing" is Enterprise "Coming Soon" | Real-time multiplayer since launch (yjs CRDT), `<Pump />` live-refresh | Real-time by default via Convex subscriptions — no bespoke CRDT/Pusher layer needed |
| Data layer ops | You operate Mongo or Postgres yourself | Proprietary Postgres today (admittedly complex per their own Dec-2025 post), migrating to Git files | No separate DB to operate — Convex is the managed backend |
| Hosting continuity | MIT, self-host unaffected; **but Cloud is paused for new projects** post-Figma | Roadmap contingent on Vercel, "more info soon" | Self-hosted by design, Apache-2.0, no dependency on a single vendor's hosting roadmap |
| RBAC | Document/field/operation-level access control (code-based) | View Only Mode (single read-only role); fine-grained RBAC not confirmed beyond this | Field-level RBAC compiled into Convex indexed queries — more structurally efficient than app-layer checks |
| Overlap summary | VexCMS overlaps Payload most on **code-first DX** (TS config generating schema/API) — VexCMS's differentiation vs. Payload is real-time + no separate DB ops | VexCMS overlaps BaseHub most on **real-time collaboration** — VexCMS's differentiation vs. BaseHub is TS-code-first schema + Apache-2.0 self-host vs. closed SaaS with uncertain roadmap | — |

---

## 6. Convex-native CMS landscape

- **Official Convex Components directory**: 175 components listed as of 2026-10-12 ([convex.dev/components](https://www.convex.dev/components/components.md)) — **no CMS/admin-panel category**, no CMS component from the Convex team itself.
- **get-convex/cms-template**: official Convex-org GitHub template repo for a CMS starter — 22 ★, created 2024-08-13, last pushed 2026-02-05. A starter template, not a maintained product ([github.com/get-convex/cms-template](https://github.com/get-convex/cms-template), checked 2026-10-12).
- **stack.convex.dev**: no articles found under "CMS," "content management," or "admin panel" showcasing a built CMS product.

| Project | What it is | Stars | Last commit | Status | Source |
|---|---|---|---|---|---|
| obkaro/convex-cms | "A CMS that lives in your Convex app" — Convex Component, typesafe admin API + bundled admin UI | 5 | 2026-04-03 | Hobby, stalled ~6 months | [github.com/obkaro/convex-cms](https://github.com/obkaro/convex-cms) |
| david-potgieter/convex-headless-cms | Convex component, headless CMS data layer, publish-state-machine, no bundled UI | 0 | 2026-06-10 | Unreleased/abandoned shortly after creation | [github.com/david-potgieter/convex-headless-cms](https://github.com/david-potgieter/convex-headless-cms) |
| daocodotorg/basic-blog (`basic-blog-convex-blog-cms` on npm) | Headless blog/CMS Convex component, TipTap admin UI, CLI, optional MCP server | 5 | 2026-04-10 | Narrowly scoped to blogging, stalled since last release | [github.com/daocodotorg/basic-blog](https://github.com/daocodotorg/basic-blog) |
| `@cms-subir/core`, `/convex`, `/admin` (npm scope) | Config-driven CMS core: collections, field types, access control, Convex schema generation, admin UI — closest conceptual match to VexCMS | n/a, no public repo found | last npm publish 2026-07-30 | Single-author, no activity signal, appears unmaintained | [registry.npmjs.org/@cms-subir/core](https://registry.npmjs.org/@cms-subir/core) |

Convex's own dashboard tooling: [dashboard.convex.dev](https://docs.convex.dev/dashboard) is an ops/data console, not a content-authoring CMS; **Convex Panel** ([convexpanel.dev](https://www.convexpanel.dev/)) is a third-party dev-debugging tool, not content management.

**Context — comparable code-first CMS on other reactive/modern BaaS**: Firebase has a mature precedent — **FireCMS** ([firecms.co](https://firecms.co/)), MIT-licensed, React+TypeScript, built directly on Firestore, managed cloud + self-host, actively marketed. Supabase has emerging entrants — **Supabase-cms** ([supabase-cms.com](https://www.supabase-cms.com/)) and **Supamode** ([makerkit.dev/supabase-cms](https://makerkit.dev/supabase-cms)). This proves the "code-first CMS natively on a reactive BaaS" category is viable — VexCMS is not solving a non-problem, it's applying a proven category pattern to an underserved platform.

**Verdict**: Effectively **greenfield on Convex specifically**. No official Convex-team CMS exists; all third-party attempts are solo-maintainer, single-digit-star, narrowly-scoped or unmaintained. The competitive risk is prospective — either Convex itself building a FireCMS-style official offering, or a better-resourced team — not an existing incumbent.

---

## 7. Positioning map inputs

Two axes: **X = Code-first (TS config) ↔ UI-first (dashboard-configured)**; **Y = Real-time native (live subscriptions/multiplayer) ↔ Request/response (poll or manual refresh)**.

| Company | X: code-first ↔ UI-first | Y: real-time ↔ request-response | Justification |
|---|---|---|---|
| **VexCMS** | Fully code-first (`.ts` config) | Fully real-time (Convex subscriptions native) | Config generates Convex schema + typed API; admin panel subscribes live |
| **Payload** | Fully code-first (`payload.config.ts`) | Request/response today; multiplayer "Coming Soon" Enterprise-only | [docs](https://payloadcms.com/docs/getting-started/what-is-payload); [enterprise/multi-player-editing](https://payloadcms.com/enterprise/multi-player-editing) |
| **Sanity** | Code-first (`.ts` schema) | Real-time (flagship multiplayer Studio) | [sanity.io/docs](https://www.sanity.io/docs) |
| **Strapi** | Code-first (TS/JS content types) | Request/response (no co-editing; locking Enterprise-only) | [dxpscorecard.com](https://www.dxpscorecard.com/platform/strapi) |
| **TinaCMS** | Code-first (`tina/config.ts`) | Partial — git-commit-based live visual edit, not true multiplayer | [luckymedia.dev](https://www.luckymedia.dev/insights/tina-cms) |
| **Keystatic** | Code-first (`keystatic.config.ts`) | Request/response (commit-based; multiplayer only an experimental Cloud roadmap item) | [GitHub repo description](https://github.com/Thinkmill/keystatic) |
| **Decap CMS** | UI-adjacent (`config.yml`, YAML not TS) | Request/response (concurrent edits error) | [astro4b.com](https://astro4b.com/en/blog/decap-cms/) |
| **BaseHub** | UI-first (dashboard blocks, TS only via generated SDK) | Fully real-time (multiplayer + `<Pump />`) | [pricing](https://basehub.com/pricing); [Pump blog](https://basehub.com/blog/pump) |
| **Storyblok** | UI-first (visual component config) | Real-time (live Visual Editor + comments) | pricing page feature list |
| **DatoCMS** | UI-first | Partial — presence + locking, not char-level co-editing | [datocms.com/blog](https://www.datocms.com/blog/new-collaboration-tools) |
| **Builder.io** | UI-first (dashboard models) | Real-time (collaborative visual editor) | [builder.io/c/docs/models-intro](https://www.builder.io/c/docs/models-intro) |
| **Contentful** | UI-first (Management API/UI) | Request/response (optimistic locking only) | [headlesscms.guide](https://headlesscms.guide/guides/top-5-headless-cms-platforms-with-real-time-collaboration) |
| **Directus** | UI-first (Studio reads existing DB schema) | Request/response (no real-time co-editing found) | not found |
| **Hygraph** | UI-first | Request/response | pricing page |
| **Prismic** | UI-first (Slice Machine + JS components) | Unconfirmed | not found |

**Reading the map**: VexCMS and Sanity are the only two occupying the "fully code-first + fully real-time" quadrant — but Sanity's real-time layer sits on a closed proprietary Content Lake with no self-host option, while VexCMS is Apache-2.0 self-hosted on Convex. Payload is code-first but not yet real-time (multiplayer is an unshipped Enterprise promise). BaseHub is real-time but not code-first. No competitor occupies VexCMS's exact cell with VexCMS's licensing/self-host profile.

---

## 8. Differentiation table — VexCMS vs. Payload, Sanity, Strapi, BaseHub, Directus

| Capability | VexCMS | Payload | Sanity | Strapi | BaseHub | Directus |
|---|---|---|---|---|---|---|
| Real-time by default (live subscriptions, not polling) | ✅ Convex subscriptions | ❌ — "Multi-Player Editing" Enterprise-only, **not shipped** ([enterprise page](https://payloadcms.com/enterprise/multi-player-editing)) | ✅ flagship multiplayer Studio ([sanity.io/docs](https://www.sanity.io/docs)) | ❌ no real-time co-editing ([dxpscorecard.com](https://www.dxpscorecard.com/platform/strapi)) | ✅ multiplayer + `<Pump />` since launch ([pricing](https://basehub.com/pricing)) | ❌ not found |
| TS config generates schema + typed API | ✅ | ✅ `payload.config.ts` → DB + REST/GraphQL/local API ([docs](https://payloadcms.com/docs/getting-started/what-is-payload)) | ✅ `.ts` schema files ([sanity.io/docs](https://www.sanity.io/docs)) | ✅ TS/JS content-type files | ❌ dashboard-authored, SDK types generated *from* schema, not the reverse ([npm](https://www.npmjs.com/package/basehub)) | ❌ Studio UI reads existing DB schema |
| Field-level RBAC compiled into indexed DB queries | ✅ (Convex indexed queries) | ⚠️ field/doc/operation-level access control exists but is app-layer code, not compiled into indexed queries ([docs](https://payloadcms.com/docs/access-control/overview)) | ❌ not found | ⚠️ role-based access control exists, review-workflow locking is Enterprise-only | ❌ "View Only Mode" is the only confirmed granular role ([pricing](https://basehub.com/pricing)) | ❌ not found |
| Live preview of unsaved state | ✅ | ✅ Live Preview feature ([FocusReactive overview](https://focusreactive.com/payload-cms-overview/)) | ✅ (real-time Studio implies this) | ⚠️ not found as a named feature | ✅ `<Toolbar />` + Draft Mode ([docs](https://docs.basehub.com/api-reference/javascript-sdk/next)) | ❌ not found |
| Lifecycle hooks | ✅ | ✅ (hooks are a core Payload concept, implied by plugin ecosystem) | ⚠️ not found as a first-class concept | ✅ (lifecycle hooks are a core Strapi concept) | ✅ Workflow Block (commit/row/event triggers) ([changelog](https://basehub.com/changelog/collect-track-automate)) | ✅ (flows/hooks exist) |
| Self-hosted, no separate DB to operate | ✅ (Convex is managed) | ❌ you operate Mongo or Postgres yourself ([docs/database](https://payloadcms.com/docs/database/overview)) | ❌ no self-host option at all (Content Lake proprietary) | ❌ you operate Postgres/MySQL/SQLite yourself | ❌ closed SaaS, no self-host (planned future OSS "Core," unshipped) | ⚠️ self-hosted but you still operate your own SQL DB |
| Apache-2.0 / fully permissive OSS licence | ✅ | ✅ MIT (reaffirmed post-Figma, [FAQ](https://payloadcms.com/payload-has-joined-figma)) | ⚠️ Studio/CLI MIT, but core data layer closed | ✅ MIT core (Enterprise features proprietary) | ❌ closed SaaS today | ❌ relicensed to BSL 1.1, free only under $5M/yr revenue ([hub.docker.com](https://hub.docker.com/r/directus/directus)) |

Legend: ✅ = confirmed shipped; ❌ = confirmed absent/not available; ⚠️ = partial/ambiguous per sources cited.

---

## 9. Unverified / conflicting

| Item | What was tried | Result |
|---|---|---|
| Figma→Payload deal price/terms | Searched Figma blog, Payload blog, TechCrunch, PitchBook | Not disclosed anywhere open; PitchBook profile exists but is paywalled |
| Payload pre-acquisition valuation | Same as above | Not found |
| Payload seed-round investor list (Gradient Ventures, MongoDB) | TechCrunch primary article, Tracxn aggregator | Only Tracxn (aggregator) names investors — not confirmed on a primary source |
| Payload Enterprise numeric pricing | payloadcms.com/enterprise | Sales-led, "Schedule a Demo," no published price |
| BaseHub founding date | Tracxn (2023, low-confidence "1 employee"), PitchBook (conflicting "2021... Out of Business... 2 employees" — almost certainly a mismatched entity) | Best proxy: Sept 2023 changelog v0.2.0 entry; no authoritative "founded in X" statement found |
| BaseHub institutional funding (amount, round name, VC investors) | "BaseHub funding," "BaseHub Series A," Crunchbase/PitchBook searches | No confirmed round found; only datapoint is Vercel CEO's personal passive pre-acquisition stake |
| BaseHub/Vercel acquisition price | basehub.com blog, press search | Not disclosed |
| BaseHub team headcount | LinkedIn, basehub.com | Not found |
| BaseHub full customer/case-study logo list | pricing page "Trusted by" section | Logos are images, not text-extractable in this pass |
| BaseHub changelog cadence, Aug 2025 → June 2026 | basehub.com/changelog | Only two 2026 items found were standalone blog posts, not changelog entries; dashboard changelog for that window not retrieved |
| Whether BaseHub's Dec-2025 Git-native/OSS-Core rearchitecture shipped or was shelved post-Vercel-acquisition | basehub.com blog/changelog | Not found — as of 2026-10-12 it was still "in active development" per the original post, no confirmation either way since |
| Sanity/Contentful/Hygraph/Prismic/DatoCMS/Builder.io/Storyblok current valuations | Company pricing/about pages, Crunchbase | Not disclosed by any company; only Contentful's 2021 ~$3B peak (pre-Salesforce $1-1.5B acquisition) and Directus/Strapi total-raised are partially sourced |
| ARR figures for Sanity (~$27M), Prismic (~$15M), DatoCMS (~$1.3M) | Latka (getlatka.com) | All third-party estimates, not company-disclosed primary figures — flagged inline in the master table |
