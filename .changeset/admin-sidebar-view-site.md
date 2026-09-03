---
"@vexcms/react": patch
---

`AppSidebar` now renders a "View site" button next to the theme toggle in the
admin sidebar header.

The panel is mounted under `basePath` inside the host app, so the site it
manages is always at `/` — there was no way back out to it from inside the
panel short of editing the URL by hand. The button links there with lucide's
`ExternalLink` at `size="icon"` `variant="outline"`, matching `ThemeToggle`'s
box exactly so the pair reads as one control group.

It uses the established anchor-as-button pattern from `CollectionListView` —
`nativeButton={false}` plus `render={<VexLink href="/" />}` — so the framework
`Link` from `FrameworkComponentsContext` handles the navigation and Base UI
emits `aria-disabled` rather than the `disabled` attribute, which is what
`buttonVariants` actually styles. The label is `sr-only`; nothing in the
header's 12px row grows.
