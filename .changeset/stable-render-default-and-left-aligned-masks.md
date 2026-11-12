---
"@vexcms/react": patch
---

Field `Input` overrides keep their input mounted while typing. The `renderDefault` an override
receives was a new function every render (number fields built it inline), so an override that
rendered it as JSX remounted the real input and lost focus after each keystroke. `renderDefault`
now has a stable identity for every field type and always calls the latest control, so both
`renderDefault(props)` and `<RenderDefault {...props} />` are safe.

Masked number inputs are left-aligned like unmasked ones. Inputmask's numeric aliases
(`numeric`, `decimal`, `integer`, `currency`, `percentage`) right-align by default; field masks now
pass `rightAlign: false` unless a mask's own `options` say otherwise.
