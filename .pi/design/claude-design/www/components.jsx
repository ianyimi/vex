/* global React */
// VexCMS marketing — shared components
// Nav, footer, logo, code blocks, admin mockup, reactivity demo, install card.

const { useState, useEffect, useRef } = React;

// ─── Logo ────────────────────────────────────────────────────────────────
function Logo({ size = 20, withWordmark = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg
        className="logo-mark"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 8 L16 24 L28 8"
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {withWordmark && (
        <span
          style={{
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "-0.015em",
            color: "var(--fg)",
          }}
        >
          VexCMS
        </span>
      )}
    </span>
  );
}

// ─── Icon helper ──────────────────────────────────────────────────────────
function Icon({ name, size }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || ref.current.dataset.lucideRendered) return;
    try {
      if (window.lucide?.createIcons) {
        window.lucide.createIcons({ nameAttr: "data-lucide", attrs: { "stroke-width": 1.75 } });
        ref.current.dataset.lucideRendered = "1";
      }
    } catch (e) { /* icon missing — render nothing */ }
  }, [name]);
  const style = size ? { width: size, height: size } : undefined;
  return <i ref={ref} data-lucide={name} style={style} />;
}

// Inline brand marks (Lucide's CDN build drops brand icons)
function BrandIcon({ name, size = 14 }) {
  if (name === "github") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.01c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.26 5.68.41.35.78 1.05.78 2.12v3.15c0 .31.21.67.8.56A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  );
  if (name === "twitter") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.84l-5.36-7.02L4.6 22H1.34l8.04-9.19L1 2h7.01l4.84 6.4L18.244 2zm-1.2 18h1.89L7.08 4H5.08l11.96 16z"/>
    </svg>
  );
  if (name === "discord") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.37A19.8 19.8 0 0016.56 3l-.17.3a14.6 14.6 0 00-4.78 0L11.44 3a19.8 19.8 0 00-3.76 1.37C4.48 8.93 3.7 13.35 4.08 17.72a19.9 19.9 0 006.04 3.05l.54-.75c-.97-.35-1.9-.8-2.78-1.33.23-.17.46-.34.68-.52a14.2 14.2 0 0012.88 0l.68.52c-.88.53-1.81.98-2.78 1.33l.54.75a19.9 19.9 0 006.04-3.05c.45-5.07-.77-9.45-3.6-13.35zM9.55 15.46c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43s2.17 1.1 2.15 2.43c0 1.33-.95 2.42-2.15 2.42zm4.9 0c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43s2.17 1.1 2.15 2.43c0 1.33-.95 2.42-2.15 2.42z"/>
    </svg>
  );
  return null;
}

// ─── Nav ──────────────────────────────────────────────────────────────────
function Nav({ page = "home", onNavigate }) {
  const items = [
    { id: "home", label: "Home" },
    { id: "features", label: "Features" },
    { id: "pricing", label: "Pricing" },
    { id: "roadmap", label: "Roadmap" },
  ];
  return (
    <nav className="nav">
      <a
        className="brand"
        href="#home"
        onClick={(e) => { e.preventDefault(); onNavigate?.("home"); }}
      >
        <Logo size={20} />
        <span className="sub">v0.1</span>
      </a>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={`item ${page === i.id ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); onNavigate?.(i.id); }}
            >
              {i.label}
            </a>
          </li>
        ))}
        <li>
          <a className="item" href="#docs" onClick={(e) => e.preventDefault()}>Docs</a>
        </li>
        <li>
          <a className="item" href="#changelog" onClick={(e) => e.preventDefault()}>Changelog</a>
        </li>
      </ul>
      <div className="spacer" />
      <button className="menu-btn" type="button" aria-label="Open menu" onClick={(e) => e.preventDefault()}>
        <Icon name="menu" size={16} />
      </button>
      <a className="cta" href="#github" onClick={(e) => e.preventDefault()}>
        <BrandIcon name="github" size={12} />
        <span>github.com/vexcms</span>
        <span style={{ color: "var(--fg-subtle)", marginLeft: 4 }}>· 2.4k</span>
      </a>
      <a className="btn outline" href="#admin" onClick={(e) => e.preventDefault()} style={{ height: 32, padding: "0 12px", fontSize: 12 }}>
        Sign in
      </a>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div className="brand-col">
            <Logo size={22} />
            <p>
              The Convex-native CMS. Real-time content, type-safe by default.
              MIT licensed, free forever.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <a className="btn ghost" href="#" onClick={(e) => e.preventDefault()} style={{ padding: "0 8px", height: 28 }}>
                <BrandIcon name="github" size={13} />
              </a>
              <a className="btn ghost" href="#" onClick={(e) => e.preventDefault()} style={{ padding: "0 8px", height: 28 }}>
                <BrandIcon name="twitter" size={13} />
              </a>
              <a className="btn ghost" href="#" onClick={(e) => e.preventDefault()} style={{ padding: "0 8px", height: 28 }}>
                <BrandIcon name="discord" size={13} />
              </a>
            </div>
          </div>
          <div className="col">
            <h4>Product</h4>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Roadmap</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div className="col">
            <h4>Developers</h4>
            <ul>
              <li><a href="#">Docs</a></li>
              <li><a href="#">Quickstart</a></li>
              <li><a href="#">API reference</a></li>
              <li><a href="#">GitHub</a></li>
            </ul>
          </div>
          <div className="col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Sponsors</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">MIT License</a></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="baseline">
          <span>© 2026 VexCMS · MIT License</span>
          <span className="live">
            <span className="pulse" /> status · all systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Install card ────────────────────────────────────────────────────────
function Install({ cmd = "pnpm create vexcms@latest" }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="install">
      <span className="prompt">$</span>
      <span>{cmd}</span>
      <button
        className={`copy ${copied ? "ok" : ""}`}
        onClick={() => {
          navigator.clipboard?.writeText(cmd);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        aria-label="Copy install command"
      >
        <Icon name={copied ? "check" : "copy"} />
      </button>
    </div>
  );
}

// ─── Code block (simple syntax highlighting via token spans) ─────────────
function CodeBlock({ filename, meta, children, height }) {
  return (
    <div className="codecard" style={height ? { height } : undefined}>
      <div className="head">
        <span className="dots"><span /><span /><span /></span>
        <span className="fname">{filename}</span>
        {meta && <span className="meta">{meta}</span>}
      </div>
      <div className="body">
        <pre>{children}</pre>
      </div>
    </div>
  );
}

// Helpers to build syntax-highlighted JSX tokens without a library.
const T = {
  k: (s) => <span className="tok-key">{s}</span>,
  f: (s) => <span className="tok-fn">{s}</span>,
  s: (s) => <span className="tok-str">{s}</span>,
  n: (s) => <span className="tok-num">{s}</span>,
  c: (s) => <span className="tok-com">{s}</span>,
  p: (s) => <span className="tok-pun">{s}</span>,
  t: (s) => <span className="tok-type">{s}</span>,
};

// ─── Sample schema code (hero main sample) ────────────────────────────────
function SchemaSample() {
  return (
    <CodeBlock filename="collections/posts.ts" meta="TYPESCRIPT">
      <>{T.k("import")} {"{ "}{T.f("defineCollection")}{", "}{T.f("text")}{", "}{T.f("richtext")}{", "}{T.f("select")}{", "}{T.f("relationship")}{" }"} {T.k("from")} {T.s("\"@vexcms/core\"")}{";"}{"\n\n"}
      {T.k("export const")} {T.f("posts")} {"= "}{T.f("defineCollection")}{"({"}{"\n"}
      {"  "}slug{": "}{T.s("\"posts\"")}{","}{"\n"}
      {"  "}fields{": {"}{"\n"}
      {"    "}title{":  "}{T.f("text")}{"({ "}required{": "}{T.k("true")}{" }),"}{"\n"}
      {"    "}slug{":   "}{T.f("text")}{"({ "}index{": "}{T.s("\"by_slug\"")}{" }),"}{"\n"}
      {"    "}author{": "}{T.f("relationship")}{"({ "}to{": "}{T.s("\"users\"")}{" }),"}{"\n"}
      {"    "}status{": "}{T.f("select")}{"({"}{"\n"}
      {"      "}options{": ["}{T.s("\"draft\"")}{", "}{T.s("\"published\"")}{"],"}{"\n"}
      {"      "}defaultValue{": "}{T.s("\"draft\"")}{","}{"\n"}
      {"    }),"}{"\n"}
      {"    "}content{": "}{T.f("richtext")}{"({ "}mediaCollection{": "}{T.s("\"media\"")}{" }),"}{"\n"}
      {"  }"}{","}{"\n"}
      {"  "}versions{": { "}drafts{": "}{T.k("true")}{", "}autosave{": "}{T.k("true")}{" },"}{"\n"}
      {"});"}{"\n\n"}
      {T.c("// Generated at save — fully typed.")}{"\n"}
      {T.k("type")} {T.t("Post")} {"= "}{T.t("Doc")}{"<"}{T.s("\"posts\"")}{">;"}{"\n"}
      </>
    </CodeBlock>
  );
}

// Smaller "types derived" code — used in the "type-safe by default" panel.
function QuerySample() {
  return (
    <CodeBlock filename="app/blog/[slug].tsx" meta="TYPESCRIPT · REACT">
      <>
      {T.k("const")} post {"= "}{T.f("useQuery")}{"(api."}{T.f("posts")}{"."}{T.f("getBySlug")}{", {"}{"\n"}
      {"  "}slug{",\n"}
      {"});"}{"\n\n"}
      {T.c("//    ^? Post | null | undefined")}{"\n"}
      {T.c("//       Fully typed. Live-subscribed.")}{"\n"}
      {T.c("//       No API client. No fetch layer.")}{"\n\n"}
      {T.k("if")} (post === {T.k("undefined")}) {T.k("return")} {"<"}{T.t("Skeleton")} {"/>;"}{"\n"}
      {T.k("if")} (post === {T.k("null")}) {T.f("notFound")}{"();"}{"\n\n"}
      {T.k("return")} {"<"}{T.t("Article")} post{"={post} />;"}
      </>
    </CodeBlock>
  );
}

// ─── Admin panel mockup (uses the copied screenshot) ─────────────────────
// Faithful HTML/CSS recreation of the admin panel — uses the SAME tokens
// as the marketing site (Ember accent, Stark sharp radii, Geist, mono
// neutrals). No screenshots — so it never falls out of sync with theme.
function AdminMockup() {
  const rows = [
    { title: "Introducing VexCMS",            slug: "introducing-vexcms",          status: "Published", author: "Alex Morgan",  updated: "2m ago"  },
    { title: "Schema-first content modeling", slug: "schema-first",                status: "Published", author: "Riley Chen",   updated: "1h ago"  },
    { title: "Real-time previews, end-to-end",slug: "real-time-previews",          status: "Draft",     author: "Alex Morgan",  updated: "3h ago"  },
    { title: "RBAC done right",               slug: "rbac-done-right",             status: "Draft",     author: "Sam Park",     updated: "yesterday"},
    { title: "Migrations without downtime",   slug: "migrations-without-downtime", status: "Scheduled", author: "Riley Chen",   updated: "2d ago"  },
    { title: "Type-safe field inputs",        slug: "type-safe-field-inputs",      status: "Published", author: "Sam Park",     updated: "3d ago"  },
  ];
  const collections = [
    { icon: "file-text",     label: "Posts",        count: 24, active: true  },
    { icon: "users",         label: "Authors",      count: 8,  active: false },
    { icon: "tag",           label: "Categories",   count: 12, active: false },
    { icon: "image",         label: "Media",        count: 86, active: false },
    { icon: "settings",      label: "Settings",     count: null, active: false },
  ];
  return (
    <div className="admin-mock">
      <div className="chrome">
        <span className="dot" /><span className="dot" /><span className="dot" />
        <span className="url">vexcms.dev / admin / posts</span>
        <span className="live-chip"><span className="pulse" /> convex · connected</span>
      </div>
      <div className="admin-body">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <Logo size={16} />
          </div>
          <div className="admin-nav-label">Collections</div>
          <ul className="admin-nav">
            {collections.map((c) => (
              <li key={c.label} className={c.active ? "active" : ""}>
                <Icon name={c.icon} size={14} />
                <span className="lbl">{c.label}</span>
                {c.count != null && <span className="count">{c.count}</span>}
              </li>
            ))}
          </ul>
          <div className="admin-nav-label" style={{ marginTop: 18 }}>System</div>
          <ul className="admin-nav">
            <li><Icon name="key-round" size={14} /><span className="lbl">API keys</span></li>
            <li><Icon name="git-branch" size={14} /><span className="lbl">Versions</span></li>
            <li><Icon name="webhook" size={14} /><span className="lbl">Webhooks</span></li>
          </ul>
        </aside>
        <div className="admin-main">
          <div className="admin-topbar">
            <div className="admin-crumb">
              <span className="muted">Posts</span>
              <span className="sep">/</span>
              <span>All posts</span>
            </div>
            <div className="admin-actions">
              <span className="admin-search">
                <Icon name="search" size={12} />
                <span>Search posts…</span>
                <span className="kbd">⌘K</span>
              </span>
              <span className="btn primary sm">
                <Icon name="plus" size={12} /> New post
              </span>
            </div>
          </div>
          <div className="admin-page">
            <div className="admin-page-head">
              <div>
                <h3>Posts</h3>
                <p>24 documents · 6 drafts · last edit 2m ago</p>
              </div>
              <div className="admin-filters">
                <span className="chip active">All</span>
                <span className="chip">Drafts</span>
                <span className="chip">Published</span>
                <span className="chip">Scheduled</span>
              </div>
            </div>
            <div className="admin-table">
              <div className="admin-thead">
                <span>Title</span>
                <span>Status</span>
                <span>Author</span>
                <span>Updated</span>
              </div>
              {rows.map((r) => (
                <div key={r.slug} className="admin-tr">
                  <span className="cell-title">
                    <Icon name="file-text" size={13} />
                    <span>
                      <span className="t">{r.title}</span>
                      <span className="s">/{r.slug}</span>
                    </span>
                  </span>
                  <span>
                    <span className={
                      "badge " +
                      (r.status === "Published" ? "success" :
                       r.status === "Draft" ? "secondary" : "warning")
                    }>
                      <span className="dot" />
                      {r.status}
                    </span>
                  </span>
                  <span className="cell-muted">{r.author}</span>
                  <span className="cell-muted">{r.updated}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reactivity demo (auto-flashes fields to show live subscription) ─────
function ReactivityDemo() {
  const [tick, setTick] = useState(0);
  const [data, setData] = useState({
    title: "Introducing VexCMS",
    status: "draft",
    author: "Alex Morgan",
    updatedAt: "just now",
    _version: 3,
  });
  const [flashKey, setFlashKey] = useState(null);

  useEffect(() => {
    const sequence = [
      { key: "status", val: "published", wait: 2800 },
      { key: "_version", val: 4, wait: 1700 },
      { key: "updatedAt", val: "2s ago", wait: 2200 },
      { key: "title", val: "Introducing VexCMS — v0.1", wait: 2500 },
      { key: "_version", val: 5, wait: 1700 },
      { key: "status", val: "draft", wait: 2200 },
      { key: "author", val: "Riley Chen", wait: 2500 },
      { key: "_version", val: 6, wait: 1500 },
      { key: "title", val: "Introducing VexCMS", wait: 2200 },
      { key: "status", val: "published", wait: 2200 },
      { key: "_version", val: 7, wait: 2000 },
    ];
    const step = sequence[tick % sequence.length];
    const t = setTimeout(() => {
      setData((d) => ({ ...d, [step.key]: step.val, updatedAt: "just now" }));
      setFlashKey(step.key);
      setTick((x) => x + 1);
      setTimeout(() => setFlashKey(null), 900);
    }, step.wait);
    return () => clearTimeout(t);
  }, [tick]);

  return (
    <div className="react-demo">
      <div className="panel">
        <div className="lbl"><span className="pulse" /> admin · editor</div>
        <div className="field-row">
          <div className="k">title</div>
          <div className={`v ${flashKey === "title" ? "flash" : ""}`}>{data.title}</div>
        </div>
        <div className="field-row">
          <div className="k">status</div>
          <div className={`v ${flashKey === "status" ? "flash" : ""}`}>{data.status}</div>
        </div>
        <div className="field-row">
          <div className="k">author</div>
          <div className={`v ${flashKey === "author" ? "flash" : ""}`}>{data.author}</div>
        </div>
        <div className="field-row">
          <div className="k">_version</div>
          <div className={`v ${flashKey === "_version" ? "flash" : ""}`}>{data._version}</div>
        </div>
        <div className="field-row">
          <div className="k">updatedAt</div>
          <div className={`v ${flashKey === "updatedAt" ? "flash" : ""}`}>{data.updatedAt}</div>
        </div>
      </div>
      <div className="panel">
        <div className="lbl"><span className="pulse" /> frontend · useQuery</div>
        <div className="json">
{"{\n"}
{"  "}<span className={flashKey === "title" ? "flash-line" : ""}>{`title: "${data.title}"`}</span>{",\n"}
{"  "}<span className={flashKey === "status" ? "flash-line" : ""}>{`status: "${data.status}"`}</span>{",\n"}
{"  "}<span className={flashKey === "author" ? "flash-line" : ""}>{`author: "${data.author}"`}</span>{",\n"}
{"  "}<span className={flashKey === "_version" ? "flash-line" : ""}>{`_version: ${data._version}`}</span>{",\n"}
{"  "}<span className={flashKey === "updatedAt" ? "flash-line" : ""}>{`updatedAt: "${data.updatedAt}"`}</span>{"\n"}
{"}"}
        </div>
      </div>
    </div>
  );
}

// Export all to window so pages.jsx can consume them.
Object.assign(window, {
  Logo,
  Icon,
  BrandIcon,
  Nav,
  Footer,
  Install,
  CodeBlock,
  T,
  SchemaSample,
  QuerySample,
  AdminMockup,
  ReactivityDemo,
});
