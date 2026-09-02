# Bug Fix Tracking: Admin Panel Storage Adapters Serialization Error

**Date:** 2026-06-14
**Status:** Open - Root cause identified, fix pending
**Error Message:**
```
[browser] Uncaught Error: Only plain objects, and a few built-ins, can be passed to Client Components from Server Components. Classes or null prototypes are not supported.
  [{name: "convex", type: ..., softDelete: ..., mediaCollections: ...}]
```

## Root Cause Analysis

The `VexStorageAdapter` interface has `readonly` modifiers on all properties:
```typescript
export interface VexStorageAdapter {
  readonly name: string;
  readonly mediaCollections: MediaCollectionConfig[];
  readonly admin: {
    readonly softDelete: boolean;
  };
}
```

When implemented by a class (e.g., `ConvexStorageAdapter`), these `readonly` modifiers create objects with class prototypes that React cannot serialize when passing from Server Components to Client Components.

## Files Modified (Attempted Fixes)

### 1. packages/core/src/media/types.ts
**Change:** Removed `readonly` modifiers from `VexStorageAdapter` interface
**Status:** ❌ Did not fix the issue
**Reason:** The class instances themselves are still being passed, not just the properties

### 2. packages/next/src/NextAdminLayout.tsx
**Change:** Added `sanitizeConfigForClient()` call before passing config to `AdminLayout`
**Status:** ❌ Did not fix the issue
**Reason:** The sanitization was already happening in `AdminLayout`, but the class instances were still being passed

### 3. packages/react/src/components/AdminLayout.tsx
**Change:** Modified to use sanitized config instead of raw props.config
**Status:** ❌ Did not fix the issue
**Reason:** `AdminLayout` is a client component and should receive sanitized config, but the issue persists

## Key Observations

1. The error occurs on `GET /admin` when the admin page loads
2. The `storageAdapters` array contains `ConvexStorageAdapter` class instances
3. The `sanitizeConfigForClient()` function is designed to strip non-serializable values
4. The error message shows the object being passed has `name`, `type`, `softDelete`, `mediaCollections` properties - this is the class instance itself

## Next Steps to Investigate

1. Verify that `sanitizeConfigForClient()` is actually being called and working correctly
2. Check if there's another code path where the config is being passed without sanitization
3. Consider whether the `storageAdapters` should be completely omitted from the client config (not just sanitized)
4. Check if the `ConvexStorageAdapter` class needs to be converted to a plain object before being passed

## Test Results

- Rebuilt packages: core, next, react
- Dev server restarted
- Error persists after all attempted fixes