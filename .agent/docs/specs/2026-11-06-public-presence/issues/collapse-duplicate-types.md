title: Collapse duplicate exported types (VexMediaCreateMediaDocumentArgs / DraggableContextValue)
labels: good first issue, type: bug, area: core

## Context

A structural duplicate-member scan over `packages/*/src`'s exported interfaces found pairs of types
that describe the same shape under two different names. Two names for one concept forces every reader
to prove they're the same thing, and lets them drift apart silently. Two pairs remain:

- `VexMediaCreateMediaDocumentArgs` (`packages/core/src/api/convex.ts`) vs
  `CreateMediaDocumentClientArgs` (`packages/core/src/media/api/types.ts`) — identical 8 members
- `DraggableContextValue` (`packages/react/src/ui/dnd/context.ts`) vs `DragHandleContextValue`
  (`packages/react/src/ui/dnd/Draggable.tsx`) — both `{ dragHandleProps, isDragging }`

## Scope

Pick one name per pair, keep it, and update every import site to match — mechanical, no behavior
change. `lsp rename` (or your editor's rename-symbol) across each pair's usages is the intended tool.

## Acceptance criteria

- [ ] Only one of the two type names survives per pair; the other is deleted, not re-exported as an
      alias
- [ ] `pnpm typecheck` passes with no new errors
- [ ] A changeset is added for `@vexcms/core` and `@vexcms/react` if either type is publicly exported
      from the package's entry point (check `src/index.ts`)

## Out of scope

Any type outside these two pairs.
