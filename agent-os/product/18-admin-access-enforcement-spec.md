# 18 — Admin Access Enforcement & Impersonation

## Overview

Wire the RBAC permission system (Spec 16: `defineAccess` + `hasPermission`) into the admin panel end-to-end. This covers server-side enforcement in Convex CRUD functions, client-side UI permission checks (hiding/disabling buttons, columns, form fields, sidebar entries), user impersonation for testing permissions, and the `adminRoles` config for gating admin panel access.

## Design Decisions

1. **Server-side enforcement in API layer** — Permission checks go in `convex/vex/collections.ts` (the outer API layer), not in `model/collections.ts`. Model functions stay pure business logic.

2. **Simplified `hasPermission` API** — No `fieldKeys` universe parameter. The function takes optional `fields?: string[]` (the specific fields to check) and returns:
   - `boolean` when `fields` is omitted (overall action access)
   - `Record<string, boolean>` when `fields` is provided (per-field map for those specific fields)

   For `mode: "allow"`, a field is allowed if it's in the allow list. For `mode: "deny"`, a field is allowed if it's NOT in the deny list. No field universe needed.

3. **List queries filter post-query** — `listDocuments` and `searchDocuments` evaluate dynamic read callbacks on each returned document and filter out denied ones. `totalCount` reflects the unfiltered DB count (the UI shows "X documents" but the user may see fewer per page). This is a pragmatic tradeoff — accurate filtered counts would require scanning every document.

4. **`adminRoles` on `defineAccess`** — Separate top-level field controlling which roles can access the admin panel and impersonate. Roles in `adminRoles` get `admin: true` by default. Roles NOT in `adminRoles` cannot access the admin panel at all.

5. **Impersonation** — Uses custom Convex mutations that modify the session's `impersonatedBy` field. Only users with a role in `adminRoles` can impersonate. The impersonated user's roles are used for all permission checks. A banner shows "Viewing as [user]" with a stop button.

6. **Sidebar visibility** — Collections are hidden from the sidebar if the user (or impersonated user) has no read access at all to that collection.

7. **Field-level UI enforcement** — Columns hidden in list view if read permission denies a field. Form fields read-only in edit view if update permission denies a field. Hidden entirely if read permission denies the field.

8. **`access` config passed to client directly** — The `access` config (from `defineAccess`) is a standalone module with no server dependencies. Client components import it directly rather than passing through RSC serialization (which can't serialize functions). This means dynamic callbacks like `({ data, user }) => data.name === user.name` work on the client for accurate UI permission checks. The `AdminPage` component accepts an `access` prop that takes the raw `VexAccessConfig`. No sanitization needed.

## Out of Scope

- Organization-aware permission resolution (the `organization` param in callbacks)
- Audit logging of permission denials
- Per-document read filtering with accurate total counts (would require Convex indexes)
- Rate limiting or abuse prevention on impersonation
- Better Auth API endpoint integration (we use direct session table mutations)

## Target Directory Structure

```
packages/core/src/
├── access/
│   ├── types.ts                     # MODIFY — add adminRoles to VexAccessConfig + input types
│   ├── hasPermission.ts             # ALREADY UPDATED — simplified API (no fieldKeys)
│   ├── hasPermission.test.ts        # ALREADY UPDATED — 69 tests with new API
│   ├── defineAccess.ts              # MODIFY — add adminRoles param
│   ├── defineAccess.test.ts         # MODIFY — add tests for adminRoles
│   └── index.ts                     # already exists
├── config/
│   └── sanitizeConfig.ts            # (no changes — access passed directly, not through RSC)
├── types/
│   └── index.ts                     # (no changes — access is not on ClientVexConfig)

packages/admin-next/src/
├── components/
│   ├── AdminPage.tsx                # MODIFY — pass user + access context
│   ├── AdminLayout.tsx              # MODIFY — accept user roles/id, access config
│   ├── RowActionsMenu.tsx           # MODIFY — accept permission-based disable flags
│   ├── CreateDocumentDialog.tsx     # (no changes — parent controls visibility)
│   ├── DeleteDocumentDialog.tsx     # (no changes — parent controls visibility)
│   ├── ImpersonationBanner.tsx      # NEW — "Viewing as [user]" banner
│   └── AppSidebar/
│       ├── index.tsx                # MODIFY — filter collections by read access
│       └── nav-user.tsx             # MODIFY — add impersonation dropdown
├── context/
│   └── PermissionContext.tsx        # NEW — React context for user + access config
├── hooks/
│   └── usePermission.ts            # NEW — hook wrapping hasPermission for components
├── views/
│   ├── CollectionsView.tsx          # MODIFY — permission-based UI
│   ├── CollectionEditView.tsx       # MODIFY — field-level read/write permissions
│   ├── MediaCollectionsView.tsx     # MODIFY — permission-based UI
│   └── MediaCollectionEditView.tsx  # MODIFY — permission-based UI

apps/test-app/
├── convex/vex/
│   ├── collections.ts               # MODIFY — add hasPermission checks
│   ├── media.ts                     # MODIFY — add hasPermission checks
│   └── impersonation.ts             # NEW — impersonation queries/mutations
├── src/
│   ├── app/admin/
│   │   └── layout.tsx               # MODIFY — pass user roles + id to admin layout
│   └── auth/
│       └── serverUtils.ts           # (no changes — already returns roles)
```

## Implementation Order

1. **Core: `adminRoles` on types + `defineAccess`** — extend the permission system with admin panel gating. Testable: unit tests pass.
2. **Admin: Permission context + `usePermission` hook** — React context providing user + access to all admin components. Testable: build passes.
3. **Admin: Sidebar filtering** — hide collections user can't read. Testable: build passes, visual verification.
4. **Admin: CollectionsView permissions** — hide create/delete buttons, disable row actions based on permissions. Testable: build passes, visual verification.
5. **Admin: CollectionEditView field-level permissions** — read-only/hidden fields based on permissions. Testable: build passes, visual verification.
6. **Admin: MediaCollectionsView + MediaCollectionEditView permissions** — same treatment for media views. Testable: build passes.
7. **Test-app: Server-side enforcement in collections.ts** — add `hasPermission` calls to all CRUD handlers. Testable: Convex functions enforce permissions.
8. **Test-app: Server-side enforcement in media.ts** — same for media CRUD. Testable: media functions enforce permissions.
9. **Test-app: Impersonation backend** — Convex query/mutation for impersonation. Testable: impersonation works.
10. **Test-app: Admin layout + impersonation UI** — pass user data, impersonation banner, NavUser dropdown. Testable: full end-to-end impersonation flow.
11. **Final integration** — verify full build, all tests, end-to-end walkthrough.

---

## Step 1: Core — `adminRoles` types + `defineAccess`

- [ ] Modify `packages/core/src/access/types.ts` — add `adminRoles` to `VexAccessConfig`, `VexAccessInputBase`, `VexAccessInputWithOrg`
- [ ] Modify `packages/core/src/access/defineAccess.ts` — handle `adminRoles` param, default to all roles
- [ ] Modify `packages/core/src/access/defineAccess.test.ts` — add tests for `adminRoles`
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/access/types.ts`

Add `adminRoles` to the input types and resolved config.

In `VexAccessInputBase`, add after `roles`:

```typescript
  /**
   * Roles that can access the admin panel and impersonate other users.
   * Must be a subset of `roles`. Defaults to all roles if not specified.
   * Only accepts `true` — no callbacks or field-level permissions for admin access.
   */
  adminRoles?: readonly (TRoles[number] & string)[];
```

In `VexAccessInputWithOrg`, add the same field after `roles`.

In `VexAccessConfig` (resolved), add:

```typescript
  /** Roles that can access the admin panel and impersonate. */
  adminRoles: readonly string[];
```

### File: `packages/core/src/access/defineAccess.ts`

In the implementation function, after existing validation:

```typescript
  // Default adminRoles to all roles if not specified
  const adminRoles = props.adminRoles ?? props.roles;

  // Validate adminRoles are a subset of roles
  if (process.env.NODE_ENV !== "production" && props.adminRoles) {
    const rolesSet = new Set(props.roles);
    for (const adminRole of props.adminRoles) {
      if (!rolesSet.has(adminRole)) {
        console.warn(
          `[vex] defineAccess: adminRole "${adminRole}" not found in roles array`,
        );
      }
    }
  }
```

Update the return object:

```typescript
  return {
    roles: props.roles,
    adminRoles,
    userCollection: props.userCollection.slug,
    orgCollection: props.orgCollection?.slug,
    userOrgField: props.userOrgField,
    permissions: props.permissions,
  };
```

Also add `adminRoles` to both overload signatures' input types.

### File: `packages/core/src/access/defineAccess.test.ts`

Add tests:

```typescript
  it("defaults adminRoles to all roles when not specified", () => {
    const access = defineAccess({
      roles: ["admin", "editor"] as const,
      resources: allResources,
      userCollection: users,
      permissions: {
        admin: {},
        editor: {},
      },
    });

    expect(access.adminRoles).toEqual(["admin", "editor"]);
  });

  it("accepts explicit adminRoles subset", () => {
    const access = defineAccess({
      roles: ["admin", "editor", "viewer"] as const,
      resources: allResources,
      userCollection: users,
      adminRoles: ["admin"],
      permissions: {
        admin: {},
        editor: {},
        viewer: {},
      },
    });

    expect(access.adminRoles).toEqual(["admin"]);
  });
```

---

## Step 2: Admin — Permission context + `usePermission` hook

- [ ] Create `packages/admin-next/src/context/PermissionContext.tsx`
- [ ] Create `packages/admin-next/src/hooks/usePermission.ts`
- [ ] Export from `packages/admin-next/src/index.ts`
- [ ] Run `pnpm build`

### File: `packages/admin-next/src/context/PermissionContext.tsx`

React context that holds the current user's data and the client-side access config. All permission-aware components consume this.

```typescript
"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { VexAccessConfig } from "@vexcms/core";

export interface PermissionUser {
  /** User document ID */
  id: string;
  /** User's role(s) */
  roles: string[];
  /** User display name */
  name: string;
  /** User email */
  email: string;
  /** Avatar URL */
  avatar?: string;
}

export interface ImpersonationState {
  /** Whether currently impersonating */
  active: boolean;
  /** The impersonated user (if active) */
  impersonatedUser?: PermissionUser;
  /** The real admin user (always the original) */
  realUser: PermissionUser;
}

interface PermissionContextValue {
  /** The effective user for permission checks (impersonated user if active, otherwise real user) */
  user: PermissionUser;
  /** The access config (with full callbacks — imported directly, not serialized through RSC) */
  access?: VexAccessConfig;
  /** Impersonation state */
  impersonation: ImpersonationState;
  /** Whether the real user can access the admin panel */
  canAccessAdmin: boolean;
  /** Whether the real user can impersonate (must have adminRole) */
  canImpersonate: boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider(props: {
  user: PermissionUser;
  access?: VexAccessConfig;
  impersonatedUser?: PermissionUser;
  children: ReactNode;
}) {
  // TODO: implement
  //
  // 1. Determine effective user:
  //    - If impersonatedUser is provided, use it for permission checks
  //    - Otherwise use props.user
  //
  // 2. Compute canAccessAdmin:
  //    - If no access config → true (permissive default)
  //    - Otherwise: check if props.user (real user, NOT impersonated) has any role in access.adminRoles
  //
  // 3. Compute canImpersonate:
  //    - Same as canAccessAdmin — only adminRoles can impersonate
  //
  // 4. Build impersonation state
  //
  // 5. Memoize the context value
  //
  // 6. Return <PermissionContext.Provider value={value}>{props.children}</PermissionContext.Provider>
  throw new Error("Not implemented");
}

export function usePermissionContext(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error("usePermissionContext must be used within a PermissionProvider");
  }
  return ctx;
}
```

### File: `packages/admin-next/src/hooks/usePermission.ts`

Hook that wraps `hasPermission` for convenient use in components. Uses the simplified API — no `fieldKeys` needed.

```typescript
"use client";

import { useMemo } from "react";
import { hasPermission, type AccessAction, type ResolvedFieldPermissions } from "@vexcms/core";
import { usePermissionContext } from "../context/PermissionContext";

/**
 * Check permissions for the current user on a resource action.
 *
 * Without `fields` → returns overall boolean access.
 * With `fields` → returns per-field permission map + helpers.
 *
 * @param props.resource - Collection/global slug
 * @param props.action - CRUD action to check
 * @param props.fields - Optional specific fields to check (returns field map when provided)
 * @param props.data - Optional document data for dynamic permission callbacks
 * @returns Permission result with helper methods
 */
export function usePermission(props: {
  resource: string;
  action: AccessAction;
  fields?: string[];
  data?: Record<string, any>;
}) {
  const { user, access } = usePermissionContext();

  return useMemo(() => {
    const result = hasPermission({
      access,
      user: { _id: user.id, ...user },
      userRoles: user.roles,
      resource: props.resource,
      action: props.action,
      fields: props.fields,
      data: props.data,
    });

    // No fields → boolean result
    if (typeof result === "boolean") {
      return {
        /** Whether the user has access to this resource for this action */
        allowed: result,
        /** Per-field permission map (empty when no fields requested) */
        fieldPermissions: {} as ResolvedFieldPermissions,
        /** Check if a specific field is allowed (always returns `allowed` when no fields were requested) */
        isFieldAllowed: (_field: string) => result,
      };
    }

    // With fields → Record<string, boolean> result
    const fieldPermissions = result;
    const allowed = Object.values(fieldPermissions).some((v) => v === true);

    return {
      /** Whether the user has ANY access to this resource for this action */
      allowed,
      /** Per-field permission map */
      fieldPermissions,
      /** Check if a specific field is allowed */
      isFieldAllowed: (field: string) => fieldPermissions[field] ?? false,
    };
  }, [access, user, props.resource, props.action, props.fields, props.data]);
}
```

---

## Step 3: Admin — Sidebar filtering

- [ ] Modify `packages/admin-next/src/components/AppSidebar/index.tsx` — filter collections by read access
- [ ] Modify `packages/admin-next/src/components/AdminLayout.tsx` — wrap with `PermissionProvider`
- [ ] Run `pnpm build`

### File: `packages/admin-next/src/components/AdminLayout.tsx`

Wrap the layout with `PermissionProvider`. Accept user data including roles and ID.

```typescript
import { SidebarInset, SidebarProvider } from "@vexcms/ui";
import { AppSidebar, NavUserData } from "./AppSidebar";
import { ComponentPropsWithRef } from "react";
import { ClientVexConfig } from "@vexcms/core";
import { PermissionProvider, PermissionUser } from "../context/PermissionContext";
import { ImpersonationBanner } from "./ImpersonationBanner";
import type { VexAccessConfig } from "@vexcms/core";

export function AdminLayout({
  config,
  user,
  permissionUser,
  impersonatedUser,
  access,
  children,
}: {
  config: ClientVexConfig;
  user?: NavUserData;
  /** Full user data with roles for permission checks */
  permissionUser?: PermissionUser;
  /** If the admin is impersonating, this is the impersonated user */
  impersonatedUser?: PermissionUser;
  /** Access config imported directly (not serialized through RSC) */
  access?: VexAccessConfig;
} & ComponentPropsWithRef<"div">) {
  const content = (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar config={config} user={user} />
      <SidebarInset className="overflow-y-hidden">
        <ImpersonationBanner />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );

  if (permissionUser) {
    return (
      <PermissionProvider
        user={permissionUser}
        access={access}
        impersonatedUser={impersonatedUser}
      >
        {content}
      </PermissionProvider>
    );
  }

  return content;
}
```

### File: `packages/admin-next/src/components/AppSidebar/index.tsx`

In the `useMemo` that builds the nav, filter out collections where the user has no read access. Use the permission context (with a try-catch fallback for when no provider exists).

Add at the top of the component:

```typescript
  // Try to get permission context — may not exist if no access config
  let permissionContext: ReturnType<typeof usePermissionContext> | null = null;
  try {
    permissionContext = usePermissionContext();
  } catch {
    // No permission provider — show all collections (permissive default)
  }
```

Inside the `useMemo`, filter `allCollections`:

```typescript
    // Filter collections by read access (no fields needed — just overall boolean)
    const accessibleCollections = permissionContext?.access
      ? allCollections.filter((c) => {
          const readAllowed = hasPermission({
            access: permissionContext!.access,
            user: { _id: permissionContext!.user.id },
            userRoles: permissionContext!.user.roles,
            resource: c.slug,
            action: "read",
          });
          return readAllowed === true;
        })
      : allCollections;
```

Then use `accessibleCollections` instead of `allCollections` for building the nav items.

---

## Step 4: Admin — CollectionsView permissions

- [ ] Modify `packages/admin-next/src/views/CollectionsView.tsx` — hide create/delete buttons, disable row actions
- [ ] Run `pnpm build`

### File: `packages/admin-next/src/views/CollectionsView.tsx`

Import and use `usePermission` to check create, delete, and read permissions.

At the top of the component, add permission checks:

```typescript
  // Permission checks — no fields for overall action access
  const createPerm = usePermission({
    resource: collection.slug,
    action: "create",
  });

  const deletePerm = usePermission({
    resource: collection.slug,
    action: "delete",
  });

  // Read permission with fields — for column visibility
  const fieldKeys = Object.keys(collection.fields as Record<string, VexField>);
  const readPerm = usePermission({
    resource: collection.slug,
    action: "read",
    fields: fieldKeys,
  });
```

Replace the existing `disableCreate` / `disableDelete` logic:

```typescript
  const disableDelete = (collection.admin?.disableDelete ?? false) || !deletePerm.allowed;
  const disableCreate = (collection.admin?.disableCreate ?? false) || !createPerm.allowed;
```

For column visibility based on read field permissions, filter the columns:

```typescript
  const permissionFilteredColumns = useMemo(() => {
    return columns.filter((col) => {
      const colId = (col as any).accessorKey ?? col.id;
      if (!colId || colId === "_id" || colId === "actions") return true;
      return readPerm.isFieldAllowed(colId);
    });
  }, [columns, readPerm]);
```

Use `permissionFilteredColumns` instead of `columns` when building `columnsWithActions`.

For the `RowActionsMenu`, check update permission:

```typescript
  const updatePerm = usePermission({
    resource: collection.slug,
    action: "update",
  });
```

Pass `disableEdit={!updatePerm.allowed}` to `RowActionsMenu` (requires updating RowActionsMenu — see below).

### File: `packages/admin-next/src/components/RowActionsMenu.tsx`

Add `disableEdit` prop:

```typescript
interface RowActionsMenuProps extends ComponentPropsWithRef<"button"> {
  onEdit: () => void;
  onDelete: () => void;
  disableDelete?: boolean;
  /** Whether edit is disabled (e.g., no update permission) */
  disableEdit?: boolean;
}
```

In the render, conditionally disable the edit button:

```typescript
  {!disableEdit && (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 h-8 px-2 text-sm"
      onClick={() => { setOpen(false); onEdit(); }}
    >
      <Pencil className="h-4 w-4" />
      Edit
    </Button>
  )}
```

---

## Step 5: Admin — CollectionEditView field-level permissions

- [ ] Modify `packages/admin-next/src/views/CollectionEditView.tsx` — field-level read/write permissions
- [ ] Run `pnpm build`

### File: `packages/admin-next/src/views/CollectionEditView.tsx`

Import and use permission hooks for both read and update with specific fields:

```typescript
  const fieldKeys = Object.keys(collection.fields as Record<string, VexField>);

  const readPerm = usePermission({
    resource: collection.slug,
    action: "read",
    fields: fieldKeys,
    data: document ?? undefined,
  });

  const updatePerm = usePermission({
    resource: collection.slug,
    action: "update",
    fields: fieldKeys,
    data: document ?? undefined,
  });

  const deletePerm = usePermission({
    resource: collection.slug,
    action: "delete",
    data: document ?? undefined,
  });
```

Filter field entries by read permission and mark read-only by update permission:

```typescript
  const fieldEntries: FieldEntry[] = useMemo(
    () =>
      Object.entries(collection.fields as Record<string, VexField>)
        .filter(([name, field]) => {
          if (field.admin?.hidden) return false;
          // Hide fields the user can't read
          if (!readPerm.isFieldAllowed(name)) return false;
          return true;
        })
        .map(([name, field]) => ({
          name,
          field,
          // Mark field as read-only if user can't update it
          readOnly: !updatePerm.isFieldAllowed(name),
        })),
    [collection, readPerm, updatePerm],
  );
```

Note: This requires `FieldEntry` to support a `readOnly` property. If `AppForm` / `FieldEntry` doesn't currently support this, add it. The `readOnly` flag should make the form field non-editable (disabled or visually indicated as read-only).

Also disable the delete button based on delete permission:

```typescript
  const disableDelete = (collection.admin?.disableDelete ?? false) || !deletePerm.allowed;
```

Disable the Save button if user has no update permission on any field:

```typescript
  <Button
    type="submit"
    form="collection-edit-form"
    disabled={isSaving || fieldEntries.length === 0 || !updatePerm.allowed}
  >
    {isSaving ? "Saving..." : "Save"}
  </Button>
```

---

## Step 6: Admin — MediaCollectionsView + MediaCollectionEditView permissions

- [ ] Modify `packages/admin-next/src/views/MediaCollectionsView.tsx` — same pattern as CollectionsView
- [ ] Modify `packages/admin-next/src/views/MediaCollectionEditView.tsx` — same pattern as CollectionEditView
- [ ] Run `pnpm build`

### File: `packages/admin-next/src/views/MediaCollectionsView.tsx`

Apply the same pattern as Step 4 for CollectionsView:
- Import `usePermission`
- Check create, delete, read permissions (no `fields` for overall access, with `fields` for column visibility)
- Override `disableDelete` / `disableCreate` with permission results
- Filter columns by read field permissions
- Pass `disableEdit` to row actions

### File: `packages/admin-next/src/views/MediaCollectionEditView.tsx`

Apply the same pattern as Step 5 for CollectionEditView:
- Check read, update, delete permissions (with `fields` for field-level checks)
- Filter field entries by read permission
- Mark fields read-only by update permission
- Disable Save button if no update access
- Disable Delete button if no delete access

---

## Step 7: Test-app — Server-side enforcement in collections.ts

- [ ] Modify `apps/test-app/convex/vex/collections.ts` — add `hasPermission` checks to all handlers
- [ ] Verify with manual testing

### File: `apps/test-app/convex/vex/collections.ts`

Add a helper to get the current user from the Convex auth context, then call `hasPermission` in each handler.

```typescript
import { hasPermission } from "@vexcms/core"

// Helper to get user from Convex auth context
async function requireUser(ctx: any) {
  // TODO: implement
  //
  // 1. Get user identity from ctx.auth.getUserIdentity()
  //    → If null, throw ConvexError("Not authenticated")
  //
  // 2. Look up the user document by the identity's subject/tokenIdentifier
  //    → The session query already resolves this; here we need the user doc
  //      including their roles
  //
  // 3. Return { user, roles } where:
  //    - user is the full user document (as Record<string, any>)
  //    - roles is the user's role field value as string[]
  //
  // Edge cases:
  // - User exists in auth but not in DB → throw
  // - User has no roles field → default to empty array
  throw new Error("Not implemented");
}
```

For each handler, add permission checks. Example for `createDocument`:

```typescript
export const createDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    const match = requireCollection(collectionSlug)
    const { user, roles } = await requireUser(ctx)

    // Check create permission for the specific fields being submitted
    const fieldNames = Object.keys(fields as Record<string, unknown>)
    hasPermission({
      access: config.access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "create",
      fields: fieldNames,
      data: fields as Record<string, unknown>,
      throwOnDenied: true,
    })

    return await Collections.createDocument<DataModel>({
      args: {
        collectionFields: match.fields,
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: fields as Record<string, unknown>,
        kind: match.kind,
      },
      ctx,
    })
  },
})
```

For `updateDocument`, check that the specific fields being updated are allowed:

```typescript
    const fieldNames = Object.keys(fields as Record<string, unknown>)
    hasPermission({
      access: config.access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "update",
      fields: fieldNames,
      data: existingDoc, // fetch existing doc first for dynamic callbacks
      throwOnDenied: true,
    })
```

For `deleteDocument` and `bulkDeleteDocuments`, check delete permission (no fields needed — overall boolean):

```typescript
    hasPermission({
      access: config.access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "delete",
      data: existingDoc,
      throwOnDenied: true,
    })
```

For `listDocuments`, filter results post-query (no fields for overall read check):

```typescript
    // After getting paginated result, filter by read permission
    const filteredPage = result.page.filter((doc: any) => {
      const readAllowed = hasPermission({
        access: config.access,
        user,
        userRoles: roles,
        resource: args.collectionSlug,
        action: "read",
        data: doc,
      })
      return readAllowed === true
    })
    return { ...result, page: filteredPage }
```

For `getDocument`, check read permission and throw if denied:

```typescript
    hasPermission({
      access: config.access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "read",
      data: doc,
      throwOnDenied: true,
    })
```

---

## Step 8: Test-app — Server-side enforcement in media.ts

- [ ] Modify `apps/test-app/convex/vex/media.ts` — add `hasPermission` checks
- [ ] Verify with manual testing

### File: `apps/test-app/convex/vex/media.ts`

Same pattern as Step 7. Add permission checks to `createMediaDocument` and `paginatedSearchDocuments`. Use the same `requireUser` helper (import or co-locate).

---

## Step 9: Test-app — Impersonation backend

- [ ] Create `apps/test-app/convex/vex/impersonation.ts` — queries and mutations
- [ ] Verify with manual testing

### File: `apps/test-app/convex/vex/impersonation.ts`

```typescript
import type { DataModel } from "@convex/_generated/dataModel"
import { mutation, query } from "@convex/_generated/server"
import { ConvexError, v } from "convex/values"
import { TABLE_SLUG_USERS } from "~/db/constants"
import config from "../../vex.config"

/**
 * List users available for impersonation.
 * Only accessible by users with adminRoles.
 */
export const listImpersonatableUsers = query({
  args: {},
  handler: async (ctx) => {
    // TODO: implement
    //
    // 1. Get current user via auth context
    //    → Throw if not authenticated
    //
    // 2. Check if current user has an adminRole
    //    → If not, return empty array
    //
    // 3. Query all users from the user collection
    //    → Return id, name, email, image, role for each
    //    → Exclude the current user from results
    //
    // Edge cases:
    // - No access config → return empty array (no impersonation without RBAC)
    // - User collection slug comes from config.access.userCollection
    throw new Error("Not implemented");
  },
})

/**
 * Start impersonating another user.
 * Sets the current session's impersonatedBy field.
 * Only accessible by users with adminRoles.
 */
export const startImpersonation = mutation({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, { targetUserId }) => {
    // TODO: implement
    //
    // 1. Get current user and session
    //    → Throw if not authenticated
    //
    // 2. Verify current user has adminRole
    //    → Throw ConvexError if not
    //
    // 3. Verify target user exists
    //    → Throw ConvexError if not
    //
    // 4. Update the current session: set impersonatedBy = current user's ID
    //    and update userId to targetUserId
    //    → This makes all subsequent queries act as the target user
    //
    // 5. Return the target user's data (for the UI banner)
    //
    // Edge cases:
    // - Can't impersonate yourself → throw
    // - Already impersonating → update to new target (allow switching)
    throw new Error("Not implemented");
  },
})

/**
 * Stop impersonating. Restores the session to the original admin user.
 */
export const stopImpersonation = mutation({
  args: {},
  handler: async (ctx) => {
    // TODO: implement
    //
    // 1. Get current session
    //    → Throw if not authenticated
    //
    // 2. Check if session has impersonatedBy set
    //    → If not, no-op (already not impersonating)
    //
    // 3. Restore: set userId back to impersonatedBy value,
    //    clear impersonatedBy field
    //
    // 4. Return success
    throw new Error("Not implemented");
  },
})

/**
 * Get current impersonation state.
 * Returns the impersonated user's data if active.
 */
export const getImpersonationState = query({
  args: {},
  handler: async (ctx) => {
    // TODO: implement
    //
    // 1. Get current session
    //    → If not authenticated, return { active: false }
    //
    // 2. Check if session has impersonatedBy set
    //    → If not, return { active: false }
    //
    // 3. Look up both the original admin (impersonatedBy) and
    //    current user (session.userId = impersonated user)
    //
    // 4. Return { active: true, realUser: admin, impersonatedUser: target }
    throw new Error("Not implemented");
  },
})
```

---

## Step 10: Test-app — Admin layout + impersonation UI

- [ ] Modify `apps/test-app/src/app/admin/layout.tsx` — pass full user data to AdminLayout
- [ ] Create `packages/admin-next/src/components/ImpersonationBanner.tsx`
- [ ] Modify `packages/admin-next/src/components/AppSidebar/nav-user.tsx` — add impersonation dropdown
- [ ] Run `pnpm build`

### File: `apps/test-app/src/app/admin/layout.tsx`

Pass full user data including roles and ID. Import `access` directly (not through RSC serialization) since the `defineAccess` output is a plain module with no server deps.

```typescript
import { AdminLayout as Layout } from "@vexcms/admin-next"
import { SidebarTrigger } from "@vexcms/ui"
import { sanitizeConfigForClient } from "@vexcms/core"

import config from "~/../vex.config"
import { access } from "~/vexcms/access"
import { getCurrentUser } from "~/auth/serverUtils"

const clientConfig = sanitizeConfigForClient(config)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  const permissionUser = user
    ? {
        id: user.id,
        roles: Array.isArray(user.role) ? user.role : [user.role].filter(Boolean),
        name: user.name,
        email: user.email,
        avatar: user.image,
      }
    : undefined

  return (
    <Layout
      config={clientConfig}
      user={user ? { name: user.name, avatar: user.image, email: user.email } : undefined}
      permissionUser={permissionUser}
      access={access}
    >
      <SidebarTrigger />
      <main className="flex flex-col flex-1 overflow-hidden">{children}</main>
    </Layout>
  )
}
```

### File: `packages/admin-next/src/components/ImpersonationBanner.tsx`

A banner shown at the top of the admin panel when impersonating.

```typescript
"use client";

import { usePermissionContext } from "../context/PermissionContext";
import { Button } from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { XIcon, UserIcon } from "lucide-react";

export function ImpersonationBanner() {
  // TODO: implement
  //
  // 1. Get impersonation state from permission context
  //    → If not active, return null (render nothing)
  //
  // 2. Render a banner bar:
  //    - Yellow/amber background to stand out
  //    - Icon + "Viewing as {impersonatedUser.name} ({impersonatedUser.email})"
  //    - "Stop Impersonating" button that calls stopImpersonation mutation
  //
  // 3. On stop:
  //    - Call the Convex mutation
  //    - Reload the page to refresh the session
  //
  // Edge cases:
  // - Mutation fails → show error toast
  // - Context not available → return null
  throw new Error("Not implemented");
}
```

### File: `packages/admin-next/src/components/AppSidebar/nav-user.tsx`

Add impersonation section to the user dropdown. When the user has `canImpersonate`, show a list of users they can impersonate.

```typescript
// Add to the dropdown content, after the existing menu groups:

// Impersonation section (only for adminRoles)
{canImpersonate && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuLabel>Impersonate User</DropdownMenuLabel>
      {/* TODO: implement
        1. Use a Convex query to fetch impersonatable users
           → listImpersonatableUsers from impersonation.ts
        2. Render each user as a DropdownMenuItem
        3. On click, call startImpersonation mutation with the user's ID
        4. On success, reload the page to refresh session

        Edge cases:
        - Loading state → show skeleton
        - No users to impersonate → show "No users available"
        - Already impersonating → show current target with checkmark
      */}
    </DropdownMenuGroup>
  </>
)}
```

The `NavUser` component needs to accept the permission context. Either:
- Import `usePermissionContext` directly (preferred — keeps it self-contained)
- Or receive `canImpersonate` as a prop

---

## Step 11: Final integration

- [ ] Run `pnpm build` across all packages
- [ ] Run `pnpm --filter @vexcms/core test` — verify all tests pass
- [ ] Update `packages/core/src/index.ts` exports if needed (VexAccessConfig)
- [ ] Update `packages/admin-next/src/index.ts` exports (PermissionProvider, usePermission, ImpersonationBanner)
- [ ] Manual end-to-end test:
  - [ ] Log in as admin → see all collections in sidebar, all CRUD buttons enabled
  - [ ] Impersonate a user with limited permissions → sidebar filters, buttons disabled/hidden
  - [ ] Try CRUD operations as impersonated user → server rejects unauthorized actions
  - [ ] Stop impersonating → admin view restored
  - [ ] Verify field-level permissions in edit view (read-only fields, hidden fields)
- [ ] Run `pnpm --filter test-app build` — verify no type errors

## Success Criteria

- [ ] `hasPermission` simplified API: `fields` omitted → `boolean`, `fields` provided → `Record<string, boolean>` (no `fieldKeys` universe)
- [ ] `defineAccess` accepts `adminRoles` param, defaults to all roles
- [ ] Access config (with full callbacks) passed directly to admin panel via `access` prop
- [ ] Sidebar hides collections the user can't read
- [ ] CollectionsView: create button hidden if no create permission, delete disabled if no delete permission
- [ ] CollectionsView: columns hidden if read permission denies field
- [ ] CollectionEditView: fields read-only if update permission denies field, hidden if read denies field
- [ ] CollectionEditView: save button disabled if no update permission, delete disabled if no delete permission
- [ ] MediaCollectionsView + MediaCollectionEditView: same permission enforcement as regular collections
- [ ] Server-side: all CRUD mutations/queries in collections.ts check permissions via `hasPermission`
- [ ] Server-side: unauthorized actions throw `VexAccessError` / `ConvexError`
- [ ] Server-side: list queries filter results post-query using read permission callbacks
- [ ] Impersonation: admin users can impersonate other users via NavUser dropdown
- [ ] Impersonation: banner shows "Viewing as [user]" with stop button
- [ ] Impersonation: all permission checks use the impersonated user's roles
- [ ] Impersonation: only users with `adminRoles` can impersonate
- [ ] All existing tests continue to pass
- [ ] Test-app builds without type errors
