/* global React */
/* VexCMS shared primitives — wordmark, lightning glyph, lucide icon helper, sample data */

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext, Fragment } = React;

/* ──────────────────────────────────────────────────────────────
   Lightning bolt that replaces the / stroke of the x in VexCMS
   The x is built as: backslash (text) + lightning (orange) + nothing
   We render Vex + custom-x + CMS so the bolt is a real SVG.
   ────────────────────────────────────────────────────────────── */
function LightningBolt({ size = 14, className = "" }) {
  return (
    <svg
      className={className}
      width={size} height={size * 1.15}
      viewBox="0 0 14 16" fill="none"
      style={{ display: "inline-block", verticalAlign: "-0.18em", flex: "0 0 auto" }}
      aria-hidden="true"
    >
      <path
        d="M9 0.5 L1 9.5 L6 9.5 L4 15.5 L13 6 L8 6 L9 0.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* Wordmark: VexCMS where the V is rendered in Ember orange. Clean, legible
   at every size. Geist 700, tight tracking. */
function VexWordmark({ size = 15 }) {
  return (
    <span
      className="vex-wordmark"
      style={{
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.025em",
        fontWeight: 700,
      }}
    >
      <span style={{ color: "var(--accent)" }}>V</span>
      <span>exCMS</span>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   Tiny inline lucide-ish icon set. Stroke = currentColor.
   ────────────────────────────────────────────────────────────── */
const ICONS = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35",
  plus: "M12 5v14 M5 12h14",
  x: "M18 6 6 18 M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  chevDown: "m6 9 6 6 6-6",
  chevRight: "m9 18 6-6-6-6",
  chevLeft: "m15 18-6-6 6-6",
  chevUp: "m18 15-6-6-6 6",
  chevsUpDown: "m7 15 5 5 5-5 M7 9l5-5 5 5",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  filter: "M3 6h18 M7 12h10 M10 18h4",
  sort: "m3 16 4 4 4-4 M7 20V4 M21 8l-4-4-4 4 M17 4v16",
  layout: "M3 3h7v18H3z M14 3h7v9h-7z M14 14h7v7h-7z",
  layers: "m12 2 9 4-9 4-9-4 9-4Z M3 12l9 4 9-4 M3 18l9 4 9-4",
  fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  fileEdit: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8 M14 2v6h6 M18 13.5l4 4-4 4-4 1 1-4 3-5Z",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6",
  database: "M21 5c0 1.7-4 3-9 3s-9-1.3-9-3 4-3 9-3 9 1.3 9 3Z M21 5v6c0 1.7-4 3-9 3s-9-1.3-9-3V5 M21 11v6c0 1.7-4 3-9 3s-9-1.3-9-3v-6",
  newspaper: "M4 22h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z M16 6h2 M16 10h2 M16 14h2 M6 6h6v8H6z M6 18h12",
  image: "M3 3h18v18H3z M8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z m12 8-5-5L5 19",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  panelLeft: "M3 3h18v18H3z M9 3v18",
  panelRight: "M3 3h18v18H3z M15 3v18",
  panel: "M3 3h18v18H3z",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  externalLink: "M15 3h6v6 M10 14 21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  calendar: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  hash: "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
  type: "M4 7V5h16v2 M9 21h6 M12 5v16",
  toggleRight: "M16 4H8a8 8 0 0 0 0 16h8a8 8 0 0 0 0-16Z M16 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  list: "M3 6h18 M3 12h18 M3 18h18",
  dot: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  copy: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6v4H9z",
  arrowUpDown: "m21 16-4 4-4-4 M17 20V4 M3 8l4-4 4 4 M7 4v16",
  arrowDown: "m19 12-7 7-7-7 M12 5v14",
  arrowUp: "m5 12 7-7 7 7 M12 19V5",
  eye: "M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff: "M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 8 10 8a17 17 0 0 1-3 4 M6.6 6.6A17 17 0 0 0 2 12s4 8 10 8a9 9 0 0 0 5.4-1.6 M14.1 14.1a3 3 0 1 1-4.2-4.2 M2 2l20 20",
  bolt: "m13 2-9 13h7l-2 7 9-13h-7z",
  command: "M18 3h-3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z M17 21v-8H7v8 M7 3v5h8",
  refresh: "M21 12a9 9 0 1 1-3-6.7L21 8 M21 3v5h-5",
  zap: "M13 2 3 14h7l-1 8 10-12h-7z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z",
  alertCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 8v4 M12 16h.01",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 16v-4 M12 8h.01",
  helpCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3 M12 17h.01",
  archive: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3z M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8 M10 12h4",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2 M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0",
  send: "m22 2-7 20-4-9-9-4z M22 2 11 13",
  drag: "M10 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M14 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M10 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M14 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M10 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M14 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  loader: "M12 2v4 M16.24 7.76l2.83-2.83 M18 12h4 M16.24 16.24l2.83 2.83 M12 18v4 M7.76 16.24l-2.83 2.83 M6 12H2 M7.76 7.76 4.93 4.93",
  star: "m12 2 3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z",
  cloud: "M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 5 17.5",
  trendUp: "m23 6-9.5 9.5-5-5L1 18 M17 6h6v6",
  caretDown: "M6 9l6 6 6-6",
};
function Icon({ name, size = 14, className = "", style, strokeWidth }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      className={className}
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth || 1.75}
      strokeLinecap="round" strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   Field type registry — icon + label
   ────────────────────────────────────────────────────────────── */
const FIELD_TYPES = {
  text:         { icon: "type",       label: "Text"       },
  number:       { icon: "hash",       label: "Number"     },
  checkbox:     { icon: "toggleRight",label: "Checkbox"   },
  select:       { icon: "list",       label: "Select"     },
  date:         { icon: "calendar",   label: "Date"       },
  url:          { icon: "link",       label: "URL"        },
  relationship: { icon: "layers",     label: "Relationship" },
};

/* ──────────────────────────────────────────────────────────────
   Sample data — pages, posts, authors, media (matches www site)
   ────────────────────────────────────────────────────────────── */
const COLLECTIONS = [
  { slug: "pages",   label: "Pages",   icon: "fileText",   count: 14 },
  { slug: "posts",   label: "Posts",   icon: "newspaper",  count: 47 },
  { slug: "authors", label: "Authors", icon: "users",      count: 8  },
  { slug: "media",   label: "Media",   icon: "image",      count: 132},
];

const AUTHORS = [
  { id: "a_01", name: "Lena Park",       email: "lena@vexcms.dev",     handle: "lena",       initials: "LP" },
  { id: "a_02", name: "Marcus Field",    email: "marcus@vexcms.dev",   handle: "marcus",     initials: "MF" },
  { id: "a_03", name: "Yuki Tanaka",     email: "yuki@vexcms.dev",     handle: "yuki",       initials: "YT" },
  { id: "a_04", name: "Sven Holm",       email: "sven@vexcms.dev",     handle: "sven",       initials: "SH" },
  { id: "a_05", name: "Priya Mehra",     email: "priya@vexcms.dev",    handle: "priya",      initials: "PM" },
  { id: "a_06", name: "Adaeze Okafor",   email: "adaeze@vexcms.dev",   handle: "adaeze",     initials: "AO" },
  { id: "a_07", name: "Theo Cardoso",    email: "theo@vexcms.dev",     handle: "theo",       initials: "TC" },
  { id: "a_08", name: "Camille Rousseau",email: "camille@vexcms.dev",  handle: "camille",    initials: "CR" },
];

const MEDIA = [
  { id: "m_01", filename: "hero-grid-dark.png",   size: "248 KB", w: 1920, h: 1080 },
  { id: "m_02", filename: "ember-glyph.svg",      size: "4 KB",   w: 256,  h: 256  },
  { id: "m_03", filename: "team-offsite-2025.jpg",size: "1.4 MB", w: 2400, h: 1600 },
  { id: "m_04", filename: "schema-diagram.png",   size: "92 KB",  w: 1200, h: 800  },
  { id: "m_05", filename: "founder-portrait.jpg", size: "612 KB", w: 1600, h: 1600 },
];

const POSTS = [
  { id: "p_01", title: "Why we built VexCMS on Convex",        slug: "why-vexcms-convex",     status: "published", author: "a_01", featured: true,  views: 4820, publishedAt: "2025-04-08", updatedAt: "2025-04-09" },
  { id: "p_02", title: "Reactive content, no rebuild step",     slug: "reactive-content",      status: "published", author: "a_02", featured: false, views: 2104, publishedAt: "2025-04-02", updatedAt: "2025-04-02" },
  { id: "p_03", title: "Stark × Ember — the design system",     slug: "stark-ember-system",    status: "published", author: "a_03", featured: true,  views: 1890, publishedAt: "2025-03-28", updatedAt: "2025-04-01" },
  { id: "p_04", title: "Schemas as the source of truth",        slug: "schemas-source-truth",  status: "draft",     author: "a_01", featured: false, views: 0,    publishedAt: null,         updatedAt: "2025-04-12" },
  { id: "p_05", title: "Migrating off Sanity in a weekend",     slug: "migrating-off-sanity",  status: "published", author: "a_04", featured: false, views: 3402, publishedAt: "2025-03-21", updatedAt: "2025-03-22" },
  { id: "p_06", title: "Relationship fields, finally clean",    slug: "relationship-fields",   status: "draft",     author: "a_02", featured: false, views: 0,    publishedAt: null,         updatedAt: "2025-04-14" },
  { id: "p_07", title: "Type-safe content from schema to view", slug: "type-safe-content",     status: "published", author: "a_05", featured: false, views: 2816, publishedAt: "2025-03-10", updatedAt: "2025-03-12" },
  { id: "p_08", title: "Live preview with zero config",         slug: "live-preview",          status: "scheduled", author: "a_03", featured: false, views: 0,    publishedAt: "2025-04-20", updatedAt: "2025-04-13" },
  { id: "p_09", title: "Why we don't use a queue",              slug: "no-queue",              status: "archived",  author: "a_06", featured: false, views: 488,  publishedAt: "2024-11-04", updatedAt: "2025-01-14" },
  { id: "p_10", title: "Building an admin that respects you",   slug: "admin-respects",        status: "draft",     author: "a_07", featured: false, views: 0,    publishedAt: null,         updatedAt: "2025-04-15" },
];

const PAGES = [
  { id: "pg_01", title: "Home",            slug: "/",          status: "published", author: "a_01", updatedAt: "2025-04-12" },
  { id: "pg_02", title: "Pricing",         slug: "/pricing",   status: "published", author: "a_01", updatedAt: "2025-04-10" },
  { id: "pg_03", title: "Docs",            slug: "/docs",      status: "published", author: "a_03", updatedAt: "2025-04-09" },
  { id: "pg_04", title: "Changelog",       slug: "/changelog", status: "published", author: "a_02", updatedAt: "2025-04-13" },
  { id: "pg_05", title: "Roadmap (2026)",  slug: "/roadmap",   status: "draft",     author: "a_01", updatedAt: "2025-04-15" },
];

/* Make these globally available to other JSX files */
Object.assign(window, {
  React, useState, useEffect, useRef, useMemo, useCallback, createContext, useContext, Fragment,
  LightningBolt, VexWordmark, Icon, ICONS,
  FIELD_TYPES, COLLECTIONS, AUTHORS, MEDIA, POSTS, PAGES,
});
