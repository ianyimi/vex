# Maprios Migration — Roadmap Gap Analysis

> Cross-reference of the full maprios site configuration against the VexCMS roadmap. Identifies what the roadmap already covers and what's missing.

---

## What the Roadmap Already Covers (✅)

| Maprios Feature | Roadmap Coverage | Notes |
|---|---|---|
| Auth (Users, Sessions, Accounts, Verifications) | Spec 13 — Better Auth Package | ✅ Already built |
| Pages collection with blocks | Spec 28 — Blocks System | ✅ Already built |
| Media collection with upload | Spec 15 — Media Collections | ✅ Already built |
| Draft/published status | Spec 07 — Versioning & Drafts | ✅ Already built |
| Access control (read by status) | Spec 16 — RBAC | ✅ Already built |
| Globals (SiteConfig) | Spec 38 — Globals System | ✅ Already built |
| Theme system with color field | Spec 29 — Color Field + Theme | ✅ Already built |
| Block style controls | Spec 09c — Block Style Controls | ✅ Already built |
| Live preview | Spec 10 — Live Preview | ✅ Already built |
| Rich text | Spec 17 — Rich Text (Plate) | ✅ Already built |
| Custom admin components | Spec 09 — Custom Admin Components | ✅ Already built |
| Icon picker | Listed as done in Current Project State | ✅ Already built |
| Form submission collection | Spec 24 — Form Builder | 📋 Phase 3 (planned) |
| email/textarea field types | Spec 24 — Form Builder | 📋 Phase 3 (planned) |
| Cross-component auth | Spec 43b — Cross-Component Auth | 📋 Phase 3 (planned) |
| Team management | Spec 18 — Team Management UI | 📋 Phase 3 (planned) |
| API keys | Spec 19 — API Key Management | 📋 Phase 3 (planned) |
| Hooks system | Spec XX — Hooks System | 📋 Phase 3 (planned) |
| Field types (text, number, checkbox, select, date, relationship, array, group, blocks, upload, json, color, tabs, object, richtext) | All listed as done | ✅ Already built |

---

## What's Missing from the Roadmap (❌)

### 1. Block Group Categorization

**What:** The maprios admin block picker groups 37+ block variants into 15 categories (Heroes, Call to Action, Features, Contact, Gallery, Stats, Team, Testimonial, Case Study, FAQ, Industries, Services, Footer, Navbar, etc.).

**Gap:** Spec 28 (Blocks System) mentions "admin block picker" but does not mention group/category organization. With 37+ variants in a flat list, the picker becomes unusable.

**Impact:** HIGH — admin UX for content editors.

**Recommendation:** Add to Spec 28 or as a standalone note. Add `admin.group` to `defineBlock()` options. Admin block picker renders grouped sections.

---

### 2. Additional Block Categories Beyond 8 Marketing Blocks

**What:** The roadmap lists 8 marketing blocks (Spec 34): Hero, Features, CTA, FAQ, Header, Footer, HowItWorks, Roadmap. The maprios site uses **15 block categories with 37+ variants**:

| Category | Variants | In Roadmap? |
|---|---|---|
| Hero | 3 | ✅ Spec 34 |
| Features | 11 | ✅ Spec 34 |
| CTA | 3 | ✅ Spec 34 |
| FAQ | 2 | ✅ Spec 34 |
| Header | 1 (Navbar) | ✅ Spec 34 |
| Footer | 3 | ✅ Spec 34 |
| **Contact** | 1 | ❌ Missing |
| **Gallery** | 2 | ❌ Missing |
| **Stats** | 1 | ❌ Missing |
| **Team** | 1 | ❌ Missing |
| **Testimonial** | 2 | ❌ Missing |
| **CaseStudy** | 1 | ❌ Missing |
| **Industries** | 1 | ❌ Missing |
| **Service** | 1 | ❌ Missing |
| **Services** | 2 | ❌ Missing |
| **Navbar** | 4 (in Headers collection) | Partially covered |
| HowItWorks | — | ✅ Spec 34 |
| Roadmap | — | ✅ Spec 34 |

**Gap:** 7 block categories are not in the roadmap's marketing blocks list. These are content blocks needed for the maprios site.

**Impact:** MEDIUM — these are just additional `defineBlock()` calls. No new framework features needed. But they need to be built/ported.

**Recommendation:** Expand Spec 34 or add a new spec for "Maprios Block Library" that lists all 15+ categories. Note: Header/Footer are collection-level (not page blocks), and Navbar is a block within Headers collection.

---

### 3. Contact Form Block Configuration

**What:** The maprios Contact block has a `form` group with configuration fields: title, description, submit button label, terms link labels/URLs, privacy link labels/URLs, success message, error message. It also has an array of `contactMethods` (email, phone, chat, office) with icon, title, description, value, href.

**Gap:** Spec 24 (Form Builder) covers the **submission collection** (ContactSubmissions) and field types (email, textarea). But it does not cover the **Contact block** which configures the frontend form UI (labels, messages, links, contact methods). This is a block that renders a form + contact info, not just a form submission handler.

**Impact:** HIGH — the Contact block is a core page section on the maprios site.

**Recommendation:** Add to Spec 24 or as a separate note. The Contact block uses `group()` + `array()` fields for form configuration + contact methods. It needs the `icon` field (already done) and `upload` field (already done for team photos). The actual submission handling is a separate Convex mutation that writes to the ContactSubmissions collection.

---

### 4. Public Mutation Access (Unauthenticated Create)

**What:** The maprios ContactSubmissions collection has `access: { create: () => true }` — anyone can submit a form without authentication. This is a public Convex mutation.

**Gap:** Spec 16 (RBAC) covers document-level and field-level permissions for authenticated users. It does not explicitly mention the **public/unauthenticated access pattern**.

**Impact:** HIGH — contact forms are public-facing. Without this, the form builder is useless for lead capture.

**Recommendation:** Add to Spec 16 or Spec 24. Public mutations need:
- `access: { create: () => true }` or equivalent in `defineAccess()`
- Convex mutation that skips auth checks for specific collections/actions
- Rate limiting (basic) to prevent abuse
- Spam protection (honeypot or CAPTCHA integration)

---

### 5. Admin Form Row Layout

**What:** The maprios Contact block form configuration uses side-by-side field pairs:
```ts
{ type: "row", fields: [
  { name: "termsLinkLabel", admin: { width: "50%" } },
  { name: "termsLinkHref", admin: { width: "50%" } },
] }
```

**Gap:** The roadmap's admin form (Spec 14) does not mention row layout for side-by-side fields. VexCMS has `admin.width: "half"` on individual fields, but no explicit row grouping.

**Impact:** LOW — can be modeled with `group()` fields or individual `width: "half"` fields. Not a blocker.

**Recommendation:** Note in Spec 14 that `admin.width: "half"` on consecutive fields renders side-by-side. Or add a lightweight `row` layout concept.

---

### 6. Seed Data with Block Content

**What:** The maprios seed creates pages with full block content (hero blocks, feature blocks, CTA blocks, etc. with default values, images, contact methods, team members, etc.). The seed also creates headers, footers, themes, and links them in SiteConfig.

**Gap:** The roadmap mentions "seed script" for the marketing site but does not specify **seed data with nested block content**. Block content is complex JSON with nested arrays, groups, and relationships.

**Impact:** MEDIUM — one-time setup, but complex to write manually.

**Recommendation:** Add to Spec 30.5 (Create CLI) or as a note. Seed data should be TypeScript files that import `defineBlock()` defaults and create documents with full block arrays. The CLI's `create-vexcms` template should include a seed script example.

---

### 7. Form Submission Admin Table View

**What:** The maprios ContactSubmissions collection has `admin: { defaultColumns: ["firstName", "lastName", "email", "createdAt"] }` — a specific table view for form submissions.

**Gap:** Spec 24 mentions "submission storage in Convex" but does not explicitly mention the **admin table view** for submissions. This is a standard collection list view, but it needs specific columns.

**Impact:** LOW — standard collection list view already supports this. Just needs to be wired as a collection.

**Recommendation:** Note in Spec 24 that form submission collections use standard `defineCollection()` with the admin list view. No new framework feature needed.

---

### 8. Block Defaults / Presets

**What:** Every maprios block has extensive `defaultValue` settings (hero headlines, feature descriptions, team member bios, contact methods, etc.). These are the block's "preset content" that appears when a block is first added to a page.

**Gap:** The roadmap does not explicitly mention block default values. `defaultValue` on fields is supported (it's a standard field property), but complex nested defaults (arrays of objects with multiple fields) need to be validated.

**Impact:** LOW — `defaultValue` on array fields and group fields is already supported by the field system. Just needs testing with complex nested structures.

**Recommendation:** No roadmap change needed. Just verify that `defaultValue` works for `array()` fields with nested objects.

---

## Summary: What Needs to Be Added to the Roadmap

| # | Item | Priority | Where to Add |
|---|---|---|---|
| 1 | **Block group categorization** | HIGH | Spec 28 (Blocks System) or new note |
| 2 | **Additional block categories** (Gallery, Stats, Team, Testimonial, CaseStudy, Industries, Service, Services, Contact) | MEDIUM | Spec 34 (Marketing Blocks) — expand list |
| 3 | **Contact form block** (form config + contact methods) | HIGH | Spec 24 (Form Builder) or separate note |
| 4 | **Public mutation access** (unauthenticated create) | HIGH | Spec 16 (RBAC) or Spec 24 |
| 5 | **Admin form row layout** | LOW | Spec 14 (Collection Edit Form) — note |
| 6 | **Seed data with block content** | MEDIUM | Spec 30.5 (Create CLI) or note |
| 7 | **Form submission admin table** | LOW | Spec 24 — already covered by standard collection view |
| 8 | **Block defaults** | LOW | No change — already supported |

---

## Recommended Roadmap Updates

### Add to Spec 28 (Blocks System)

```
- Block group categorization in admin picker
  - defineBlock({ admin: { group: "Heroes" } })
  - Admin block picker renders collapsible sections by group
  - Groups ordered alphabetically or by config order
```

### Expand Spec 34 (Marketing Blocks)

```
Spec 34 — Marketing Blocks
  ✅ Hero, Features, CTA, FAQ, Header, Footer, HowItWorks, Roadmap
  🔜 Additional blocks for maprios migration:
    - Contact (form config + contact methods)
    - Gallery (image grid with items)
    - Stats (numbers + countdown)
    - Team (member grid with photos + social links)
    - Testimonial (quote carousel)
    - CaseStudy (case study content)
    - Industries (industry showcase)
    - Service / Services (service listing)
```

### Add to Spec 24 (Form Builder)

```
- Contact form block (page-level block, not just submission collection)
  - Form configuration: title, description, button labels, terms/privacy links, messages
  - Contact methods array: icon, title, description, value, href
  - Submission handling: writes to ContactSubmissions collection
- Public mutation access (unauthenticated create)
  - Rate limiting (basic: 5 submissions / IP / hour)
  - Spam honeypot field
```

### Add to Spec 16 (RBAC)

```
- Public access patterns
  - Unauthenticated create for specific collections (e.g., form submissions)
  - IP-based rate limiting for public mutations
  - No auth required, but still validated and logged
```

---

## Bottom Line

**The roadmap covers 95% of what the maprios site needs.** The only genuine framework gaps are:

1. **Block group categorization** — admin UX feature
2. **Public mutation access** — access control pattern
3. **Contact form block** — block variant that combines form config + contact methods

Everything else (additional block categories, seed data, admin table views, block defaults) is implementation work using existing framework features, not new framework development.

**Phase 3 in the roadmap (Form Builder → Cross-Component Auth → Teams → API Keys → Hooks) is the right focus.** After that, the maprios migration is primarily content block implementation, not framework work.
