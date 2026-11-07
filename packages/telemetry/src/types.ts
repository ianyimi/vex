import type {
  AdminFieldType,
  Alignment,
  ColorFormat,
  CommitTsFieldAdminFormat,
  CommitTsFieldOn,
  SelectDisplay,
  StorageAdapterProtocol,
} from "@vexcms/core";
import type { TELEMETRY_EVENTS, TELEMETRY_SCHEMA_VERSION } from "./constants";

/** Subset of process environment variables telemetry reads; never the full `process.env`. */
export type TelemetryEnv = Record<string, string | undefined>;

/** Derived from {@link TELEMETRY_EVENTS}. */
export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number];

/** Per-machine telemetry state persisted to the settings file. */
export interface TelemetrySettings {
  enabled?: boolean;
  machineId: string;
  salt: string;
  noticeShownAt?: string;
}

/** Runtime/toolchain facts recorded on every telemetry event. */
export interface TelemetryEnvironment {
  vexVersions: Record<string, string>;
  nodeVersion: string;
  os: NodeJS.Platform;
  arch: string;
  packageManager: "pnpm" | "npm" | "yarn" | "bun" | "unknown";
  framework: "next" | "tanstack" | "unknown";
}

/** Vex-owned timing data for one `dev`/`deploy` run's config load and schema generation. */
export interface TelemetryTimings {
  configLoadMs: number;
  schemaGenMs: number;
  schemaChanged: boolean;
}

/** Scaffold choices recorded on a `create-vexcms` run's telemetry event. */
export interface TelemetryCreateOptions {
  framework: string;
  template: "base" | "marketing";
  bare: boolean;
  auth: {
    emailPassword: boolean;
    oauthProviderCount: number;
    orgs: boolean;
  };
  monorepo: boolean;
  initGit: boolean;
  installDependencies: boolean;
}

/** Pipeline stage a `dev`/`deploy`/`create` run failed at — vex-owned stages only, never the Convex push/deploy itself. */
export const TELEMETRY_FAILURE_STAGES = ["resolveConfig", "loadConfig", "generateSchema", "scaffold"] as const;

/** Derived from {@link TELEMETRY_FAILURE_STAGES}. */
export type TelemetryFailureStage = (typeof TELEMETRY_FAILURE_STAGES)[number];

/** Allowlisted classification of a caught error, resolved by `classifyTelemetryError` from the error's `name` — never its message. */
export const TELEMETRY_ERROR_CODES = [
  "configError",
  "accessConfigError",
  "authConfigError",
  "componentConfigError",
  "storageConfigError",
  "unknown",
] as const;

/** Derived from {@link TELEMETRY_ERROR_CODES}. */
export type TelemetryErrorCode = (typeof TELEMETRY_ERROR_CODES)[number];

/** Whether a run completed or failed, and if it failed, where and with what allowlisted error code. */
export type TelemetryOutcome =
  | { status: "ok" }
  | { status: "failed"; stage: TelemetryFailureStage; errorCode: TelemetryErrorCode };

/**
 * One field inside an {@link AnonymizedConfig} payload, flat and keyed by its
 * generated `path` (e.g. `c1.f3`, `k2.f1.t1.f2`) — see {@link AnonymizedConfig}
 * for the full path grammar. Every other property is either the field's
 * `type`, a count, a boolean, or an allowlisted enum literal — never a
 * label, description, default value, option value, mask pattern, or URL.
 */
export interface AnonymizedField {
  path: string;
  type: AdminFieldType;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  position?: "main" | "sidebar";
  cellAlignment?: Alignment;
  hasValidate?: boolean;
  hasIndex?: boolean;
  hasSearchIndex?: boolean;
  hasMask?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  defaultValue?: boolean;
  format?: ColorFormat | CommitTsFieldAdminFormat;
  themeColors?: boolean;
  time?: {
    hidden: boolean;
    use12HourFormat: boolean;
    timePicker: { hour: boolean; minute: boolean; second: boolean };
  };
  hasMany?: boolean;
  optionCount?: number;
  display?: SelectDisplay;
  searchable?: boolean;
  target?: string;
  hasAccept?: boolean;
  hasMediaTarget?: boolean;
  defaultCollapsed?: boolean;
  tabCount?: number;
  hasCustomCell?: boolean;
  enableSorting?: boolean;
  enableHiding?: boolean;
  on?: CommitTsFieldOn;
}

/**
 * One block DEFINITION referenced by one or more `blocks()` field
 * placements, numbered by first appearance (`k1`, `k2`, …) walking
 * collections → globals → media depth-first. Its own fields live in
 * {@link AnonymizedConfig.fields} under `${id}.fN`, walked once at first
 * appearance regardless of how many placements reuse the definition.
 */
export interface AnonymizedBlock {
  id: string;
  /** Every placement's generated path (e.g. `c1.f3.b1`), one entry per `blocks()` field that lists this definition. */
  paths: string[];
  defaultCollapsed?: boolean;
}

/** One anonymized collection, global, or media collection. */
export interface AnonymizedResource {
  path: string;
  kind: "collection" | "global" | "media";
  drafts: boolean;
  livePreview: boolean;
  timestamps: boolean;
  indexCount?: number;
  hookCounts: Record<"beforeChange" | "beforeDelete" | "afterChange" | "afterDelete", number>;
  savedViewCount?: number;
  defaultSortIsCustom?: boolean;
  bulkDelete?: boolean;
  storageAdapterKind?: StorageAdapterProtocol;
}

/**
 * Privacy-reviewed shape of `VexConfig` sent as `TelemetryEvent.config`.
 * Every collection/global/media/block/field NAME is replaced by a generated
 * path: resources are `c<n>` / `g<n>` / `m<n>` (1-based declaration order);
 * block DEFINITIONS are `k<n>` (1-based, numbered by first appearance
 * walking collections → globals → media depth-first); a field's path is its
 * parent's path plus `.f<n>` (1-based, local to that parent) — `.t<n>` for a
 * tabs field's nth tab, `.b<n>` for a blocks field's nth placement, `.i` for
 * an array field's single `items` row (no index — every row shares one
 * shape). No collection, field, block, or role NAME ever appears in this
 * shape, only paths, counts, booleans, numbers, and allowlisted enum
 * literals.
 */
export interface AnonymizedConfig {
  collectionCount: number;
  globalCount: number;
  mediaCollectionCount: number;
  blockCount: number;
  fieldCount: number;
  resources: AnonymizedResource[];
  blocks: AnonymizedBlock[];
  fields: AnonymizedField[];
  features: {
    drafts: boolean;
    livePreview: boolean;
    conditions: boolean;
    slots: boolean;
    inputMasks: boolean;
    /**
     * Always `false` — `@vexcms/core` has no localization feature yet
     * (richtext is deliberately locale-agnostic). Reserved so the docs page
     * and this shape don't change again the day core adds one.
     */
    localization: false;
    auth: boolean;
    authAdapter: "none" | "betterAuth" | "custom";
    access: {
      enabled: boolean;
      roleCount: number;
      ruleCount: number;
      fieldPermissionRuleCount: number;
      queryConstraintRuleCount: number;
      callbackRuleCount: number;
      customActionCount: number;
      customResourceCount: number;
      organizations: boolean;
    };
    hookCount: number;
  };
  storageAdapterKinds: StorageAdapterProtocol[];
  /** Set only when `fitTelemetryEvent` dropped `resources`/`blocks`/`fields` to fit the size cap; every count and `features` field still reflects the real config. */
  truncated?: true;
}

/** The full payload one `vex dev`/`vex deploy`/`create-vexcms` run sends to the telemetry endpoint. */
export interface TelemetryEvent {
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  event: TelemetryEventName;
  machineId: string;
  projectId: string;
  sentAt: string;
  environment: TelemetryEnvironment;
  outcome: TelemetryOutcome;
  config?: AnonymizedConfig;
  timings?: TelemetryTimings;
  create?: TelemetryCreateOptions;
}
