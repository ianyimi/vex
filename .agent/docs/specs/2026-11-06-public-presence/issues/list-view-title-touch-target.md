title: List-view row title links are 16px-tall touch targets on mobile
labels: good first issue, type: bug, area: ui

## Context

The `useAsTitle` link in every data-table row renders at 16px tall — the text's own line box, with no
padding — well under the 44px (Apple HIG) / 48dp (Android) minimum touch-target guidance. Measured on
`/admin/pages` and `/admin/themes` at 375px and 390px widths during a mobile audit.

## Scope

Give the row title link a real touch target — padding or `min-h` on the link itself is the smallest
fix. Making the entire cell clickable is a larger change (affects desktop row density too) and is not
required for this issue.

## Acceptance criteria

- [ ] The title link's tappable area is at least 44px tall at 375px/390px viewport widths
- [ ] Desktop row height and density are visually unchanged
- [ ] A changeset is added for `@vexcms/react`

## Out of scope

Making the whole row clickable — that's a design call (row density), not a padding fix.
