/**
 * CRUD actions available on every resource subject (collections and globals).
 *
 * Draft actions ({@link DRAFT_ACTIONS}) are added conditionally when a resource
 * declares `versions.drafts: true`.
 */
export const CRUD_ACTIONS = {
  create: "create",
  read: "read",
  update: "update",
  delete: "delete",
} as const;
/** CRUD action union, derived from {@link CRUD_ACTIONS}. */
export type CrudAction = (typeof CRUD_ACTIONS)[keyof typeof CRUD_ACTIONS];

/**
 * The CRUD actions that mutate a document, i.e. {@link CrudAction} without
 * `"read"`.
 *
 * Lives here beside {@link CrudAction} rather than in the revalidation module
 * because it is plain CRUD vocabulary, not a revalidation concept — cache
 * invalidation is simply its first consumer (a read never invalidates a
 * cached path, so `resolveTargets` accepts only these three).
 */
export type CrudWriteAction = Exclude<CrudAction, typeof CRUD_ACTIONS.read>;

/**
 * Draft workflow actions — present on a resource subject only when its config
 * declares `versions.drafts: true` (globals today; collections with Spec 36).
 */
export const DRAFT_ACTIONS = {
  readDrafts: "readDrafts",
  saveDraft: "saveDraft",
  publish: "publish",
  unpublish: "unpublish",
  deleteVersions: "deleteVersions",
} as const;
/** Draft action union, derived from {@link DRAFT_ACTIONS}. */
export type DraftAction = (typeof DRAFT_ACTIONS)[keyof typeof DRAFT_ACTIONS];

/**
 * Access actions gating SHARED (`vex_views`) saved views (decision 13).
 * Present on every collection that has a resolved `admin.view` (see
 * {@link HasListView} in `access/types.ts`) — globals have no list view and
 * never carry them.
 *
 * - `readViews` is query-shaped (see {@link QUERY_ACTIONS} below) — it
 *   gates `listViews`, the use of shared views, and `find`'s shared-view
 *   allow-list (decision 26).
 * - `createView` gates saving a new shared view and promoting a local view.
 * - `updateView` gates saving changes to and renaming a shared view.
 * - `deleteView` gates deleting a shared view.
 *
 * Undeclared like every other action (P-007): a role matrix that never
 * mentions one of these resolves it to denied, so shared-view reads and
 * writes are all fail-closed by default. A caller without `createView` can
 * still save views locally — `savedListViews/localSavedListViewsStore.ts` (Step 12) never
 * calls `hasPermission` for the `local` source.
 */
export const VIEW_ACTIONS = {
  readViews: "readViews",
  createView: "createView",
  updateView: "updateView",
  deleteView: "deleteView",
} as const;
/** View action union, derived from {@link VIEW_ACTIONS}. */
export type ViewAction = (typeof VIEW_ACTIONS)[keyof typeof VIEW_ACTIONS];

/**
 * Actions whose read shape is a query rather than a single-document check —
 * the only actions an indexed `{ filter, withIndex }` permission check may
 * target (design doc §3: `withIndex` on `create`/`update`/`delete` would
 * narrow nothing, since those authorize one document, not a range).
 */
export const QUERY_ACTIONS = {
  read: CRUD_ACTIONS.read,
  readDrafts: DRAFT_ACTIONS.readDrafts,
  readViews: VIEW_ACTIONS.readViews,
} as const;
/** Query-shaped action union, derived from {@link QUERY_ACTIONS}. */
export type QueryAction = (typeof QUERY_ACTIONS)[keyof typeof QUERY_ACTIONS];

/**
 * Field-mode object modes: `allow` = only the listed fields, `deny` = all but
 * the listed fields.
 */
export const PERMISSION_MODES = {
  allow: "allow",
  deny: "deny",
} as const;
/** Field-mode object mode, derived from {@link PERMISSION_MODES}. */
export type PermissionMode = (typeof PERMISSION_MODES)[keyof typeof PERMISSION_MODES];

/**
 * How `hasPermission` answers a *quantified* question: when no `data` is
 * supplied and a role's check is a callback that needs the document, the scope
 * decides what "yes" would even mean.
 *
 * - `doc` — "may they do this to THIS document?" `data` is required; a callback
 *   that needs it and does not get it throws {@link VexAccessError}. Opt into
 *   this in edit views and row actions, where a silent `false` would surface as
 *   a permanently disabled control and read like a misconfigured matrix.
 * - `any` — "may they do this to AT LEAST ONE document?" Resolves such a callback
 *   to `true` without invoking it. Use for nav/sidebar/list gating; per-document
 *   filtering still happens downstream in `find`/`get`.
 * - `all` (default) — "may they do this to EVERY document?" Resolves such a
 *   callback to `false`: a per-document condition cannot hold for all of them.
 *   Fail-closed, so omitting `scope` never throws and never over-permits.
 *
 * Static boolean checks are unaffected by scope, and any scope evaluates the
 * callback normally once `data` is supplied.
 */
export const PERMISSION_SCOPES = {
  doc: "doc",
  any: "any",
  all: "all",
} as const;
/** Permission evaluation scope, derived from {@link PERMISSION_SCOPES}. */
export type PermissionScope = (typeof PERMISSION_SCOPES)[keyof typeof PERMISSION_SCOPES];

/**
 * Wildcard key usable at two matrix levels: role level (`admin: { [WILDCARD_KEY]:
 * true }`, boolean only) and action level inside a per-action map (any
 * `PermissionCheck`). Precedence: explicit action > subject wildcard > role
 * wildcard > `defaults`.
 */
export const WILDCARD_KEY = "*" as const;

/**
 * Built-in non-resource subjects contributed by core. Every entry becomes a
 * subject in the {@link SubjectMap} exactly like a user-declared custom
 * resource (no data, no fields).
 */
export const ADMIN_CUSTOM_SUBJECTS = {
  adminPanel: {
    key: "adminPanel",
    actions: ["access", "impersonate"],
  },
} as const;

/** Union of built-in subject slugs (currently `"adminPanel"`). */
export type AdminCustomSubjectSlug = keyof typeof ADMIN_CUSTOM_SUBJECTS;
