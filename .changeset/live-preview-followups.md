---
"@vexcms/core": patch
"@vexcms/react": patch
"create-vexcms": patch
---

Live preview follow-ups found in the manual verification pass.

**`useLivePreviewDocumentQuery`.** The overlay only reaches documents a consumer hands it,
and the existing `useLivePreviewQuery` sugar assumes a `getBySlug`-style array — so a
component reading a singleton through a plain `useQuery` was invisible to live preview.
Editing a `headers` document while previewing `/` changed nothing. The new sibling hook
wraps a query that already resolves to ONE document (a `getFirst`-style read or a lookup
by id), collapsing `null` into `undefined` so consumers have a single "nothing to render"
case. Exported alongside its `LivePreviewDocumentQueryResult` result type; the
`marketing-site` template's `SiteHeader` and `SiteFooter` now use it.

**`admin.livePreview.url` accepts a literal path.** A collection or global that always
previews in one place declares `url: "/"` rather than `url: () => "/"`.
`LivePreviewUrlResolver` is now declared through a method-syntax/index-access indirection
to keep `TDoc` bivariant: as a plain function type in property position it is strictly
contravariant, which stops a still-generic `CollectionConfig` assigning to the concrete
union the admin views hold, and method shorthand is not available to a member of a union.

**The selected breakpoint survives the panel closing.** It is persisted per collection or
global under `vex-live-preview-breakpoint:<slug>`, restored after mount rather than in a
`useState` initializer — the admin page is server-rendered, and reading `localStorage`
during render produced markup the server never emitted, leaving the restored button
rendered inactive on the hydration mismatch.

**The split re-measures when the preview is opened.** `useLivePreviewPanelMinSize` returned
a `RefObject` and measured in a mount-only effect, so a split that mounts later — every
time the editor opens the preview — kept the default floors. It now returns a callback ref
and keys the `ResizeObserver` effect on the measured element.

**Admin chrome.** Breadcrumbs render the collection's `admin.icon` beside its label, and
the "View site" button sits immediately left of the breadcrumbs instead of being pushed to
the opposite edge.
