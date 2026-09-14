---
"@vexcms/react": patch
---

Make the data-table bulk-actions bar reachable, and gate row selection on delete permission.

The bar was mounted but unreachable — `DataTable` never rendered it, so selecting rows did
nothing. Selection was also enabled unconditionally, which showed checkboxes to roles that
cannot delete.

`DataTableBulkActionsProps` is a breaking change for anyone rendering the component directly:
it now takes `selectedCount`, `onDelete`, `onClear` and `isDeleting` instead of a
`selection` object from `useTableSelection`. The `all` and `inverse` mode badges are removed;
they were unreachable without a select-all-across-pages control.
