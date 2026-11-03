# Review 3 — after Pass 2 decisions

## Summary

Open: 2 violations (richtext-plate, create-vexcms), 0 gaps. Both apply already-codified rules with a single obvious fix (no tradeoff) — recorded as `Step 26 — Pass 3 decisions`.

## core

No open violations or gaps.

## react

No open violations or gaps.

## next

No open violations or gaps.

## cli

No open violations or gaps.

## better-auth

No open violations or gaps.

## file-storage-convex

No open violations or gaps.

## richtext-plate

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| violation | react-components-pascal | packages/richtext-plate/src/editor/components/editorElements.tsx (exports HrElement, TableElement, ImageElement…) | 1 | rename to `EditorElements.tsx`; repoint importers |

## create-vexcms

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| violation | broken import / shared `cn` source | templates/marketing-site/src/components/motion-primitives/{AnimatedGroup,TextEffect}.tsx:3 import `cn` from nonexistent `~/lib/utils` | 2 | import `cn` from `@vexcms/react` like every other template component |

## apps/test

No open violations or gaps.

## apps/www

No open violations or gaps.

## apps/docs

No open violations or gaps.
