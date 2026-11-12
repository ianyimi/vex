---
"@vexcms/react": patch
---

Masked number inputs no longer reset the caret to the start of the field on every keystroke.
`resolveFieldMask` resolves a brand-new (but value-equal) mask object on every render, and
`useFieldMask`'s `useCallback` depended on that object by reference — so typing into a masked
`number()` field (e.g. `admin.mask: "decimal"`) tore down and re-initialized Inputmask after each
character, which reset `selectionStart` to `0` and inserted digits at the front instead of the end.
`useFieldMask` now memoizes the mask by a serialized value key, so Inputmask only reinitializes
when the mask's actual value changes, not on every re-render.
