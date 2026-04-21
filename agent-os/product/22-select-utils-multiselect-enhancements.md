# 22 — Select Utils & MultiSelect Enhancements

## Overview

Adds two hex color utility functions to the select field's utils module, and extends the `MultiSelect` UI component with two new capabilities: a clear-all button on the trigger chip, and an `allowCustomValues` mode that lets users type and add values not in the predefined list.

## Design Decisions

- **Clear-all lives on the trigger** — An `×` icon button appears at the right edge of `MultiSelectTrigger` (between the badge area and the chevron) when `clearable={true}` and at least one value is selected. Clicking it clears all values without opening the dropdown.
- **Custom values footer is debounced + pinned** — When `allowCustomValues={true}`, a fixed `+ Add "X"` footer appears at the bottom of the popover (the results list scrolls behind it) after 1s of typing. It only shows when there is no exact match on the existing item values or string labels. Hitting Enter selects the first filtered result as usual; users must explicitly click the footer to add a new custom value.
- **Exact match suppresses the footer** — If the typed text exactly matches any registered item's `value` or (string) label, the footer does not appear.
- **`normalizeHex` / `getOppositeColor` are single-param** — These are pure, single-parameter utilities; no `props` wrapper is needed per the single-param exemption.
- **6-char hex only** — `getOppositeColor` assumes a 6-character hex string. 3-char shorthand (`#abc`) is not normalised and will produce a wrong result; this is documented.

## Out of Scope

- Keyboard navigation to the "Add" footer (arrow keys stay within cmdk items)
- `allowCustomValues` support in `single` mode is unchanged — it works but add is still available
- Persisting custom values to the field definition / collection config
- Label matching for non-string (JSX) labels — only `string` labels are checked for exact match

## Target Directory Structure

```
packages/react/src/
  components/
    fields/
      select/
        utils.ts            ← new exports: normalizeHex, getOppositeColor
        utils.test.ts       ← new: unit tests for both functions
    ui/
      multi-select.tsx      ← modified: clearable + allowCustomValues
```

## Implementation Order

> **Key:**
>
> - `[agent]` — Boilerplate / pattern-following; no novel logic required
> - `[dev]` — Important custom logic; dev implements these

1. `[dev]` **Step 1** — `utils.ts` + `utils.test.ts`: implement and test `normalizeHex` and `getOppositeColor`. Testable immediately after this step.
2. `[dev]` **Step 2** — Extend `MultiSelectContextType` and `MultiSelect` props with `clearable`, `allowCustomValues`, and `clearAll`. No visible UI change yet; types and context wiring only.
3. `[dev]` **Step 3** — Update `MultiSelectTrigger` to render the clear-all `×` button when `clearable && selectedValues.size > 0`.
4. `[dev]` **Step 4** — Update `MultiSelectContent` to track the search input and render the debounced custom-value footer.

---

## Step 1: Select Field Utils

- [ ] Create `packages/react/src/components/fields/select/utils.ts`
- [ ] Create `packages/react/src/components/fields/select/utils.test.ts`
- [ ] Run `pnpm test` in `packages/react` and confirm both tests pass

### File: `packages/react/src/components/fields/select/utils.ts`

Pure hex color utilities for the select field.

````typescript
/**
 * Ensures a hex color string is prefixed with `#`.
 *
 * Idempotent — if the `#` is already present it is returned unchanged.
 * Does not validate that the string is a well-formed hex color.
 *
 * @param hex - A hex color string, with or without a leading `#`.
 * @returns The hex string with a `#` prefix.
 *
 * @example
 * ```ts
 * normalizeHex("ffffff")  // "#ffffff"
 * normalizeHex("#ffffff") // "#ffffff"
 * normalizeHex("ABC123")  // "#ABC123"
 */
export function normalizeHex(hex: string): string {
  return hex.startsWith("#") ? hex : `#${hex}`;
}

/**
 * Returns the opposite (inverted) color of a hex color by subtracting each
 * RGB channel value from 255.
 *
 * Expects a 6-character hex string (with or without a leading `#`).
 * 3-character shorthand (`#abc`) is **not** supported — pass the expanded
 * form (`#aabbcc`) instead.
 *
 * @param hex - A 6-character hex color string, with or without a leading `#`.
 * @returns The inverted color as a lowercase 7-character hex string (`#rrggbb`).
 *
 * @example
 * ```ts
 * getOppositeColor("#ffffff") // "#000000"
 * getOppositeColor("#000000") // "#ffffff"
 * getOppositeColor("#ff0000") // "#00ffff"
 * getOppositeColor("1a2b3c")  // "#e5d4c3"
 */
export function getOppositeColor(hex: string): string {
  const normalized = normalizeHex(hex);
  const r = 255 - parseInt(normalized.slice(1, 3), 16);
  const g = 255 - parseInt(normalized.slice(3, 5), 16);
  const b = 255 - parseInt(normalized.slice(5, 7), 16);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
````

### File: `packages/react/src/components/fields/select/utils.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { normalizeHex, getOppositeColor } from "./utils";

describe("normalizeHex", () => {
  it("prepends # when missing", () => {
    expect(normalizeHex("ffffff")).toBe("#ffffff");
  });

  it("leaves # in place when already present", () => {
    expect(normalizeHex("#ffffff")).toBe("#ffffff");
  });

  it("preserves uppercase characters", () => {
    expect(normalizeHex("ABC123")).toBe("#ABC123");
    expect(normalizeHex("#ABC123")).toBe("#ABC123");
  });

  it("does not double-prefix", () => {
    expect(normalizeHex("##ff0000")).not.toBe("###ff0000");
    // starts with # already so is returned as-is
    expect(normalizeHex("##ff0000")).toBe("##ff0000");
  });
});

describe("getOppositeColor", () => {
  it("inverts white to black", () => {
    expect(getOppositeColor("#ffffff")).toBe("#000000");
  });

  it("inverts black to white", () => {
    expect(getOppositeColor("#000000")).toBe("#ffffff");
  });

  it("inverts red to cyan", () => {
    expect(getOppositeColor("#ff0000")).toBe("#00ffff");
  });

  it("accepts hex without # prefix", () => {
    expect(getOppositeColor("1a2b3c")).toBe("#e5d4c3");
  });

  it("pads single-digit channel values with a leading zero", () => {
    // 0xfe → 0x01 (1 → "01")
    expect(getOppositeColor("#fefefe")).toBe("#010101");
  });

  it("returns lowercase hex", () => {
    expect(getOppositeColor("#AABBCC")).toBe("#554433");
  });
});
```

---

## Step 2: Extend MultiSelect Context & Props

- [ ] Open `packages/react/src/components/ui/multi-select.tsx`
- [ ] Add `clearable`, `allowCustomValues` props to `MultiSelect`
- [ ] Add `clearAll` and `clearable`/`allowCustomValues` to `MultiSelectContextType`
- [ ] Wire the new values through context

This step makes **no visible UI change** — it only wires the new shape through the context so Steps 3 and 4 can read from it.

### File: `packages/react/src/components/ui/multi-select.tsx` (partial — diff shown)

**Replace `MultiSelectContextType`:**

```typescript
type MultiSelectContextType = {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  setOpen: (open: boolean) => void;
  selectedValues: Set<string>;
  // eslint-disable-next-line no-unused-vars
  toggleValue: (value: string) => void;
  items: Map<string, ReactNode>;
  single: boolean;
  clearable: boolean;
  clearAll: () => void;
  allowCustomValues: boolean;
  // eslint-disable-next-line no-unused-vars
  onItemAdded: (value: string, label: ReactNode) => void;
};
```

**Replace `MultiSelect` props and body:**

```typescript
export function MultiSelect({
  children,
  values,
  defaultValues,
  onValuesChange,
  single = false,
  clearable = false,
  allowCustomValues = false,
}: {
  children: ReactNode;
  values?: string[];
  defaultValues?: string[];
  /** @param onValuesChange - Called with the new array of selected values whenever selection changes. */
  // eslint-disable-next-line no-unused-vars
  onValuesChange?: (values: string[]) => void;
  /** When `true`, only one option may be selected at a time. */
  single?: boolean;
  /**
   * When `true`, renders an `×` button on the trigger that clears all selected
   * values at once. Only visible when at least one value is selected.
   */
  clearable?: boolean;
  /**
   * When `true`, a debounced footer appears in the dropdown allowing the user
   * to add a typed value that does not match any predefined option.
   */
  allowCustomValues?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [internalValues, setInternalValues] = useState(
    new Set<string>(values ?? defaultValues),
  );
  const selectedValues = values ? new Set(values) : internalValues;
  const [items, setItems] = useState<Map<string, ReactNode>>(new Map());

  function toggleValue(value: string) {
    const getNewSet = (prev: Set<string>) => {
      if (single) {
        return prev.has(value) ? new Set<string>() : new Set<string>([value]);
      }
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    };
    setInternalValues(getNewSet);
    onValuesChange?.([...getNewSet(selectedValues)]);
    if (single) setOpen(false);
  }

  function clearAll() {
    setInternalValues(new Set());
    onValuesChange?.([]);
  }

  const onItemAdded = useCallback((value: string, label: ReactNode) => {
    setItems((prev) => {
      if (prev.get(value) === label) return prev;
      return new Map(prev).set(value, label);
    });
  }, []);

  return (
    <MultiSelectContext
      value={{
        open,
        setOpen,
        selectedValues,
        single,
        toggleValue,
        items,
        clearable,
        clearAll,
        allowCustomValues,
        onItemAdded,
      }}
    >
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        {children}
      </Popover>
    </MultiSelectContext>
  );
}
```

---

## Step 3: MultiSelectTrigger Clear-All Button

- [ ] Update `MultiSelectTrigger` in `multi-select.tsx` to read `clearable`, `clearAll`, and `selectedValues` from context
- [ ] Render the `×` button when `clearable && selectedValues.size > 0`
- [ ] Verify: render a `<MultiSelect clearable>` with selected values and confirm the button appears and clears on click

The `×` button must call `e.stopPropagation()` so clicking it does not open the popover.

### File: `packages/react/src/components/ui/multi-select.tsx` (partial)

**Replace `MultiSelectTrigger`:**

```typescript
export function MultiSelectTrigger({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: ReactNode;
} & ComponentPropsWithoutRef<typeof PopoverTrigger>) {
  const { open, clearable, clearAll, selectedValues } = useMultiSelectContext();
  const showClear = clearable && selectedValues.size > 0;

  return (
    <PopoverTrigger
      role="combobox"
      aria-expanded={open}
      {...props}
      className={cn(
        "flex h-auto min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
    >
      {children}
      <div className="ml-2 flex shrink-0 items-center gap-1">
        {showClear && (
          <button
            type="button"
            aria-label="Clear all"
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            className="flex items-center justify-center rounded-sm opacity-50 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <XIcon className="size-4" />
          </button>
        )}
        <ChevronsUpDownIcon className="size-4 opacity-50" />
      </div>
    </PopoverTrigger>
  );
}
```

---

## Step 4: MultiSelectContent Custom Values Footer

- [ ] Update `MultiSelectContent` in `multi-select.tsx`
- [ ] Add `inputValue` controlled state wired to `CommandInput`
- [ ] Add `showAddFooter` state with a 1s debounce effect
- [ ] Render the fixed footer below the `CommandList` when `showAddFooter` is true
- [ ] Verify: with `allowCustomValues={true}`, type a new value and confirm the footer appears after ~1s; confirm typing an exact existing value suppresses it; confirm clicking `+ Add "X"` adds the badge

### File: `packages/react/src/components/ui/multi-select.tsx` (partial)

Add `useState` and `useEffect` are already imported. No new imports needed.

**Replace `MultiSelectContent`:**

```typescript
export function MultiSelectContent({
  search = true,
  children,
  ...props
}: {
  search?: boolean | { placeholder?: string; emptyMessage?: string };
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof Command>, "children">) {
  const { allowCustomValues, toggleValue, items, onItemAdded } =
    useMultiSelectContext();
  const canSearch = typeof search === "object" ? true : search;
  const [inputValue, setInputValue] = useState("");
  const [showAddFooter, setShowAddFooter] = useState(false);

  useEffect(() => {
    const trimmed = inputValue.trim();

    if (!allowCustomValues || trimmed === "") {
      setShowAddFooter(false);
      return;
    }

    // Hide immediately on each keystroke, then re-evaluate after 1s
    setShowAddFooter(false);
    const timer = setTimeout(() => {
      const hasExactMatch =
        items.has(trimmed) ||
        [...items.values()].some((label) => label === trimmed);
      setShowAddFooter(!hasExactMatch);
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputValue, allowCustomValues, items]);

  function handleAddCustom() {
    const trimmed = inputValue.trim();
    if (trimmed === "") return;
    toggleValue(trimmed);
    onItemAdded(trimmed, trimmed);
    setInputValue("");
    setShowAddFooter(false);
  }

  return (
    <>
      <div style={{ display: "none" }}>
        <Command>
          <CommandList>{children}</CommandList>
        </Command>
      </div>
      <PopoverContent className="w-(--anchor-width) p-0">
        <Command {...props}>
          {canSearch ? (
            <CommandInput
              placeholder={
                typeof search === "object" ? search.placeholder : undefined
              }
              value={allowCustomValues ? inputValue : undefined}
              onValueChange={allowCustomValues ? setInputValue : undefined}
            />
          ) : (
            <button autoFocus className="sr-only" />
          )}
          <div className="relative">
            <CommandList>
              {canSearch && !(allowCustomValues && inputValue.trim() !== "") && (
                <CommandEmpty>
                  {typeof search === "object"
                    ? search.emptyMessage
                    : undefined}
                </CommandEmpty>
              )}
              {children}
            </CommandList>
            {showAddFooter && (
              <div
                className="absolute bottom-0 left-0 right-0 border-t bg-popover px-1 py-1"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="text-muted-foreground">+</span>
                  Add &ldquo;{inputValue.trim()}&rdquo;
                </button>
              </div>
            )}
          </div>
        </Command>
      </PopoverContent>
    </>
  );
}
```

> **Note on `onMouseDown` prevention:** The `e.preventDefault()` on the footer wrapper prevents the `CommandInput` from losing focus when the user clicks the add button, which would otherwise clear the input before `handleAddCustom` reads it.

> **Note on `CommandList` scrolling:** The `CommandList` has a default `max-height` set by cmdk. The footer overlays the bottom of that area. If the last item is hidden behind the footer, consider adding `pb-10` to `CommandList` — but this is a cosmetic polish concern and not required for functionality.

---

## Verification

**Run these after completing all steps and fix any failures before considering the spec done.**

- [ ] `cd packages/react && pnpm test` — `utils.test.ts` tests all pass
- [ ] `pnpm build` from repo root — all packages build without type errors
- [ ] Manual smoke: render `<MultiSelect clearable>` with pre-selected values, confirm `×` clears
- [ ] Manual smoke: render `<MultiSelect allowCustomValues>`, type a new value, wait 1s, confirm footer appears; type an exact existing value, confirm footer is suppressed; click `+ Add`, confirm badge is added
- [ ] Manual smoke: confirm `Enter` key still selects the first filtered result (not the custom add)

## Success Criteria

- [ ] `normalizeHex` always returns a string starting with `#`
- [ ] `getOppositeColor` returns a 7-character lowercase `#rrggbb` string
- [ ] `clearable` prop renders an `×` button on the trigger only when values are selected
- [ ] Clear button does not open/toggle the popover
- [ ] `allowCustomValues` footer appears after ~1s of typing a value with no exact match
- [ ] Footer is suppressed when typed text exactly matches an existing item value or string label
- [ ] Clicking `+ Add "X"` adds the value as a badge and clears the input
- [ ] All existing `MultiSelect` usage (no new props) is unaffected
