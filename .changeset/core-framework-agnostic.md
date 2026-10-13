---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
---

**`@vexcms/core` no longer depends on React.** Its only peer dependency is now `convex`;
`react`, `lucide-react`, `@tanstack/react-query`, `@tanstack/react-table`, and
`@convex-dev/react-query` are gone, so `npm i @vexcms/core` stops pulling ~70 MB of React
packages.

**Breaking — client wrappers moved to `@vexcms/react/client`.** `get`, `find`, `search`,
`create`, `update`, `remove`, `getGlobal`, `findGlobals`, `updateGlobal`, `saveDraft`,
`publish`, `unpublish`, `listVersions`, `getVersionSnapshot`, `deleteVersion`,
`findQueryKey`, their `*ClientArgs` types, and `VexQueryOptions` are no longer exported from
`@vexcms/core/client` (removed). Change the import path:

```ts
// before
import { get, saveDraft } from "@vexcms/core/client";
// after
import { get, saveDraft } from "@vexcms/react/client";
```

**Breaking — `LucideIconName` is now `IconName`.** Core no longer imports `lucide-react`; the
icon-name set comes from `vex generate`, which now writes
`IconName: keyof typeof import("lucide-react").icons` into `vex.types.ts`. Re-run
`vex generate` (or `vex dev`) to keep icon autocomplete; before that, `IconName` is `string`.

**Breaking — `CellComponentProps.row` is `CellRow<TData>` (`{ original: TData }`).** Built-in
cells only read `row.original`, and React Table's `Row` still satisfies it. A custom cell that
called React Table methods on `row` must type that prop itself.
