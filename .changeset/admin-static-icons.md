---
"@vexcms/react": patch
---

The admin panel renders icons from lucide's full icon set again instead of loading each one on
demand. On-demand loading made every admin icon flash its placeholder on page refresh.
`AdminLayout` now mounts an internal `IconComponentsProvider` with `lucide-react`'s `icons`, so
`Icon` renders the real SVG in the server HTML and on hydration. The cost is a larger `/admin`
bundle. Public pages are unchanged: they still load icons on demand, or render them from
`IconNodeProvider`, and never import the full set.

The JSON editor's loading fallback now carries `aria-required`, so a required JSON field no
longer reads as optional to assistive tech while CodeMirror loads.
