# Hydration Error Fix - Complete Solution

## The Real Problem

The hydration error comes from a **mismatch between server and client rendering** in the DnD system.

### Why the Mounted Check Exists

The `mounted` check in `Droppable` was a **workaround** for a deeper architectural issue:

1. `@hello-pangea/dnd`'s `DragDropContext` uses browser APIs (DOM, events)
2. These APIs don't exist on the server
3. But components still need access to `DndContext` for the registry system
4. The mounted check prevented DnD from rendering on the server **while still allowing context access**

### What Went Wrong

When you moved the mounted check to `DndProvider`, it broke because:

```tsx
// DndProvider with early return
if (!mounted) {
  return <>{children}</>;  // ❌ No DndContext.Provider!
}

// Later, Droppable tries to use the context
const registry = useDndRegistry();  // ❌ Throws: context doesn't exist!
```

**Error**: `useDndContext must be called inside a DndProvider, or with access to a DndContext`

---

## The Correct Solution

We need to **provide the context on the server, but not render `DragDropContext`**.

### Step 1: Fix DndProvider

**File**: `/packages/react/src/components/ui/dnd/DndProvider.tsx`

**Add imports** (line ~8):
```tsx
import { useEffect, useState } from "react";  // Add to existing imports
```

**Add mounted state and conditional DragDropContext** (after line 92, before `return`):

```tsx
export function DndProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // All existing refs and state
  const registry = useRef(
    new Map<string, (from: number, to: number) => void>(),
  );
  const itemStableKeysRef = useRef(new Map<string, (string | undefined)[]>());
  const accordionStateRef = useRef(new Map<string, boolean>());
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);
  const [dndKey, setDndKey] = useState(0);

  // Existing register function
  const register = useCallback(
    (id: string, handler: (from: number, to: number) => void): (() => void) => {
      registry.current.set(id, handler);
      return () => {
        registry.current.delete(id);
      };
    },
    [],
  );

  // Existing moveItemStableKey function
  function moveItemStableKey(droppableId: string, from: number, to: number) {
    const slots = itemStableKeysRef.current.get(droppableId);
    if (!slots) return;
    const [moved] = slots.splice(from, 1);
    slots.splice(to, 0, moved);
  }

  const contextValue = useMemo<DndContextValue>(
    () => ({
      register,
      activeDroppableId,
      itemStableKeysRef,
      accordionStateRef,
    }),
    [register, activeDroppableId],
  );

  // ADD THIS: Client-only mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // MODIFY THIS: Always provide context, but conditionally render DragDropContext
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
}
```

### Step 2: Remove Mounted Check from Droppable

**File**: `/packages/react/src/components/ui/dnd/Droppable.tsx`

**Delete lines 70-92**:
```tsx
// DELETE THESE LINES:
const [mounted, setMounted] = useState(false);
const registry = useDndRegistry();
const activeDroppableId = registry?.activeDroppableId ?? null;

// Always keep a fresh ref to onReorder so registered handlers never stale-close.
const onReorderRef = useRef(onReorder);
useEffect(() => {
  onReorderRef.current = onReorder;
});

useEffect(() => {
  setMounted(true);
}, []);

// Register with the shared DragDropContext when DndProvider is present.
useEffect(() => {
  if (!registry || !mounted) return;
  return registry.register(id, (from, to) => onReorderRef.current(from, to));
}, [id, registry, mounted]);

if (!mounted) {
  return (
    <div className="flex flex-col gap-2 border-border rounded-sm min-h-[4px]" />
  );
}
```

**Replace with (keep these hooks, remove mounted logic)**:
```tsx
const registry = useDndRegistry();
const activeDroppableId = registry?.activeDroppableId ?? null;

// Always keep a fresh ref to onReorder so registered handlers never stale-close.
const onReorderRef = useRef(onReorder);
useEffect(() => {
  onReorderRef.current = onReorder;
});

// Register with the shared DragDropContext when DndProvider is present.
useEffect(() => {
  if (!registry) return;  // Remove mounted check
  return registry.register(id, (from, to) => onReorderRef.current(from, to));
}, [id, registry]);  // Remove mounted from deps
```

---

## Additional Fix: Blocks Field Loading State

To prevent layout shift when loading blocks with relationship fields or upload fields, add skeleton loading states.

### Step 3: Add Skeleton to FormBlocks

**File**: `/packages/react/src/components/form/FormBlocks.tsx`

**Add Skeleton import** (line ~27):
```tsx
import { Skeleton } from "../ui/skeleton";
```

**Update UploadItemRow equivalent in FormBlocks**:

The blocks field doesn't fetch data itself (it's all in the form state), but if your blocks contain upload or relationship fields, those individual field components handle their own loading.

However, to prevent **initial layout shift during form hydration**, add a loading state to the entire FormBlocks component:

**Add after line 173** (start of FormBlocks component):
```tsx
export function FormBlocks(props: FormBlocksProps) {
  const { name, field, fieldDef, readOnly, submissionAttempts, className } = props;
  const form = useContext(AppFormContext);
  
  // ADD THIS: Track initial hydration
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!form) {
    return (
      <p className="text-sm text-destructive">
        FormBlocks[{name}] must be used inside an AppForm.
      </p>
    );
  }

  const items = (field.state.value ?? []) as GenericBlock[];
  
  // ADD THIS: Show skeleton during initial load if items exist
  if (!isHydrated && items.length > 0) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="flex flex-col gap-2">
          {items.map((_, index) => (
            <div 
              key={index}
              className="rounded-sm border-2 border-border bg-muted/40 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ... rest of component (existing code)
```

**Why this helps:**
- Server renders with block data
- Client hydrates and briefly shows skeleton
- After useEffect, shows real interactive blocks
- Prevents flash of wrong structure during DnD initialization

---

## Alternative: Simpler Skeleton for Blocks

If the above is too invasive, just add skeletons to **individual block rows** while they render:

**File**: `/packages/react/src/components/form/FormBlocks.tsx`

Inside the `items.map()` loop (around line 247), add loading check:

```tsx
{items.map((item, index) => {
  const blockSlug = item.blockType as string;
  const blockDef = blockDefMap.get(blockSlug);
  const itemKey = (item.id as string) ?? String(index);
  
  // ADD THIS: Check if sub-fields are loading
  const hasUploadOrRelationship = blockDef && 
    Object.values(blockDef.fields).some(f => 
      f.type === 'upload' || f.type === 'relationship'
    );

  if (!blockDef) {
    return (
      <div key={itemKey} className="...">
        Unknown block type: <code>{blockSlug}</code>
        ...
      </div>
    );
  }

  return (
    <Draggable key={itemKey} id={`${name}-${itemKey}`} index={index}>
      <AccordionItem value={itemKey} className="...">
        {/* Existing header */}
        <AccordionPrimitive.Header className="...">
          <DragHandle />
          {/* ... rest of header */}
        </AccordionPrimitive.Header>

        {/* Content - show skeleton during initial render if has async fields */}
        <AccordionContent className="px-3 pt-3">
          <div className="flex flex-col gap-4 pt-3">
            {subFields.length === 0 ? (
              <p className="...">This block has no configurable fields.</p>
            ) : (
              subFields.map(([fieldKey, subFieldDef]) => {
                const SubInput = fieldToInputComponent(subFieldDef.type);
                if (!SubInput) return null;
                
                // Each field component (upload, relationship) handles its own loading
                return (
                  <SubInput
                    key={fieldKey}
                    name={`${name}[${index}].${fieldKey}`}
                    fieldDef={subFieldDef as any}
                    readOnly={readOnly || subFieldDef.admin.readOnly}
                  />
                );
              })
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Draggable>
  );
})}
```

The individual field components (upload, relationship) already handle their own loading states with skeletons, so you don't need to add anything else to FormBlocks.

---

## Summary of Changes

### Required (Fixes Hydration Error):
1. **`/packages/react/src/components/ui/dnd/DndProvider.tsx`**
   - Add `useState` and `useEffect`
   - Add mounted state
   - Conditionally render `DragDropContext` but always provide `DndContext.Provider`

2. **`/packages/react/src/components/ui/dnd/Droppable.tsx`**
   - Remove mounted state and early return
   - Remove mounted from useEffect deps

### Optional (Reduces Layout Shift):
3. **`/packages/react/src/components/form/FormBlocks.tsx`**
   - Add Skeleton import
   - Add hydration state check
   - Show skeleton during initial render

---

## Why This Architecture?

```
Server Render:
└─ DndContext.Provider (✅ exists)
   └─ children (no DragDropContext)
      └─ Droppable
         └─ useDndRegistry() (✅ context available)
         └─ Renders static HTML

Client Hydration:
└─ DndContext.Provider (✅ exists)
   └─ children (no DragDropContext yet)
      └─ Droppable
         └─ useDndRegistry() (✅ context available)
         └─ Matches server HTML (✅ no error)

Client After Mount:
└─ DndContext.Provider (✅ exists)
   └─ DragDropContext (✅ now active!)
      └─ children
         └─ Droppable
            └─ useDndRegistry() (✅ context available)
            └─ Drag and drop works!
```

**Key insight**: Context can exist without DragDropContext. The context provides the registry system, DragDropContext provides the drag-and-drop behavior.

---

## Testing Checklist

- [ ] Edit a page with blocks field
- [ ] Edit a page with upload field
- [ ] Save and reload page (full refresh)
- [ ] No hydration errors in console
- [ ] Drag and drop works in blocks field
- [ ] Drag and drop works in upload field (multi)
- [ ] Upload field shows skeletons during load
- [ ] Blocks field renders without layout shift
- [ ] Nested blocks (blocks within blocks) work if applicable

---

## Files Modified

1. `/packages/react/src/components/ui/dnd/DndProvider.tsx` (add mounted check, conditional DragDropContext)
2. `/packages/react/src/components/ui/dnd/Droppable.tsx` (remove mounted check)
3. `/packages/react/src/components/form/FormBlocks.tsx` (optional: add skeleton during hydration)
