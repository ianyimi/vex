---
"@vexcms/react": patch
"create-vexcms": patch
---

Three small fixes found while dogfooding a live scaffold post-alpha.4.

`FilledInput`'s per-item remove button now respects the upload field's
`readOnly` config (`disabled={readOnly || Boolean(accessError)}`) instead of
only disabling on an access error — collection views that mark the field
read-only could still delete uploaded media.

`AccordionTrigger`'s `postIconChildren` now render as a `Header` sibling
instead of nested inside `AccordionPrimitive.Trigger`. The Trigger renders a
native `<button>`, so a `<Button>` (or other interactive element) passed as
`postIconChildren` produced invalid `<button>` nesting and a hydration error;
moving it outside also drops the need for `e.stopPropagation()` to keep the
action clickable without toggling the accordion.

`create-vexcms`'s `base-nextjs` template auto-derives `next.config.ts`'s
`images.remotePatterns` Convex hostname from `NEXT_PUBLIC_CONVEX_URL` instead
of leaving a commented-out placeholder for the developer to fill in by hand;
falls back to an empty list when the URL is unset or unparsable (e.g. a
deployment-less build with `SKIP_ENV_VALIDATION`).
