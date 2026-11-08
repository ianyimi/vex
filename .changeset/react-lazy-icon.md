---
"@vexcms/react": patch
---

**Root `Icon` loads icons on demand instead of bundling all 1703 of `lucide-react`'s icon components.**
Every page that renders an `Icon` by name — directly, or through a collection's `admin.icon`, a block's
`icon` field, or `Button`'s own `icon` prop — used to pull in every icon lucide-react ships (505 KB). `Icon`
now resolves the name to `lucide-react/dynamic`'s on-demand import and reserves the loaded icon's exact box
with a placeholder `<svg>` while it loads, so nothing shifts. A new `isIconName(name): name is IconName`
export lets a caller holding untyped data (CMS content, a block field) check a name before rendering it,
the same guard `Icon` applies internally.

The admin panel uses the same lazy `Icon` everywhere, including its own sidebar, collection/global
icons, field previews, and menu-item icons — there is no separate eager admin icon component.

**Migration:** nothing for root `Icon` callers — same props, same `null`-on-unknown-name fallback, same
one-warning-per-name behavior; the only visible difference is a brief placeholder box before an icon paints.
A caller doing `icons[name]` directly against `lucide-react` to render a CMS-driven icon (as `Features`/`HowItWorks`/`Footer`/`Split`
block renderers do) should switch to `Icon` + `isIconName` to get the same lazy loading.

**Server-resolved icon nodes for first paint.** `resolveIconNodes`, exported from `@vexcms/react/server`,
resolves a set of icon names to lucide's serializable `IconNode`s on the server. A new `IconNodeProvider`
(and its `IconNodeMap` type), both exported from the root, hands those nodes to every `Icon` beneath it;
`Icon` now checks that provider first and renders a matching node synchronously — real SVG in the server
HTML, no request — before falling back to the lazy `DynamicIcon` path above for any name the server never
saw (live-preview edits, client-only data). A route that already collects the documents it renders can
resolve their icons once and wrap its tree: `IconNodeProvider` merges with any parent provider, so a
layout-level map (header/footer icons) and a page-level map (block icons) compose without either
overwriting the other.
