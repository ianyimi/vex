import { CollectionConfig } from "../types";
import { GlobalConfig } from "../globals";
import type {
  DocumentBySlug,
  GlobalDocumentBySlug,
  CollectionsFieldTypeMap,
  GlobalsFieldTypeMap,
  CollectionSlug,
} from "../types/generated";
import {
  ADMIN_CUSTOM_SUBJECTS,
  WILDCARD_KEY,
  type PermissionMode,
  type CrudAction,
  type DraftAction,
  type AdminCustomSubjectSlug,
} from "./constants";
import { ConvexError } from "convex/values";

/**
 * Any config that may contribute a resource subject: a collection or a global.
 * Structural — the slug literal (and `versions.drafts`, when present) is all
 * the type system reads from it.
 */
export type AccessResource = CollectionConfig | GlobalConfig;

/**
 * Single permission check result — boolean shorthand (all/none) or a
 * field-mode object restricting the check to named fields.
 *
 * @typeParam TFieldKeys - Union of valid field keys for this resource.
 */
export type FieldPermissionResult<TFieldKeys extends string> =
  | boolean
  | { mode: PermissionMode; fields: TFieldKeys[] };

/**
 * Resolved field-level permissions — one boolean per requested field.
 * Returned by `hasPermission` when `fields` is passed.
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Props passed to a permission callback.
 *
 * The `data` key exists only for data-carrying subjects; the `organization`
 * key exists only when `orgCollectionSlug` is configured. Built with
 * intersections (not conditional property types) so the keys are truly
 * absent — not present-but-`never` — when unavailable.
 *
 * @typeParam TData - Document type for the subject; `never` when the subject has no data.
 * @typeParam TUser - User document shape (registry lookup on the user collection slug).
 * @typeParam TOrg - Organization document shape; `never` when not configured.
 */
export type PermissionCallbackProps<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
> = {
  user: TUser;
} & ([TData] extends [never] ? unknown : { data: TData }) &
  ([TOrg] extends [never] ? unknown : { organization: TOrg });

/**
 * A single permission check — static boolean, field-mode object, or callback.
 *
 * A callback returning `undefined` is treated as deny.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this subject.
 */
export type PermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TFieldKeys extends string = string,
> =
  | FieldPermissionResult<TFieldKeys>
  | ((
      props: PermissionCallbackProps<TData, TUser, TOrg>,
    ) => FieldPermissionResult<TFieldKeys> | undefined);

/**
 * One entry in the subject registry: the action union, the data shape passed
 * to callbacks, and the field-key union for field-level checks.
 */
export interface SubjectEntry {
  /** Union of actions this subject supports. */
  action: string;
  /** Document/context type; `never` for subjects without data. */
  data: unknown;
  /** Union of field keys; `never` for non-field-aware subjects. */
  fields: string;
}

// ── Inference helpers (registry-based via GeneratedVexTypes augmentation) ──

/** Extract the slug literal from a resource config. @internal */
type ExtractSlug<T> = T extends { slug: infer S extends string } ? S : never;

/**
 * Document type for a slug via the generated registry (collections, then
 * globals; wide fallback pre-generation). @internal
 */
type InferDocTypeFromSlug<S extends string> = S extends keyof DocumentBySlug
  ? DocumentBySlug[S]
  : S extends keyof GlobalDocumentBySlug
    ? GlobalDocumentBySlug[S]
    : Record<string, unknown>;

/**
 * Document type for a resource config via its slug literal. @internal
 */
type InferDocType<T> = T extends { slug: infer S extends string }
  ? InferDocTypeFromSlug<S>
  : Record<string, unknown>;

/**
 * Widens a field-key union to `string` when the registry lookup collapsed to
 * `never` — happens when an index-signature fallback (pre-`vex generate`)
 * swallows the slug and its value union is empty. @internal
 */
type FieldKeysOrWide<TKeys> = [TKeys] extends [never] ? string : TKeys & string;

/**
 * Union of all field keys for a resource slug via the generated field-type
 * maps (wide `string` fallback pre-generation). @internal
 */
type ExtractFieldKeys<T> = T extends { slug: infer S extends string }
  ? S extends keyof CollectionsFieldTypeMap
    ? FieldKeysOrWide<CollectionsFieldTypeMap[S][keyof CollectionsFieldTypeMap[S]]>
    : S extends keyof GlobalsFieldTypeMap
      ? FieldKeysOrWide<GlobalsFieldTypeMap[S][keyof GlobalsFieldTypeMap[S]]>
      : string
  : string;

/** True when a resource config declares `versions.drafts: true`. @internal */
type HasDrafts<T> = T extends { versions?: { drafts?: infer D extends boolean } }
  ? D extends true
    ? true
    : false
  : false;

/**
 * The complete subject registry: resources (keyed by slug, CRUD + conditional
 * draft actions), custom resources, and the core built-in subjects from
 * {@link ADMIN_CUSTOM_SUBJECTS}.
 *
 * @typeParam TResources - Structural resource tuple (`{ slug, versions? }`).
 * @typeParam TCustom - Custom resource declarations.
 */
export type SubjectMap<
  TResources extends readonly AccessResource[] = AccessResource[],
  TCustom extends Record<string, CustomResourceInput> = Record<string, CustomResourceInput>,
> = {
  [R in TResources[number] as ExtractSlug<R>]: {
    action: CrudAction | (HasDrafts<R> extends true ? DraftAction : never);
    data: InferDocType<R>;
    fields: ExtractFieldKeys<R>;
  };
} & {
  [K in keyof TCustom]: {
    action: TCustom[K]["actions"][number];
    data: TCustom[K]["data"] extends DataTypeCarrier<infer D> ? D : never;
    fields: never;
  };
} & {
  [K in AdminCustomSubjectSlug]: {
    action: (typeof ADMIN_CUSTOM_SUBJECTS)[K]["actions"][number];
    data: never;
    fields: never;
  };
};

/**
 * Phantom carrier for a custom resource's `data` type. Created by
 * {@link dataType}; never inspected at runtime.
 */
export interface DataTypeCarrier<T = never> {
  readonly __phantom?: T;
}

/**
 * Declares the data type callbacks (and `hasPermission` callers) receive for a
 * custom resource.
 *
 * @example
 * ```ts
 * customResources: {
 *   reviews: { actions: ["approve", "reject"], data: dataType<{ queue: string }>() },
 * }
 * ```
 * @returns a plain object '{}'
 */
export function dataType<T>(): DataTypeCarrier<T> {
  return {};
}

/**
 * A custom (non-collection) subject declaration: its action list and an
 * optional typed data carrier. One canonical form — no array shorthand.
 */
export type CustomResourceInput = {
  actions: readonly string[];
  data?: DataTypeCarrier<unknown>;
};

/**
 * Per-role permission matrix, typed against the resolved {@link SubjectMap}.
 *
 * Each subject key accepts `boolean` (all actions) or a per-action map whose
 * keys are that subject's action union plus the action-level wildcard
 * ({@link WILDCARD_KEY}) — each value a full {@link PermissionCheck}.
 * The role-level wildcard is boolean-only.
 * Precedence: explicit action > subject wildcard > role wildcard > `defaults`.
 *
 * @typeParam TSubjects - The resolved {@link SubjectMap}.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape, or `never`.
 */
export type RolePermissions<
  TSubjects extends Record<string, SubjectEntry>,
  TUser = Record<string, unknown>,
  TOrg = never,
> = {
  [S in keyof TSubjects]?:
    | boolean
    | ({
        [A in TSubjects[S]["action"]]?: PermissionCheck<
          TSubjects[S]["data"],
          TUser,
          TOrg,
          TSubjects[S]["fields"]
        >;
      } & {
        [W in typeof WILDCARD_KEY]?: PermissionCheck<
          TSubjects[S]["data"],
          TUser,
          TOrg,
          TSubjects[S]["fields"]
        >;
      });
} & {
  /** Role-level wildcard: covers subjects this role never declares. Boolean only. */
  [W in typeof WILDCARD_KEY]?: boolean;
};

/**
 * Input shape for the `defineAccess` builder.
 *
 * @typeParam TRoles - Tuple of role name literals.
 * @typeParam TResources - Structural resource tuple (`{ slug, versions? }`).
 * @typeParam TCustom - Custom resource declarations.
 * @typeParam TUserCollection - `{ slug }` shape naming the user collection.
 * @typeParam TOrgCollection - `{ slug }` shape naming the org collection; `undefined` if absent.
 *
 * @see {@link VexAccessConfig} for the resolved runtime shape.
 */
export interface VexAccessConfigInput<
  TRoles extends readonly string[],
  TResources extends readonly AccessResource[] = readonly AccessResource[],
  TCustom extends Record<string, CustomResourceInput> = {},
  TUserSlug extends string = string,
  TOrgSlug extends string | undefined = undefined,
> {
  /** Default: `true`. Turn access control on or off. */
  enabled?: boolean;

  /**
   * OPTIONAL. Role applied when a caller's roles resolve empty — no session,
   * or an anonymous user (e.g. Better Auth anonymous plugin) whose
   * `userRolesField` is unset. Explicit roles always win over this fallback.
   * Omitted → empty roles deny, exactly as before.
   */
  anonRole?: TRoles[number];

  /** Role identifiers; keys of the `permissions` matrix. */
  roles: TRoles;

  /** Collections/globals contributing subjects, keyed by slug. */
  resources: TResources;

  /**
   * Custom, non-resource subjects with arbitrary action unions and optional
   * typed data. Example: `{ apiKeys: { actions: ["create", "revoke"] } }`.
   */
  customResources?: TCustom;

  /**
   * Slug of the collection whose documents are `user` in callbacks. A plain
   * slug string — the full collection often does not exist at authoring time
   * (auth-adapter collections merge later, inside `defineConfig`); the
   * document type resolves from the generated registry by slug.
   */
  userCollectionSlug: TUserSlug;

  /**
   * REQUIRED. The field on the user document that holds the user's role(s).
   * Value may be `string` or `string[]`; `hasPermission` normalizes both.
   * Callers never pass roles separately — they always ride the user document.
   */
  userRolesField: string;

  /**
   * Slug of the organization collection. When present, `organization` is
   * available (typed via the registry) in every permission callback; when
   * omitted, callbacks have no `organization` key.
   */
  orgCollectionSlug?: TOrgSlug;

  /**
   * Posture for undeclared role/subject/action combinations.
   * @defaultValue `PERMISSION_MODES.allow`
   */
  defaultPermissionMode?: PermissionMode;

  /**
   * Permission matrix: role → subject → check. See {@link RolePermissions}
   * for shapes and wildcard semantics.
   */
  permissions: Record<
    TRoles[number],
    RolePermissions<
      SubjectMap<TResources, TCustom>,
      InferDocTypeFromSlug<TUserSlug>,
      TOrgSlug extends string ? InferDocTypeFromSlug<TOrgSlug> : never
    >
  >;
}

/**
 * Resolved access configuration returned by `defineAccess` — the runtime
 * shape consumed by `hasPermission`.
 *
 * Deliberately VALUE-LEVEL TYPE-ERASED: every call-site guarantee
 * (`resource`/`action` unions, callback `data` types, field keys) rides the
 * phantom `TSubjects` parameter, while the stored fields are wide. This is
 * what lets any concrete config assign to plain `VexAccessConfig` (e.g. the
 * `access` field on `VexConfig`) — a fully-generic config type would be
 * unassignable to any common supertype, because permission callbacks are
 * contravariant in their `data` parameter.
 *
 * @typeParam TSubjects - Phantom {@link SubjectMap} carried for `hasPermission` inference.
 */
export interface VexAccessConfig<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
> {
  /** Default: `true`. Turn access control on or off. */
  enabled: boolean;

  /**
   * The allback role when there is no user.
   */
  anonRole?: string;

  /** Role names known to the system. */
  roles: readonly string[];

  /** Undeclared-permission posture. */
  defaultPermissionMode: PermissionMode;

  /** Slug of the user collection. */
  userCollectionSlug: CollectionSlug;

  /** Field on the user document holding role(s) (`string | string[]`). */
  userRolesField: string;

  /** Slug of the organization collection, when configured. */
  orgCollectionSlug?: CollectionSlug;

  /**
   * The permission matrix as authored (checks may be booleans, field-mode
   * objects, or callbacks). Type-erased for storage; `defineAccess` fully
   * type-checks it at authoring time.
   */
  permissions: Record<string, Record<string, unknown>>;

  /**
   * Phantom field carrying {@link SubjectMap} for inference. Optional and
   * never assigned at runtime.
   */
  readonly __subjects?: TSubjects;
}

/**
 * Thrown by `hasPermission` when `throwOnDenied: true` and access is denied.
 * Carries the subject, action, and (for field checks) the first denied field.
 */
export class VexAccessError extends ConvexError<{
  code: "ACCESS_DENIED";
  resource: string;
  action: string;
  field?: string;
  message: string;
}> {
  /** The subject on which access was denied. */
  resource: string;

  /** The denied action. */
  action: string;

  /** First denied field (field checks only). */
  field?: string;

  /**
   * @param options — Structured denial context.
   * @param options.message — Human-readable error message.
   * @param options.resource — Subject name.
   * @param options.action — Action name.
   * @param options.field — First denied field, when a `fields` check denied.
   */
  constructor(options: { message?: string; resource: string; action: string; field?: string }) {
    // `ConvexError.data` MUST be a valid Convex value: `convexToJson` REJECTS
    // `undefined`, and an unserializable payload means Convex cannot deliver the
    // error at all — the client subscription never receives a result and the
    // query hangs in `fetchStatus: "fetching"` forever. Omit absent keys; never
    // pass `undefined`. `message` travels in `data` because `ConvexError` owns
    // `this.message` (it stringifies `data`).
    super({
      code: "ACCESS_DENIED",
      resource: options.resource,
      action: options.action,
      field: options.field,
      message: options.message ?? `Access Denied: ${options.resource}/${options.action}`,
    });
    this.name = "VexAccessError";
    this.resource = options.resource;
    this.action = options.action;
    this.field = options.field;
  }
}

/**
 * Thrown by `defineAccess` on hard configuration errors (custom resource key
 * colliding with a resource slug; empty `actions` array).
 */
export class VexAccessConfigError extends Error {
  /** @param message — Human-readable description of the configuration error. */
  constructor(message: string) {
    super(message);
    this.name = "VexAccessConfigError";
  }
}
