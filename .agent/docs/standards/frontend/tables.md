---
applies_to: ["packages/react/src/components/ui/data-table/**", "packages/react/src/components/fields/*/columnDef.tsx", "packages/react/src/components/views/**"]
---
# Tables (TanStack Table)

- Headless setup: `useReactTable({ data, columns, getCoreRowModel })`, rendered by
  `DataTable` via `flexRender()` (`packages/react/src/components/ui/data-table/DataTable.tsx`).
- Every field type exports a `*FieldToColumnDef()` factory taking
  `{ fieldDef, fieldKey, collection, isTitleField? }` and returning a typed `ColumnDef`.
  `getCollectionColumnDefs()` iterates the collection's fields and delegates to the right
  factory (`packages/react/src/components/fields/index.tsx:183-210`). New field types MUST
  add a columnDef factory — the visual layer changes, the derivation stays.
- Row selection/bulk actions: `enableRowSelection` / `enableBulkActions` props insert the
  checkbox column and wire `rowSelection` state + `onBulkDelete` (confirmed via
  DeleteManyModal). Selection state lives in `useTableSelection`
  (`packages/react/src/hooks/useTableSelection.ts:63`).
- Pagination is cursor-based load-more: `isDone`, `onLoadMore`, `isLoadingMore`,
  `totalCount` props on DataTable; `usePaginatedQuery` owns the cursor.
- Boolean cells render "Yes"/"No" text, not icons. Date cells use `toLocaleDateString()`,
  not date-fns.
