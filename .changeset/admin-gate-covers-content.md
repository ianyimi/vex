---
"@vexcms/next": patch
"create-vexcms": patch
---

`NextAdminPage`'s access gate now runs BEFORE anything streams, exactly like the existing
token check: `canAccessAdminPanel` is awaited, and a denied caller is redirected — the route
never streams any admin shell or content to them. The real shell streams exactly as it did
before this change (real title/tabs/toolbar/controls/checkboxes for an allowed caller, only
row data still resolves behind its own `<Suspense>` skeleton).

An earlier version of this change gated the content area behind a generic
`AdminContentSkeleton` instead of awaiting the check — reverted after a live review found it
made the loading state worse (layout shift, row-selection spinners, phantom skeletons,
pop-in). `AdminContentSkeleton` is deleted; there is no replacement component.
