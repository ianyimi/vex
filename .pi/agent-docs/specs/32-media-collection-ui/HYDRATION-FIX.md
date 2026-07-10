# Hydration Error Fix - Droppable Component

## Error
```
Uncaught Error: Hydration failed because the server rendered HTML didn't match the client.

<div
+ className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]"
- className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center ..."
- role="presentation"
- tabindex="0"
>
- <input type="file" ... />
- <p className="text-sm text-muted-foreground">
```

**Location**: `/packages/react/src/components/ui/dnd/Droppable.tsx:90`

---

## Root Cause

The `Droppable` component has a `mounted` state check:

```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return (
    <div className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]" />
  );
}
```

**What happens:**
1. **Server**: `mounted = false` → renders placeholder div
2. **Client (hydration)**: `mounted = false` → expects placeholder div
3. **Client (after useEffect)**: `mounted = true` → renders full dropzone
4. **React**: Sees mismatch between server HTML and client expectation → error

The issue is that the server-rendered HTML is a simple placeholder, but somewhere the client is rendering the full upload dropzone UI during hydration.

---

## Solution 1: Suppress Hydration Warning (Quick Fix)

**File**: `/packages/react/src/components/ui/dnd/Droppable.tsx`

Change line 88-92:

```tsx
if (!mounted) {
  return (
    <div 
      suppressHydrationWarning  // ← Add this
      className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]" 
    />
  );
}
```

**Pros**: Quick fix, tells React to ignore the mismatch
**Cons**: Doesn't solve the underlying issue, just suppresses the warning

---

## Solution 2: Make Server Render Match Client (Recommended)

The mounted check exists to prevent `@hello-pangea/dnd` from running on the server (it needs browser APIs). But we need the **structure** to match.

**File**: `/packages/react/src/components/ui/dnd/Droppable.tsx`

Replace lines 83-92 with:

```tsx
// Render a static placeholder on server, then upgrade to interactive on client
if (!mounted) {
  const { className, ...divProps } = div ?? { className: "" };
  const wrapperClassName = cn(
    "flex flex-col gap-2 border-border rounded-sm",
    className,
  );
  
  return (
    <div 
      suppressHydrationWarning
      className={wrapperClassName}
      {...divProps}
    >
      {/* Render children statically - no DnD context */}
      {typeof children === "function" ? null : children}
    </div>
  );
}
```

**Pros**: Server renders the same structure as client
**Cons**: More complex, children might not render correctly if they expect DnD context

---

## Solution 3: Move Mounted Check to DndProvider (Best) ⭐

The real issue is that `Droppable` shouldn't control the mounted state - the parent `DndProvider` should.

**I checked - DndProvider does NOT have a mounted check.** It directly wraps children in `DragDropContext`, which causes the hydration issue.

**File**: `/packages/react/src/components/ui/dnd/DndProvider.tsx`

Add mounted check at the start of the component (after line 70):

```tsx
import { useEffect, useState } from "react";  // ← Add to existing imports

export function DndProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Existing refs and state
  const registry = useRef(...);
  const itemStableKeysRef = useRef(...);
  // ... etc
  
  // Add this AFTER all hooks but BEFORE the context value
  if (!mounted) {
    return <>{children}</>;  // Render children without DnD context on server
  }
  
  const contextValue = useMemo<DndContextValue>(...);
  
  return (
    <DndContext.Provider value={contextValue}>
      <DragDropContext ...>
        {children}
      </DragDropContext>
    </DndContext.Provider>
  );
}
```

Then **remove** the mounted check from `Droppable.tsx` entirely.

**File**: `/packages/react/src/components/ui/dnd/Droppable.tsx`

Delete lines 70-92:
```tsx
// DELETE THESE LINES (70-72):
const [mounted, setMounted] = useState(false);
const registry = useDndRegistry();
const activeDroppableId = registry?.activeDroppableId ?? null;

// DELETE LINES 74-80:
const onReorderRef = useRef(onReorder);
useEffect(() => {
  onReorderRef.current = onReorder;
});

useEffect(() => {
  setMounted(true);
}, []);

// DELETE LINES 82-92:
if (!mounted) {
  return (
    <div className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]" />
  );
}
```

And update line 95-99 to restore the registry calls:
```tsx
// Keep these (they were after the mounted check):
const registry = useDndRegistry();
const activeDroppableId = registry?.activeDroppableId ?? null;

const onReorderRef = useRef(onReorder);
useEffect(() => {
  onReorderRef.current = onReorder;
});

// Register with the shared DragDropContext when DndProvider is present.
useEffect(() => {
  if (!registry) return;  // ← Remove mounted check here
  return registry.register(id, (from, to) => onReorderRef.current(from, to));
}, [id, registry]);  // ← Remove mounted from deps
```

**Pros**: Centralizes SSR handling, cleaner architecture
**Cons**: Requires checking if DndProvider exists and how it works

---

## Solution 4: Dynamic Import (Nuclear Option)

Make the entire form client-only by dynamic importing with `ssr: false`.

**File**: `/packages/react/src/components/views/CollectionEditView.tsx`

But this would break SSR for the entire edit view, which is not ideal.

---

## Recommended Approach ⭐

**Use Solution 3** - it's the cleanest and most comprehensive fix.

### Step-by-Step:

1. **Add mounted check to DndProvider** (`/packages/react/src/components/ui/dnd/DndProvider.tsx`)
   - Import `useEffect` and `useState`
   - Add state and effect at component start
   - Return `<>{children}</>` when not mounted

2. **Remove mounted check from Droppable** (`/packages/react/src/components/ui/dnd/Droppable.tsx`)
   - Delete lines 70-92 (mounted state, effects, and early return)
   - Update useEffect deps to remove `mounted`

3. **Test thoroughly**
   - Page refresh with upload field
   - Drag and drop still works
   - No hydration errors in console

### Why This is Best:
- ✅ Centralized SSR handling
- ✅ All DnD components benefit
- ✅ No hydration mismatches
- ✅ Cleaner architecture
- ✅ Future-proof for other DnD components

### Fallback:
If Solution 3 causes issues, try Solution 1 (suppressHydrationWarning) as a temporary fix while debugging.

---

## Confirmed: DndProvider Structure

**File**: `/packages/react/src/components/ui/dnd/DndProvider.tsx`

✅ **Confirmed findings:**
- ❌ Does NOT have a mounted check
- ✅ Wraps everything in `DragDropContext` on line 116
- ✅ Used by `AppForm` which wraps the entire form

**File**: `/packages/react/src/components/form/AppForm.tsx`

Line 53:
```tsx
<DndProvider>
  <form ...>
    {props.children}
  </form>
</DndProvider>
```

**This means:**
- Adding mounted check to `DndProvider` will fix ALL dnd components at once
- No need for individual mounted checks in `Droppable`, `Draggable`, etc.
- Server renders form without DragDropContext, client hydrates then upgrades to interactive

---

## Test After Fix

1. Edit a page with an upload field that has media selected
2. Save the page
3. Reload the page (full page refresh)
4. Check console for hydration errors
5. Verify drag-and-drop still works after hydration

---

## Files to Edit (Solution 3)

### Primary Changes:
1. **`/packages/react/src/components/ui/dnd/DndProvider.tsx`**
   - Line ~8: Add `useEffect, useState` to imports
   - Line ~71: Add mounted state after function start
   - Line ~95: Add conditional return before contextValue

2. **`/packages/react/src/components/ui/dnd/Droppable.tsx`**
   - Lines 70-92: Delete mounted check
   - Line ~97: Remove `mounted` from useEffect deps

### Files to Verify (no changes needed):
- `/packages/react/src/components/form/AppForm.tsx` - wraps form in DndProvider
- `/packages/react/src/components/fields/upload/FilledInput.tsx` - uses Droppable
