import { STORAGE_ADAPTER_PROTOCOLS, type AdminFieldType } from "@vexcms/core";
import type {
  AnonymizedConfig,
  TelemetryCreateOptions,
  TelemetryEnvironment,
  TelemetryErrorCode,
  TelemetryEvent,
  TelemetryEventName,
  TelemetryFailureStage,
  TelemetryOutcome,
} from "@vexcms/telemetry";

import type { Doc } from "../_generated/dataModel";

interface ScaffoldColumns {
  scaffoldTemplate?: TelemetryCreateOptions["template"][];
  scaffoldBare?: boolean;
  scaffoldMonorepo?: boolean;
  scaffoldEmailPassword?: boolean;
  scaffoldOauthProviderCount?: number;
  scaffoldOrgs?: boolean;
}

interface ConfigColumns {
  collectionCount?: number;
  globalCount?: number;
  mediaCollectionCount?: number;
  blockCount?: number;
  fieldCount?: number;
  fieldTypes?: AdminFieldType[];
  featureDrafts?: boolean;
  featureLivePreview?: boolean;
  featureConditions?: boolean;
  featureSlots?: boolean;
  featureInputMasks?: boolean;
  featureAuth?: boolean;
  authAdapter?: AnonymizedConfig["features"]["authAdapter"][];
  hookCount?: number;
  accessEnabled?: boolean;
  accessRoleCount?: number;
  accessRuleCount?: number;
  accessFieldPermissionRuleCount?: number;
  accessQueryConstraintRuleCount?: number;
  accessCallbackRuleCount?: number;
  accessCustomActionCount?: number;
  accessCustomResourceCount?: number;
  accessOrganizations?: boolean;
  storageUsesPresignedUrl?: boolean;
  configTruncated?: boolean;
  latestConfig?: AnonymizedConfig;
}

export interface TelemetryProjectPatch extends ConfigColumns, ScaffoldColumns {
  projectId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  devEventCount: number;
  deployEventCount: number;
  createEventCount: number;
  failedEventCount: number;
  lastEvent: TelemetryEventName[];
  lastOutcomeStatus: TelemetryOutcome["status"][];
  lastFailureStage?: TelemetryFailureStage[];
  lastErrorCode?: TelemetryErrorCode[];
  framework: TelemetryEnvironment["framework"][];
  packageManager: TelemetryEnvironment["packageManager"][];
  os: string;
  nodeMajor: number;
  vexCoreVersion?: string;
}

function parseNodeMajor(nodeVersion: string): number {
  const match = /^v?(\d+)\./.exec(nodeVersion);
  return match?.[1] === undefined ? 0 : Number(match[1]);
}

/**
 * Derives every `telemetryProjects` column sourced from an event's `config`.
 * `config.truncated` means `fitTelemetryEvent` (in `@vexcms/telemetry`)
 * dropped `resources`/`blocks`/`fields` to fit the body-size cap before
 * sending — every count and `features` field is still the real value, but
 * `fieldTypes` (the only column derived by walking the now-empty `fields`
 * array) can't be recomputed, so it carries `existing`'s value forward
 * instead of going empty.
 */
function deriveConfigColumns(config: AnonymizedConfig, existing: Doc<"telemetryProjects"> | null): ConfigColumns {
  return {
    collectionCount: config.collectionCount,
    globalCount: config.globalCount,
    mediaCollectionCount: config.mediaCollectionCount,
    blockCount: config.blockCount,
    fieldCount: config.fieldCount,
    fieldTypes: config.truncated
      ? existing?.fieldTypes
      : [...new Set(config.fields.map((field) => field.type))].sort(),
    featureDrafts: config.features.drafts,
    featureLivePreview: config.features.livePreview,
    featureConditions: config.features.conditions,
    featureSlots: config.features.slots,
    featureInputMasks: config.features.inputMasks,
    featureAuth: config.features.auth,
    authAdapter: [config.features.authAdapter],
    hookCount: config.features.hookCount,
    accessEnabled: config.features.access.enabled,
    accessRoleCount: config.features.access.roleCount,
    accessRuleCount: config.features.access.ruleCount,
    accessFieldPermissionRuleCount: config.features.access.fieldPermissionRuleCount,
    accessQueryConstraintRuleCount: config.features.access.queryConstraintRuleCount,
    accessCallbackRuleCount: config.features.access.callbackRuleCount,
    accessCustomActionCount: config.features.access.customActionCount,
    accessCustomResourceCount: config.features.access.customResourceCount,
    accessOrganizations: config.features.access.organizations,
    storageUsesPresignedUrl: config.storageAdapterKinds.includes(STORAGE_ADAPTER_PROTOCOLS.presignedUrl),
    configTruncated: config.truncated,
    latestConfig: config,
  };
}

function previousConfigColumns(existing: Doc<"telemetryProjects"> | null): ConfigColumns {
  return {
    collectionCount: existing?.collectionCount,
    globalCount: existing?.globalCount,
    mediaCollectionCount: existing?.mediaCollectionCount,
    blockCount: existing?.blockCount,
    fieldCount: existing?.fieldCount,
    fieldTypes: existing?.fieldTypes,
    featureDrafts: existing?.featureDrafts,
    featureLivePreview: existing?.featureLivePreview,
    featureConditions: existing?.featureConditions,
    featureSlots: existing?.featureSlots,
    featureInputMasks: existing?.featureInputMasks,
    featureAuth: existing?.featureAuth,
    authAdapter: existing?.authAdapter,
    hookCount: existing?.hookCount,
    accessEnabled: existing?.accessEnabled,
    accessRoleCount: existing?.accessRoleCount,
    accessRuleCount: existing?.accessRuleCount,
    accessFieldPermissionRuleCount: existing?.accessFieldPermissionRuleCount,
    accessQueryConstraintRuleCount: existing?.accessQueryConstraintRuleCount,
    accessCallbackRuleCount: existing?.accessCallbackRuleCount,
    accessCustomActionCount: existing?.accessCustomActionCount,
    accessCustomResourceCount: existing?.accessCustomResourceCount,
    accessOrganizations: existing?.accessOrganizations,
    storageUsesPresignedUrl: existing?.storageUsesPresignedUrl,
    configTruncated: existing?.configTruncated,
    latestConfig: existing?.latestConfig as AnonymizedConfig | undefined,
  };
}

function deriveScaffoldColumns(
  create: TelemetryCreateOptions | undefined,
  existing: Doc<"telemetryProjects"> | null,
): ScaffoldColumns {
  if (!create) {
    return {
      scaffoldTemplate: existing?.scaffoldTemplate,
      scaffoldBare: existing?.scaffoldBare,
      scaffoldMonorepo: existing?.scaffoldMonorepo,
      scaffoldEmailPassword: existing?.scaffoldEmailPassword,
      scaffoldOauthProviderCount: existing?.scaffoldOauthProviderCount,
      scaffoldOrgs: existing?.scaffoldOrgs,
    };
  }
  return {
    scaffoldTemplate: [create.template],
    scaffoldBare: create.bare,
    scaffoldMonorepo: create.monorepo,
    scaffoldEmailPassword: create.auth.emailPassword,
    scaffoldOauthProviderCount: create.auth.oauthProviderCount,
    scaffoldOrgs: create.auth.orgs,
  };
}

/**
 * Derives the full `telemetryProjects` column patch for one ingested event.
 * Always returns every column — an event carrying no `config` (a failed
 * load, or a `dev`/`deploy` event whose load never reached config
 * resolution) reuses `existing`'s config-derived columns unchanged; an
 * event carrying no `create` reuses `existing`'s scaffold columns
 * unchanged.
 *
 * @param props.event - The ingested, already-validated telemetry event.
 * @param props.existing - The project's current row, or `null` for a
 *   project's first-ever event.
 * @returns The complete column set for `ctx.db.insert`/`ctx.db.patch`.
 */
export function deriveTelemetryProject(props: {
  event: TelemetryEvent;
  existing: Doc<"telemetryProjects"> | null;
}): TelemetryProjectPatch {
  const { event, existing } = props;
  const { outcome } = event;
  const now = Date.now();

  return {
    projectId: event.projectId,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    devEventCount: (existing?.devEventCount ?? 0) + (event.event === "dev" ? 1 : 0),
    deployEventCount: (existing?.deployEventCount ?? 0) + (event.event === "deploy" ? 1 : 0),
    createEventCount: (existing?.createEventCount ?? 0) + (event.event === "create" ? 1 : 0),
    failedEventCount: (existing?.failedEventCount ?? 0) + (outcome.status === "failed" ? 1 : 0),
    lastEvent: [event.event],
    lastOutcomeStatus: [outcome.status],
    lastFailureStage: outcome.status === "failed" ? [outcome.stage] : existing?.lastFailureStage,
    lastErrorCode: outcome.status === "failed" ? [outcome.errorCode] : existing?.lastErrorCode,
    framework: [event.environment.framework],
    packageManager: [event.environment.packageManager],
    os: event.environment.os,
    nodeMajor: parseNodeMajor(event.environment.nodeVersion),
    vexCoreVersion: event.environment.vexVersions["@vexcms/core"] ?? existing?.vexCoreVersion,
    ...deriveScaffoldColumns(event.create, existing),
    ...(event.config ? deriveConfigColumns(event.config, existing) : previousConfigColumns(existing)),
  };
}

/**
 * Guards {@link deriveTelemetryProject} against a malformed `config` (an
 * old or skewed CLI build, since `config`/`timings` are `v.optional(v.any())`
 * in `ingest.ts`'s args validator and so reach here with no structural
 * check at all). Returns `undefined` instead of throwing — `ingest.ts`
 * calls this instead of `deriveTelemetryProject` directly so a bad
 * `config` can't roll back the raw `telemetryEvents` insert that already
 * landed earlier in the same (atomic) mutation; it skips the project
 * upsert for this event entirely rather than attempt a partial,
 * config-independent patch.
 */
export function safeDeriveTelemetryProject(props: {
  event: TelemetryEvent;
  existing: Doc<"telemetryProjects"> | null;
}): TelemetryProjectPatch | undefined {
  try {
    return deriveTelemetryProject(props);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return undefined;
  }
}
