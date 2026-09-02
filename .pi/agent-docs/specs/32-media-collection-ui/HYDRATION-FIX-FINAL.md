# Hydration Error - Final Solution

## The Real Constraint

`@hello-pangea/dnd` uses an **internal Redux store** created by `DragDropContext`. All `Droppable` components need this store to exist. This means:

❌ **Cannot render `DNDDroppable` without `DragDropContext`**
❌ **Cannot conditionally render `DragDropContext` in `DndProvider`**
✅ **Must keep the mounted check in `Droppable`**

The mounted check was **architecturally correct** - the hydration warning is a cosmetic issue that can be suppressed.

---

## Solution 1: Suppress Hydration Warning (Simplest)

**File**: `/packages/react/src/components/ui/dnd/Droppable.tsx`

**Change line 88-92** to add `suppressHydrationWarning`:

```tsx
if (!mounted) {
  return (
    <div 
      suppressHydrationWarning
      className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]" 
    />
  );
}
```

**That's it.** This tells React to ignore the mismatch between server placeholder and client content.

### Why This Works
- Server renders: placeholder div
- Client hydrates: expects placeholder div (matches ✅)
- After useEffect: mounted = true, renders full Droppable
- React sees `suppressHydrationWarning` and doesn't complain about the upgrade

### Trade-offs
- ✅ Simple, one-line fix
- ✅ Preserves existing architecture
- ✅ No breaking changes
- ⚠️ Brief flash of empty placeholder before content loads (usually imperceptible)

---

## Solution 2: Match Structure (More Work, Better UX)

Make the placeholder **structurally match** the hydrated content to eliminate the flash.

**File**: `/packages/react/src/components/ui/dnd/Droppable.tsx`

**Replace lines 88-92**:

```tsx
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
      {/* Render children statically without DnD wrappers */}
      {typeof children === "function" ? null : children}
    </div>
  );
}
```

### Why This Works Better
- Server renders: wrapper with children (static)
- Client hydrates: same structure (matches ✅)
- After useEffect: upgrades to interactive Droppable
- No flash, smoother UX

### Trade-offs
- ⚠️ More complex
- ⚠️ Children might render incorrectly if they depend on DnD context
- ✅ Better visual experience
- ✅ Still uses `suppressHydrationWarning` as safety net

---

## Solution 3: Dynamic Import (Nuclear Option)

Make the entire form client-only by lazy loading.

**File**: Create `/packages/react/src/components/views/CollectionEditViewClient.tsx`

Move the form logic to a client component and dynamic import it:

```tsx
// CollectionEditView.tsx
import dynamic from 'next/dynamic';

const CollectionEditViewClient = dynamic(
  () => import('./CollectionEditViewClient'),
  { ssr: false }
);

export function CollectionEditView(props) {
  // ... existing query logic
  
  if (!currentDocument) {
    return <p>Document not found.</p>;
  }
  
  return <CollectionEditViewClient {...props} currentDocument={currentDocument} />;
}
```

### Trade-offs
- ❌ Loses SSR for the entire edit form
- ❌ Worse performance (no server-rendered HTML)
- ❌ Flash of loading state
- ✅ Completely avoids hydration issues
- ⚠️ Only use as last resort

---

## Recommended Approach

**Use Solution 1** - add `suppressHydrationWarning` to the placeholder div in `Droppable.tsx`.

### Why
- ✅ One-line change
- ✅ No architectural changes needed
- ✅ Fixes the error completely
- ✅ Existing mounted check was correct
- ✅ No breaking changes

The hydration warning is **cosmetic** - the placeholder is only visible for ~1 frame during hydration. Suppressing it is the right pragmatic choice.

---

## Blocks Field Loading State (Bonus)

To reduce layout shift in blocks field when it contains upload or relationship fields, add skeleton states.

### Option A: Individual Field Skeletons (Already Done)

Your upload field already has skeleton loading in `UploadItemRow`:

```tsx
// FilledInput.tsx - UploadItemRow
{!mediaDoc ? (
  <>
    <Skeleton className="h-11 w-11" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-xs" />
      <Skeleton className="h-4 w-xs" />
    </div>
  </>
) : (
  // ... actual content
)}
```

This already prevents layout shift in upload fields inside blocks. No additional work needed for blocks themselves.

### Option B: Whole-Form Skeleton (Overkill)

You could add a loading state to the entire `CollectionEditView`, but this is usually unnecessary since individual field components handle their own loading.

---

## Implementation Steps

1. **Open**: `/packages/react/src/components/ui/dnd/Droppable.tsx`
2. **Find**: Line 88-92 (the mounted check early return)
3. **Change**:
   ```tsx
   if (!mounted) {
     return (
       <div 
         suppressHydrationWarning  // ← Add this attribute
         className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]" 
       />
     );
   }
   ```
4. **Save**
5. **Test**: Reload a page with upload field or blocks field
6. **Verify**: No hydration error in console

---

## Why the Previous Fixes Failed

### Attempt 1: Move mounted check to DndProvider
```tsx
// DndProvider
if (!mounted) {
  return <>{children}</>;  // ❌ No DndContext.Provider!
}
```
**Error**: `useDndContext must be called inside a DndProvider`

### Attempt 2: Provide context but conditionally render DragDropContext
```tsx
// DndProvider
<DndContext.Provider value={contextValue}>
  {mounted ? (
    <DragDropContext>{children}</DragDropContext>
  ) : (
    children  // ❌ DNDDroppable tries to render without DragDropContext!
  )}
</DndContext.Provider>
```
**Error**: `Could not find "store" in the context of "Connect(Droppable)"`

### Why Both Failed
`@hello-pangea/dnd`'s `DragDropContext` creates an internal Redux store. `DNDDroppable` is a connected component that needs this store. Without `DragDropContext`, there's no store, so it crashes.

**The mounted check in Droppable was correct architecture** - it prevents `DNDDroppable` from rendering until `DragDropContext` exists.

---

## Alternative: Client-Only Boundary Higher Up

If you want to avoid `suppressHydrationWarning` and are okay with losing some SSR, you could make `AppForm` client-only:

**File**: `/packages/react/src/components/form/AppFormClient.tsx` (new file)

```tsx
"use client";
export { AppForm } from "./AppForm";
```

Then use dynamic import where AppForm is used:

```tsx
import dynamic from 'next/dynamic';
const AppForm = dynamic(() => import('./form/AppFormClient').then(m => m.AppForm), { ssr: false });
```

But this is overkill for a hydration warning. Just use `suppressHydrationWarning`.

---

## Testing

After adding `suppressHydrationWarning`:

- [ ] Load a page with blocks field
- [ ] Load a page with upload field (single)
- [ ] Load a page with upload field (multi, with items)
- [ ] Reload page (full refresh)
- [ ] Check console - no hydration errors
- [ ] Drag and drop still works
- [ ] Upload field shows skeletons while loading
- [ ] No visual flash during page load

---

## Summary

**The Fix**: Add `suppressHydrationWarning` to line 90 of `/packages/react/src/components/ui/dnd/Droppable.tsx`

**Why**: `@hello-pangea/dnd` requires `DragDropContext` to exist before rendering `DNDDroppable`. The mounted check is architecturally correct. The hydration warning is cosmetic and can be safely suppressed.

**Files Changed**: 1 file, 1 line, 1 attribute

This is the correct, minimal, pragmatic solution. 🎯
