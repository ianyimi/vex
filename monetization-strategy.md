# Monetization Strategy & Feature Roadmap

## Competitive Context

**Vex CMS** is a Convex-native headless CMS — PayloadCMS rebuilt from the ground up for Convex's real-time, serverless architecture with full TypeScript type safety.

**Comparable product**: [BaseHub](https://basehub.com/) — headless CMS with Git-like content branching, $12/user/month, built on NeonDB (Postgres). Their core differentiator is content branching. Our advantage: **real-time reactivity is free and built-in via Convex**. BaseHub has to engineer live collaboration on top of Postgres; we get it for nothing.

**Key references:**
- [BaseHub pricing & features](https://basehub.com/)
- [Payload CMS](https://payloadcms.com/) — primary inspiration, MIT licensed
- [Payload richtext-lexical package](https://github.com/payloadcms/payload/tree/main/packages/richtext-lexical) — Lexical 0.41.0, model our `richtext()` field after this
- [Convex Components docs](https://docs.convex.dev/components) — distribution option post-feature-complete
- [Convex Components directory](https://convex.dev/components)

---

## License Strategy

**MIT license for all core packages.** This is the developer acquisition flywheel — the more people self-host, the more brand grows.

Enterprise features ship as separate packages under **BSL (Business Source License)** or a commercial license. Source is visible but requires a paid license for commercial use above a threshold.

Comparable OSS monetization models:
- [Payload CMS](https://github.com/payloadcms/payload) — MIT core → Payload Cloud hosting
- [Ghost](https://github.com/TryGhost/Ghost) — MIT → Ghost Pro hosting
- [Strapi](https://github.com/strapi/strapi) — MIT → Strapi Cloud + enterprise
- [Sanity](https://www.sanity.io/pricing) — free tier → API usage billing
- [Cal.com](https://github.com/calcom/cal.com) — AGPL → enterprise commercial license
- [Posthog](https://github.com/PostHog/posthog) — MIT/EE split — MIT core, paid EE features in same repo

---

## Monetization Model

### Tier 1 — MIT Core (Free Forever)

Everything currently built stays free in npm packages:
- All field types, collections, globals
- RBAC system
- Draft/publish workflow + version history
- Media handling
- Admin panel (self-hosted)
- CLI + schema generation
- Auth integration (Better Auth)
- Rich text editor (Lexical)
- Live preview
- Team management
- API key management
- Content scheduling
- Audit log (basic)

### Tier 2 — @vexcms/enterprise (Paid Packages, BSL)

Gated features that enterprises require and will pay for:

| Package | Feature | Why It's Paid |
|---------|---------|---------------|
| `@vexcms/enterprise-environments` | Project-level content branching (staging/production) | Core competitive moat, BaseHub charges for this |
| `@vexcms/enterprise-sso` | SAML/OIDC SSO, IdP group → role mapping | Enterprise security requirement |
| `@vexcms/enterprise-workflows` | Review/approval workflows, required sign-off before publish | Compliance & editorial governance |
| `@vexcms/enterprise-audit` | Full audit log with retention, export, compliance reports | SOC2/HIPAA requirement |
| `@vexcms/enterprise-localization` | i18n field variants, locale-aware versioning | Agencies pay per-project for this |

Pricing model: **flat annual license per company** (not per-seat). $500-2000/yr range. Standard for OSS enterprise packages.

### Tier 3 — Convex Partnership

Every Vex install requires a Convex account. As Vex grows, it drives meaningful Convex signups. Leverage options:

1. **Affiliate/referral revenue** — revenue share on Convex plan upgrades from Vex users
2. **Sponsored development** — Convex funds Vex dev time as a showcase project
3. **Convex Stack listing** — featured in Convex ecosystem, drives organic installs
4. **Convex Component** — listed in [components directory](https://convex.dev/components) for easy `npx convex-component add vexcms` (see limitations below)
5. **Acquisition/hire path** — traction-based, Vex is the best marketing for Convex's value prop

### Tier 4 — Support & Services

Once agencies and startups depend on the project:
- $500-2000/mo priority support subscriptions
- Custom implementation consulting
- White-label admin panel licensing for agencies

### Tier 5 — GitHub Sponsors / OSS Grants

Once public with traction:
- [GitHub Sponsors](https://github.com/sponsors)
- [Open Collective](https://opencollective.com/)
- Ecosystem grants: Vercel, Netlify, and others fund OSS in their ecosystem

---

## Convex Component Packaging — Limitations

The Convex Components data isolation model is a fundamental constraint for Vex:

> "Code inside a component can't read data that is not explicitly provided to it. This includes database tables, file storage, environment variables, scheduled functions."

**What this means for Vex:**
- Users cannot join Vex-managed tables with their own app tables in a single Convex query
- Relationship fields that point to host-app tables (not Vex tables) would require two round-trips + in-memory joining
- You lose Convex's indexed joins and reactive subscriptions across the component boundary

**The better-auth component hit exactly this wall** — you couldn't join auth tables with app data in one query, which is why building auth tables in the default Convex tables was the right call.

**Verdict**: Packaging as a Convex Component is a distribution/discoverability play but trades architectural flexibility. Better approach: **Convex Stack** (full project template) — you get the distribution benefit without the isolation penalty. Revisit component packaging only after the feature set is complete.

---

## Enterprise Package Setup — Git Submodule

`packages/enterprise` must be set up as a git submodule pointing to a separate private repo. This keeps enterprise source code out of the public MIT repo's git history entirely.

```bash
# one-time setup: add the private repo as a submodule
git submodule add git@github.com:you/vexcms-enterprise.git packages/enterprise
git commit -m "chore: add enterprise package as git submodule"
```

After this, `packages/enterprise` in the public repo is just a pointer to a commit hash — no source code visible.

**Local dev (full access):**
```bash
git clone --recurse-submodules git@github.com:you/vexcms.git
# packages/enterprise is fully populated, pnpm workspace links it normally
```

**Public contributors cloning the MIT repo:**
```bash
git clone https://github.com/you/vexcms
# packages/enterprise directory is empty — no error, no enterprise code exposed
```

**Keeping the submodule in sync:**
```bash
# after making changes inside packages/enterprise
cd packages/enterprise
git add . && git commit -m "feat: ..."
git push origin main

# back in root repo, update the submodule pointer
cd ../..
git add packages/enterprise
git commit -m "chore: update enterprise submodule"
```

**pnpm workspace** — no special handling needed. Add to `pnpm-workspace.yaml` as normal:
```yaml
packages:
  - "packages/*"   # picks up packages/enterprise automatically when populated
  - "apps/*"
```

**CI** — enterprise builds run with separate credentials scoped to the private repo. Public CI (GitHub Actions on the MIT repo) simply skips the enterprise package when the submodule is not populated.

---

## Rich Text Editor

**Payload 4.0 uses Lexical** (Meta's editor framework). Package: [`@payloadcms/richtext-lexical`](https://github.com/payloadcms/payload/tree/main/packages/richtext-lexical) — Lexical 0.41.0.

Model the `richtext()` field directly after their implementation:
- Same serialization patterns (JSON storage in Convex)
- Same plugin architecture
- Same React integration
- Add HTML/RSC rendering utilities (`@vexcms/richtext-lexical/html`, `/rsc`)
- Block embeds link to the existing `blocks()` field system

---

## Why Certain Features Were Deprioritized

**TypeSafe Content SDK** — Not needed. Vex is Convex-native; users write Convex queries directly against typed generated tables. The CLI's generated `vex.schema.ts` already gives full type safety. Only relevant if supporting non-Convex backends (not planned).

**Webhooks** — Not needed for core use case. Traditional CMSes need webhooks to trigger Vercel/Netlify rebuilds because content lives outside the app. Convex is real-time push — publish a document and changes propagate instantly to all subscribers with no build step. Webhooks would only matter for external integrations (Slack notifications, Zapier), which is a low-priority nice-to-have.

**Web Hosting** — Not charging for hosting. Revenue comes from enterprise packages, Convex partnership, and support contracts instead.

---

## Full Spec & Feature Build Order

### In Progress
```
Spec 15 — Media Collections
Spec 16 — RBAC / Access Permissions
```

### Phase 1 — Core MVP Completion

```
Spec 17 — Rich Text Field (Lexical)
  - richtext() field type
  - Model after @payloadcms/richtext-lexical (Lexical 0.41.0)
  - Basic formatting: bold, italic, headings, lists, links, inline images
  - Serialize to JSON (stored in Convex)
  - @vexcms/richtext-lexical/html + /rsc rendering utilities
  - Block embed support (integrates with blocks() field)

Spec 18 — Team Management UI
  - Invite users by email (email send via Convex action)
  - Role assignment during invite flow
  - Pending invite table with revoke support
  - User management table in admin panel

Spec 19 — API Key Management
  - Generate read-only API tokens per project
  - Keys stored hashed in Convex, shown once on creation
  - Used for headless content fetching without full auth session
  - Rate limiting config per key (v2)
```

### Phase 2 — Differentiators (ship before public launch)

```
Spec 20 — Content Scheduling
  - publishAt: timestamp on versioned collections
  - Convex scheduled function polls + auto-publishes
  - "Schedule" button in admin alongside Save Draft / Publish
  - Cancel/reschedule support

Spec 21 — Project-Level Environments  ← PRIMARY ENTERPRISE MOAT
  - _environmentId field on all Vex-managed documents
  - vex_environments table (production, staging, development)
  - Environment switcher in admin header
  - "Promote staging → production" atomic mutation
  - Diff view showing changeset between environments
  - Full rollback of content state to any environment snapshot
  - Nothing else in the Convex ecosystem does this

Spec 22 — Audit Log
  - vex_audit_log table: who, collection, doc, action, diff, timestamp
  - Written on every adminCreate/Update/Delete/Publish mutation
  - Audit log viewer in admin (filter by user/collection/date)
  - Basic version ships MIT; advanced retention/export/compliance is enterprise
```

### Phase 3 — Enterprise & Ecosystem Features

```
Spec 23 — Localization (i18n)               [already Phase 3.1 in roadmap]
  - localized: true per field
  - Locale switcher in admin panel
  - Fallback locale support
  - Per-locale version history

Spec 24 — Form Builder                      [already Phase 3.2 in roadmap]
  - defineFormCollection() builder
  - Field types: text, email, textarea, select, checkbox
  - Submission storage in Convex
  - Email notifications via Convex actions
  - Frontend embed utilities

Spec 25 — Plugin System                     [already Phase 3.3 in roadmap]
  - Plugin interface: (config) => config
  - Register custom field types
  - Hook into admin panel components
  - Example plugins: SEO, sitemap, redirects

Spec 26 — SSO / SAML                        [enterprise, @vexcms/enterprise-sso]
  - SAML/OIDC provider configuration
  - Maps IdP groups to Vex roles
  - Enterprise login blocker — most large companies require this

Spec 27 — Review / Approval Workflows       [enterprise, pairs with Spec 21]
  - "Submit for review" action on staging environment
  - Reviewer role can approve/reject changesets
  - Approval required before promote to production
  - Notification system (email on review events)
```

### Phase 4 — Ecosystem

```
Phase 4.1 — TanStack Start admin            [already in roadmap]
Phase 4.2 — Storage Adapters (S3, R2, Vercel Blob)
Phase 4.3 — Auth Adapters (Clerk, Auth.js)
Phase 4.4 — create-vexcms CLI              [scaffold new projects]
Phase 4.5 — Documentation site
Phase 4.6 — Convex Component packaging     [distribution play, post-feature-complete]
```

---

## Summary Timeline

```
NOW         Spec 15 (Media) → Spec 16 (RBAC)
PHASE 1     Spec 17 (Lexical) → Spec 18 (Teams) → Spec 19 (API Keys)
PHASE 2     Spec 20 (Scheduling) → Spec 21 (Environments) → Spec 22 (Audit Log)
PHASE 3     Spec 23 (i18n) → Spec 24 (Forms) → Spec 25 (Plugins) → Spec 26 (SSO) → Spec 27 (Reviews)
PHASE 4     TanStack, Storage, Auth adapters, CLI, Docs, Component packaging
```

Specs 21 (Environments) and 26 (SSO) are where enterprise monetization lives — those become the `@vexcms/enterprise-*` packages. Everything else stays MIT. Spec 21 is the highest-value feature: it justifies a commercial license, nothing in the Convex ecosystem competes with it, and it maps directly to how engineering teams think about deployment workflows.
