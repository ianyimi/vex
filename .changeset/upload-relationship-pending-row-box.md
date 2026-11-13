---
"@vexcms/react": patch
---

Fixed layout shift on edit-view refresh for `upload`/`relationship` fields (single and
`hasMany`), verified live against `apps/test`: the pending-row skeleton no longer resizes once
the referenced document loads.

`FilePreview`'s `mediaDoc` prop is now optional — passing no doc (or `isPending`) renders its
existing spinner through the exact same sized/radius'd wrapper box the settled thumbnail uses,
instead of callers keeping a second, hand-sized `<Skeleton>` in sync with it. `UploadItemRow`
had drifted to `h-12 w-12` (48px) for that second skeleton against the real thumbnail's
`size={44}` (44px) — a real, reported 4px shift on every upload row once its media doc
resolved. It now renders `FilePreview` unconditionally (pending or settled) for an always-
identical box (measured live: 48px row height, zero delta across reload), and its
filename/mimetype/ALT-tag skeletons reuse the settled row's exact wrapper classes (`truncate
text-sm`/`text-xs`, the real `@lg/form`-responsive ALT wrapper, the real `InputTag`), with
`inline-block` skeleton placeholders so each line's height comes from the same
`text-sm`/`text-xs` font-metric strut the real text uses — never a separately maintained pixel
guess.

`RelationshipItemRow`'s pending state previously reserved a `h-10 w-10` square thumbnail slot
that the settled row never actually has (relationship rows render title/updated-at text only,
no image) — a layout shift in both directions depending on content length. It now renders the
same `flex flex-col py-1.5` text box in both states, with the collection icon (config-known,
not document-dependent) rendered for real pre-resolve too, and the title/updated-at lines'
presence driven by the same config-known slots. The title skeleton mirrors the settled `Default
RelationshipPreview`'s exact nesting — an outer `truncate` span wrapping an inner `text-[13px]`
span — rather than flattening both classes onto one span: live measurement caught that the
flattened version's "normal" line-height strut measured ~4.5px shorter at that different
nesting depth, a residual shift the structural fix removes (measured live: 56px row height,
zero delta across reload).

`RelationshipDocumentList`'s (the relationship picker's search-results tab) pending rows
carried an unrelated `h-10` skeleton bar against the real `py-1.5`/`text-[13px]` button rows —
fixed the same way, reusing the real row's shell classes and `hasMany` checkbox box.
