# L pre-pass evidence — VexCMS 0.1.0 launch

> Mechanical evidence only, attached next to each `surface-review.md` row so the read-through
> in steps 14–21 is judgement, not grep. No pass/fail judgement below except where the check is
> itself mechanical. After any fix, append a new dated run under the same section — never
> overwrite. Raw outputs too long to inline are in `l-evidence/` beside this file.

## Reviewed SHA

`e49d7ac3fbbc61c09e78e931c9effba1d57562b1` plus the uncommitted working tree of 2026-11-10 (see
`surface-review.md` § Review record). Run 2026-11-10.

## Matrix-row sweeps

### version / dist-tag
Command:
```
rg -n "0\.1\.0-alpha|@alpha" README.md packages/*/README.md apps/docs/src/content/docs apps/docs/astro.config.mjs apps/www/src/vexcms/blocks apps/www/convex/seed.ts CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev .agent/docs/specs/2026-11-06-public-presence/release-notes.md
```
Output:
```
apps/docs/astro.config.mjs:41:						'- VexCMS ships as `0.1.0-alpha`; `/roadmap` lists what shipped in 0.1.0, what ships next (in order), and what is not planned.',
packages/react/README.md:8:pnpm add @vexcms/react@alpha
packages/create-vexcms/README.md:5:> dist-tag (`0.1.0-alpha.x`) — the `latest` tag on npm still points at an old,
packages/create-vexcms/README.md:7:> `pnpm create vexcms@alpha`. Use it for experiments and evaluation only; the
packages/create-vexcms/README.md:20:pnpm create vexcms@alpha
packages/create-vexcms/README.md:26:pnpm create vexcms@alpha my-project
packages/create-vexcms/README.md:32:pnpm create vexcms@alpha apps/website
packages/create-vexcms/README.md:46:pnpm create vexcms@alpha my-app --bare
packages/create-vexcms/README.md:49:pnpm create vexcms@alpha my-app --orgs
packages/create-vexcms/README.md:52:pnpm create vexcms@alpha my-app --yes
packages/create-vexcms/README.md:55:pnpm create vexcms@alpha my-app --monorepo --yes
packages/create-vexcms/README.md:181:pnpm create vexcms@alpha my-app --monorepo --yes
packages/create-vexcms/README.md:200:`pnpm create vexcms@alpha` always scaffolds with the newest pre-release. The npm
packages/create-vexcms/README.md:201:`latest` tag still points at an old, unrelated `0.0.20` line, so `@alpha` — or an
packages/create-vexcms/README.md:205:pnpm create vexcms@0.1.0-alpha.10
apps/www/convex/seed.ts:688:        installCommand: "pnpm create vexcms@alpha",
apps/www/convex/seed.ts:708:              "pnpm create vexcms@alpha scaffolds Next.js, Convex, auth, and the admin panel in one step",
apps/www/convex/seed.ts:944:              "pnpm create vexcms@alpha gives you a Next.js app with Convex, Better Auth, and the admin panel already wired together",
apps/www/convex/seed.ts:1391:            value: "0.1.0-alpha",
packages/core/README.md:12:pnpm create vexcms@alpha
packages/core/README.md:20:pnpm add @vexcms/core@alpha @vexcms/cli@alpha @vexcms/next@alpha @vexcms/react@alpha @vexcms/better-auth@alpha @vexcms/file-storage-convex@alpha
packages/core/README.md:22:pnpm add @vexcms/richtext-plate@alpha
packages/next/README.md:8:pnpm add @vexcms/next@alpha
README.md:5:> (`0.1.0-alpha.x`) — the `latest` tag on npm still points at an old, unrelated
README.md:6:> `0.0.20` line, so installs must use an explicit tag: `pnpm create vexcms@alpha`.
README.md:30:pnpm create vexcms@alpha my-site
packages/richtext-plate/README.md:12:pnpm add @vexcms/richtext-plate@alpha
.agent/docs/specs/2026-11-06-public-presence/release-notes.md:27:Install from the `latest` npm tag: `pnpm add @vexcms/core@latest @vexcms/react@latest @vexcms/next@latest @vexcms/better-auth@latest @vexcms/file-storage-convex@latest` (drop any `@alpha` pins), then run `vex generate`.
.github/ISSUE_TEMPLATE/1-bug_report.yml:16:      description: "The `@vexcms/*` package versions, `convex`, and `next`, e.g. `@vexcms/core@0.1.0-alpha.11, convex@1.44.0, next@16.4.3`"
.github/ISSUE_TEMPLATE/1-bug_report.yml:17:      placeholder: "@vexcms/core@0.1.0-alpha.x, convex@x.x.x, next@x.x.x"
.github/ISSUE_TEMPLATE/1-bug_report.yml:48:      description: Numbered steps from a fresh `pnpm create vexcms@alpha` (or your own setup) to the bug.
apps/www/src/vexcms/blocks/FAQ/config.ts:63:            "Run `npx create-vexcms@alpha` to scaffold a new project with Vex CMS pre-configured. The CLI sets up your Next.js app, Convex backend, authentication, and admin panel in under a minute.",
apps/www/src/vexcms/blocks/HowItWorks/config.ts:38:            "Run npx create-vexcms@alpha to get a Next.js app with Convex, authentication, and the admin panel pre-configured.",
apps/www/src/vexcms/blocks/Hero/config.ts:21:      defaultValue: "v0.1.0-alpha — now on npm",
apps/www/src/vexcms/blocks/Hero/config.ts:42:      defaultValue: "pnpm create vexcms@alpha",
apps/docs/src/content/docs/guides/quickstart.mdx:14:pnpm create vexcms@alpha my-site
```

### install commands
Command:
```
rg -n "pnpm create vexcms|npm create vexcms|npx create-vexcms" README.md packages/create-vexcms/README.md apps/docs/src/content/docs apps/www/src/vexcms/blocks apps/www/convex/seed.ts .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md .agent/docs/specs/2026-11-06-public-presence/release-notes.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev
```
Output:
```
README.md:6:> `0.0.20` line, so installs must use an explicit tag: `pnpm create vexcms@alpha`.
README.md:30:pnpm create vexcms@alpha my-site
.agent/docs/specs/2026-11-06-public-presence/release-notes.md:12:- **A real-time admin panel** with list views (search, AND/OR filters, column controls, saved views), lifecycle hooks with async server-side `validate()`, and `pnpm create vexcms` scaffolding a full Next.js + Convex project.
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:123:`pnpm create vexcms` (the post-Release command; `copy-flip.patch` drops `@alpha`), since "Please make it easy for users to try your thing out,
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:435:| Quickstart     | `pnpm create vexcms` (after Release; `@alpha` until then) to a signed-in admin panel in under five minutes | `apps/docs/src/content/docs/guides/quickstart.mdx` (re-check in step 13 — launch-infrastructure may update this page's content) |
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:472:types path with `pnpm create vexcms`.
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:892:- [ ] All 8 packages published at `0.1.0`, `latest` tag: `for p in @vexcms/core @vexcms/react @vexcms/next @vexcms/cli @vexcms/better-auth @vexcms/file-storage-convex @vexcms/richtext-plate create-vexcms; do npm view "$p" dist-tags --json; done` — every one's `latest` reads `0.1.0`. If `latest` still reads `0.0.20`, stop: `pnpm create vexcms` would install the old scaffolder (spec.md § Handoffs, Release).
apps/www/convex/seed.ts:688:        installCommand: "pnpm create vexcms@alpha",
apps/www/convex/seed.ts:708:              "pnpm create vexcms@alpha scaffolds Next.js, Convex, auth, and the admin panel in one step",
apps/www/convex/seed.ts:944:              "pnpm create vexcms@alpha gives you a Next.js app with Convex, Better Auth, and the admin panel already wired together",
packages/create-vexcms/README.md:7:> `pnpm create vexcms@alpha`. Use it for experiments and evaluation only; the
packages/create-vexcms/README.md:20:pnpm create vexcms@alpha
packages/create-vexcms/README.md:26:pnpm create vexcms@alpha my-project
packages/create-vexcms/README.md:32:pnpm create vexcms@alpha apps/website
packages/create-vexcms/README.md:46:pnpm create vexcms@alpha my-app --bare
packages/create-vexcms/README.md:49:pnpm create vexcms@alpha my-app --orgs
packages/create-vexcms/README.md:52:pnpm create vexcms@alpha my-app --yes
packages/create-vexcms/README.md:55:pnpm create vexcms@alpha my-app --monorepo --yes
packages/create-vexcms/README.md:181:pnpm create vexcms@alpha my-app --monorepo --yes
packages/create-vexcms/README.md:200:`pnpm create vexcms@alpha` always scaffolds with the newest pre-release. The npm
packages/create-vexcms/README.md:205:pnpm create vexcms@0.1.0-alpha.10
.github/ISSUE_TEMPLATE/1-bug_report.yml:48:      description: Numbered steps from a fresh `pnpm create vexcms@alpha` (or your own setup) to the bug.
apps/www/src/vexcms/blocks/Hero/config.ts:42:      defaultValue: "pnpm create vexcms@alpha",
apps/docs/src/content/docs/dev/project-structure.mdx:25:project is generated from by `pnpm create vexcms` — `base-nextjs` (minimal
apps/docs/src/content/docs/dev/project-structure.mdx:65:  separate `pnpm create vexcms` package that generates a new project (which
apps/docs/src/content/docs/dev/project-structure.mdx:101:| `create-vexcms` | `.` | The `pnpm create vexcms` scaffolder binary — not a library import. |
apps/docs/src/content/docs/dev/contributing.mdx:157:| `packages/create-vexcms` | `pnpm create vexcms` and its templates |
apps/www/src/vexcms/blocks/HowItWorks/config.ts:38:            "Run npx create-vexcms@alpha to get a Next.js app with Convex, authentication, and the admin panel pre-configured.",
apps/www/src/vexcms/blocks/FAQ/config.ts:63:            "Run `npx create-vexcms@alpha` to scaffold a new project with Vex CMS pre-configured. The CLI sets up your Next.js app, Convex backend, authentication, and admin panel in under a minute.",
apps/docs/src/content/docs/dev/project-structure.mdx:25:project is generated from by `pnpm create vexcms` — `base-nextjs` (minimal
apps/docs/src/content/docs/dev/project-structure.mdx:65:  separate `pnpm create vexcms` package that generates a new project (which
apps/docs/src/content/docs/dev/project-structure.mdx:101:| `create-vexcms` | `.` | The `pnpm create vexcms` scaffolder binary — not a library import. |
apps/docs/src/content/docs/dev/contributing.mdx:157:| `packages/create-vexcms` | `pnpm create vexcms` and its templates |
apps/docs/src/content/docs/guides/caching-and-seo.mdx:15:The default `pnpm create vexcms` marketing-site starter already wires all of this — read on to
apps/docs/src/content/docs/guides/quickstart.mdx:14:pnpm create vexcms@alpha my-site
```

### package list (8 published)
Command:
```
node -e 'const fs=require("fs");for(const d of fs.readdirSync("packages")){try{const p=JSON.parse(fs.readFileSync("packages/"+d+"/package.json"));if(p.name&&!p.private)console.log(p.name,p.version,p.publishConfig?.tag??"latest")}catch{}}'
```
Output:
```
@vexcms/better-auth 0.1.0-alpha.36 alpha
@vexcms/cli 0.1.0-alpha.36 alpha
@vexcms/core 0.1.0-alpha.36 alpha
create-vexcms 0.1.0-alpha.36 alpha
@vexcms/file-storage-convex 0.1.0-alpha.36 alpha
@vexcms/next 0.1.0-alpha.36 alpha
@vexcms/react 0.1.0-alpha.36 alpha
@vexcms/richtext-plate 0.1.0-alpha.36 alpha
```

### requirements
Command:
```
rg -n "\"engines\"" -A2 package.json; rg -n -A8 "^  peers:" pnpm-workspace.yaml | rg "next|react|convex|zod"; rg -n -i "node(\.js)? ?(>=|2[02]|18)" README.md apps/docs/src/content/docs/guides/quickstart.mdx apps/docs/src/content/docs/dev/contributing.mdx CONTRIBUTING.md .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md
```
Output:
```
42:  "engines": {
43-    "node": ">=22.18.0"
44-  },
132-    "@convex-dev/react-query": ">=0.1.0 <0.2.0"
133-    "@tanstack/react-form": ">=1.33.0 <2"
134-    "@tanstack/react-query": ">=5.0.0 <6"
135-    "@tanstack/react-table": ">=8.0.0 <9"
138-    "@testing-library/react": ">=16.0.0 <17"
apps/docs/src/content/docs/dev/contributing.mdx:14:You need Node.js 22.18 or later and pnpm 10. `corepack enable` gives you the pnpm version the
```

### product one-liner
Command:
```
gh api repos/ianyimi/vex --jq .description; rg -n "^description:" apps/docs/src/content/docs/index.mdx; rg -n "type-safe headless CMS" README.md packages/*/README.md apps/www/convex/seed.ts .agent/docs/specs/2026-11-06-public-presence/public-copy.md
```
Output:
```
Type-safe headless CMS built on Convex. A real-time admin panel, end-to-end type inference, auth, ABAC — no separate backend to run.
3:description: A type-safe headless CMS built natively on Convex — real-time reactivity, generated types, and zero database configuration.
README.md:21:A type-safe headless CMS built natively on [Convex](https://convex.dev). VexCMS generates your
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:63:Bio: I build VexCMS, a type-safe headless CMS built on Convex, in my free time. Sponsorship funds the free core: faster bug fixes first, then the free roadmap. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.
```

### field-type count claims
Command:
```
rg -n "[0-9]+ field types" README.md apps/docs/src/content/docs apps/www/convex/seed.ts packages/create-vexcms/templates/marketing-site/convex/seed.ts .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md .agent/docs/specs/2026-11-06-public-presence/release-notes.md; echo "docs field pages: $(find apps/docs/src/content/docs/fields -name "*.mdx" | wc -l)"
```
Output:
```
.agent/docs/specs/2026-11-06-public-presence/release-notes.md:8:- **16 field types**, including `richtext` (Plate.js via `@vexcms/richtext-plate`, with inline images from the media library), `blocks` with a cross-document block clipboard, and layout fields (`tabs`, `collapsible`, `row`, `ui`) with conditional fields enforced on client and server.
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:443:VexCMS 0.1.0's shipped feature list (16 field types, versioning and drafts, Convex schema +
packages/create-vexcms/templates/marketing-site/convex/seed.ts:950:                  "No. Everything ships as 0.1.0-alpha. Versioning, drafts, and live preview are in progress. There are 12 field types today; richtext, json, tabs, and ui are planned, not built. See the roadmap.",
apps/docs/src/content/docs/roadmap.md:12:- ✅ 16 field types — `text`, `number`, `checkbox`, `select`, `date`, `url`, `email`, `textarea`, `json`, `relationship`, `upload`, `array`, `group`, `blocks`, `color`, `richtext` (Plate.js via `@vexcms/richtext-plate`, with inline images from the media library)
docs field pages:       20
```

### ABAC vs RBAC wording
Command:
```
gh api repos/ianyimi/vex --jq .description; rg -n "\bABAC\b|\bRBAC\b" README.md apps/docs/src/content/docs apps/www/convex/seed.ts .github packages/*/README.md .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md
```
Output:
```
Type-safe headless CMS built on Convex. A real-time admin panel, end-to-end type inference, auth, ABAC — no separate backend to run.
packages/core/README.md:216:for the RBAC table, autosave, version history/restore, and the live-preview interaction.
packages/core/README.md:218:### Access Control (RBAC)
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:61:| Feature post — RBAC + hooks and validation    | https://vexcms.dev/posts/access-control-hooks-validation       |
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:66:| Clip — RBAC + hooks and validation            | https://vexcms.dev/launch/access-control-hooks-validation.mp4  |
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:388:  admin panel, end-to-end type inference, auth, ABAC — no separate backend to run." (read via
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:389:  `gh api repos/ianyimi/vex --jq .description`; the "ABAC" wording there does not match the
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:390:  role-based `defineAccess` model below; the ABAC / RBAC consistency-matrix row in step 21
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:444:type codegen, the real-time admin panel, RBAC with indexed rules, live preview, lifecycle
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:474:#### D4 — RBAC + server-enforced hooks and validation
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:476:- RBAC compiles permission rules to indexed Convex queries: `packages/core/src/access/compileQueryConstraints.ts`
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:814:### D4 — Feature post: RBAC + server-enforced hooks and validation
apps/www/convex/seed.ts:1012:              "The core is Apache-2.0 and stays that way: every field type, the admin panel, the CLI, RBAC, drafts, live preview, and hooks. You pay Convex for usage, and Convex has a free tier. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.",
apps/www/convex/seed.ts:1437:            feature: "Document & Field-Level RBAC",
apps/docs/src/content/docs/compare.mdx:28:| Access control (document/field level, applied in the query) | `defineAccess()`: role → subject → check, enforced on the server; a `withIndex`/`where` check compiles directly into the Convex query itself, not a post-filter[^12] | Function-based access control (not fixed roles), Collection/Global/Field level, core OSS[^p12] | Fixed roles (2 on Free, 5 on Growth); custom roles and GROQ-filtered resources are Enterprise-only[^s12] | RBAC free/core: custom admin roles plus field/locale-level permission conditions[^st12] |
apps/docs/src/content/docs/compare.mdx:62:[^12]: VexCMS docs — [Access Control (RBAC)](/guides/access-control/)
apps/docs/src/content/docs/fields/ui.mdx:8:validation, type-gen, RBAC, indexing, or default-value resolution. Legal in
apps/docs/src/content/docs/fields/ui.mdx:47:entirely. There is no stored value, no default, no RBAC entry, and no
apps/docs/src/content/docs/fields/ui.mdx:88:admin concern (search, sort, filtering, RBAC) — it is purely a form/list
apps/docs/src/content/docs/dev/project-structure.mdx:53:  on top of `@vexcms/core`'s schema/field/RBAC primitives. Core has zero
apps/docs/src/content/docs/roadmap.md:18:- ✅ RBAC with document-level access, indexed rules (`withIndex` ranges and `where` predicates), and per-call `access.action` / `access.bypass`
apps/docs/src/content/docs/roadmap.md:28:- ✅ Field-level RBAC permissions — a filter callback may return a field map instead of a boolean
apps/docs/src/content/docs/dev/package-layout.mdx:35:access/        # RBAC dispatchers — resolveAccessCall, resolveReadCall, query constraints
apps/docs/src/content/docs/dev/naming-conventions.mdx:336:config concerns. RBAC adds `access` (the `defineAccess` matrix),
apps/docs/src/content/docs/guides/theming.mdx:113:resolves it through the [Local API](/guides/local-api/). RBAC is bypassed
apps/docs/src/content/docs/guides/admin-customization.mdx:183:`access` gates on RBAC and is checked first; `condition` is checked after and
apps/docs/src/content/docs/guides/framework-adapters.md:511:RBAC-aware component in the tree reads, so there is no client-only flash. `user === null`
apps/docs/src/content/docs/guides/local-api.mdx:3:description: Direct, typed server-side data access inside your own Convex functions — the same get/find/search/create/update/remove/globals surface the admin panel runs on, with RBAC enforced on every call.
apps/docs/src/content/docs/guides/local-api.mdx:19:  writes anything — RBAC is enforced **inside** the Local API, not layered on top by your
apps/docs/src/content/docs/guides/local-api.mdx:240:// A genuinely public read, opted out of RBAC explicitly — costs no session lookup.
apps/docs/src/content/docs/guides/access-control.mdx:2:title: Access Control (RBAC)
apps/docs/src/content/docs/guides/access-control.mdx:291:  same fail-closed default the rest of RBAC uses: a field the map never mentions never gets
apps/docs/src/content/docs/guides/access-control.mdx:431:Like every other RBAC check, field permissions are enforced in the generated Convex functions
apps/docs/src/content/docs/guides/access-control.mdx:576:// A genuinely public read, opted out of RBAC explicitly — costs no session lookup.
```

### licence line
Command:
```
rg -n "Apache-2\.0 licensed|licen[cs]ed under" README.md packages/*/README.md apps/www/convex/seed.ts CONTRIBUTING.md apps/docs/src/content/docs .agent/docs/specs/2026-11-06-public-presence/public-copy.md
```
Output:
```
README.md:95:VexCMS is Apache-2.0 licensed. Paid add-ons may come later, as separate packages, after the
CONTRIBUTING.md:85:Your contribution is licensed under Apache-2.0, the same as the rest of VexCMS (section 5 of the
apps/www/convex/seed.ts:631:        copyright: "VexCMS. Apache-2.0 licensed. Built on Convex.",
apps/www/convex/seed.ts:1843:      "PLACEHOLDER — replace before D1: VexCMS is Apache-2.0 licensed, built and maintained by one developer.",
apps/www/convex/seed.ts:1847:      { type: "p", children: [{ text: "VexCMS is Apache-2.0 licensed." }] },
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:14:VexCMS is Apache-2.0 licensed.
```

### paid line (verbatim)
Command:
```
rg -n "Paid add-ons may come later" README.md apps/docs/src/content/docs apps/www/convex/seed.ts apps/test/convex/seed.ts .agent/docs/specs/2026-11-06-public-presence/public-copy.md .agent/docs/specs/2026-11-06-public-presence/release-notes.md
```
Output:
```
apps/www/convex/seed.ts:1012:              "The core is Apache-2.0 and stays that way: every field type, the admin panel, the CLI, RBAC, drafts, live preview, and hooks. You pay Convex for usage, and Convex has a free tier. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.",
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:10:Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:63:Bio: I build VexCMS, a type-safe headless CMS built on Convex, in my free time. Sponsorship funds the free core: faster bug fixes first, then the free roadmap. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.
apps/test/convex/seed.ts:1008:              "The core is Apache-2.0 and stays that way: every field type, the admin panel, the CLI, RBAC, drafts, live preview, and hooks. You pay Convex for usage, and Convex has a free tier. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.",
README.md:95:VexCMS is Apache-2.0 licensed. Paid add-ons may come later, as separate packages, after the
apps/docs/src/content/docs/compare.mdx:10:Paid add-ons may come later, as separate packages, after the free roadmap. The core stays
apps/docs/src/content/docs/roadmap.md:70:Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.
```

### banned paid terms
Command:
```
rg -ni "pro tier|agency|enterprise|maprios|\bSSO\b|audit log|co-edit|annual licen|\$[0-9]" README.md packages/*/README.md apps/docs/src/content/docs apps/www/convex/seed.ts apps/test/convex/seed.ts .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md .agent/docs/specs/2026-11-06-public-presence/release-notes.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev
```
Output:
```
apps/docs/src/content/docs/fields/select.mdx:60:        { label: "Enterprise", value: "enterprise" },
apps/docs/src/content/docs/compare.mdx:21:| Licence | Apache-2.0, the entire project[^5] | MIT, the entire core (admin panel included)[^p5] | Studio: MIT (confirmed via `gh api repos/sanity-io/sanity/license`). Content Lake: proprietary SaaS[^s5] | MIT core; code under `ee/` directories is proprietary Strapi Enterprise Edition[^st5] |
apps/docs/src/content/docs/compare.mdx:22:| Pricing model | Free and open source; no SaaS tier[^6] | No SaaS pricing page; self-hosted OSS, Enterprise is sales-contact[^p6] | Free tier (20 seats, 2 datasets, 10k docs), paid from $15/seat/month (Growth)[^s6] | Community free/unlimited (MIT); paid CMS from $45/month (Growth), Cloud hosting from $35/project/month[^st6] |
apps/docs/src/content/docs/compare.mdx:23:| Real-time admin | Every list view is a Convex subscription — two editors on one collection see each other's writes live[^7] | "Multi-Player Editing" listed Coming Soon under Enterprise, not shipped[^p7] | Real-time editing and multiplayer presence, on all plans including Free[^s7] | No real-time/presence feature found; an open, unimplemented feedback request exists for basic edit-locking[^st7] |
apps/docs/src/content/docs/compare.mdx:24:| Live preview of unsaved edits | Streams the form's current (unsaved) values onto the real public route via `postMessage` + `BroadcastChannel`, no draft save required[^8] | Core OSS Live Preview (iframe, `postMessage`, real-time); the separate drag-and-drop "Visual Editor" is Coming Soon under Enterprise[^p8] | Live Preview and Visual Editing (click-to-edit Presentation tool), on all plans including Free[^s8] | Not on Community (free); available on Growth ($45/month) and Enterprise[^st8] |
apps/docs/src/content/docs/compare.mdx:25:| Drafts + version history | One published row plus at most one draft row sharing its `_id`; every distinct content state recorded as an immutable `vex_versions` snapshot; restore and unpublish included[^9] | Core OSS Versions/Drafts system with version history[^p9] | Review Changes retention: 3 days (Free), 90 days (Growth), 365 days (Enterprise)[^s9] | Draft & Publish is core/free; Content History (version history UI) is Growth (14 days) or Enterprise (custom), not on Community[^st9] |
apps/docs/src/content/docs/compare.mdx:26:| Scheduled publishing | After 0.1.0 (roadmap) | Core OSS — `versions.drafts.schedulePublish` on the base Versions config[^p10] | Growth plan ($15/seat/month) and up, not on Free[^s10] | "Releases" feature — not on Community, unlimited on Growth and Enterprise[^st10] |
apps/docs/src/content/docs/compare.mdx:28:| Access control (document/field level, applied in the query) | `defineAccess()`: role → subject → check, enforced on the server; a `withIndex`/`where` check compiles directly into the Convex query itself, not a post-filter[^12] | Function-based access control (not fixed roles), Collection/Global/Field level, core OSS[^p12] | Fixed roles (2 on Free, 5 on Growth); custom roles and GROQ-filtered resources are Enterprise-only[^s12] | RBAC free/core: custom admin roles plus field/locale-level permission conditions[^st12] |
apps/docs/src/content/docs/compare.mdx:76:[^p6]: https://payloadcms.com/pricing (404, attempted 2026-11-06); https://payloadcms.com/enterprise (fetched 2026-11-06)
apps/docs/src/content/docs/compare.mdx:77:[^p7]: https://payloadcms.com/enterprise (fetched 2026-11-06)
apps/www/convex/seed.ts:1232:        { label: "Enterprise", value: "enterprise" },
apps/www/convex/seed.ts:1260:  plan: v.optional(v.array(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")))),
apps/www/convex/seed.ts:2051:      "Wayne Enterprises",
apps/test/convex/seed.ts:1228:        { label: "Enterprise", value: "enterprise" },
apps/test/convex/seed.ts:1256:  plan: v.optional(v.array(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")))),
apps/test/convex/seed.ts:1894:  await insertBySlug("case_studies", "maprios", {
apps/test/convex/seed.ts:1895:    title: "Maprios cuts publish time by 60%",
apps/test/convex/seed.ts:1899:    clientName: "Maprios",
apps/test/convex/seed.ts:1901:    clientUrl: "https://maprios.com",
```

### roadmap order + no planned-issue links
Command:
```
rg -n "Plugin system|Localization|Scheduled publishing|TanStack Start adapter|Form builder|Outbound webhooks|API keys and team management|Brownfield adoption|No fixed order" apps/docs/src/content/docs/roadmap.md .agent/docs/specs/2026-11-06-public-presence/public-copy.md; echo "-- planned-issue / thumbs-up sweep:"; rg -n -i "issues/(5[3-9]|6[0-4])\b|👍 the linked issue|move one up|label planned" README.md apps/docs/src/content/docs apps/www/convex/seed.ts apps/test/convex/seed.ts .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md .agent/docs/specs/2026-11-06-public-presence/release-notes.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev .agent/docs/specs/2026-11-06-launch-kit-final-review/copy-flip.patch; echo "gh planned issues: $(gh issue list --repo ianyimi/vex --label planned --state all --json number --jq length)"
```
Output:
```
apps/docs/src/content/docs/roadmap.md:52:1. **Plugin system** — The extension points 0.1.0 ships (admin slots, component overrides, action contributions) become a supported plugin API for collections, fields, hooks, access rules and admin views.
apps/docs/src/content/docs/roadmap.md:53:2. **Free features, as demand appears** — No fixed order.
apps/docs/src/content/docs/roadmap.md:54:   - **Localization** — Per-field locale values, opted into per collection and per field, with locale-aware drafts.
apps/docs/src/content/docs/roadmap.md:55:   - **Scheduled publishing** — Publish and unpublish at a set time, on Convex's scheduler.
apps/docs/src/content/docs/roadmap.md:56:   - **TanStack Start adapter** — The admin panel and the caching helpers on a second framework.
apps/docs/src/content/docs/roadmap.md:57:   - **Form builder** — Collect input from site visitors, with generated validation and stored submissions.
apps/docs/src/content/docs/roadmap.md:58:   - **Outbound webhooks** — Notify other services when content changes.
apps/docs/src/content/docs/roadmap.md:59:   - **API keys and team management** — Invite people, assign roles, and issue scoped keys for reading content from outside.
apps/docs/src/content/docs/roadmap.md:60:3. **Brownfield adoption** — Add VexCMS to an existing Convex app table by table, without migrating the data it already holds.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:20:1. **Plugin system** — The extension points 0.1.0 ships (admin slots, component overrides, action contributions) become a supported plugin API for collections, fields, hooks, access rules and admin views.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:21:2. **Free features, as demand appears** — No fixed order.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:22:   - **Localization** — Per-field locale values, opted into per collection and per field, with locale-aware drafts.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:23:   - **Scheduled publishing** — Publish and unpublish at a set time, on Convex's scheduler.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:24:   - **TanStack Start adapter** — The admin panel and the caching helpers on a second framework.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:25:   - **Form builder** — Collect input from site visitors, with generated validation and stored submissions.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:26:   - **Outbound webhooks** — Notify other services when content changes.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:27:   - **API keys and team management** — Invite people, assign roles, and issue scoped keys for reading content from outside.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:28:3. **Brownfield adoption** — Add VexCMS to an existing Convex app table by table, without migrating the data it already holds.
-- planned-issue / thumbs-up sweep:
gh planned issues: 0
```

### support channel (Discussions, no Discord)
Command:
```
rg -ni "discussions|discord" README.md apps/docs/src/content/docs/index.mdx apps/docs/src/content/docs/dev apps/www/convex/seed.ts CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev
```
Output:
```
apps/www/convex/seed.ts:638:          { label: "Discussions", href: "https://github.com/ianyimi/vex/discussions" },
apps/www/convex/seed.ts:972:        supportLink: "https://github.com/ianyimi/vex/discussions",
README.md:73:- **Questions and ideas**: [GitHub Discussions](https://github.com/ianyimi/vex/discussions)
CONTRIBUTING.md:11:| A question about using VexCMS | [Discussions → Q&A](https://github.com/ianyimi/vex/discussions/categories/q-a)                                                                        |
CONTRIBUTING.md:12:| An idea for a new feature     | [Discussions → Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) — 👍 the ideas you want; I label the ones I'll take `accepted`     |
.github/ISSUE_TEMPLATE/config.yml:4:    url: https://github.com/ianyimi/vex/discussions/categories/q-a
.github/ISSUE_TEMPLATE/config.yml:5:    about: Questions about using VexCMS go to Discussions, not issues.
.github/ISSUE_TEMPLATE/config.yml:7:    url: https://github.com/ianyimi/vex/discussions/categories/ideas
.github/ISSUE_TEMPLATE/config.yml:8:    about: Feature ideas go to Discussions, where 👍 votes rank them.
```

### contact addresses
Command:
```
rg -n "hello@vexcms\.dev|security@vexcms\.dev" README.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev apps/www/convex/seed.ts apps/docs/src/content/docs .agent/docs/specs/2026-11-06-public-presence/public-copy.md
```
Output:
```
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:46:Questions and ideas go to [GitHub Discussions](https://github.com/ianyimi/vex/discussions). Bugs go to [issues](https://github.com/ianyimi/vex/issues/new/choose). Security reports go to [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) or security@vexcms.dev — never a public issue.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:50:- hello@vexcms.dev — sponsorship, partnership and business enquiries, and Code of Conduct reports.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:51:- security@vexcms.dev — security reports, when private vulnerability reporting isn't an option.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:108:Questions about privacy or this page: hello@vexcms.dev.
apps/www/convex/seed.ts:1692:            answer: "Questions about privacy or this page: hello@vexcms.dev.",
apps/www/convex/seed.ts:1809:            answer: "Questions about privacy or this page: hello@vexcms.dev.",
CODE_OF_CONDUCT.md:46:When an incident does occur, it is important to report it promptly. To report a possible violation, email **hello@vexcms.dev**.
CONTRIBUTING.md:15:| A security vulnerability      | [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) (preferred) or `security@vexcms.dev` — never a public issue |
SECURITY.md:14:2. **If that isn't an option:** email `security@vexcms.dev`.
README.md:77:- **Security**: [SECURITY.md](SECURITY.md) — private vulnerability reporting, or security@vexcms.dev
apps/docs/src/content/docs/accessibility.md:32:Questions about privacy or this page: hello@vexcms.dev.
```

### funding links
Command:
```
rg -n "github\.com/sponsors/ianyimi|buymeacoffee\.com|buttondown\.com" README.md apps/docs/astro.config.mjs apps/www/convex/seed.ts .github/FUNDING.yml CONTRIBUTING.md
```
Output:
```
README.md:15:[![Sponsors](https://img.shields.io/github/sponsors/ianyimi)](https://github.com/sponsors/ianyimi)
README.md:75:- **Release emails**: [subscribe](https://buttondown.com/vexcms)
README.md:88:Sponsor on [GitHub Sponsors](https://github.com/sponsors/ianyimi) (monthly or one-time), or
README.md:89:[buy me a coffee](https://buymeacoffee.com/zaye).
apps/www/convex/seed.ts:639:          { label: "Release emails", href: "https://buttondown.com/vexcms" },
apps/www/convex/seed.ts:640:          { label: "Sponsor", href: "https://github.com/sponsors/ianyimi" },
apps/www/convex/seed.ts:641:          { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/zaye" },
apps/www/convex/seed.ts:652:          { platform: "GitHub Sponsors", href: "https://github.com/sponsors/ianyimi", icon: "Heart" },
apps/www/convex/seed.ts:1688:              "Release emails: if you subscribe, your email address is stored by Buttondown, which runs the list and sends one email per release. Buttondown's privacy policy: https://buttondown.com/legal/privacy",
apps/www/convex/seed.ts:1892:              "https://buttondown.com/vexcms.",
apps/docs/astro.config.mjs:16:				{ icon: 'heart', label: 'Sponsors', href: 'https://github.com/sponsors/ianyimi' },
apps/docs/astro.config.mjs:17:				{ icon: 'email', label: 'Release emails', href: 'https://buttondown.com/vexcms' },
```

### follow link and who builds this
Command:
```
rg -n "buttondown\.com|Release emails" README.md apps/docs/astro.config.mjs apps/www/convex/seed.ts; rg -n "built and maintained by one developer" README.md apps/www/convex/seed.ts CONTRIBUTING.md .agent/docs/specs/2026-11-06-public-presence/public-copy.md
```
Output:
```
apps/docs/astro.config.mjs:17:				{ icon: 'email', label: 'Release emails', href: 'https://buttondown.com/vexcms' },
README.md:75:- **Release emails**: [subscribe](https://buttondown.com/vexcms)
apps/www/convex/seed.ts:639:          { label: "Release emails", href: "https://buttondown.com/vexcms" },
apps/www/convex/seed.ts:1688:              "Release emails: if you subscribe, your email address is stored by Buttondown, which runs the list and sends one email per release. Buttondown's privacy policy: https://buttondown.com/legal/privacy",
apps/www/convex/seed.ts:1891:              "Release emails: one email per release, nothing else — subscribe at " +
apps/www/convex/seed.ts:1892:              "https://buttondown.com/vexcms.",
CONTRIBUTING.md:3:VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:34:VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship.
README.md:81:VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in
apps/www/convex/seed.ts:1017:              "VexCMS is built and maintained by one developer, @ianyimi, in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship. Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap.",
apps/www/convex/seed.ts:1843:      "PLACEHOLDER — replace before D1: VexCMS is Apache-2.0 licensed, built and maintained by one developer.",
apps/www/convex/seed.ts:1879:              "VexCMS is built and maintained by one developer, @ianyimi (https://github.com/ianyimi), " +
```

### triage window + PR response window
Command:
```
rg -n "within a week" README.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev apps/www/convex/seed.ts .agent/docs/specs/2026-11-06-public-presence/public-copy.md .agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md
```
Output:
```
apps/www/convex/seed.ts:1017:              "VexCMS is built and maintained by one developer, @ianyimi, in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship. Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap.",
apps/www/convex/seed.ts:1880:              "in their free time. New issues are triaged within a week; how fast a fix lands depends " +
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:34:VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:38:I give every pull request a first review within a week.
.agent/docs/specs/2026-11-06-public-presence/public-copy.md:59:Reports are acknowledged within a week. Supported versions: the latest 0.1.x release.
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:625:their free time. New issues are triaged within a week; how fast a fix lands depends on its
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:628:"Reports are acknowledged within a week. Supported versions: the latest 0.1.x release." —
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:631:"I give every pull request a first review within a week." — `public-copy.md` § Pull request
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:913:within a week, matching `public-copy.md` § Who builds this.
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:916:   reply and leave `status: needs-repro`. Pull requests: a first review within a week
.agent/docs/specs/2026-11-06-launch-kit-final-review/launch-kit.md:932:10. `security@vexcms.dev` — acknowledge within a week (`public-copy.md` § Security response
CONTRIBUTING.md:4:time. New issues are triaged within a week; how fast a fix lands depends on its severity and on
CONTRIBUTING.md:71:- I give every pull request a first review within a week. After you push changes, I review again
CONTRIBUTING.md:72:  within a week.
README.md:82:their free time. New issues are triaged within a week; how fast a fix lands depends on its
SECURITY.md:16:Reports are acknowledged within a week.
```

### contributor flow
Command:
```
rg -n -i "target(s)? .?dev|base branch|squash|conventional commits|changeset|accepted|Fixes #|good first issue" CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev README.md
```
Output:
```
.github/PULL_REQUEST_TEMPLATE.md:3:- The base branch is `dev`, not `master`.
.github/PULL_REQUEST_TEMPLATE.md:5:- CONTRIBUTING.md says what needs an issue or an accepted idea first.
.github/PULL_REQUEST_TEMPLATE.md:12:Fixes #<!-- the bug issue number, or replace this line with the link to the accepted Ideas discussion -->
.github/PULL_REQUEST_TEMPLATE.md:24:- [ ] The base branch is `dev`
.github/PULL_REQUEST_TEMPLATE.md:25:- [ ] Links a bug issue or an accepted Ideas discussion (typo and broken-link fixes excepted)
.github/PULL_REQUEST_TEMPLATE.md:26:- [ ] A `patch` changeset, if this changes a published package (`packages/*`)
CONTRIBUTING.md:12:| An idea for a new feature     | [Discussions → Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) — 👍 the ideas you want; I label the ones I'll take `accepted`     |
CONTRIBUTING.md:25:  `good first issue`, wait until I assign it to you, so two people don't build the same fix.
CONTRIBUTING.md:26:- **A feature** links an Ideas discussion labeled `accepted`. If it changes a public API,
CONTRIBUTING.md:38:- Title it `type(scope): description`, in [Conventional Commits](https://www.conventionalcommits.org/)
CONTRIBUTING.md:40:  pull request can be anything: I squash-merge, so the title becomes the commit.
CONTRIBUTING.md:41:- Put `Fixes #123` in the description, or the link to the accepted discussion.
CONTRIBUTING.md:46:the checks, changesets, and how a merged change reaches a release.
CONTRIBUTING.md:50:- **A changeset**, if it changes a published package (`packages/*`): `pnpm changeset`, then
apps/docs/src/content/docs/dev/project-structure.mdx:13:`package.json#exports` map, built with `tsup`, versioned with Changesets.
apps/docs/src/content/docs/dev/contributing.mdx:3:description: Set up the repo, run the checks, add a changeset, and open a pull request against dev — the path from a fork to a published release.
apps/docs/src/content/docs/dev/contributing.mdx:8:This page is the how-to for changing VexCMS itself. What needs an issue or an accepted idea
apps/docs/src/content/docs/dev/contributing.mdx:33:| `pnpm changeset` | Records a changeset for your change |
apps/docs/src/content/docs/dev/contributing.mdx:99:## Add a changeset
apps/docs/src/content/docs/dev/contributing.mdx:102:`packages/*` that users install) needs a changeset. Docs-only and `apps/*`-only changes don't.
apps/docs/src/content/docs/dev/contributing.mdx:105:pnpm changeset
apps/docs/src/content/docs/dev/contributing.mdx:130:- Description: fill in the template, including `Fixes #123` or the link to the accepted idea.
apps/docs/src/content/docs/dev/contributing.mdx:137:1. I squash-merge your pull request into `dev`. Your title becomes the commit subject and your
apps/docs/src/content/docs/dev/contributing.mdx:141:   merges, the `Fixes #123` in your commit closes the issue.
apps/docs/src/content/docs/dev/contributing.mdx:143:   `chore: version packages (alpha)` pull request from the queued changesets.
```

### telemetry wording
Command:
```
rg -n -i "telemetry" README.md packages/cli/README.md packages/create-vexcms/README.md apps/www/convex/seed.ts | head -30; rg -n "^## " apps/docs/src/content/docs/guides/telemetry.mdx
```
Output:
```
packages/create-vexcms/README.md:189:## Telemetry
packages/create-vexcms/README.md:192:opt-out telemetry the `vex` CLI uses. Disable it with `DO_NOT_TRACK=1`,
packages/create-vexcms/README.md:193:`VEX_TELEMETRY_DISABLED=1`, or `vex telemetry disable` inside a scaffolded project; it is
packages/create-vexcms/README.md:195:[Telemetry guide](https://docs.vexcms.dev/guides/telemetry/).
apps/www/convex/seed.ts:1645:          "VexCMS runs the analytics, the live demo, and the CLI telemetry described below. This page lists exactly what each one sends.",
apps/www/convex/seed.ts:1681:            question: "Does the CLI send telemetry?",
apps/www/convex/seed.ts:1683:              "create-vexcms and vex collect anonymous usage telemetry by default — no personal data, no IP address, no project content. Opt out at any time with vex telemetry disable, DO_NOT_TRACK=1, or VEX_TELEMETRY_DISABLED=1. Full field list: https://docs.vexcms.dev/guides/telemetry/.",
packages/cli/README.md:58:### `vex telemetry`
packages/cli/README.md:60:Manages anonymous build-time telemetry, which is on by default:
packages/cli/README.md:63:vex telemetry enable
packages/cli/README.md:64:vex telemetry disable
packages/cli/README.md:65:vex telemetry status [--json]
packages/cli/README.md:68:`status` shows whether telemetry is enabled, why, and where the settings file lives;
packages/cli/README.md:70:project, without sending it. `DO_NOT_TRACK=1` or `VEX_TELEMETRY_DISABLED=1` also disable it,
packages/cli/README.md:71:and it is always off in CI. A telemetry failure never fails a command. Every field sent is
packages/cli/README.md:72:listed in the [Telemetry guide](https://docs.vexcms.dev/guides/telemetry/).
15:## When events are sent
25:## The first-run notice
32:## The per-run reminder
67:## Field reference
1110:## What is never sent
1127:## Anonymous ids
1143:## Retention and access
1149:## Opting out
1166:## Debug mode
```

### accessibility claim
Command:
```
rg -n "WCAG|accessib" README.md apps/www/convex/seed.ts apps/docs/src/content/docs/accessibility.md | head -30
```
Output:
```
apps/docs/src/content/docs/accessibility.md:3:description: VexCMS's accessibility conformance statement for the admin panel and the React/Next.js packages.
apps/docs/src/content/docs/accessibility.md:8:WCAG 2.2 Level AA in full, plus 2.4.13 Focus Appearance (normally a Level AAA criterion), applied
apps/docs/src/content/docs/accessibility.md:14:Automated: axe-core 4.14 (via Playwright, tagged for WCAG 2.2 A/AA), a colocated `vitest-axe`
apps/docs/src/content/docs/accessibility.md:27:tools needs a pointer — there's no keyboard equivalent yet (WCAG 2.1.1 Keyboard, 2.5.7 Dragging
apps/www/convex/seed.ts:646:          { label: "Accessibility", href: "/accessibility" },
apps/www/convex/seed.ts:1762:    .withIndex("by_slug", (q) => q.eq("slug", "accessibility"))
apps/www/convex/seed.ts:1765:  const accessibilityPageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
apps/www/convex/seed.ts:1767:    slug: "accessibility",
apps/www/convex/seed.ts:1773:        id: "accessibility-hero",
apps/www/convex/seed.ts:1776:        heading: "VexCMS aims for WCAG 2.2 AA, plus a stronger focus indicator.",
apps/www/convex/seed.ts:1783:        id: "accessibility-faq",
apps/www/convex/seed.ts:1791:              "WCAG 2.2 Level AA in full — every Level A and AA success criterion — plus 2.4.13 Focus Appearance, which is normally a Level AAA criterion. We hold the focus indicator to that AAA bar everywhere on this site.",
apps/www/convex/seed.ts:1796:              "Automated: axe-core 4.14 (via Playwright, tagged for WCAG 2.2 A/AA), the Nu Html Checker, Lighthouse CI's accessibility category, and eslint-plugin-jsx-a11y. We also ran a full keyboard-only sweep of every page. A VoiceOver and 200%-zoom/reflow pass hasn't run yet; this statement will be updated once it has, with no date promised.",
apps/www/convex/seed.ts:1805:              "One: selecting, resizing, or choosing a table size in the richtext editor's image and table tools needs a pointer — there's no keyboard equivalent yet (WCAG 2.1.1 Keyboard, 2.5.7 Dragging Movements). Every other issue found during testing has been fixed.",
apps/www/convex/seed.ts:1817:      await ctx.db.patch(TABLE_SLUG_PAGES, existingAccessibilityPage._id, accessibilityPageDoc)
apps/www/convex/seed.ts:1818:      patched.push("page:accessibility")
apps/www/convex/seed.ts:1820:      skipped.push("page:accessibility")
apps/www/convex/seed.ts:1823:    await ctx.db.insert(TABLE_SLUG_PAGES, accessibilityPageDoc)
apps/www/convex/seed.ts:1824:    created.push("page:accessibility")
```

### voice: first person on contributor surfaces (VW-005/015)
Command:
```
rg -n -w -i "we|our|us|the maintainers?|the team" CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE apps/docs/src/content/docs/dev README.md
```
Output:
```
CODE_OF_CONDUCT.md:3:## Our Pledge
CODE_OF_CONDUCT.md:5:We pledge to make our community welcoming, safe, and equitable for all.
CODE_OF_CONDUCT.md:7:We are committed to fostering an environment that respects and promotes the dignity, rights, and contributions of all individuals, regardless of characteristics including race, ethnicity, caste, color, age, physical characteristics, neurodiversity, disability, sex or gender, gender identity or expression, sexual orientation, language, philosophy or religion, national or social origin, socio-economic position, level of education, or other status. The same privileges of participation are extended to everyone who participates in good faith and in accordance with this Covenant.
CODE_OF_CONDUCT.md:11:While acknowledging differences in social norms, we all strive to meet our community's expectations for positive behavior. We also understand that our words and actions may be interpreted differently than we intend based on culture, background, or native language.
CODE_OF_CONDUCT.md:13:With these considerations in mind, we agree to behave mindfully toward each other and act in ways that center our shared values, including:
CODE_OF_CONDUCT.md:15:1. Respecting the **purpose of our community**, our activities, and our ways of gathering.
CODE_OF_CONDUCT.md:18:4. **Taking responsibility** for our actions and contributions.
CODE_OF_CONDUCT.md:21:7. Behaving in other ways that promote and sustain the **well-being of our community**.
CODE_OF_CONDUCT.md:25:We agree to restrict the following behaviors in our community. Instances, threats, and promotion of these behaviors are violations of this Code of Conduct.
CODE_OF_CONDUCT.md:33:7. Behaving in other ways that **threaten the well-being** of our community.
CODE_OF_CONDUCT.md:71:This enforcement ladder is intended as a guideline. It does not limit the ability of Community Managers to use their discretion and judgment, in keeping with the best interests of our community.
CODE_OF_CONDUCT.md:75:This Code of Conduct applies within all community spaces, and also applies when an individual is officially representing the community in public or other spaces. Examples of representing our community include using an official email address, posting via an official social media account, or acting as an appointed representative at an online or offline event.
```

### repo URL
Command:
```
rg -n -o 'github\.com/ianyimi/vex[^/\s"\')`>.]*' README.md apps/docs/astro.config.mjs .github/FUNDING.yml packages/*/package.json
```
Output:
```
distinct forms: github.com/ianyimi/vex
```

### VexCMS vs Vex in prose (VW-003)
Command:
```
rg -n -P '\bVex( CMS)?\b(?![A-Za-z.\-/])' README.md CONTRIBUTING.md apps/docs/src/content/docs apps/www/src/vexcms/blocks apps/www/convex/seed.ts packages/*/README.md packages/create-vexcms/templates/base-nextjs/README.md
```
Output:
```
README.md:27:Scaffold a complete Next.js + Convex + Vex project (answer "yes" to installing dependencies):
packages/better-auth/README.md:3:[Better Auth](https://www.better-auth.com/) integration for [VEX CMS](https://github.com/ianyimi/vex). Converts Better Auth's user/session/account/verification tables — and any registered plugin's tables — into standard Vex collections, so auth data is manageable through the same admin panel as everything else.
packages/better-auth/README.md:108:Both entry points convert Better Auth's schema into Vex collections through the same pipeline:
packages/better-auth/README.md:113:2. **Converts fields** — maps Better Auth field types to Vex field types (string → text,
apps/www/convex/seed.ts:693:          "Define your collections in TypeScript. Vex generates the Convex schema and types. Your app gets typed queries. Your clients get a real-time admin panel. No API layer. No second database.",
apps/www/convex/seed.ts:780:        heading: "You write the collection. Vex writes the schema.",
apps/www/convex/seed.ts:813:            label: "Vex generates",
apps/www/convex/seed.ts:1241:            label: "Vex generates",
apps/www/src/vexcms/blocks/Header/config.ts:13:      defaultValue: "Vex CMS",
apps/www/src/vexcms/blocks/Hero/config.ts:38:        "A headless CMS built natively on Convex. Declare your collections in TypeScript and Vex generates the Convex schema, the types, and the queries — no translation layer. Every edit reaches every subscriber in milliseconds.",
apps/www/src/vexcms/blocks/HowItWorks/config.ts:44:            "Use defineCollection() and field helpers to declare your content model in TypeScript. Vex generates your Convex schema, types, and queries automatically.",
apps/www/src/vexcms/blocks/CTA/config.ts:12:      defaultValue: "Ready to build with Vex CMS?",
apps/www/src/vexcms/blocks/FAQ/config.ts:17:        "Everything you need to know about Vex CMS and building with Convex.",
apps/www/src/vexcms/blocks/FAQ/config.ts:36:          question: "What is Vex CMS?",
apps/www/src/vexcms/blocks/FAQ/config.ts:38:            "Vex CMS is a headless content management system built on Convex. It provides real-time data, type-safe schemas, database-driven theming, role-based access control, and a full admin panel — all configured in TypeScript. Live preview ships today; versioning and drafts are in progress — see the roadmap.",
apps/www/src/vexcms/blocks/FAQ/config.ts:41:          question: "How is Vex different from other headless CMS platforms?",
apps/www/src/vexcms/blocks/FAQ/config.ts:43:            "Unlike traditional headless CMS platforms that use REST or GraphQL APIs, Vex is powered by Convex's real-time database. This means content updates are instant across all clients, with no polling or webhooks needed. Your schema is defined in code, giving you full type safety from database to frontend.",
apps/www/src/vexcms/blocks/FAQ/config.ts:46:          question: "Do I need to know Convex to use Vex CMS?",
apps/www/src/vexcms/blocks/FAQ/config.ts:48:            "Basic familiarity with Convex helps, but Vex handles most of the complexity for you. The CLI generates your Convex schema, queries, and types automatically from your collection definitions. You just define your fields and Vex does the rest.",
apps/www/src/vexcms/blocks/FAQ/config.ts:51:          question: "Can I use Vex with any frontend framework?",
apps/www/src/vexcms/blocks/FAQ/config.ts:53:            "Vex CMS is framework-agnostic at the data layer — any app that can use Convex can use Vex. The admin panel and UI components are built for Next.js, but the core package and generated queries work with any Convex-compatible frontend.",
apps/www/src/vexcms/blocks/FAQ/config.ts:56:          question: "Is Vex CMS free?",
apps/www/src/vexcms/blocks/FAQ/config.ts:63:            "Run `npx create-vexcms@alpha` to scaffold a new project with Vex CMS pre-configured. The CLI sets up your Next.js app, Convex backend, authentication, and admin panel in under a minute.",
apps/www/src/vexcms/blocks/Features/config.ts:43:            "Define your collections with TypeScript. Vex generates Convex schemas, Zod validators, and typed queries automatically.",
apps/www/src/vexcms/blocks/Roadmap/config.ts:17:        "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
apps/www/src/vexcms/blocks/Footer/config.ts:13:      defaultValue: "Vex CMS",
apps/www/src/vexcms/blocks/Footer/config.ts:21:      defaultValue: "Vex CMS. All rights reserved.",
apps/docs/src/content/docs/guides/auth.mdx:7:introspects your auth provider's schema and converts it into standard Vex
apps/docs/src/content/docs/guides/auth.mdx:92:converts its tables into Vex collections, plus a client-safe
apps/docs/src/content/docs/guides/auth.mdx:275:`betterAuthAdapter()` maps Better Auth `DBFieldAttribute` types to Vex field
apps/docs/src/content/docs/guides/auth.mdx:278:| Better Auth type | Vex field |
apps/docs/src/content/docs/dev/naming-conventions.mdx:33:(`NextAdminPage`), `Vex*` reserved for framework-agnostic APIs shipped from
```

## Link check

Command: `node /tmp/l-link-check.mjs` (spec step 13's script; `SOURCES` widened to the
contributor-workflow files, the issue forms, `FUNDING.yml` and `release-notes.md`; skips
`apps/docs/dist/api/**`, Design Decision 25). Full JSON: `l-evidence/link-check.json.txt`.
```
checked 201 URL(s) from 239 file(s)
flagged 24:
  404 https://docs.vexcms.dev/404/
  404 https://docs.vexcms.dev/dev/contributing/
  404 https://docs.vexcms.dev/dev/testing-and-code-style/
  404 https://github.com/&lt;you&gt;/vex.git
  404 https://github.com/ianyimi/vex.gitgit
  200 https://github.com/ianyimi/vex/issues/new/choose -> login (https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fianyimi%2Fvex%2Fissues%2Fnew%2Fchoose)
  404 https://github.com/ianyimi/vex/issues/new/choose`
  200 https://github.com/ianyimi/vex/security/advisories/new -> login (https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fianyimi%2Fvex%2Fsecurity%2Fadvisories%2Fnew)
  404 https://github.com/ianyimi/vex`
  404 https://github.com/vireshvekariya/use-mask-input
  404 https://github.com/you/minimal-repro
  404 https://payloadcms.com/pricing
  404 https://placeholder.convex.cloud
  404 https://twitter.com/username
  403 https://twitter.com/username&quot
  404 https://va.vercel-scripts.com/v1/script.debug.js`:e.basePath?p(`${e.basePath}/insights/script.js`
  404 https://vexcms.dev/brand
  404 https://vexcms.dev/docs/access-control
  404 https://vexcms.dev/posts/vexcms-0-1-0`
  403 https://www.npmjs.com/package/
  403 https://www.npmjs.com/package/@vexcms/core
  403 https://www.npmjs.com/package/convex-test
  403 https://www.npmjs.com/package/create-vexcms
  404 https://x.com/vexcms
```

Triage of the flagged rows (agent, mechanical):

| URL | Source | Disposition |
|---|---|---|
| `github.com/vireshvekariya/use-mask-input` (404) | `guides/conditional-fields-and-masks.mdx:132` | **fixed** → `github.com/eduardoborges/use-mask-input` (npm `repository`), 200 (L-001) |
| `vexcms.dev/docs/access-control` (404) | `templates/base-nextjs/src/auth/access.ts:25` | **fixed** → `docs.vexcms.dev/guides/access-control/`, 200 (L-002) |
| `x.com/vexcms` (404) | `Footer/config.ts` default `socialLinks` (www, apps/test, marketing-site template) | finding L-003 (no X account exists) |
| `payloadcms.com/pricing` (404) | `compare.mdx` footnote `[^p6]` | already annotated "(404, attempted 2026-11-06)" in the footnote; finding L-004 |
| `vexcms.dev/brand` (404) | www seed + `public-copy.md` | production predates PP-13; live after the pre-launch deploy (LI-8). Not-yet-live |
| `docs.vexcms.dev/dev/contributing/`, `/dev/testing-and-code-style/` (404) | docs dist + CONTRIBUTING | new CW pages, not deployed yet. Not-yet-live |
| `vexcms.dev/posts/vexcms-0-1-0` | kit, seeds | draft until D1 (kit "Not-yet-live URLs") |
| `github.com/…/issues/new/choose`, `/security/advisories/new` (→ login) | CONTRIBUTING, SECURITY, `config.yml` | GitHub requires sign-in for these; expected |
| `npmjs.com/package/*` (403) | READMEs, docs | npm bot wall; pages exist (`npm view` resolves every package) |
| `twitter.com/username`, `github.com/you/minimal-repro`, `github.com/<you>/vex.git`, `placeholder.convex.cloud`, `localhost:*` | docs examples, CONTRIBUTING, quickstart | placeholders in examples; expected |
| `…vex.gitgit`, backtick- or `&quot`-suffixed URLs, `va.vercel-scripts.com/…basePath` | minified/inline text | extraction artifacts of the regex, not real links |

Negative test (AP-013): `node /tmp/l-link-check.mjs --negative-test | rg "404 https://vexcms\.dev/__l-link-check-negative-test__"` — see the dated line appended below.

2026-11-10: printed `404 https://vexcms.dev/__l-link-check-negative-test__` (pass).

## Packed manifests and READMEs

From `node scripts/verify-scaffold.mjs --keep`'s tarballs (alpha.36 working tree). Packed READMEs
extracted to `/tmp/l-pack-evidence/<name>/README.md`. Fields: `l-evidence/pack-fields.txt`.
```

### @vexcms/better-auth
{"name":"@vexcms/better-auth","version":"0.1.0-alpha.36","description":"better-auth adapter for VexCMS on Convex","keywords":["cms","headless-cms","convex","typescript","auth","better-auth"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/better-auth"},"license":"Apache-2.0","bugs":null,"files":["dist"],"engines":null,"peerDependencies":{"better-auth":">=1.7.16 <1.8.0","convex":">=1.44.0 <2","@vexcms/core":"^0.1.0-alpha.36"}}
README -> /tmp/l-pack-evidence/@vexcms__better-auth/README.md

### @vexcms/cli
{"name":"@vexcms/cli","version":"0.1.0-alpha.36","description":"VexCMS CLI: dev server orchestration and type generation","keywords":["cms","headless-cms","convex","typescript","cli"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/cli"},"license":"Apache-2.0","bugs":null,"files":["dist"],"engines":null,"peerDependencies":{"convex":">=1.44.0 <2","@vexcms/core":"^0.1.0-alpha.36"}}
README -> /tmp/l-pack-evidence/@vexcms__cli/README.md

### @vexcms/core
{"name":"@vexcms/core","version":"0.1.0-alpha.36","description":"Convex-native headless CMS core: field factories, schema generation, and typed collection APIs","keywords":["cms","headless-cms","convex","typescript"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/core"},"license":"Apache-2.0","bugs":null,"files":["dist"],"engines":null,"peerDependencies":{"convex":">=1.44.0 <2"}}
README -> /tmp/l-pack-evidence/@vexcms__core/README.md

### create-vexcms
{"name":"create-vexcms","version":"0.1.0-alpha.36","description":"Scaffold a new VexCMS project","keywords":["cms","headless-cms","convex","typescript","create","scaffold"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/create-vexcms"},"license":"Apache-2.0","bugs":null,"files":["dist","templates"],"engines":null,"peerDependencies":null}
README -> /tmp/l-pack-evidence/create-vexcms/README.md

### @vexcms/file-storage-convex
{"name":"@vexcms/file-storage-convex","version":"0.1.0-alpha.36","description":"Convex file-storage adapter for VexCMS uploads","keywords":["cms","headless-cms","convex","typescript","storage"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/file-storage-convex"},"license":"Apache-2.0","bugs":null,"files":["dist"],"engines":null,"peerDependencies":{"convex":">=1.44.0 <2","@vexcms/core":"^0.1.0-alpha.36"}}
README -> /tmp/l-pack-evidence/@vexcms__file-storage-convex/README.md

### @vexcms/next
{"name":"@vexcms/next","version":"0.1.0-alpha.36","description":"Next.js adapter and admin routes for VexCMS","keywords":["cms","headless-cms","convex","typescript","nextjs"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/next"},"license":"Apache-2.0","bugs":null,"files":["dist","styles.css"],"engines":null,"peerDependencies":{"@convex-dev/react-query":">=0.1.0 <0.2.0","@tanstack/react-form":">=1.33.0 <2","@tanstack/react-query":">=5.0.0 <6","@tanstack/react-table":">=8.0.0 <9","convex":">=1.44.0 <2","next":">=15.0.0","nuqs":">=2.8.0 <3","react":">=18.0.0","react-dom":">=18.0.0","zod":">=4.0.0 <5"}}
README -> /tmp/l-pack-evidence/@vexcms__next/README.md

### @vexcms/react
{"name":"@vexcms/react","version":"0.1.0-alpha.36","description":"React admin components and hooks for VexCMS","keywords":["cms","headless-cms","convex","typescript","react","admin"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/react"},"license":"Apache-2.0","bugs":null,"files":["dist","styles.css"],"engines":null,"peerDependencies":{"@convex-dev/react-query":">=0.1.0 <0.2.0","@tanstack/react-query":">=5.0.0 <6","@testing-library/jest-dom":">=7.0.0 <8","@testing-library/react":">=16.0.0 <17","@testing-library/user-event":">=14.0.0 <15","convex":">=1.44.0 <2","convex-test":">=0.0.38 <0.1.0","next":">=15.0.0","nuqs":">=2.8.0 <3","react":">=18.0.0","react-dom":">=18.0.0","vitest":">=4.0.0 <5","vitest-axe":">=1.0.0-pre.5 <2.0.0"}}
README -> /tmp/l-pack-evidence/@vexcms__react/README.md

### @vexcms/richtext-plate
{"name":"@vexcms/richtext-plate","version":"0.1.0-alpha.36","description":"Plate rich-text editor integration for VexCMS","keywords":["cms","headless-cms","convex","typescript","richtext","plate"],"homepage":"https://docs.vexcms.dev","repository":{"type":"git","url":"git+https://github.com/ianyimi/vex.git","directory":"packages/richtext-plate"},"license":"Apache-2.0","bugs":null,"files":["dist"],"engines":null,"peerDependencies":{"react":">=18.0.0","react-dom":">=18.0.0","@vexcms/core":"^0.1.0-alpha.36","@vexcms/react":"^0.1.0-alpha.36"}}
README -> /tmp/l-pack-evidence/@vexcms__richtext-plate/README.md
```

Mechanical observation: `bugs` is `null` in all 8 manifests; `engines` is `null` in all 8 (L-005).

## GitHub API dumps

Commands: step 12's GitHub block plus npm dist-tags and external HEAD checks. Full output:
`l-evidence/github.txt`.
```
## repo
{"default_branch":"master","description":"Type-safe headless CMS built on Convex. A real-time admin panel, end-to-end type inference, auth, ABAC — no separate backend to run.","has_discussions":true,"has_wiki":false,"homepage":"https://vexcms.dev","license":"Apache-2.0","topics":["admin-panel","better-auth","cms","convex","headless-cms","nextjs","rbac","react","real-time","typescript"]}
## community
{"files":{"code_of_conduct":"https://github.com/ianyimi/vex/blob/master/CODE_OF_CONDUCT.md","code_of_conduct_file":"https://github.com/ianyimi/vex/blob/master/CODE_OF_CONDUCT.md","contributing":"https://github.com/ianyimi/vex/blob/master/CONTRIBUTING.md","issue_template":null,"license":"https://github.com/ianyimi/vex/blob/master/LICENSE","pull_request_template":"https://github.com/ianyimi/vex/blob/master/.github/PULL_REQUEST_TEMPLATE.md","readme":"https://github.com/ianyimi/vex/blob/master/README.md"},"health_percentage":100}
## labels
adapter: better-auth;adapter: file-storage-convex;adapter: next;adapter: richtext-plate;area: auth;area: cli;area: core;area: create-vexcms;area: docs;area: live-preview;area: storage;area: templates;area: ui;area: versions;BREAKING;dependencies;duplicate;good first issue;help wanted;invalid;javascript;planned;roadmap: p0;roadmap: p1;roadmap: p2;stale;status: cant-reproduce;status: needs-repro;status: needs-triage;status: verified;type: bug;type: docs;type: feature;wontfix;
## discussion categories
{"discussionCategories":{"nodes":[{"isAnswerable":false,"name":"Announcements","slug":"announcements"},{"isAnswerable":false,"name":"Ideas","slug":"ideas"},{"isAnswerable":true,"name":"Q\u0026A","slug":"q-a"},{"isAnswerable":false,"name":"Show and tell","slug":"show-and-tell"}]},"pinnedDiscussions":{"nodes":[{"discussion":{"title":"Welcome to VexCMS Discussions","url":"https://github.com/ianyimi/vex/discussions/66"}}]}}
## planned
[]
## good first issue
65 CLOSED Show a toast when media upload fails instead of only logging to console []
58 CLOSED List-view row title links are 16px-tall touch targets on mobile []
56 OPEN Add a CI check that apps/docs' llms.txt outputs stay in sync with the sidebar []
55 OPEN Collapse duplicate exported types (VexMediaCreateMediaDocumentArgs / DraggableContextValue) []
52 CLOSED Wire the existing AdminNotFound component into its 6 remaining TODO call sites []
## open issues
56 Add a CI check that apps/docs' llms.txt outputs stay in sync with the sidebar {good first issue,area: docs,type: docs}
55 Collapse duplicate exported types (VexMediaCreateMediaDocumentArgs / DraggableContextValue) {good first issue,area: core,type: bug}
## releases
@vexcms/cli@0.1.0-alpha.36	Pre-release	@vexcms/cli@0.1.0-alpha.36	2026-11-10T11:09:37Z
@vexcms/next@0.1.0-alpha.36	Pre-release	@vexcms/next@0.1.0-alpha.36	2026-11-10T11:09:34Z
@vexcms/file-storage-convex@0.1.0-alpha.36	Pre-release	@vexcms/file-storage-convex@0.1.0-alpha.36	2026-11-10T11:09:31Z
@vexcms/better-auth@0.1.0-alpha.36	Pre-release	@vexcms/better-auth@0.1.0-alpha.36	2026-11-10T11:09:28Z
@vexcms/core@0.1.0-alpha.36	Pre-release	@vexcms/core@0.1.0-alpha.36	2026-11-10T11:09:25Z
## pvr
{"enabled":true}## npm
@vexcms/core {"latest":"0.0.20","alpha":"0.1.0-alpha.36"}
create-vexcms {"latest":"0.0.20","alpha":"0.1.0-alpha.36"}
## external
200 https://github.com/sponsors/ianyimi
200 https://buymeacoffee.com/zaye
200 https://buttondown.com/vexcms
200 https://vexcms.dev/
200 https://docs.vexcms.dev/
```

Label drift (live vs `.github/labels.yml`, `LC_ALL=C comm`): live-only `javascript`, `planned`,
`roadmap: p0`, `roadmap: p1`, `roadmap: p2`, `type: feature` (L-012; cleared by the queued
`sync-labels.mjs --prune`, DEP-7/CW-8).

## verify-scaffold.mjs --keep (full run)

Command: `node scripts/verify-scaffold.mjs --keep`. Full log: `l-evidence/verify-scaffold.log`.
```
    ✓ /robots.txt names a user-agent and a sitemap

Summary:
  ✓ templates/base-nextjs (--bare) — all steps green
  ✓ templates/marketing-site (full) — all steps green

--keep: preserved /var/folders/6j/65gmhg_92wq518p0w2vtwt6c0000gn/T/vex-verify-pack-vwIQqn and /var/folders/6j/65gmhg_92wq518p0w2vtwt6c0000gn/T/vex-verify-scaffold-gmD5Kx
EXIT 0
```
(Doubles as step 18's template-scaffold evidence; kept dirs are in the log's last line.)

## Docs build

Command: `pnpm --filter docs build`. Full log: `l-evidence/docs-build.log`.
```
12:40:20 [starlight:pagefind] Found 982 HTML files.
12:40:20 [starlight:pagefind] Finished building search index in 0.78s.
12:40:20 [@astrojs/sitemap] `sitemap-index.xml` created at `dist`
12:40:20 [build] 982 page(s) built in 17.74s
12:40:20 [build] Complete!
EXIT 0
```

## Copy-flip coverage

`copy-flip.patch` (LK-11) applied in a scratch worktree, then the alpha sweep re-run there:
no hit outside `packages/*/package.json` `version`/`publishConfig.tag` and the base template's
`~0.1.0-alpha.N` ranges (both Release's). `git apply --check` exit 0 on today's working tree;
negative test (one corrupted context line) fails with `patch does not apply`. Not in the patch,
by design: root `release` script `--tag alpha` and the 8 `publishConfig.tag` (launch plan §
Release mechanics, "Publish 0.1.0 to npm `latest`"); `packages/create-vexcms/src/index.ts:10`
JSDoc usage line (JSDoc is out of L, Design Decision 25).

## Launch-kit lint re-run

0 of 25 slots are filled (LK-6 is the developer's), so `lint-slots.mjs` has nothing to check;
it runs at LK-7. The kit's own banned-term check (`rg -ni … launch-kit.md`) prints only DevHunt's
`$49` fee, as on 2026-11-07.
