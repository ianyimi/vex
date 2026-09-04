---
"@vexcms/react": patch
---

The "View site" button moved from `AppSidebar`'s header into the `AdminLayout`
topbar.

The sidebar is collapsible, so the button vanished along with it whenever an
admin collapsed the sidebar to get more room — there was no way back out to
the site short of editing the URL by hand. It now lives in the topbar next to
`AdminTopNav`, positioned to the right of the breadcrumbs and before the
`SidebarTrigger`, so it stays visible regardless of sidebar state. `ThemeToggle`
stayed put in the sidebar header, which now renders just the "VexCMS Admin"
title and the toggle.

It still uses the established anchor-as-button pattern from
`CollectionListView` — `nativeButton={false}` plus `render={<VexLink href="/" />}`
— so the framework `Link` from `FrameworkComponentsContext` handles the
navigation and Base UI emits `aria-disabled` rather than the `disabled`
attribute, which is what `buttonVariants` actually styles.
