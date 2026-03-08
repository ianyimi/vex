"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { cn } from "../../styles/utils";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface MultiSelectContextValue {
  values: string[];
  onValuesChange: (values: string[]) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

const MultiSelectContext = React.createContext<MultiSelectContextValue | null>(
  null,
);

function useMultiSelect() {
  const ctx = React.useContext(MultiSelectContext);
  if (!ctx)
    throw new Error("MultiSelect compound components must be used within <MultiSelect>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

interface MultiSelectProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  children: React.ReactNode;
}

function MultiSelect({ values, onValuesChange, children }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <MultiSelectContext.Provider
      value={{ values, onValuesChange, open, setOpen, search, setSearch }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </MultiSelectContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

function MultiSelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <PopoverTrigger
      className={cn(
        "flex min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
    </PopoverTrigger>
  );
}

// ---------------------------------------------------------------------------
// Value (badge display)
// ---------------------------------------------------------------------------

interface MultiSelectValueProps {
  placeholder?: string;
  className?: string;
}

function Badge({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: (e: React.MouseEvent) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-xs font-medium">
      {children}
      <span
        role="button"
        tabIndex={0}
        className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 cursor-pointer"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRemove(e as unknown as React.MouseEvent);
          }
        }}
      >
        <XIcon className="size-3" />
      </span>
    </span>
  );
}

function MultiSelectValue({ placeholder, className }: MultiSelectValueProps) {
  const { values, onValuesChange } = useMultiSelect();

  const remove = (val: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onValuesChange(values.filter((v) => v !== val));
  };

  if (values.length === 0) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {placeholder ?? "Select..."}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {values.map((val) => (
        <Badge key={val} onRemove={remove(val)}>
          {val}
        </Badge>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content (dropdown)
// ---------------------------------------------------------------------------

function MultiSelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const { search, setSearch } = useMultiSelect();

  return (
    <PopoverContent
      className={cn("w-[var(--anchor-width)] p-1", className)}
      {...props}
    >
      <div className="px-2 pb-1.5 pt-1">
        <input
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-60 overflow-y-auto">{children}</div>
    </PopoverContent>
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

interface MultiSelectItemProps
  extends Omit<React.ComponentProps<"div">, "value"> {
  value: string;
}

function MultiSelectItem({
  value,
  children,
  className,
  ...props
}: MultiSelectItemProps) {
  const { values, onValuesChange, search } = useMultiSelect();

  const label =
    typeof children === "string" ? children : value;

  // Filter by search term
  if (search && !label.toLowerCase().includes(search.toLowerCase())) {
    return null;
  }

  const selected = values.includes(value);

  const toggle = () => {
    onValuesChange(
      selected ? values.filter((v) => v !== value) : [...values, value],
    );
  };

  return (
    <div
      role="option"
      aria-selected={selected}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        selected && "bg-accent/50",
        className,
      )}
      onClick={toggle}
      {...props}
    >
      <span className="mr-2 flex size-4 shrink-0 items-center justify-center">
        {selected && <CheckIcon className="size-4" />}
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
};
