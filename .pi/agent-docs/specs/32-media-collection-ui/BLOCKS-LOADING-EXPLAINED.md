# Blocks Field Loading Behavior - Explained

## Why You're Seeing Loading States

The **blocks field data itself** loads immediately with the document. But **sub-fields inside blocks** that reference other documents cause loading states.

---

## What Loads Immediately

✅ **The blocks array structure**:
```tsx
// From the document fetch
{
  blocks: [
    {
      id: "uuid-1",
      blockType: "hero",
      blockName: "Homepage Hero",
      title: "Welcome",
      image: "k5j7abc...",  // ← Just an ID, loads immediately
    }
  ]
}
```

---

## What Causes Loading States

❌ **Upload fields** - Fetch the full media document:

```tsx
// blocks[0].image contains just an ID: "k5j7abc..."
// But UploadItemRow needs the full media document:
const { data: mediaDoc, isPending } = useQuery({ 
  ...convexQuery(vexConvexApi.get, { id: "k5j7abc..." })
});
// ↑ This causes the loading state
```

**File**: `/packages/react/src/components/fields/upload/FilledInput.tsx` (line ~120)

```tsx
function UploadItemRow({ mediaId, ... }) {
  const { data: doc, isPending } = useQuery({ 
    ...convexQuery(vexConvexApi.get, { id: mediaId }) 
  });
  const mediaDoc = doc as VexMediaDocument | null | undefined;

  return (
    <div className="...">
      {!mediaDoc ? (
        <Skeleton className="h-11 w-11" />  // ← Loading state
      ) : (
        <FilePreview mediaDoc={mediaDoc} />  // ← Real content
      )}
    </div>
  );
}
```

❌ **Relationship fields** - Fetch the related document:

```tsx
// Similar pattern - the blocks have IDs, but need full documents
const { data: relatedDoc } = useQuery({
  ...convexQuery(vexConvexApi.get, { id: relationship.value })
});
```

**File**: Likely in `/packages/react/src/components/fields/relationship/Input.tsx`

---

## Example Scenario

You have a page with blocks:

```tsx
// Initial document load (FAST - comes from server)
{
  _id: "k5page123",
  title: "Homepage",
  blocks: [
    {
      id: "uuid-1",
      blockType: "hero",
      image: "k5media456",        // ← Just an ID
      relatedPost: "k5post789",   // ← Just an ID
    }
  ]
}
```

Then inside the blocks form:
1. ✅ Block structure renders immediately
2. ❌ Upload field starts fetching `k5media456` → shows skeleton
3. ❌ Relationship field starts fetching `k5post789` → shows skeleton
4. ✅ After ~50-200ms, both resolve → show real content

---

## Is This a Problem?

### ❌ Not a Problem If:
- Loading states are brief (~50-200ms)
- Only happens for upload/relationship fields inside blocks
- No layout shift (skeletons match final size)

### ⚠️ Potential Problem If:
- Loading states last > 500ms (network issue or inefficient query)
- Layout shifts significantly during load
- Blocks themselves don't render (structure missing)

---

## How to Verify What's Loading

### Step 1: Check Network Tab
1. Open DevTools → Network
2. Reload the page
3. Filter by "convex" or your API
4. Look for requests **after** the initial page load
5. Each `vexConvexApi.get` call is a sub-field fetching data

### Step 2: Add Console Logs

**File**: `/packages/react/src/components/fields/upload/FilledInput.tsx`

```tsx
function UploadItemRow({ mediaId, ... }) {
  const { data: doc, isPending } = useQuery({ 
    ...convexQuery(vexConvexApi.get, { id: mediaId }) 
  });
  
  console.log('UploadItemRow:', { mediaId, isPending, hasDoc: !!doc });  // ← Add this
  
  // ... rest of component
}
```

### Step 3: Check Form Initial Values

**File**: `/packages/react/src/components/views/CollectionEditView.tsx`

```tsx
const form = useCollectionForm({
  document: currentDocument,
  collection: props.collection,
  onSubmit: async ({ value }) => { ... },
});

console.log('Form initialized with:', currentDocument);  // ← Add this
console.log('Blocks data:', currentDocument.blocks);      // ← Add this
```

---

## Optimization: Prefetch Related Documents

If loading states are annoying, you could prefetch all related documents when loading the page.

### Option A: Batch Fetch in CollectionEditView

**File**: `/packages/next/src/NextAdminPage.tsx` (line ~71)

Currently:
```tsx
if (collection && documentId) {
  const initialData = await fetchQuery(vexConvexApi.get, {
    id: documentId,
  });
  
  return (
    <CollectionEditView
      collection={collection}
      documentId={documentId}
      initialData={initialData}
    />
  );
}
```

Enhanced:
```tsx
if (collection && documentId) {
  const initialData = await fetchQuery(vexConvexApi.get, {
    id: documentId,
  });
  
  // Prefetch all referenced media/relationship docs
  const mediaIds = extractMediaIds(initialData, collection);
  const relatedIds = extractRelationshipIds(initialData, collection);
  
  await Promise.all([
    ...mediaIds.map(id => fetchQuery(vexConvexApi.get, { id })),
    ...relatedIds.map(id => fetchQuery(vexConvexApi.get, { id })),
  ]);
  
  return (
    <CollectionEditView
      collection={collection}
      documentId={documentId}
      initialData={initialData}
    />
  );
}
```

**Pros**: No loading states, everything instant
**Cons**: Slower initial page load, more complex code

### Option B: Accept the Loading States

**This is normal behavior for nested document references.** The skeleton states are brief and prevent layout shift. This is the intended design.

---

## Summary

**Expected behavior**:
- ✅ Blocks field structure loads immediately (it's in the document)
- ✅ Upload fields inside blocks show skeletons while fetching media docs
- ✅ Relationship fields inside blocks show skeletons while fetching related docs
- ✅ Skeletons prevent layout shift
- ✅ Loading is brief (~50-200ms)

**Not expected**:
- ❌ Blocks field itself shows loading (structure should be immediate)
- ❌ Loading states last > 500ms
- ❌ Layout shifts during load

**Files involved**:
- `/packages/react/src/components/fields/upload/FilledInput.tsx` (UploadItemRow query)
- `/packages/react/src/components/fields/relationship/Input.tsx` (relationship query)
- `/packages/react/src/components/views/CollectionEditView.tsx` (initial document fetch)
- `/packages/next/src/NextAdminPage.tsx` (server-side prefetch)

---

## Recommendation

**Keep the current behavior.** The loading states are:
1. Brief and imperceptible in most cases
2. Preventing layout shift (good UX)
3. Standard pattern for nested document references
4. Better than blocking the entire form render

Only optimize if you're seeing > 500ms load times or significant user complaints.
