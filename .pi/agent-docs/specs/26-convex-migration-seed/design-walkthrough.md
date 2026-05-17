# 26 — Design Walkthrough: Convex Migration & Seed Script

## End-to-end consumer walkthrough

This walkthrough shows what a developer does to migrate from an existing Convex deployment to a fresh one, and how the collection configs and seed data ensure the new environment is immediately useful.

### Step 1: Provision a new Convex deployment

The developer creates a new project at https://dashboard.convex.dev. This gives them a new deployment URL (e.g. `https://happy-otter-123.convex.cloud`) and deployment name (e.g. `dev:happy-otter-123`).

### Step 2: Update environment variables

```bash
# apps/www/.env.local
NEXT_PUBLIC_CONVEX_URL=https://happy-otter-123.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://happy-otter-123.convex.site
CONVEX_DEPLOYMENT=dev:happy-otter-123
```

### Step 3: Push schema and seed

```bash
# Push the schema (creates all tables + indexes)
npx convex dev --once

# Seed with marketing site data
npx convex run seed:init
# → { created: ["site_settings", "header", "footer", "theme", "page:home", "page:features", "page:pricing", "page:roadmap", "posts (6 samples)"], skipped: [], message: "Initialized 9 items. Skipped 0 (already exist)." }

# Create first admin user (existing Better Auth setup)
npx convex run auth:createAdmin --email "admin@vexcms.dev"
```

### Step 4: Verify in the admin panel

Navigate to `http://localhost:3020/admin`. The sidebar shows:

- **Collections** — Pages (4 docs), Posts (6 docs), Headers (1 doc), Footers (1 doc), Themes (1 doc)
- Opening Pages shows: Home, Features, Pricing, Roadmap — each with title, slug, content, and SEO fields
- Opening the Theme shows: Stark × Ember with `#E8622A` / `#F07040` primary colors

### Step 5: Run tests

```bash
pnpm test
# All core tests pass with new pages/posts/themes fixture
# All www Convex tests pass for all 5 collections
# Seed idempotency test passes
```

## Collection design rationale

### Why 5 collections when only 2 existed before?

The marketing site needs structured content for navigation (headers), footer links (footers), and theming (themes). Storing these as collection documents rather than hardcoded config means:

1. The admin panel can edit them without redeployment
2. The seed script creates the canonical starting state
3. When blocks/globals are implemented, these migrate cleanly to their proper types

### Why JSON text fields for menu items, links, and social links?

The `blocks` and `array` field types aren't implemented yet. The designs require structured data (label + href pairs) for navigation and links. Storing as JSON strings in `text` fields:

- **Pro:** Valid data shape, seed script populates with correct values, frontend can `JSON.parse()` immediately
- **Con:** No admin UI validation, raw JSON in the admin text area
- **Migration path:** When `blocks`/`array` are implemented, these become proper typed fields with component editors

### Why `site_settings` as a collection instead of a global?

`defineGlobal` isn't implemented. A collection with a single document achieves the same data storage. The `insertIfEmpty` pattern in the seed ensures only one site_settings document exists. When globals are implemented, this migrates to `defineGlobal({ slug: "site_settings", ... })`.

### Why restructure the core test fixture?

The core package previously tested against `posts/authors/organizations` — tables that don't exist in the www app. Aligning the fixture with `pages/posts/themes` means:

1. Core tests exercise the same data model the marketing site uses
2. When a new field is added to www's pages collection, the core fixture can be updated in lockstep
3. The `depth` and `populate` tests still work — `pages.posts` (hasMany), `pages.theme` (hasOne), and `posts.parent` (self-ref) cover all relationship patterns

## Decisions Reference

### D1: Use only implemented field types

**Decision:** Restrict collection configs to `text`, `url`, `number`, `select`, `checkbox`, `date`, `relationship`.

**Rationale:** Blocks, globals, upload, imageUrl, color, tabs, array, and defineBlock are all specified but not implemented. Using them would cause runtime errors and typecheck failures. The spec's goal is a working migration with passing tests — implementing those field types is separate work with its own specs.

**Alternatives considered:**
- Implement blocks first, then do this spec → rejected: blocks is a major feature (spec 28), too large to bundle
- Use `v.any()` as a workaround → rejected: defeats type safety and test coverage

### D2: Defer blocks/globals/defineSite/upload/imageUrl/color/tabs

**Decision:** Mark these as "deferred" in the spec. The collection configs use available types as placeholders.

**Rationale:** Each of these is a significant feature with its own spec. Implementing them here would inflate the spec beyond a reasonable scope and risk introducing bugs in core that break downstream packages.

### D3: site_settings uses defineCollection

**Decision:** Register `site_settings` as a regular collection with a single document, not as a `defineGlobal`.

**Rationale:** `defineGlobal` doesn't exist yet. A collection with one document stores the same data. The seed script's `insertIfEmpty` pattern ensures only one document exists. Migration to `defineGlobal` is mechanical when the time comes.

**Alternatives considered:**
- Hardcode site settings in env vars → rejected: not editable from admin panel
- Skip site_settings entirely → rejected: theme and SEO metadata need a storage location

### D4: Page content stored as text field

**Decision:** Store page content as a single `text` field instead of `blocks`.

**Rationale:** `blocks` field type isn't implemented. The seed script populates `content` with the marketing site page copy as structured plain text (using markdown-like section headers). This is immediately useful — the frontend can render it as-is, and when blocks are implemented, the field migrates to `blocks({ blocks: pageBlocks })`.

**Alternatives considered:**
- Store as JSON array of block objects → rejected: no way to validate or render without blocks infrastructure
- Omit content field entirely → rejected: page content is the core of the marketing site

### D5: Themes store color values as text

**Decision:** Store theme colors as `text` fields with hex values (e.g. `#E8622A`).

**Rationale:** `color` and `tabs` field types aren't implemented. The current themes collection captures the 6 most important design tokens from the Stark × Ember palette: primary (light/dark), background (light/dark), font family, and radius. This is enough for a ThemeStyle component to inject CSS variables. When `color`/`tabs` are implemented, these migrate to proper typed fields with the full 40-token palette from the reference template.

### D6: Core fixture uses pages/posts/themes

**Decision:** Replace the `posts/authors/organizations` fixture with `pages/posts/themes`.

**Rationale:** The old fixture used tables that don't exist in www. The new fixture mirrors www's actual collections (pages and themes), so core tests validate the same data model the marketing site uses. This ensures schema parity — when a field is added to www's pages collection, the core fixture can be updated to match.

**Alternatives considered:**
- Keep old fixture alongside new → rejected: doubles maintenance burden
- Import www's actual schema → rejected: core tests must run in isolation with `pnpm --filter @vexcms/core test`

### D7: Core keeps its own fixture (no cross-package import)

**Decision:** Core owns its fixture schema internally. No import from `apps/www`.

**Rationale:** The spec-structure standard states: "A package shouldn't need `apps/www`'s data to verify its own correctness." Core must run `pnpm --filter @vexcms/core test` in CI in isolation. The fixture mirrors www's shapes but is self-contained.

### D8: Seed mutation is idempotent

**Decision:** The seed mutation uses `insertIfMissing` (checks by index) and `insertIfEmpty` (checks if table has any docs).

**Rationale:** Developers will re-run `seed:init` after partial failures, schema changes, or when they forget if they've already seeded. Idempotency prevents duplicate data. The return value clearly reports what was created vs skipped.

**Alternatives considered:**
- Wipe and recreate on every run → rejected: destroys any manual edits the developer made
- Require a `--force` flag → rejected: adds UX complexity for minimal benefit

### D9: Header/footer content as structured text

**Decision:** Store header menu items, action buttons, footer links, and social links as JSON strings in `text` fields.

**Rationale:** Same as D4 — `blocks` and `array` aren't implemented. The JSON format matches the block config default values from spec 33, so migration to proper typed fields is straightforward. The frontend can `JSON.parse()` these values immediately.

**Alternatives considered:**
- Separate fields per menu item → rejected: variable-length lists need array support
- Omit navigation data → rejected: header/footer without navigation data is useless

### D10: Auth tables remain in schema

**Decision:** Better Auth's tables (user, session, account, verification, apikey, jwks) stay in the schema unchanged.

**Rationale:** Better Auth manages these tables internally. Changing their structure would break authentication. The migration to a new deployment means these tables start empty — the developer creates the first admin user via `npx convex run auth:createAdmin`.

### D11: Posts select options updated to marketing categories

**Decision:** Change the `type` select field from generic (one–six) to content categories (blog, changelog, tutorial, update).

**Rationale:** The generic options were test data. The marketing site needs real content categories for the blog section. The design canvases show posts categorized by type. This makes the select field immediately useful rather than requiring manual reconfiguration.
