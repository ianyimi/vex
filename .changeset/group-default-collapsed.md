---
"@vexcms/core": minor
"@vexcms/react": patch
---

`group()`'s top-level `defaultOpen` is replaced by `admin.defaultCollapsed`, mirroring
`blocks()`' option of the same name (and Payload's) so every collapsible field in a config
reads the same way. The default is `false` — a group is expanded on load, and `true` is the
opt-in for secondary or rarely-edited groups.

**Read access no longer disables form navigation.** `FormGroup` and `FormBlocks` passed
`readOnly` into `AccordionItem`'s own `disabled` prop, so a caller holding read but not write
access could not expand a `group`, `array` or `blocks` field to see values it was allowed to
read. Collapsing is navigation, not editing — add/remove buttons, drag handles, the
`blockName` input and every sub-field remain gated. `runNestedFieldContainerSuite` now pins
this for all three containers across every child field type.

**The accordion no longer flashes open on page load.** `AccordionContent` animates with a CSS
transition on its inner wrapper's height, driven by Base UI's `data-starting-style`/
`data-ending-style` and `--accordion-panel-height`, instead of the `animate-accordion-*`
keyframes — which animated toward `--radix-accordion-content-height` and its Bits/Reka/Kobalte
fallbacks, none of which Base UI sets. A panel that mounts open is now simply open. The
trade-off: the open/close toggle is instant rather than animated. Restoring the animation
requires keyframes defined against `--accordion-panel-height`.

BREAKING CHANGE: `group()` no longer accepts a top-level `defaultOpen`. Use
`admin.defaultCollapsed`, whose meaning is inverted — `defaultOpen: false` becomes
`admin.defaultCollapsed: true`, and omitting it leaves the group expanded as before.
