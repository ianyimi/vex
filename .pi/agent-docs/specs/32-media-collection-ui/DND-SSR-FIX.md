# DnD SSR Fix - Static Render → Interactive Upgrade

## Problem

DnD components (Droppable, Draggable, DragHandle) have a `mounted` check that hides content for ~50-200ms during client hydration, causing:
- Empty states flash before content appears
- Layout shift when content pops in
- Poor UX even though data is available immediately

## Solution

Make all DnD components render **static versions** on the server, then upgrade to interactive on the client. This eliminates the empty state flash while preserving SSR.

---

## Step 1: Share Mounted State via Context

**File**: `/packages/react/src/components/ui/dnd/DndProvider.tsx`

### Change 1A: Add `mounted` to Context Interface

Find the `DndContextValue` interface (around line 12) and add `mounted`:

```tsx
export interface DndContextValue {
  register: (
    id: string,
    handler: (from: number, to: number) => void,
  ) => () => void;
  /** The droppableId that currently owns the active drag, or null when idle. */
  activeDroppableId: string | null;
  /**
   * Stable UUID slots per droppable. Map<droppableId, UUID[]>.
   * One UUID per array item slot. Shifted by moveItemStableKey on each drag to
   * mirror TanStack Form's moveValue — so a UUID follows its item across reorders.
   * Lives outside <DragDropContext key={dndKey}> and survives every remount.
   */
  itemStableKeysRef: RefObject<Map<string, (string | undefined)[]>>;
  /**
   * Accordion open/closed state per stable key. Map<stableKey, boolean>.
   * For array-item group fields: stableKey is the slot UUID from itemStableKeysRef.
   * For top-level group fields: stableKey is the field name.
   * Lives outside <DragDropContext key={dndKey}> and survives every remount.
   */
  accordionStateRef: RefObject<Map<string, boolean>>;
  /** Whether DnD is mounted on the client (false on server). */
  mounted: boolean;  // ← ADD THIS LINE
}
```

### Change 1B: Add Mounted State to DndProvider

Find the `DndProvider` function (around line 70) and add mounted state at the start:

```tsx
export function DndProvider({ children }: { children: ReactNode }) {
  // ADD THIS:
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  // END ADD
  
  // Existing code:
  const registry = useRef(
    new Map<string, (from: number, to: number) => void>(),
  );
  const itemStableKeysRef = useRef(new Map<string, (string | undefined)[]>());
  const accordionStateRef = useRef(new Map<string, boolean>());
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(
    null,
  );
  const [dndKey, setDndKey] = useState(0);
  
  // ... rest of function
```

### Change 1C: Add Mounted to Context Value

Find the `contextValue` useMemo (around line 110) and add `mounted`:

```tsx
const contextValue = useMemo<DndContextValue>(
  () => ({
    register,
    activeDroppableId,
    itemStableKeysRef,
    accordionStateRef,
    mounted,  // ← ADD THIS LINE
  }),
  [register, activeDroppableId, mounted],  // ← Add mounted to deps array
);
```

### Change 1D: Conditionally Render DragDropContext

Find the return statement (around line 120) and wrap DragDropContext conditionally:

```tsx
return (
  <DndContext.Provider value={contextValue}>
    {mounted ? (
      <DragDropContext
        key={dndKey}
        onDragStart={(result) => {
          document.body.style.overflowX = "hidden";
          setActiveDroppableId(result.source.droppableId);
        }}
        onDragEnd={(result) => {
          document.body.style.overflowX = "";
          setActiveDroppableId(null);
          if (!result.destination) return;
          if (result.source.droppableId !== result.destination.droppableId)
            return;
          const droppableId = result.source.droppableId;
          const from = result.source.index;
          const to = result.destination.index;
          const handler = registry.current.get(result.source.droppableId);
          handler?.(result.source.index, result.destination.index);
          moveItemStableKey(droppableId, from, to);
          setDndKey((k) => k + 1);
        }}
      >
        {children}
      </DragDropContext>
    ) : (
      children
    )}
  </DndContext.Provider>
);
```

### Change 1E: Update useDndRegistry

Find the `useDndRegistry` function (around line 50) and add `mounted`:

```tsx
export function useDndRegistry() {
  const dnd = useContext(DndContext);
  if (!dnd) {
    throw new Error(
      "useDndContext must be called inside a DndProvider, or with access to a DndContext",
    );
  }
  return { 
    register: dnd.register, 
    activeDroppableId: dnd.activeDroppableId,
    mounted: dnd.mounted,  // ← ADD THIS LINE
  };
}
```

---

## Step 2: Update Droppable to Render Static Children

**File**: `/packages/react/src/components/ui/dnd/Droppable.tsx`

### Change 2A: Remove Local Mounted State

Find and **DELETE** these lines (around line 70-82):

```tsx
// DELETE THESE LINES:
const [mounted, setMounted] = useState(false);

// DELETE THESE LINES:
useEffect(() => {
  setMounted(true);
}, []);
```

### Change 2B: Get Mounted from Context

Replace the deleted lines with:

```tsx
const registry = useDndRegistry();
const activeDroppableId = registry?.activeDroppableId ?? null;
const mounted = registry?.mounted ?? false;  // ← ADD THIS LINE
```

So the full block looks like:

```tsx
export function Droppable({
  id,
  direction = "vertical",
  div,
  dndContext,
  children,
  wrapperKey,
  dndKey,
  onReorder,
  ...droppableProps
}: DroppableProps) {
  const registry = useDndRegistry();
  const activeDroppableId = registry?.activeDroppableId ?? null;
  const mounted = registry?.mounted ?? false;  // ← ADD THIS
  
  // Always keep a fresh ref to onReorder so registered handlers never stale-close.
  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  });

  // Register with the shared DragDropContext when DndProvider is present.
  useEffect(() => {
    if (!registry || !mounted) return;
    return registry.register(id, (from, to) => onReorderRef.current(from, to));
  }, [id, registry, mounted]);
  
  // ... rest of component
```

### Change 2C: Update Mounted Check to Render Static Children

Find the mounted check (around line 88-92) and replace:

```tsx
// REPLACE THIS:
if (!mounted) {
  return (
    <div suppressHydrationWarning className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]" />
  );
}

// WITH THIS:
if (!mounted) {
  const { className, ...divProps } = div ?? { className: "" };
  const wrapperClassName = cn(
    "flex flex-col gap-2 border-border rounded-sm",
    className,
  );
  
  return (
    <div suppressHydrationWarning className={wrapperClassName} {...divProps}>
      {/* Render children statically - they'll handle their own non-interactive state */}
      {children}
    </div>
  );
}
```

---

## Step 3: Update Draggable to Render Static Children

**File**: `/packages/react/src/components/ui/dnd/Draggable.tsx`

### Change 3A: Import DndContext

At the top of the file (around line 8), ensure you have:

```tsx
import { DndContext } from "./DndProvider";  // ← Add if not present
```

### Change 3B: Get Mounted from Context

Find the start of the `Draggable` function (around line 55) and add:

```tsx
export function Draggable({
  id,
  index,
  isDragHandle = false,
  children,
  div,
  ...draggableProps
}: DraggableProps) {
  // ADD THIS:
  const parentContext = useContext(DndContext);
  const mounted = parentContext?.mounted ?? false;
  
  // If not mounted, render static version
  if (!mounted) {
    const { className, ...divProps } = div ?? { className: "" };
    
    // Create a static context for DragHandle children
    const staticContext: DragHandleContextValue = {
      dragHandleProps: null,
      isDragging: false,
    };
    
    return (
      <DraggableInstanceContext.Provider value={staticContext}>
        <div className={className} {...divProps}>
          {typeof children === 'function' 
            ? null  // Can't call function children without DNDDraggable provided/snapshot
            : children
          }
        </div>
      </DraggableInstanceContext.Provider>
    );
  }
  // END ADD
  
  // Existing DNDDraggable code continues below:
  return (
    <DNDDraggable draggableId={id} index={index} {...draggableProps}>
      {(provided, snapshot, rubric) => {
        // ... existing code
      }}
    </DNDDraggable>
  );
}
```

---

## Step 4: Update DragHandle to Render Static Icon

**File**: `/packages/react/src/components/ui/dnd/DragHandle.tsx`

### Change 4A: Import DndContext

At the top of the file (around line 4), add:

```tsx
import { DndContext } from "./DndProvider";  // ← Add if not present
```

### Change 4B: Add Static Render Mode

Find the `DragHandle` function (around line 10) and add mounted check at the start:

```tsx
export function DragHandle({
  dragHandleProps: dragHandlePropsProp,
  children,
  className,
  ...divProps
}: {
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
} & ComponentPropsWithoutRef<"div">) {
  // ADD THIS:
  const parentContext = useContext(DndContext);
  const mounted = parentContext?.mounted ?? false;
  
  // If not mounted, render static grip icon (no drag functionality)
  if (!mounted) {
    if (children) {
      return (
        <div 
          className={cn("shrink-0 opacity-50 cursor-default", className)} 
          {...divProps}
        >
          {children}
        </div>
      );
    }
    
    return (
      <div 
        className={cn("shrink-0 opacity-50 cursor-default", className)} 
        {...divProps}
      >
        <GripVertical size={16} />
      </div>
    );
  }
  // END ADD
  
  // Existing interactive code:
  const ctx = useDraggableInstanceContext();
  const resolvedProps = dragHandlePropsProp ?? ctx.dragHandleProps ?? {};

  if (children) {
    return (
      <div
        className={cn("cursor-grab shrink-0", className)}
        {...resolvedProps}
        {...divProps}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("cursor-grab shrink-0", className)}
      {...resolvedProps}
      {...divProps}
    >
      <GripVertical size={16} />
    </div>
  );
}
```

---

## Summary of Changes

### Files Modified:

1. **`/packages/react/src/components/ui/dnd/DndProvider.tsx`**
   - Add `mounted: boolean` to `DndContextValue` interface
   - Add `useState` and `useEffect` for mounted state
   - Add `mounted` to context value
   - Conditionally render `DragDropContext` only when mounted
   - Add `mounted` to `useDndRegistry()` return

2. **`/packages/react/src/components/ui/dnd/Droppable.tsx`**
   - Remove local `mounted` state
   - Get `mounted` from context via `useDndRegistry()`
   - Update mounted check to render static children

3. **`/packages/react/src/components/ui/dnd/Draggable.tsx`**
   - Import `DndContext`
   - Get `mounted` from context
   - Add early return for static render when not mounted

4. **`/packages/react/src/components/ui/dnd/DragHandle.tsx`**
   - Import `DndContext`
   - Get `mounted` from context
   - Add early return for static render (grayed out, no cursor-grab)

---

## Expected Behavior After Fix

### Server Render:
- ✅ DndProvider provides context (no DragDropContext)
- ✅ Droppable renders plain div with all children visible
- ✅ Draggable renders plain div with all children visible
- ✅ DragHandle renders static grip icon (grayed out, `opacity-50`)
- ✅ Blocks field shows all 4 blocks immediately
- ✅ Upload field shows all 3 items immediately (with loading skeletons)

### Client Hydration:
- ✅ Same structure as server (no mismatch)
- ✅ No layout shift
- ✅ Content visible immediately

### Client After Mount (~50ms):
- ✅ `mounted = true`
- ✅ DragDropContext wraps children
- ✅ Droppable becomes interactive (DNDDroppable)
- ✅ Draggable becomes interactive (DNDDraggable)
- ✅ DragHandle becomes draggable (cursor-grab, full opacity)
- ✅ No layout shift - same structure, just upgraded

---

## Testing Checklist

- [ ] Page loads with blocks field visible immediately (no empty state)
- [ ] Page loads with upload field visible immediately (skeletons if data loading)
- [ ] No layout shift during page load
- [ ] No "flash of empty content"
- [ ] After ~50ms, drag handles become interactive (cursor-grab appears)
- [ ] Drag and drop works correctly after interactive upgrade
- [ ] Server logs show data present
- [ ] Client logs show data present
- [ ] No hydration errors in console
- [ ] No DnD errors in console

---

## Rollback Plan

If this breaks something, revert by:

1. Remove `mounted: boolean` from `DndContextValue`
2. Restore local `mounted` state in `Droppable.tsx`
3. Remove mounted checks from `Draggable.tsx` and `DragHandle.tsx`
4. Add `suppressHydrationWarning` to Droppable's placeholder div

---

## Why This Works

**The Key Insight**: `@hello-pangea/dnd` needs `DragDropContext` to exist before rendering its connected components (`DNDDroppable`, `DNDDraggable`). But we don't need those components on the server - we just need the visual structure.

By rendering static versions that look identical but have no DnD wiring, we get:
- Immediate content visibility (SSR)
- No layout shift (same structure)
- Graceful upgrade to interactive (client mount)
- No hydration errors (structure matches)

The `mounted` flag coordinated via context ensures all DnD components upgrade together at the same time.
