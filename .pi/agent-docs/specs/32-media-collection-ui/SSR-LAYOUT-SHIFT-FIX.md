# SSR Layout Shift Fix - Empty Fields on Initial Render

## The Problem

**Current behavior**:
1. **Server render**: Blocks field EMPTY, upload field EMPTY (❌ wrong - data exists!)
2. **Client hydration**: Upload shows skeleton, blocks pop in (⚠️ layout shift)
3. **After fetch**: Upload shows final loaded state

**Expected behavior**:
1. **Server render**: Blocks with data, upload with loading skeleton
2. **Client hydration**: Same (no shift)
3. **After fetch**: Upload shows final loaded state

---

## Root Cause

The server is fetching the data in `NextAdminPage.tsx` but the client components are **not using the SSR'd data properly** during initial render.

### File Flow:

**1. Server Component** - `/packages/next/src/NextAdminPage.tsx` (line ~71)
```tsx
const initialData = await fetchQuery(vexConvexApi.get, {
  id: documentId,
});

return (
  <CollectionEditView
    collection={collection}
    documentId={documentId}
    initialData={initialData}  // ✅ Data passed as prop
  />
);
```

**2. Client Component** - `/packages/react/src/components/views/CollectionEditView.tsx` (line ~50)
```tsx
const { data: currentDocument } = useQuery({
  ...get({ id: props.documentId }),
  initialData: props.initialData,  // ✅ Initial data provided
});

const form = useCollectionForm({
  document: currentDocument,  // ⚠️ But currentDocument might be undefined on first render
  collection: props.collection,
  onSubmit: async ({ value }) => { ... },
});
```

**The issue**: Even though `initialData` is passed to `useQuery`, TanStack Query might not make it **synchronously available** on the server render.

---

## Diagnosis: Check What's Actually Rendering

### Step 1: Verify Data Exists on Server

**File**: `/packages/next/src/NextAdminPage.tsx`

Add logging before return:
```tsx
const initialData = await fetchQuery(vexConvexApi.get, {
  id: documentId,
});

console.log('[SERVER] Fetched document:', {
  id: documentId,
  hasBlocks: !!initialData?.blocks,
  blocksCount: initialData?.blocks?.length,
  hasTestImage: !!initialData?.testImage,
});

return <CollectionEditView ... />;
```

### Step 2: Verify Data Available in CollectionEditView

**File**: `/packages/react/src/components/views/CollectionEditView.tsx`

Add logging at component start:
```tsx
export function CollectionEditView<...>(props: CollectionEditViewProps<...>) {
  console.log('[CollectionEditView] Props:', {
    hasInitialData: !!props.initialData,
    initialDataBlocks: props.initialData?.blocks?.length,
    initialDataTestImage: props.initialData?.testImage,
  });

  const { data: currentDocument } = useQuery({
    ...get({ id: props.documentId as any }),
    initialData: props.initialData,
  });

  console.log('[CollectionEditView] currentDocument:', {
    hasCurrent: !!currentDocument,
    currentBlocks: currentDocument?.blocks?.length,
    currentTestImage: currentDocument?.testImage,
  });

  if (!currentDocument) {
    return <p>Document not found.</p>;
  }

  // ... rest
}
```

### Step 3: Check Form Initialization

**File**: `/packages/react/src/hooks/useCollectionForm.ts`

Check if form initializes with correct values:
```tsx
// Add logging to see what the form receives
console.log('[useCollectionForm] Initializing with:', {
  documentId: document._id,
  hasBlocks: !!document.blocks,
  blocksCount: document.blocks?.length,
  testImage: document.testImage,
});
```

---

## Likely Issues & Fixes

### Issue 1: `useQuery` Not Synchronous with `initialData`

**Problem**: TanStack Query's `useQuery` with `initialData` might not be synchronous on server render.

**File**: `/packages/react/src/components/views/CollectionEditView.tsx`

**Current**:
```tsx
const { data: currentDocument } = useQuery({
  ...get({ id: props.documentId as any }),
  initialData: props.initialData,
});

if (!currentDocument) {
  return <p>Document not found.</p>;
}
```

**Fix - Use initialData directly during SSR**:
```tsx
const { data: currentDocument } = useQuery({
  ...get({ id: props.documentId as any }),
  initialData: props.initialData,
});

// Use initialData as fallback during SSR
const document = currentDocument ?? props.initialData;

if (!document) {
  return <p>Document not found.</p>;
}

const form = useCollectionForm({
  document: document,  // ← Now guaranteed to have data
  collection: props.collection,
  onSubmit: async ({ value }) => { ... },
});
```

---

### Issue 2: Client-Only Rendering in Field Components

**Problem**: Field components might have client-only checks that prevent SSR.

**File**: `/packages/react/src/components/fields/blocks/Input.tsx`

Check if there's any `typeof window !== 'undefined'` or `useEffect` that prevents initial render.

**File**: `/packages/react/src/components/fields/upload/Input.tsx`

Same check - look for client-only guards.

---

### Issue 3: FormArray/FormBlocks Not Rendering Initial Values

**File**: `/packages/react/src/components/form/FormBlocks.tsx`

Check if the component waits for form state to be ready:

```tsx
export function FormBlocks(props: FormBlocksProps) {
  const { field, fieldDef } = props;
  
  console.log('[FormBlocks] Rendering with:', {
    fieldValue: field.state.value,
    itemsCount: field.state.value?.length,
  });
  
  const items = (field.state.value ?? []) as GenericBlock[];
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className="rounded-sm border-2 border-dashed ...">
        <p>No {plural} yet.</p>  // ← This might be rendering when it shouldn't
      </div>
    );
  }
  
  // ... rest
}
```

**Potential fix**: Check if field is initialized before showing empty state:

```tsx
const items = (field.state.value ?? []) as GenericBlock[];
const isInitialized = field.state.meta.isTouched || items.length > 0;

// Show nothing during SSR/initial hydration if not initialized
if (!isInitialized) {
  return null;  // Or a skeleton matching the expected structure
}

if (items.length === 0) {
  return <div>Empty state</div>;
}
```

---

### Issue 4: Upload Field Rendering Empty Instead of Skeleton

**File**: `/packages/react/src/components/fields/upload/Input.tsx`

Check the conditional rendering logic:

```tsx
export function UploadFieldInput(props: UploadFieldInputProps) {
  // ...
  
  return (
    <form.Field name={props.name}>
      {(field) => {
        const value = field.state.value;
        const mediaIds = Array.isArray(value) ? value : value ? [value] : [];
        
        console.log('[UploadFieldInput] Rendering:', {
          name: props.name,
          hasValue: !!value,
          mediaIdsCount: mediaIds.length,
        });
        
        // Empty state check - might be too eager
        if (mediaIds.length === 0) {
          return <EmptyInput ... />;  // ← This renders when it shouldn't
        }
        
        return <FilledInput mediaIds={mediaIds} ... />;
      }}
    </form.Field>
  );
}
```

**Potential fix**: Check if form is initialized:

```tsx
{(field) => {
  const value = field.state.value;
  const mediaIds = Array.isArray(value) ? value : value ? [value] : [];
  const isInitializing = !field.state.meta.isTouched && field.state.meta.isValidating;
  
  // During SSR/initialization, show skeleton if value exists
  if (isInitializing && mediaIds.length > 0) {
    return <FilledInput mediaIds={mediaIds} ... />;  // Will show skeletons
  }
  
  if (mediaIds.length === 0) {
    return <EmptyInput ... />;
  }
  
  return <FilledInput mediaIds={mediaIds} ... />;
}}
```

---

## Recommended Fix Order

### 1. **Add Logging First** (Diagnose)

Add console.logs to:
- `/packages/next/src/NextAdminPage.tsx` - verify server fetch
- `/packages/react/src/components/views/CollectionEditView.tsx` - verify props received
- `/packages/react/src/components/form/FormBlocks.tsx` - verify field value
- `/packages/react/src/components/fields/upload/Input.tsx` - verify field value

**Goal**: Identify exactly where the data is lost.

### 2. **Fix CollectionEditView** (Most Likely Fix)

**File**: `/packages/react/src/components/views/CollectionEditView.tsx`

Change:
```tsx
const { data: currentDocument } = useQuery({
  ...get({ id: props.documentId as any }),
  initialData: props.initialData,
});

// Use initialData as fallback
const document = currentDocument ?? props.initialData;

if (!document) {
  return <p>Document not found.</p>;
}

const form = useCollectionForm({
  document: document,  // ← Guaranteed to have data
  collection: props.collection,
  onSubmit: async ({ value }) => { ... },
});
```

### 3. **Fix Field Empty State Logic** (If Issue Persists)

**File**: `/packages/react/src/components/fields/upload/Input.tsx`

Ensure it doesn't show `EmptyInput` when initializing with existing data.

**File**: `/packages/react/src/components/form/FormBlocks.tsx`

Ensure it doesn't show empty state when initializing with existing blocks.

---

## Alternative: Suspense Boundaries

If the above doesn't work, you might need to use React Suspense to handle the async query properly.

**File**: `/packages/next/src/NextAdminPage.tsx`

Wrap in Suspense:
```tsx
import { Suspense } from 'react';

return (
  <Suspense fallback={<CollectionEditViewSkeleton />}>
    <CollectionEditView
      collection={collection}
      documentId={documentId}
      initialData={initialData}
    />
  </Suspense>
);
```

But this is overkill if the data is already fetched.

---

## Expected Result After Fix

**Server render**:
```html
<!-- Blocks field with data -->
<div>
  <div>Block 1: Hero</div>
  <div>Block 2: Content</div>
</div>

<!-- Upload field with skeleton -->
<div>
  <div class="skeleton h-11 w-11"></div>
  <div class="skeleton h-4 w-32"></div>
</div>
```

**Client hydration**:
```html
<!-- Same structure - no layout shift! -->
<div>
  <div>Block 1: Hero</div>
  <div>Block 2: Content</div>
</div>

<div>
  <div class="skeleton h-11 w-11"></div>  <!-- Still loading media doc -->
  <div class="skeleton h-4 w-32"></div>
</div>
```

**After media fetch**:
```html
<!-- Blocks unchanged -->
<div>
  <div>Block 1: Hero</div>
  <div>Block 2: Content</div>
</div>

<!-- Upload now shows real data -->
<div>
  <img src="..." />
  <div>image.jpg</div>
</div>
```

**No layout shift!** ✅

---

## Files to Check/Edit

1. **`/packages/react/src/components/views/CollectionEditView.tsx`** - Use `initialData` fallback
2. **`/packages/react/src/components/fields/upload/Input.tsx`** - Fix empty state logic
3. **`/packages/react/src/components/form/FormBlocks.tsx`** - Fix empty state logic
4. **`/packages/react/src/hooks/useCollectionForm.ts`** - Verify initialization

---

## Testing Checklist

- [ ] Add console.logs to trace data flow
- [ ] Reload page with existing blocks - blocks visible immediately
- [ ] Reload page with existing upload - skeleton visible immediately
- [ ] No empty states during initial render
- [ ] No layout shift during hydration
- [ ] Upload field upgrades from skeleton to real data smoothly
- [ ] Check in Network tab - only one document fetch (server-side)
- [ ] Check in React DevTools - verify props/state values

---

## Summary

**The core issue**: `useQuery` with `initialData` might not make the data synchronously available, causing form to initialize with undefined/empty values.

**The fix**: Use `currentDocument ?? props.initialData` to guarantee data is available during SSR and initial client render.

**Expected outcome**: Zero layout shift, blocks render immediately, upload shows skeleton then upgrades to real content.
