---
"@vexcms/react": patch
"@vexcms/richtext-plate": patch
---

Read-only fields now mute their filled values, matching the existing muted label treatment
(the same `opacity-50` a disabled label/input already gets). A relationship field's single
or `hasMany` item name text, an upload field's filename/alt text, a rich text field's
rendered content, a blocks field's block-type badge, and a select field's chip/tag text all
dim to `opacity-50` when their field is read-only — the relationship/upload thumbnail image
and the color field's swatch block are deliberately left untouched. The JSON/code editor's
own read-only dimming is corrected from `opacity-80` to the same `opacity-50` every other
read-only control uses. The date and color fields already muted their filled value correctly
(a `disabled`-styled native `<input>`/trigger) and needed no change.
