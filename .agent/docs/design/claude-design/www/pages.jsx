/* global React, Nav, Footer, Install, CodeBlock, T, SchemaSample, QuerySample, AdminMockup, ReactivityDemo, Icon, Logo */
// VexCMS marketing — 6 pages wired into a single in-shell router.
// The outer design canvas renders <Site variant="..." startPage="..."/> per artboard.

const { useState, useEffect } = React;

// ─── Shared page chrome ──────────────────────────────────────────────────
function Page({ page, onNavigate, children, vp = "desktop" }) {
  // Each shell is an independently-scoped marketing site.
  return (
    <div className="www-shell" data-vp={vp}>
      <Nav page={page} onNavigate={onNavigate} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HOME — variant A: Code-forward (schema beside hero, Vercel/Resend-quiet)
// ─────────────────────────────────────────────────────────────────────────
function HomeA({ onNavigate, tagline = "tagline" }) {
  const headlineByTagline = {
    tagline: <>Real-time content.<br /><span className="serif">Type-safe</span> by default.</>,
    category: <>The <span className="serif">Convex-native</span> CMS.</>,
    dev:     <>Your schema.<br />Your types. <span className="serif">Your rules.</span></>,
    clever:  <>The CMS that <span className="serif">thinks</span> in types.</>,
  };
  return (
    <>
      <section className="hero">
        <div className="glow" />
        <div className="container">
          <div className="hero-cols">
            <div>
              <span className="eyebrow"><span className="pulse" /> v0.1 · now in public preview</span>
              <h1>{headlineByTagline[tagline] || headlineByTagline.tagline}</h1>
              <p className="sub">
                A headless CMS built natively on Convex. Your schema generates the
                database, types, and queries — no translation layer. Every edit
                propagates to every subscriber in milliseconds.
              </p>
              <div className="actions">
                <a className="btn primary lg" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.("features"); }}>
                  Read the docs
                  <Icon name="arrow-right" />
                </a>
                <Install />
              </div>
            </div>
            <div>
              <SchemaSample />
            </div>
          </div>
          <div className="logos-row" style={{ marginTop: 56 }}>
            <span className="lbl">built on</span>
            <span className="logo-pill"><Icon name="zap" size={12} /> Convex</span>
            <span className="logo-pill"><Icon name="box" size={12} /> Next.js</span>
            <span className="logo-pill"><Icon name="shield-check" size={12} /> Better Auth</span>
            <span className="logo-pill"><Icon name="type" size={12} /> Plate.js</span>
            <span className="logo-pill"><Icon name="badge-check" size={12} /> TanStack</span>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">01</span> Real-time</div>
          <div className="section-head">
            <h2>Edit in the admin. <span className="serif">Watch it appear</span> on the site.</h2>
            <p>Convex's reactive subscriptions power the admin panel and every frontend that
            subscribes. Publish a change; subscribers re-render. No webhooks, no revalidation, no build step.</p>
          </div>
          <ReactivityDemo />
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">02</span> Type safety</div>
          <div className="hero-cols">
            <div>
              <div className="section-head" style={{ marginBottom: 28 }}>
                <h2>Types that <span className="serif">follow</span> your schema.</h2>
                <p>Fields, relationships, access permissions, and generated query
                return types are all checked end-to-end. Rename a field; the TypeScript
                compiler tells every call site.</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <Bullet icon="check-check" title="Typed queries" desc="api.posts.getBySlug returns Post | null — no casts." />
                <Bullet icon="git-branch" title="Draft-aware" desc="_vexDrafts flag flips query semantics without re-typing." />
                <Bullet icon="shield" title="Access-checked" desc="RBAC resolves at the document and field level." />
              </ul>
            </div>
            <QuerySample />
          </div>
        </div>
      </section>

      <FeatureGrid />
      <PricingBand compact />
      <CTA onNavigate={onNavigate} />
      <Footer />
    </>
  );
}

function Bullet({ icon, title, desc }) {
  return (
    <li style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span style={{
        width: 28, height: 28, borderRadius: 6,
        background: "var(--accent-tint)",
        border: "1px solid var(--accent-line)",
        color: "var(--accent)",
        display: "grid", placeItems: "center",
        flex: "0 0 auto"
      }}>
        <Icon name={icon} size={14} />
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.55 }}>{desc}</div>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HOME — variant B: Admin panel lead (big product shot above the fold)
// ─────────────────────────────────────────────────────────────────────────
function HomeB({ onNavigate, tagline = "tagline" }) {
  const headlineByTagline = {
    tagline: <>Real-time content.<br /><span className="serif">Type-safe</span> by default.</>,
    category: <>The <span className="serif">Convex-native</span> CMS.</>,
    dev:     <>Your schema. Your types. <span className="serif">Your rules.</span></>,
    clever:  <>The CMS that <span className="serif">thinks</span> in types.</>,
  };
  return (
    <>
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="glow" />
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 780, margin: "0 auto 40px" }}>
            <span className="eyebrow"><span className="pulse" /> v0.1 · now in public preview</span>
            <h1 style={{ margin: "0 auto 22px" }}>{headlineByTagline[tagline] || headlineByTagline.tagline}</h1>
            <p className="sub" style={{ margin: "0 auto 32px" }}>
              A headless CMS built natively on Convex. Your schema generates the
              database, types, and queries. Every edit propagates to every subscriber in milliseconds.
            </p>
            <div className="actions" style={{ justifyContent: "center", display: "inline-flex" }}>
              <a className="btn primary lg" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.("features"); }}>
                Read the docs
                <Icon name="arrow-right" />
              </a>
              <Install />
            </div>
          </div>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <AdminMockup />
          </div>
        </div>
      </section>

      <section className="band compact">
        <div className="container">
          <div className="logos-row">
            <span className="lbl">built on</span>
            <span className="logo-pill"><Icon name="zap" size={12} /> Convex</span>
            <span className="logo-pill"><Icon name="box" size={12} /> Next.js</span>
            <span className="logo-pill"><Icon name="shield-check" size={12} /> Better Auth</span>
            <span className="logo-pill"><Icon name="type" size={12} /> Plate.js</span>
            <span className="logo-pill"><Icon name="badge-check" size={12} /> TanStack</span>
            <span style={{ marginLeft: "auto", color: "var(--fg-subtle)" }}>MIT · free forever</span>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">01</span> Schema first</div>
          <div className="hero-cols">
            <div>
              <div className="section-head">
                <h2>Define once. <span className="serif">Generate everything.</span></h2>
                <p>Declare collections, fields, and access rules in TypeScript.
                Vex generates your Convex schema, TypeScript interfaces, and typed queries —
                and auto-migrates on save.</p>
              </div>
              <Install cmd="pnpm vex dev" />
            </div>
            <SchemaSample />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">02</span> Real-time</div>
          <div className="section-head">
            <h2>Edit. <span className="serif">Subscribe.</span> Render.</h2>
            <p>Watch the same document update in the admin and on the live site. No
            webhooks, no revalidation, no build step between them.</p>
          </div>
          <ReactivityDemo />
        </div>
      </section>

      <FeatureGrid />
      <PricingBand compact />
      <CTA onNavigate={onNavigate} />
      <Footer />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HOME — variant C: Editorial (hero is large typographic, demo is a slim chip)
// ─────────────────────────────────────────────────────────────────────────
function HomeC({ onNavigate, tagline = "tagline" }) {
  const headlineByTagline = {
    tagline: <>Real-time content.<br /><span className="serif">Type-safe</span> by default.</>,
    category: <>The <span className="serif">Convex-native</span> CMS.</>,
    dev:     <>Your schema. Your types. <span className="serif">Your rules.</span></>,
    clever:  <>The CMS that <span className="serif">thinks</span> in types.</>,
  };
  return (
    <>
      <section className="hero" style={{ padding: "120px 0 64px" }}>
        <div className="glow" />
        <div className="container">
          <span className="eyebrow"><span className="pulse" /> v0.1 · now in public preview</span>
          <h1 style={{ fontSize: 84, maxWidth: 960, lineHeight: 1, margin: "8px 0 28px" }}>
            {headlineByTagline[tagline] || headlineByTagline.tagline}
          </h1>
          <p className="sub" style={{ fontSize: 19, maxWidth: 620 }}>
            A Convex-native headless CMS. PayloadCMS-familiar patterns with better
            types, live subscriptions, and zero database configuration. MIT licensed, free forever.
          </p>
          <div className="actions" style={{ marginTop: 32, alignItems: "center" }}>
            <Install />
            <a className="btn ghost" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.("features"); }}>
              or read the docs <Icon name="arrow-right" />
            </a>
          </div>
        </div>
      </section>

      <section className="band compact">
        <div className="container">
          <div style={{
            border: "1px solid var(--line)",
            borderRadius: 10,
            background: "var(--surface)",
            padding: 4,
          }}>
            <AdminMockup />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <div style={{ padding: "36px 40px 36px 0", borderRight: "1px dashed var(--line)" }}>
              <div className="rule" style={{ marginBottom: 16 }}><span className="n">01</span> schema</div>
              <h3 style={{ fontSize: 24, margin: "0 0 10px", letterSpacing: "-0.02em", fontWeight: 600 }}>
                16 field types. <span className="serif">One API.</span>
              </h3>
              <p style={{ fontSize: 14, color: "var(--fg-muted)", lineHeight: 1.6, margin: 0 }}>
                text, number, checkbox, select, date, imageUrl, relationship, upload,
                json, object, array, richtext, ui, blocks, color, tabs.
              </p>
            </div>
            <div style={{ padding: "36px 0 36px 40px" }}>
              <div className="rule" style={{ marginBottom: 16 }}><span className="n">02</span> runtime</div>
              <h3 style={{ fontSize: 24, margin: "0 0 10px", letterSpacing: "-0.02em", fontWeight: 600 }}>
                Drafts, versions, live preview. <span className="serif">Built in.</span>
              </h3>
              <p style={{ fontSize: 14, color: "var(--fg-muted)", lineHeight: 1.6, margin: 0 }}>
                Every collection gets autosave, full version history, restore,
                and a side-by-side live preview iframe.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">03</span> Reactivity</div>
          <div className="section-head">
            <h2>Edit. Subscribe. <span className="serif">Render.</span></h2>
            <p>Every Vex document is a Convex document. Every frontend query is a live subscription.</p>
          </div>
          <ReactivityDemo />
        </div>
      </section>

      <FeatureGrid />
      <PricingBand compact />
      <CTA onNavigate={onNavigate} />
      <Footer />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FEATURES PAGE
// ─────────────────────────────────────────────────────────────────────────
function FeaturesPage({ onNavigate }) {
  return (
    <>
      <section className="hero" style={{ padding: "72px 0 48px" }}>
        <div className="container">
          <span className="eyebrow"><span className="pulse" /> features · shipping in v0.1</span>
          <h1 style={{ fontSize: 48 }}>Everything a real CMS <span className="serif">ships with.</span></h1>
          <p className="sub">
            Schema, drafts, RBAC, rich text, live preview, media, versions, blocks.
            No "coming soon" on the essentials — the core is feature-complete.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">01</span> Schema</div>
          <div className="section-head">
            <h2>Sixteen field types. <span className="serif">One generator.</span></h2>
            <p>Every field is typed, migrate-aware, and composable. Arrays of objects,
            blocks of arrays, tabs of blocks — they all work, and they all generate correct TypeScript.</p>
          </div>
          <div className="feat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {[
              { n: "text", d: "Single-line, validated." },
              { n: "richtext", d: "Plate.js editor + renderer." },
              { n: "relationship", d: "Typed refs across collections." },
              { n: "array", d: "Repeatable typed field." },
              { n: "blocks", d: "Composable content blocks." },
              { n: "upload", d: "Media references + storage adapter." },
              { n: "select", d: "Enum-like, inferred." },
              { n: "checkbox", d: "Boolean toggle." },
              { n: "number", d: "min / max, nullable." },
              { n: "date", d: "Epoch number, timezone aware." },
              { n: "json", d: "Arbitrary typed payload." },
              { n: "object", d: "Named sub-field group." },
              { n: "tabs", d: "Grouped tabbed UI." },
              { n: "color", d: "OKLCH + theme tokens." },
              { n: "imageUrl", d: "URL string, validated." },
              { n: "ui", d: "Non-persisted display/action." },
            ].map((f, i) => (
              <div className="feat" key={f.n}>
                <div className="ix">{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontFamily: "var(--vex-font-mono)", fontSize: 13, color: "var(--accent)", marginBottom: 8 }}>
                  {f.n}()
                </div>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">02</span> Editorial workflow</div>
          <div className="hero-cols">
            <div>
              <div className="section-head">
                <h2>Drafts, versions, <span className="serif">live preview.</span></h2>
                <p>Autosaves coalesce into the version history. Restore any version.
                Preview drafts side-by-side against the real frontend. Reset to discard pending changes.</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <Bullet icon="history" title="Full version history" desc="Every edit is saved to vex_versions with restore support." />
                <Bullet icon="eye" title="Live preview iframe" desc="Side-by-side draft preview with responsive breakpoints." />
                <Bullet icon="rotate-ccw" title="Autosave & reset" desc="Coalesced version records; discard pending changes with one click." />
                <Bullet icon="calendar-clock" title="Content scheduling" desc="publishAt timestamps auto-publish on a Convex cron." />
              </ul>
            </div>
            <AdminMockup />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">03</span> Access control</div>
          <div className="hero-cols">
            <CodeBlock filename="access.ts" meta="defineAccess">
              <>
              {T.k("export const")} access {"= "}{T.f("defineAccess")}{"({"}{"\n"}
              {"  "}roles{": [USER_ROLES.user, USER_ROLES.admin],"}{"\n"}
              {"  "}adminRoles{": [USER_ROLES.admin],"}{"\n"}
              {"  "}permissions{": {"}{"\n"}
              {"    "}user{": {"}{"\n"}
              {"      "}posts{": {"}{"\n"}
              {"        "}create{": "}{T.k("true")}{","}{"\n"}
              {"        "}update{": "}{"({ data, user })"} {"=> data.author === user._id"}{","}{"\n"}
              {"        "}delete{": "}{T.k("false")}{","}{"\n"}
              {"      },"}{"\n"}
              {"    },"}{"\n"}
              {"  },"}{"\n"}
              {"});"}{"\n"}
              </>
            </CodeBlock>
            <div>
              <div className="section-head">
                <h2>Type-safe RBAC. <span className="serif">Document and field level.</span></h2>
                <p>Roles, resources, permissions — all typed. Runtime resolvers get the
                document and user, return a boolean, and get field-level allow/deny lists
                for free.</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <Bullet icon="user-check" title="Document & field level" desc="{mode, fields} granularity on every action." />
                <Bullet icon="key-round" title="Multi-role OR" desc="Permissions resolve across a user's full role set." />
                <Bullet icon="users" title="Organizations" desc="Scoped permissions for agencies and teams." />
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureGrid headingNumber="04" />
      <CTA onNavigate={onNavigate} />
      <Footer />
    </>
  );
}

// ─── Shared feature grid block (used across pages) ───────────────────────
function FeatureGrid({ headingNumber = "03" }) {
  const feats = [
    { ico: "zap",            t: "Real-time by default",  d: "Every query is a Convex subscription. UI stays in sync with zero configuration." },
    { ico: "shapes",          t: "16 field types",        d: "text, richtext, relationship, blocks, array, upload, color, tabs, and more." },
    { ico: "history",         t: "Versions & drafts",     d: "Autosave, restore, and a draft-aware query layer that flips based on a flag." },
    { ico: "shield-check",    t: "Typed RBAC",            d: "Document- and field-level permissions. Typed at the API surface." },
    { ico: "git-pull-request",t: "Live preview",          d: "Draft content rendered side-by-side with responsive breakpoints." },
    { ico: "blocks",          t: "Blocks & richtext",     d: "Composable block layouts and Plate.js-powered rich text editing." },
    { ico: "upload-cloud",    t: "Media library",         d: "Drop-zone, picker, and pluggable storage adapters." },
    { ico: "terminal",        t: "CLI + auto-migration",  d: "vex dev watches your config, regenerates schema + types, migrates." },
    { ico: "lock",            t: "Self-hosted",           d: "You own the admin panel and the data. MIT, free forever." },
  ];
  return (
    <section className="band">
      <div className="container">
        <div className="rule"><span className="n">{headingNumber}</span> What's in the box</div>
        <div className="section-head">
          <h2>Batteries <span className="serif">genuinely</span> included.</h2>
          <p>No upsells to unlock drafts, versions, RBAC, or rich text. These are
          table-stakes for a CMS; they ship MIT.</p>
        </div>
        <div className="feat-grid">
          {feats.map((f, i) => (
            <div className="feat" key={f.t}>
              <div className="ix">{String(i + 1).padStart(2, "0")}</div>
              <div className="ico"><Icon name={f.ico} /></div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────────────────────────────────
function PricingBand({ compact = false }) {
  return (
    <section className="band" style={compact ? undefined : { padding: "96px 0" }}>
      <div className="container">
        <div className="rule"><span className="n">04</span> Pricing</div>
        <div className="section-head">
          <h2>Free forever. <span className="serif">Pay for enterprise.</span></h2>
          <p>MIT core for everyone. Enterprise packages — environments, SSO,
          workflows, audit, i18n — are licensed per-company. Pricing below.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="tier">Core</div>
            <h3>MIT</h3>
            <p className="desc">Self-host the full CMS. All field types, drafts, RBAC, rich text, blocks, preview.</p>
            <div className="price">
              <span className="num">$0</span>
              <span className="per">forever</span>
            </div>
            <ul className="feat-list">
              <li><Icon name="check" /> 16 field types</li>
              <li><Icon name="check" /> Drafts & version history</li>
              <li><Icon name="check" /> Role-based access control</li>
              <li><Icon name="check" /> Live preview</li>
              <li><Icon name="check" /> Rich text & blocks</li>
              <li><Icon name="check" /> Media library</li>
              <li><Icon name="check" /> Team management</li>
              <li><Icon name="check" /> Community support</li>
            </ul>
            <a className="btn outline" href="#" onClick={(e) => e.preventDefault()}>
              <Icon name="terminal" /> Install now
            </a>
          </div>
          <div className="pricing-card featured">
            <div className="tier">Enterprise <span className="tag">POPULAR</span></div>
            <h3>From <span className="serif">$2,000</span> / yr</h3>
            <p className="desc">Flat annual license per company. Adds the features
            enterprise buyers ask about on the first call.</p>
            <div className="price">
              <span className="num">$2k</span>
              <span className="per">company · per year</span>
            </div>
            <ul className="feat-list">
              <li><Icon name="check" /> Everything in Core</li>
              <li><Icon name="check" /> <strong>Environments</strong> (staging → prod)</li>
              <li><Icon name="check" /> SAML / OIDC SSO</li>
              <li><Icon name="check" /> Review & approval workflows</li>
              <li><Icon name="check" /> Full audit log (retention + export)</li>
              <li><Icon name="check" /> Localization (i18n)</li>
              <li><Icon name="check" /> Email support · 24h SLA</li>
              <li className="muted"><Icon name="minus" /> Priority support — add on</li>
            </ul>
            <a className="btn primary" href="#" onClick={(e) => e.preventDefault()}>
              Talk to sales <Icon name="arrow-right" />
            </a>
          </div>
          <div className="pricing-card">
            <div className="tier">Support</div>
            <h3>Priority</h3>
            <p className="desc">Prioritized response on GitHub + Discord. For teams
            depending on Vex in production.</p>
            <div className="price">
              <span className="num">$500</span>
              <span className="per">/ month</span>
            </div>
            <ul className="feat-list">
              <li><Icon name="check" /> Same-business-day response</li>
              <li><Icon name="check" /> Private Slack channel</li>
              <li><Icon name="check" /> Upgrade guidance</li>
              <li><Icon name="check" /> Schema review</li>
              <li className="muted"><Icon name="minus" /> Requires Core or Enterprise</li>
            </ul>
            <a className="btn outline" href="#" onClick={(e) => e.preventDefault()}>
              Contact us
            </a>
          </div>
        </div>
        <div style={{
          marginTop: 28, fontSize: 12.5, color: "var(--fg-muted)",
          display: "flex", gap: 24, flexWrap: "wrap",
          fontFamily: "var(--vex-font-mono)",
        }}>
          <span><Icon name="info" size={12} />&nbsp; Enterprise source is visible under BSL; production use above threshold requires a license.</span>
          <span><Icon name="zap" size={12} />&nbsp; Convex costs billed separately by Convex.</span>
        </div>
      </div>
    </section>
  );
}

function PricingPage({ onNavigate }) {
  return (
    <>
      <section className="hero" style={{ padding: "72px 0 40px" }}>
        <div className="container">
          <span className="eyebrow">pricing · simple, flat, per-company</span>
          <h1 style={{ fontSize: 48 }}>Core is free. <span className="serif">Forever.</span></h1>
          <p className="sub">
            VexCMS is MIT-licensed. Everything a team needs to ship content to production
            is in the free tier. Enterprise adds environments, SSO, workflows, audit, i18n.
          </p>
        </div>
      </section>

      <PricingBand />

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">05</span> FAQ</div>
          <div className="section-head">
            <h2>Questions <span className="serif">we keep getting.</span></h2>
          </div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface)" }}>
            {[
              { q: "Will the MIT core ever become paid?",
                a: "No. The MIT core is permanent. Enterprise features ship as separate BSL packages you install alongside core." },
              { q: "Do I need a Convex account?",
                a: "Yes. Vex is Convex-native. Convex has a generous free tier; you're billed by Convex for their usage." },
              { q: "Is the admin panel hosted?",
                a: "No. You self-host it as a Next.js app. You own the data and the deployment." },
              { q: "Can I use Vex without Next.js?",
                a: "The core (schema, fields, access, RBAC) is framework-agnostic. The admin panel is a Next.js app today; TanStack Start is next on the roadmap." },
              { q: "Per-seat or per-company pricing?",
                a: "Per-company flat-rate annual license. No per-seat counting, no audits, no surprise invoices." },
            ].map((f, i) => (
              <details key={i} style={{ borderBottom: i < 4 ? "1px solid var(--line)" : "none" }}>
                <summary style={{
                  padding: "18px 24px",
                  cursor: "pointer",
                  fontSize: 15, fontWeight: 500,
                  color: "var(--fg)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  listStyle: "none",
                }}>
                  <span>{f.q}</span>
                  <Icon name="plus" size={16} />
                </summary>
                <div style={{ padding: "0 24px 20px", color: "var(--fg-muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTA onNavigate={onNavigate} />
      <Footer />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROADMAP PAGE
// ─────────────────────────────────────────────────────────────────────────
function RoadmapPage({ onNavigate }) {
  const rows = [
    { spec: "05",  t: "Schema field system",      d: "16 field types, recursive rendering.",    s: "done" },
    { spec: "07",  t: "Versioning & drafts",       d: "Autosave, restore, publish lifecycle.",   s: "done" },
    { spec: "10",  t: "Live preview",              d: "Side-by-side iframe, responsive breakpoints.", s: "done" },
    { spec: "15",  t: "Media collections",         d: "Upload, picker, pluggable storage adapters.", s: "done" },
    { spec: "16",  t: "RBAC / access",             d: "Document + field-level permissions.",     s: "done" },
    { spec: "17",  t: "Rich text (Plate.js)",      d: "Editor + renderer, media embeds.",        s: "done" },
    { spec: "28",  t: "Blocks system",             d: "defineBlock + blocks() field.",            s: "done" },
    { spec: "29",  t: "Color field + theme",       d: "OKLCH + CSS variable tokens.",             s: "done" },
    { spec: "33",  t: "Marketing site (vexcms.dev)", d: "This site. Dogfood.",                    s: "done" },
    { spec: "41",  t: "SEO & metadata system",     d: "og:image, favicon, meta — framework-agnostic.", s: "next" },
    { spec: "32",  t: "Docs site (apps/docs)",     d: "Convex-backed, searchable.",               s: "next" },
    { spec: "35",  t: "Public demo admin",         d: "Touchable admin, resets daily.",           s: "next" },
    { spec: "18",  t: "Team management UI",         d: "Invites, roles, pending invites.",        s: "later" },
    { spec: "19",  t: "API key management",         d: "Hashed tokens, rate-limited.",            s: "later" },
    { spec: "20",  t: "Content scheduling",         d: "publishAt + Convex cron.",                s: "later" },
    { spec: "21",  t: "Environments (enterprise)",  d: "Staging → prod, atomic promote.",         s: "later", tag: "enterprise" },
    { spec: "26",  t: "SAML / OIDC SSO",            d: "IdP group → role mapping.",               s: "later", tag: "enterprise" },
    { spec: "27",  t: "Review workflows",           d: "Approval gates before publish.",          s: "later", tag: "enterprise" },
    { spec: "23",  t: "Localization (i18n)",        d: "Per-field locale variants.",              s: "later", tag: "enterprise" },
  ];
  return (
    <>
      <section className="hero" style={{ padding: "72px 0 40px" }}>
        <div className="container">
          <span className="eyebrow"><span className="pulse" /> public · updated weekly</span>
          <h1 style={{ fontSize: 48 }}>What's shipped. <span className="serif">What's next.</span></h1>
          <p className="sub">
            Every Vex feature maps to a numbered spec. Done items are live in the
            current release. Enterprise items ship under a separate license.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
            <span className="badge b-done"><span className="dot" style={{ width: 5, height: 5, borderRadius: 9999, background: "currentColor" }} /> DONE · 42</span>
            <span className="badge b-next">NEXT · 3</span>
            <span className="badge b-later">LATER · 6</span>
            <span className="badge b-ent">ENTERPRISE · 4</span>
          </div>
          <div className="roadmap">
            {rows.map((r) => (
              <div className="roadmap-row" key={r.spec}>
                <span className="spec">SPEC {r.spec}</span>
                <span>
                  {r.s === "done" && <span className="badge b-done">DONE</span>}
                  {r.s === "next" && <span className="badge b-next">NEXT</span>}
                  {r.s === "later" && <span className="badge b-later">LATER</span>}
                </span>
                <div>
                  <div className="title">{r.t}</div>
                  <div className="desc">{r.d}</div>
                </div>
                <div className={`right ${r.s}`}>
                  {r.tag === "enterprise"
                    ? <span className="badge b-ent">ENTERPRISE</span>
                    : <Icon name="arrow-right" size={14} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="rule"><span className="n">06</span> Changelog</div>
          <div className="section-head">
            <h2>Recent <span className="serif">shipped.</span></h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { v: "v0.1.0-rc.4", d: "Block style controls: draggable panel, TW presets, responsive breakpoints, copy/paste." },
              { v: "v0.1.0-rc.3", d: "Marketing site (this site). Server-side prefetch across all public + admin routes." },
              { v: "v0.1.0-rc.2", d: "Globals (defineGlobal) with draft-aware queries. Icon picker field (Lucide search)." },
              { v: "v0.1.0-rc.1", d: "16-field schema freeze. Tabs field. Color field (OKLCH + theme tokens)." },
            ].map((c) => (
              <div key={c.v} style={{
                display: "grid", gridTemplateColumns: "160px 1fr",
                gap: 20, padding: "14px 0",
                borderBottom: "1px dashed var(--line)",
              }}>
                <span style={{ fontFamily: "var(--vex-font-mono)", fontSize: 12, color: "var(--accent)" }}>{c.v}</span>
                <span style={{ fontSize: 14, color: "var(--fg)" }}>{c.d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA onNavigate={onNavigate} />
      <Footer />
    </>
  );
}

// ─── CTA band ─────────────────────────────────────────────────────────────
function CTA({ onNavigate }) {
  return (
    <section className="cta-band">
      <div className="glow" />
      <div className="container">
        <div className="inner">
          <h2>Start with a schema. <span className="serif">Ship in an hour.</span></h2>
          <p>Scaffold a Next.js + Convex + Vex project with authentication, the
          admin panel, and a sample marketing site preconfigured.</p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Install />
            <a className="btn outline lg" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.("features"); }}>
              Read the docs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Site router
// ─────────────────────────────────────────────────────────────────────────
function Site({ variant = "A", startPage = "home", tagline = "tagline", fullHeight = false, vp = "desktop" }) {
  const [page, setPage] = useState(startPage);

  // Scroll the shell's internal content to top on nav (not the canvas).
  const shellRef = React.useRef(null);
  const navigate = (p) => {
    setPage(p);
    requestAnimationFrame(() => {
      const el = shellRef.current?.querySelector(".www-shell");
      if (el) el.scrollTop = 0;
    });
  };

  let content;
  if (page === "home") {
    if (variant === "A") content = <HomeA onNavigate={navigate} tagline={tagline} />;
    else if (variant === "B") content = <HomeB onNavigate={navigate} tagline={tagline} />;
    else content = <HomeC onNavigate={navigate} tagline={tagline} />;
  } else if (page === "features") {
    content = <FeaturesPage onNavigate={navigate} />;
  } else if (page === "pricing") {
    content = <PricingPage onNavigate={navigate} />;
  } else if (page === "roadmap") {
    content = <RoadmapPage onNavigate={navigate} />;
  }

  // Full-height mode: don't render the .www-shell wrapper (the FullPage
  // component provides its own .www-shell-full wrapper to allow natural height).
  if (fullHeight) {
    return (
      <div ref={shellRef} data-vp={vp}>
        <Nav page={page} onNavigate={navigate} />
        {content}
      </div>
    );
  }

  return (
    <div ref={shellRef}>
      <Page page={page} onNavigate={navigate} vp={vp}>
        {content}
      </Page>
    </div>
  );
}

Object.assign(window, { Site });
