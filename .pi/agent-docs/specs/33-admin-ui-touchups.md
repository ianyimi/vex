# Admin UI Touchups — URL Params, Theme Toggle, Upload Flow

**Status:** Draft (not started)

**Primary scope:** `@vexcms/react`

**Also touches:** `apps/www` (for theme toggle demo)

---

## Overview

Three independent admin UI improvements bundled into one spec because each is small, self-contained, and doesn't require full separate specs:

1. **Blocks modal URL param support** — Add `?editBlocks=<fieldName>` URL param to the blocks modal so the modal state survives page refresh (matching the media modal pattern). Also add **multi-block add** capability so users can add more than one block at a time via a checkbox UI in the block picker dialog.

2. **Framework-agnostic theme toggle component** — Create `<ThemeToggle />` in `@vexcms/react` that toggles the `.dark` class on `<html>` without depending on `next-themes`. This makes the component portable to any framework and theme handler (Tailwind expects `.dark` on the document root).

3. **Upload empty state flow fix** — When a user drops files on the empty upload field dropzone, open the `MediaPicker` directly to the Upload tab and pre-populate the uploaded file results (matching the behavior of the dropzone inside the media picker itself).

---

## Code Effect Preview

### Blocks field — multi-block add in picker dialog

```ts
-// Single-select only — one block at a time
-onClick={() => {
-  props.onSelect(blockDef);
-  props.onOpenChange(false);
-}}

+// Multi-select with checkbox UI
+const [selectedBlocks, setSelectedBlocks] = useState<BlockConfig[]>([]);
+onClick={() => toggleBlock(blockDef)}
+// "Add N blocks" button at footer
```

### Upload empty state — opens to Upload tab, not Library

```ts
-<UploadEmpty
-  onPickerOpen={openPicker}
-  onFileUpload={(mediaId) => field.handleChange([mediaId])}
-/>

+<UploadEmpty
+  onPickerOpen={openPicker}
+  onFileUpload={(mediaId) => {
+    field.handleChange([mediaId]);
+    openPickerTab("upload"); // ← NEW: opens picker on upload tab
+  }}
+/>
```

### Theme toggle — no next-themes dependency + FOUC prevention

```ts
-import { useTheme } from "next-themes"
-const { theme, setTheme } = useTheme()

+// Framework-agnostic context + blocking script
+const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
+useEffect(() => {
+  const html = document.documentElement;
+  if (theme === "dark" || (theme === "system" && matchMedia)) {
+    html.classList.add("dark");
+  } else {
+    html.classList.remove("dark");
+  }
+}, [theme]);
+
+// ThemeScript in <head> prevents FOUC
+<html suppressHydrationWarning>
+  <head>
+    <ThemeScript /> {/* ← Runs before React hydrates */}
+  </head>
+</html>
```

---

## API Surface

| Export | Type | Package | Purpose |
|--------|------|---------|---------|
| `ThemeToggle` | Component | `@vexcms/react` | Framework-agnostic theme toggle dropdown |
| `ThemeProvider` | Component | `@vexcms/react` | Theme context provider with localStorage persistence |
| `ThemeScript` | Component | `@vexcms/react` | Blocking script that prevents FOUC (renders in `<head>`) |
| `useTheme` | Hook | `@vexcms/react` | Access theme context |
| `MODALS.editBlocks` | Constant | `@vexcms/react` (internal) | URL param key for blocks modal |

---

## Status / progress checklist

- [ ] **Blocks modal URL param** — `?editBlocks=<fieldName>` drives modal open/close
- [ ] **Multi-block add** — Checkbox UI in block picker dialog, "Add N blocks" button
- [ ] **Theme toggle component** — `<ThemeToggle />` in `@vexcms/react` without next-themes
- [ ] **Upload empty state fix** — Opens picker to Upload tab with uploaded files

---

## Design Decisions

| # | Decision (one line) |
|---|---------------------|
| D1 | Blocks modal uses `?editBlocks=<fieldName>` (matches `?editMedia=<fieldName>` pattern). |
| D2 | Multi-block add is opt-in via checkbox UI — single-click still adds one block for fast workflows. |
| D3 | Theme toggle stores preference in `localStorage` as `"vex-theme"` key. |
| D4 | Theme toggle uses system preference as default, respects `prefers-color-scheme` media query. |
| D5 | `ThemeScript` is a blocking script that runs before React hydrates to prevent FOUC (same pattern as next-themes). |
| D6 | Empty upload dropzone captures File objects (doesn't upload), opens picker to Upload tab with `initialFiles` pre-filled in form. |

---

## Out of Scope

- **Global blocks modal state management** — The blocks modal is still per-field, not a single shared modal. Shared state would require a global store (Zustand / Jotai) and is deferred to a future refactor.
- **Theme toggle in admin layout** — This spec creates the component; wiring it into `AdminSidebar` or topbar is a follow-up.
- **Upload progress indicator** — Real-time upload progress (progress bars, cancellation) belongs in a separate upload queue spec.
- **Duplicate filename detection** — Checking if media documents with the same filenames already exist in the collection and showing warnings in the upload form. Deferred to a future enhancement.
- **Relationship modal URL params** — Relationship field picker modal doesn't use URL params yet. Defer to a future spec when relationship UI is redesigned.

---

## Target Directory Structure

```
packages/react/src/
├── components/
│   ├── form/
│   │   └── FormBlocks.tsx                       🟡 modify (multi-block add)
│   ├── fields/
│   │   ├── blocks/
│   │   │   └── Input.tsx                        🟡 modify (URL param)
│   │   └── upload/
│   │       ├── Input.tsx                        🟡 modify (open to upload tab)
│   │       └── EmptyInput.tsx                   🟡 modify (pass tab hint)
│   ├── media/
│   │   └── MediaPicker.tsx                      🟡 modify (accept defaultTab prop)
│   ├── modals/
│   │   └── constants.ts                         🟡 modify (add editBlocks)
│   ├── theme/
│   │   ├── ThemeToggle.tsx                      ⏳ NEW
│   │   ├── ThemeProvider.tsx                    ⏳ NEW
│   │   ├── ThemeScript.tsx                      ⏳ NEW
│   │   └── index.ts                             ⏳ NEW
│   └── ui/
│       └── tabs.tsx                             (no change — already supports defaultValue)
└── index.ts                                      🟡 modify (export ThemeToggle)

apps/www/src/
└── app/
    └── admin/
        └── theme-demo/
            └── page.tsx                          ⏳ NEW (demo page)
```

**Legend:**
- ✅ Complete
- 🟡 Modify existing
- ⏳ Pending (not started)

---

## Implementation Order

### Step 1 — Blocks modal URL param [dev]

Add `?editBlocks=<fieldName>` URL param support to the blocks field input. The modal opens when the param matches the field's name and closes by clearing the param. Mirrors the pattern used by `UploadFieldInput` and `MediaPicker`.

#### Files to modify
- [ ] `packages/react/src/components/modals/constants.ts` — add `MODALS.editBlocks`
- [ ] `packages/react/src/components/fields/blocks/Input.tsx` — wire `useQueryState`

#### `packages/react/src/components/modals/constants.ts`

```ts
export const MODALS = {
  createDocument: {
    urlParam: "createNew",
    label: "Create",
  },
  uploadMedia: {
    urlParam: "upload",
    label: "Upload",
  },
  editMedia: {
    urlParam: "editMedia",
    label: "Edit",
  },
+  editBlocks: {
+    /** URL search param that controls the blocks editor modal (`?editBlocks=<fieldName>`). */
+    urlParam: "editBlocks",
+    /** Label for the blocks editor modal's primary action. */
+    label: "Save",
+  },
} as const;
```

#### `packages/react/src/components/fields/blocks/Input.tsx`

```ts
"use client";

import type { BlocksField, GenericBlock } from "@vexcms/core";
+import { parseAsString, useQueryState } from "nuqs";
import {
  createFieldInput,
  FormDescription,
  FormLabel,
  FormError,
  FormBlocks,
} from "../../form";
+import { MODALS } from "../../modals";

/**
 * Blocks field input component for the admin edit form.
 *
 * Built with `createFieldInput` using `mode="array"`. Renders a dynamic block
 * list with a searchable Dialog picker via `FormBlocks`. Initial open/closed
 * state per block item is controlled by each block item's internal state.
 *
+ * **URL param integration:** Opens the block editor modal when
+ * `?editBlocks=<fieldName>` is present in the URL. Closing the modal clears
+ * the param. Enables deep-linking and refresh-stable editor state.
+ *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * from a `<form.Field mode="array">` render prop.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <BlocksFieldInput name="body" fieldDef={bodyField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const BlocksFieldInput = createFieldInput<GenericBlock[], BlocksField>(
  ({ name, fieldDef, field, submissionAttempts }) => {
+    const [activeField, setActiveField] = useQueryState(
+      MODALS.editBlocks.urlParam,
+      parseAsString,
+    );
+    const isEditorOpen = activeField === name;
+
+    async function openEditor() {
+      await setActiveField(name);
+    }
+
+    async function closeEditor() {
+      await setActiveField(null);
+    }
+
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} name={name} />
        <FormBlocks
          name={name}
          field={field}
          fieldDef={fieldDef}
          readOnly={fieldDef.admin.readOnly}
          submissionAttempts={submissionAttempts}
+          isEditorOpen={isEditorOpen}
+          openEditor={openEditor}
+          closeEditor={closeEditor}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
  "array",
);
```

#### `packages/react/src/components/form/FormBlocks.tsx`

Update `FormBlocks` to accept the new `isEditorOpen`, `openEditor`, `closeEditor` props. The block picker dialog now opens/closes via these props instead of internal state.

```ts
export interface FormBlocksProps {
  name: string;
  field: TypedFieldApi<GenericBlock[]>;
  fieldDef: BlocksField;
  readOnly: boolean;
  submissionAttempts: number;
  className?: string;
+  /** Whether the block editor modal is open (driven by URL param). */
+  isEditorOpen: boolean;
+  /** Opens the block editor modal (sets URL param). */
+  openEditor: () => void;
+  /** Closes the block editor modal (clears URL param). */
+  closeEditor: () => void;
}

export function FormBlocks({
  name,
  field,
  fieldDef,
  readOnly,
  submissionAttempts,
  className,
+  isEditorOpen,
+  openEditor,
+  closeEditor,
}: FormBlocksProps) {
  const form = useContext(AppFormContext);
-  const [pickerOpen, setPickerOpen] = useState(false);

  // ... rest of function unchanged until the "Add block" button

  {!readOnly && (
    <div className="flex items-center gap-2">
      {fieldDef.blocks.length === 1 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAdd(fieldDef.blocks[0]!)}
          disabled={atMax}
          icon="Plus"
        >
          Add {singular}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
-          onClick={() => setPickerOpen(true)}
+          onClick={openEditor}
          disabled={atMax}
          icon="Plus"
        >
          Add {singular}
        </Button>
      )}
      {atMax && (
        <span className="text-xs text-muted-foreground">
          Maximum {fieldDef.max} {plural} reached
        </span>
      )}
    </div>
  )}

  <FormError field={field} submissionAttempts={submissionAttempts} />

  <BlockPickerDialog
    blockDefs={fieldDef.blocks}
-    open={pickerOpen}
-    onOpenChange={setPickerOpen}
+    open={isEditorOpen}
+    onOpenChange={(open) => {
+      if (open) {
+        openEditor();
+      } else {
+        closeEditor();
+      }
+    }}
    onSelect={handleAdd}
  />
}
```

#### Verify

```bash
cd apps/www
pnpm dev:app

# Navigate to a collection edit view with a blocks field
# Click "Add block" → URL should show ?editBlocks=<fieldName>
# Refresh page → modal should still be open
# Close modal → URL param should clear
```

---

### Step 2 — Multi-block add in picker dialog [dev]

Replace the single-select block picker with a multi-select checkbox UI. When multiple blocks are selected, the footer shows "Add N blocks" instead of adding immediately on click.

#### Files to modify
- [ ] `packages/react/src/components/form/FormBlocks.tsx` — update `BlockPickerDialog` component

#### `packages/react/src/components/form/FormBlocks.tsx` (BlockPickerDialog component)

```ts
function BlockPickerDialog(props: {
  blockDefs: BlockConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockDef: BlockConfig) => void;
+  /** When true, allow selecting multiple blocks at once. */
+  multiSelect?: boolean;
}) {
  const [search, setSearch] = useState("");
+  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
+
  const filtered = props.blockDefs.filter(
    (b) =>
      b.label?.toLowerCase().includes(search.toLowerCase()) ||
      b.blockType.toLowerCase().includes(search.toLowerCase()),
  );

+  function toggleBlock(blockType: string) {
+    setSelectedBlocks((prev) => {
+      const next = new Set(prev);
+      if (next.has(blockType)) {
+        next.delete(blockType);
+      } else {
+        next.add(blockType);
+      }
+      return next;
+    });
+  }
+
+  function handleAddBlocks() {
+    // Add all selected blocks in order
+    const selectedDefs = props.blockDefs.filter((b) =>
+      selectedBlocks.has(b.blockType),
+    );
+    selectedDefs.forEach((def) => props.onSelect(def));
+    setSelectedBlocks(new Set());
+    setSearch("");
+    props.onOpenChange(false);
+  }
+
+  function handleSingleAdd(blockDef: BlockConfig) {
+    props.onSelect(blockDef);
+    props.onOpenChange(false);
+    setSearch("");
+  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Add block</DialogTitle>
-          <DialogDescription>Select a block type to add</DialogDescription>
+          <DialogDescription>
+            {props.multiSelect
+              ? "Select one or more block types"
+              : "Select a block type to add"}
+          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search blocks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="px-2 pb-3 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No blocks found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockDef) => {
+                const isSelected = selectedBlocks.has(blockDef.blockType);
                return (
                  <button
                    key={blockDef.blockType}
                    type="button"
-                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors"
+                    className={cn(
+                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors",
+                      isSelected && "bg-muted",
+                    )}
                    onClick={() => {
-                      props.onSelect(blockDef);
-                      props.onOpenChange(false);
-                      setSearch("");
+                      if (props.multiSelect) {
+                        toggleBlock(blockDef.blockType);
+                      } else {
+                        handleSingleAdd(blockDef);
+                      }
                    }}
                  >
+                    {props.multiSelect && (
+                      <div
+                        className={cn(
+                          "size-4 rounded border border-input flex items-center justify-center shrink-0",
+                          isSelected && "bg-primary border-primary",
+                        )}
+                      >
+                        {isSelected && (
+                          <Icon name="Check" className="size-3 text-primary-foreground" />
+                        )}
+                      </div>
+                    )}
                    <div className="size-8 rounded-sm bg-muted flex items-center justify-center shrink-0">
                      {blockDef.admin?.icon ? (
                        <Icon
                          name={blockDef.admin.icon as any}
                          className="size-4 text-muted-foreground"
                        />
                      ) : (
                        <LayersIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{blockDef.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {blockDef.blockType}
                        {Object.keys(blockDef.fields).length > 0 &&
                          ` · ${Object.keys(blockDef.fields).length} field${
                            Object.keys(blockDef.fields).length === 1 ? "" : "s"
                          }`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
+        {props.multiSelect && selectedBlocks.size > 0 && (
+          <div className="px-4 pb-4 pt-2 border-t flex items-center justify-between">
+            <span className="text-sm text-muted-foreground">
+              {selectedBlocks.size} selected
+            </span>
+            <Button onClick={handleAddBlocks} size="sm">
+              Add {selectedBlocks.size} block{selectedBlocks.size === 1 ? "" : "s"}
+            </Button>
+          </div>
+        )}
      </DialogContent>
    </Dialog>
  );
}
```

Update the `BlockPickerDialog` call site to pass `multiSelect={true}`:

```ts
<BlockPickerDialog
  blockDefs={fieldDef.blocks}
  open={isEditorOpen}
  onOpenChange={(open) => {
    if (open) {
      openEditor();
    } else {
      closeEditor();
    }
  }}
  onSelect={handleAdd}
+  multiSelect={true}
/>
```

#### Verify

```bash
cd apps/www
pnpm dev:app

# Navigate to a blocks field, click "Add block"
# Select multiple blocks via checkboxes
# Footer should show "Add N blocks" button
# Click "Add N blocks" → all selected blocks should be added in order
```

---

### Step 3 — Theme toggle component [dev]

Create a framework-agnostic `<ThemeToggle />` component in `@vexcms/react` that toggles the `.dark` class on `<html>` without depending on `next-themes`. Stores preference in `localStorage` and respects system preference.

#### Files to create
- [ ] `packages/react/src/components/theme/ThemeProvider.tsx` (NEW)
- [ ] `packages/react/src/components/theme/ThemeScript.tsx` (NEW)
- [ ] `packages/react/src/components/theme/ThemeToggle.tsx` (NEW)
- [ ] `packages/react/src/components/theme/index.ts` (NEW)

#### Files to modify
- [ ] `packages/react/src/index.ts` — export `ThemeProvider`, `ThemeScript`, `ThemeToggle`

#### `packages/react/src/components/theme/ThemeProvider.tsx` (NEW)

```ts
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

/**
 * Theme mode: light, dark, or system (respects `prefers-color-scheme`).
 */
export type Theme = "light" | "dark" | "system";

/**
 * Context value for the theme provider.
 */
interface ThemeContextValue {
  /** Current theme setting (may be "system"). */
  theme: Theme;
  /** Resolved theme (never "system" — either "light" or "dark"). */
  resolvedTheme: "light" | "dark";
  /** Set the theme and persist to localStorage. */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "vex-theme";

/**
 * Framework-agnostic theme provider.
 *
 * Manages the `.dark` class on `<html>` and persists the user's preference to
 * `localStorage`. Respects the system `prefers-color-scheme` media query when
 * theme is set to `"system"`.
 *
 * **Does NOT depend on `next-themes`** — works in any React framework.
 *
 * @param props - Component props.
 * @param props.children - Child elements.
 * @param props.defaultTheme - Initial theme (default: `"system"`).
 * @param props.storageKey - localStorage key (default: `"vex-theme"`).
 * @returns The provider wrapping children with theme context.
 *
 * @example
 * ```tsx
 * // Wrap your app root
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  ...divProps
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
} & ComponentPropsWithRef<"div">) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }
  }, [storageKey]);

  // Apply theme to <html> element
  useEffect(() => {
    const html = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);

      if (isDark) {
        html.classList.add("dark");
        setResolvedTheme("dark");
      } else {
        html.classList.remove("dark");
        setResolvedTheme("light");
      }
    }

    applyTheme();

    // Listen for system preference changes when theme is "system"
    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the current theme and theme setter.
 *
 * Must be used inside a `<ThemeProvider>`.
 *
 * @returns The theme context value.
 * @throws {Error} When used outside `<ThemeProvider>`.
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * setTheme("dark");
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
```

#### `packages/react/src/components/theme/ThemeScript.tsx` (NEW)

```tsx
/**
 * Blocking script that applies theme before hydration.
 *
 * Must be rendered in the document `<head>` (before React hydrates). Reads from
 * localStorage and applies `.dark` class synchronously before the first paint.
 *
 * **Framework integration:**
 * - Next.js app router: `app/layout.tsx` `<head>`
 * - Next.js pages router: `pages/_document.tsx` `<Head>`
 * - Remix: `root.tsx` `<head>`
 * - Vite: `index.html` `<head>`
 *
 * @param props - Component props.
 * @param props.storageKey - localStorage key (default: `"vex-theme"`).
 * @returns A script tag that runs before React hydration.
 *
 * @example
 * ```tsx
 * // Next.js app/layout.tsx
 * import { ThemeScript, ThemeProvider } from "@vexcms/react";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html suppressHydrationWarning>
 *       <head>
 *         <ThemeScript />
 *       </head>
 *       <body>
 *         <ThemeProvider>{children}</ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ThemeScript({ storageKey = "vex-theme" }: { storageKey?: string }) {
  // Inline script that runs synchronously before hydration
  const themeScript = `
(function() {
  try {
    var storageKey = '${storageKey}';
    var theme = localStorage.getItem(storageKey);
    var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches) || (!theme && mediaQuery.matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    // Fail silently if localStorage is blocked
  }
})();
  `.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      // Prevent React from trying to hydrate this script
      suppressHydrationWarning
    />
  );
}
```

#### `packages/react/src/components/theme/ThemeToggle.tsx` (NEW)

```ts
"use client";

import { type ComponentPropsWithRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/**
 * Theme toggle dropdown component.
 *
 * Framework-agnostic (no `next-themes` dependency). Toggles between light,
 * dark, and system themes. Renders a button with sun/moon icons and a dropdown
 * menu with three options.
 *
 * Must be rendered inside a `<ThemeProvider>`.
 *
 * @param props - Standard div props (forwarded to wrapper).
 * @returns A dropdown button that controls the theme.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <ThemeToggle className="ml-auto" />
 * </ThemeProvider>
 * ```
 */
export function ThemeToggle({ ...divProps }: ComponentPropsWithRef<"div">) {
  const { theme, setTheme } = useTheme();

  return (
    <div {...divProps}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="icon" variant="outline" />}
          suppressHydrationWarning
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={theme === "light"}
            disabled={theme === "light"}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("light");
              }
            }}
          >
            Light
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={theme === "dark"}
            disabled={theme === "dark"}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("dark");
              }
            }}
          >
            Dark
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={theme === "system"}
            disabled={theme === "system"}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("system");
              }
            }}
          >
            System
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

#### `packages/react/src/components/theme/index.ts` (NEW)

```ts
export { ThemeProvider, useTheme, type Theme } from "./ThemeProvider";
export { ThemeScript } from "./ThemeScript";
export { ThemeToggle } from "./ThemeToggle";
```

#### `packages/react/src/index.ts`

```ts
// ... existing exports

+export {
+  ThemeProvider,
+  ThemeScript,
+  ThemeToggle,
+  useTheme,
+  type Theme,
+} from "./components/theme";
```

#### Verify

```bash
cd packages/react
pnpm typecheck

# Should pass with no errors
```

Wire into `apps/www` root layout (replaces next-themes):

#### `apps/www/src/app/layout.tsx` (UPDATE)

```tsx
import { ThemeProvider, ThemeScript } from "@vexcms/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript /> {/* ← Prevents FOUC */}
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Create a demo page:

#### `apps/www/src/app/admin/theme-demo/page.tsx` (NEW)

```tsx
"use client";

import { ThemeToggle } from "@vexcms/react";

export default function ThemeDemoPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Theme Toggle Demo</h1>
      <p className="text-muted-foreground">
        This component is framework-agnostic — no next-themes dependency.
      </p>
      <ThemeToggle />
      <div className="mt-8 p-4 bg-background border rounded">
        <p className="text-sm">
          This card adapts to the theme. Toggle to see light/dark/system modes.
        </p>
      </div>
    </div>
  );
}
```

**Remove next-themes:**

```bash
cd apps/www
pnpm remove next-themes

# Delete old theme components
rm src/components/ui/theme-toggle.tsx
rm src/components/providers/theme.tsx
```

```bash
cd apps/www
pnpm dev:app

# Navigate to http://localhost:3020/admin/theme-demo
# Toggle theme → <html> should gain/lose .dark class
# Refresh page multiple times → NO FOUC (theme applies before hydration)
# Check devtools → .dark class should be present BEFORE React hydrates
```

---

### Step 4 — Upload empty state flow fix [dev]

When the user drops files on the empty upload field dropzone, **capture the File objects** (don't upload yet), open the `MediaPicker` to the Upload tab, and pre-fill those files in the `MediaUploadForm`. The user can then edit metadata before clicking the Upload button.

**Flow:**
1. User drops files on empty upload field dropzone
2. Capture File objects (no upload yet)
3. Open MediaPicker to Upload tab
4. Pass files to MediaUploadForm as `initialFiles`
5. User edits metadata in the form
6. User clicks "Upload" button
7. Files upload and media documents are created

#### Files to modify
- [ ] `packages/react/src/components/media/MediaPicker.tsx` — accept `defaultTab` and `initialFiles` props
- [ ] `packages/react/src/components/media/MediaUploadForm.tsx` — accept `initialFiles` prop
- [ ] `packages/react/src/components/fields/upload/EmptyInput.tsx` — capture File objects, don't upload
- [ ] `packages/react/src/components/fields/upload/Input.tsx` — manage pending files state

#### `packages/react/src/components/media/MediaPicker.tsx`

```ts
interface MediaPickerProps {
  targetCollection: MediaCollectionSlug;
  field: TypedFieldApi<string[]>;
  fieldDef: UploadField;
  multi: boolean;
  onSelect: (mediaIds: string[]) => void;
  onCancel: () => void;
+  /** Initial tab to show ("library" or "upload"). Default: "library". */
+  defaultTab?: "library" | "upload";
+  /** Pre-selected files to populate in the upload form (not uploaded yet). */
+  initialFiles?: File[];
}

export function MediaPicker({
  field,
  fieldDef,
  targetCollection,
  multi,
  onSelect,
  onCancel,
+  defaultTab = "library",
+  initialFiles = [],
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(field.state.value ?? []);

  const config = useVexConfig();
  const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === targetCollection);
  if (!targetCollectionConfig) {
    throw new Error(`Media collection "${targetCollection}" not found in config.`);
  }

  const handleSelect = () => {
    onSelect(selectedIds);
    setSelectedIds([]);
  };

  function handleUploadComplete(mediaIds: string[]) {
    onSelect(mediaIds);
    setSelectedIds([]);
  }

  function handleBackToLibrary() {}

  const label = fieldDef.hasMany
    ? targetCollectionConfig.labels.plural
    : targetCollectionConfig.labels.singular;
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="w-[90svw] !max-w-6xl">
        <div className="items-center flex gap-4">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Image" size={20} />
          </div>
          <div className="text">
            <h1 className="font-mono">
              Select {label} - <b className="text-primary">{fieldDef.label}</b>
            </h1>
            <p className="text-xs">Choose from the list below, or upload more</p>
          </div>
        </div>

-        <Tabs defaultValue="library">
+        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger
              value="library"
              render={
                <Button variant="ghost" icon="Folder">
                  Library
                </Button>
              }
            />
            <TabsTrigger
              value="upload"
              render={
                <Button variant="ghost" icon="Plus">
                  Upload
                </Button>
              }
            />
          </TabsList>

          <TabsContent value="library">
            {/* ... unchanged */}
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <MediaUploadForm
              fieldDef={fieldDef}
              collectionConfig={targetCollectionConfig}
              multi={fieldDef.hasMany}
              onComplete={handleUploadComplete}
              onCancel={handleBackToLibrary}
+              initialFiles={initialFiles}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

#### `packages/react/src/components/media/MediaUploadForm.tsx`

```ts
import { useEffect, useState } from "react";

interface MediaUploadFormProps {
  fieldDef: UploadField;
  collectionConfig: MediaCollectionConfig;
  multi: boolean;
  onComplete: (mediaIds: string[]) => void;
  onCancel: () => void;
+  /** Pre-selected files to populate in the form (not uploaded yet). */
+  initialFiles?: File[];
}

export function MediaUploadForm({
  fieldDef,
  collectionConfig,
  multi,
  onComplete,
  onCancel,
+  initialFiles = [],
}: MediaUploadFormProps) {
+  const [files, setFiles] = useState<File[]>(initialFiles);
+
+  // Sync initialFiles to local state when they change
+  useEffect(() => {
+    if (initialFiles.length > 0) {
+      setFiles(initialFiles);
+    }
+  }, [initialFiles]);

  // ... rest of existing MediaUploadForm implementation
  // When files are added via MediaUploadDropzone, append to the files array:
  // setFiles((prev) => [...prev, ...newFiles]);
  
  // The form now starts with pre-filled files from initialFiles
  // User can edit metadata, add more files, then click Upload
}
```

**Note:** `MediaUploadForm` may already handle file state internally. If so, just ensure it accepts `initialFiles` and pre-populates its internal file array. The key change is that `initialFiles` come from the empty dropzone capture, not from an upload.

#### `packages/react/src/components/fields/upload/EmptyInput.tsx`

```ts
import { Button } from "../../ui";
import { useCallback } from "react";
import type { MediaCollectionConfig } from "@vexcms/core";

/**
 * Props for UploadEmpty component.
 */
export interface UploadEmptyProps {
  /** Callback to open the media picker modal. */
  onPickerOpen: () => void;
-  /** Callback when a file is uploaded via dropzone. Opens picker to Upload tab. */
-  onFileUpload: (mediaId: string, openToUploadTab: boolean) => void;
+  /** Callback when files are selected via dropzone (NOT uploaded yet). */
+  onFilesSelected: (files: File[]) => void;
  /** The media collection config for the upload. */
  targetCollectionConfig: MediaCollectionConfig;
+  /** Whether the field is read-only. */
+  readOnly?: boolean;
}

/**
 * Empty state for upload field — shows basic dropzone and "Browse media library" button.
 *
 * This dropzone does NOT upload files immediately. It captures the File objects
 * and passes them to `onFilesSelected`, which opens the MediaPicker to the Upload
 * tab with those files pre-filled in the form.
 *
 * @param props - Component props.
 */
export function UploadEmpty({
  onPickerOpen,
-  onFileUpload,
+  onFilesSelected,
  targetCollectionConfig,
+  readOnly,
}: UploadEmptyProps) {
+  const handleDrop = useCallback(
+    (e: React.DragEvent<HTMLDivElement>) => {
+      e.preventDefault();
+      if (readOnly) return;
+      
+      const files = Array.from(e.dataTransfer.files);
+      if (files.length > 0) {
+        onFilesSelected(files);
+      }
+    },
+    [onFilesSelected, readOnly],
+  );
+
+  const handleFileInput = useCallback(
+    (e: React.ChangeEvent<HTMLInputElement>) => {
+      const files = Array.from(e.target.files || []);
+      if (files.length > 0) {
+        onFilesSelected(files);
+      }
+    },
+    [onFilesSelected],
+  );
+
  return (
    <div className="flex flex-col gap-2">
-      <MediaUploadDropzone
-        targetCollection={targetCollectionConfig.slug}
-        adapterName={targetCollectionConfig.meta.storageAdapter}
-        onUploadComplete={(mediaId) => onFileUpload(mediaId, true)}
-      />
+      <div
+        onDrop={handleDrop}
+        onDragOver={(e) => e.preventDefault()}
+        className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-8 text-center transition-colors hover:border-primary"
+      >
+        <input
+          type="file"
+          multiple
+          onChange={handleFileInput}
+          className="absolute inset-0 cursor-pointer opacity-0"
+          disabled={readOnly}
+          accept={targetCollectionConfig.accept?.join(",") || undefined}
+        />
+        <div className="pointer-events-none space-y-2">
+          <div className="text-muted-foreground">
+            <p className="text-sm">Drop files here or click to browse</p>
+          </div>
+        </div>
+      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPickerOpen}
        className="self-start"
        icon="Folder"
+        disabled={readOnly}
      >
        Browse media library
      </Button>
    </div>
  );
}
```

#### `packages/react/src/components/fields/upload/Input.tsx`

```ts
export const UploadFieldInput = createFieldInput<string[], UploadField>(
  ({ name, fieldDef, field, readOnly }) => {
    const [activeField, setActiveField] = useQueryState(MODALS.editMedia.urlParam, parseAsString);
+    const [defaultTab, setDefaultTab] = useState<"library" | "upload">("library");
+    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const isOpen = activeField === name;
    const value = field.state.value || [];
    const config = useVexConfig();

    const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === fieldDef.to);
    if (!targetCollectionConfig) {
      throw new Error(`Media collection "${fieldDef.to}" not found in config.`);
    }

    async function openPicker() {
      await setActiveField(name);
    }
    
    async function closePicker() {
      await setActiveField(null);
+      setDefaultTab("library"); // Reset to library on close
+      setPendingFiles([]); // Clear pending files
    }

    async function handleSelect(mediaIds: string[]) {
      field.handleChange(mediaIds);
      await closePicker();
    }

    function handleRemove(mediaId?: string) {
      if (mediaId) {
        field.handleChange(value.filter((id) => id !== mediaId));
      } else {
        field.handleChange([]);
      }
    }

    function handleReorder(from: number, to: number) {
      field.moveValue(from, to);
    }

+    function handleFilesSelected(files: File[]) {
+      // Capture files from empty dropzone (not uploaded yet)
+      setPendingFiles(files);
+      setDefaultTab("upload");
+      void openPicker();
+    }

    if (readOnly) {
      return (
        <>
          <FormLabel name={name} field={fieldDef} />
          {value.length > 0 ? (
            <UploadFilledState
              mediaIds={value}
              fieldApi={field}
              fieldDef={fieldDef}
              onRemove={handleRemove}
            />
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </>
      );
    }

    // Empty state
    if (value.length === 0) {
      return (
        <>
          <FormLabel name={name} field={fieldDef} />
          <UploadEmpty
            onPickerOpen={openPicker}
-            onFileUpload={handleFileUploadFromEmpty}
+            onFilesSelected={handleFilesSelected}
            targetCollectionConfig={targetCollectionConfig}
+            readOnly={readOnly}
          />
          {isOpen && (
            <MediaPicker
              field={field}
              fieldDef={fieldDef}
              targetCollection={fieldDef.to}
              multi={fieldDef.hasMany}
              onSelect={handleSelect}
              onCancel={closePicker}
              defaultTab={defaultTab}
+              initialFiles={pendingFiles}
            />
          )}
        </>
      );
    }

    // Filled state (single or multi)
    return (
      <>
        <FormLabel name={name} field={fieldDef} />
        <UploadFilledState
          mediaIds={value}
          fieldApi={field}
          fieldDef={fieldDef}
          onRemove={handleRemove}
          onReorder={handleReorder}
          openPicker={openPicker}
        />
        {isOpen && (
          <MediaPicker
            field={field}
            fieldDef={fieldDef}
            targetCollection={fieldDef.to}
            multi={fieldDef.hasMany}
            onSelect={handleSelect}
            onCancel={closePicker}
            defaultTab={defaultTab}
+            initialFiles={pendingFiles}
          />
        )}
      </>
    );
  },
);
```

#### Verify

```bash
cd apps/www
pnpm dev:app

# Navigate to an upload field (empty state)
# Drop files on the empty dropzone
# MediaPicker should open to the Upload tab
# The files should be pre-filled in the MediaUploadForm (NOT uploaded yet)
# User can edit metadata, add more files, then click Upload
# After clicking Upload, files upload and media documents are created
```

---

## Verification (mandatory)

```bash
# Typecheck all packages
pnpm typecheck

# Test all packages
pnpm test

# Lint
pnpm lint

# Run dev server
cd apps/www
pnpm dev:app

# Manual verification:
# 1. Blocks field — open blocks modal, URL shows ?editBlocks=<fieldName>
# 2. Blocks field — select multiple blocks, click "Add N blocks"
# 3. Theme toggle — toggle theme, refresh page multiple times, NO FOUC
# 4. Theme toggle — check <html> element has .dark class BEFORE React hydrates
# 5. Upload field — drop files on empty dropzone (no upload yet)
# 6. Upload field — picker opens to Upload tab with files pre-filled in form
# 7. Upload field — user can edit metadata, add more files, then click Upload
```

---

## Success Criteria

- [ ] Blocks modal state survives page refresh (URL param working)
- [ ] Multi-block add works — user can select 2+ blocks and add them all at once
- [ ] Theme toggle works in any React framework (no next-themes dependency)
- [ ] **No FOUC** — theme applies before React hydrates (ThemeScript working)
- [ ] Theme preference persists across sessions (localStorage)
- [ ] Upload empty state captures files (not upload), opens picker to Upload tab with files pre-filled in form
- [ ] User can edit metadata in MediaUploadForm before clicking Upload button
- [ ] No TypeScript errors (`pnpm typecheck` clean)
- [ ] No ESLint errors (`pnpm lint` clean)

---

## References

- [Spec 32 — Media Collection](./32-media-collection.md) — Media picker URL param pattern
- [Spec 31 — Blocks Field](./31-blocks-field.md) — Blocks field implementation
- [MODALS constants](../../packages/react/src/components/modals/constants.ts) — URL param registry
- [nuqs](https://nuqs.47ng.com/) — URL state management library
- [Tailwind dark mode](https://tailwindcss.com/docs/dark-mode) — `.dark` class pattern
