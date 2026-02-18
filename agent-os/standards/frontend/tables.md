## Data Table Standards (TanStack Table + shadcn)

### Overview

This project uses **TanStack Table** for data table functionality with **shadcn/ui** table components:
- Headless table logic with full UI control
- Sorting, filtering, and pagination
- Column visibility and ordering
- Row selection and expansion

### Basic Table Setup

```tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
];

function UsersTable({ data }: { data: User[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Column Definitions

**Basic columns**:
```tsx
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <a href={`mailto:${row.getValue("email")}`} className="text-primary">
        {row.getValue("email")}
      </a>
    ),
  },
];
```

**Custom cell rendering**:
```tsx
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string;
    return (
      <Badge variant={status === "active" ? "default" : "secondary"}>
        {status}
      </Badge>
    );
  },
},
```

**Actions column**:
```tsx
{
  id: "actions",
  header: () => <span className="sr-only">Actions</span>,
  cell: ({ row }) => {
    const user = row.original;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(user)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDelete(user)}
            className="text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
},
```

### Sorting

```tsx
import { getSortedRowModel, SortingState } from "@tanstack/react-table";

function SortableTable({ data }: { data: User[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    // ... more columns
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  // ... render table
}
```

### Filtering

**Column filtering**:
```tsx
import { getFilteredRowModel, ColumnFiltersState } from "@tanstack/react-table";

function FilterableTable({ data }: { data: User[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
  });

  return (
    <div>
      <Input
        placeholder="Filter by name..."
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(e) =>
          table.getColumn("name")?.setFilterValue(e.target.value)
        }
        className="max-w-sm mb-4"
      />
      {/* Table rendering */}
    </div>
  );
}
```

**Global filtering**:
```tsx
const [globalFilter, setGlobalFilter] = useState("");

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onGlobalFilterChange: setGlobalFilter,
  state: { globalFilter },
});

// Search input
<Input
  placeholder="Search all columns..."
  value={globalFilter}
  onChange={(e) => setGlobalFilter(e.target.value)}
/>
```

### Pagination

```tsx
import { getPaginationRowModel } from "@tanstack/react-table";

function PaginatedTable({ data }: { data: User[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div>
      {/* Table */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Row Selection

```tsx
import { RowSelectionState } from "@tanstack/react-table";

function SelectableTable({ data }: { data: User[] }) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    // ... other columns
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  // Get selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows;
}
```

### Column Visibility

```tsx
import { VisibilityState } from "@tanstack/react-table";

function TableWithColumnVisibility({ data }: { data: User[] }) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { columnVisibility },
  });

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Columns</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table.getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Table */}
    </div>
  );
}
```

### Integration with Convex

```tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function UsersDataTable() {
  const users = useQuery(api.users.list);

  if (users === undefined) {
    return <TableSkeleton />;
  }

  return <DataTable columns={columns} data={users} />;
}
```

### Empty State

```tsx
<TableBody>
  {table.getRowModel().rows.length ? (
    table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {/* cells */}
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell
        colSpan={columns.length}
        className="h-24 text-center text-muted-foreground"
      >
        No results found.
      </TableCell>
    </TableRow>
  )}
</TableBody>
```

### Best Practices

- **Define columns outside component** to prevent unnecessary re-renders
- **Use `accessorKey`** for simple data access, `accessorFn` for computed values
- **Memoize data** if it's derived from props to prevent re-renders
- **Handle loading states** with skeleton tables
- **Provide empty states** when no data matches filters
- **Use row selection sparingly** - only when bulk actions are needed
- **Implement server-side pagination** for large datasets
- **Add aria-labels** to interactive elements for accessibility

### Related Standards

- See [data-fetching.md](./data-fetching.md) for fetching table data
- See [components.md](./components.md) for shadcn Table component usage
