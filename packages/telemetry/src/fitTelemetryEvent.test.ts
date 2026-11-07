import { describe, expect, it } from "vitest";
import { TELEMETRY_MAX_BODY_BYTES, TELEMETRY_SCHEMA_VERSION } from "./constants";
import { fitTelemetryEvent } from "./fitTelemetryEvent";
import type { AnonymizedConfig, AnonymizedField, AnonymizedResource, TelemetryEvent } from "./types";

function buildEnvironment(): TelemetryEvent["environment"] {
  return {
    vexVersions: {},
    nodeVersion: process.version,
    os: process.platform,
    arch: process.arch,
    packageManager: "pnpm",
    framework: "unknown",
  };
}

function buildBaseEvent(config: AnonymizedConfig): TelemetryEvent {
  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    event: "dev",
    machineId: "machine-1",
    projectId: "project-1",
    sentAt: new Date().toISOString(),
    environment: buildEnvironment(),
    outcome: { status: "ok" },
    config,
  };
}

function buildFeatures(): AnonymizedConfig["features"] {
  return {
    drafts: false,
    livePreview: false,
    conditions: false,
    slots: false,
    inputMasks: false,
    localization: false,
    auth: false,
    authAdapter: "none",
    access: {
      enabled: false,
      roleCount: 0,
      ruleCount: 0,
      fieldPermissionRuleCount: 0,
      queryConstraintRuleCount: 0,
      callbackRuleCount: 0,
      customActionCount: 0,
      customResourceCount: 0,
      organizations: false,
    },
    hookCount: 0,
  };
}

function buildSmallConfig(): AnonymizedConfig {
  return {
    collectionCount: 1,
    globalCount: 0,
    mediaCollectionCount: 0,
    blockCount: 0,
    fieldCount: 1,
    resources: [
      {
        path: "c1",
        kind: "collection",
        drafts: false,
        livePreview: false,
        timestamps: false,
        hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 0, afterDelete: 0 },
      },
    ],
    blocks: [],
    fields: [{ path: "c1.f1", type: "text", required: true }],
    features: buildFeatures(),
    storageAdapterKinds: [],
  };
}

function buildOversizeResourcesAndFields(count: number): { resources: AnonymizedResource[]; fields: AnonymizedField[] } {
  const resources: AnonymizedResource[] = [];
  const fields: AnonymizedField[] = [];
  for (let index = 0; index < count; index += 1) {
    const path = `c${index + 1}`;
    resources.push({
      path,
      kind: "collection",
      drafts: false,
      livePreview: false,
      indexCount: 0,
      timestamps: false,
      savedViewCount: 0,
      defaultSortIsCustom: false,
      bulkDelete: true,
      hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 0, afterDelete: 0 },
    });
    fields.push({
      path: `${path}.f1`,
      type: "text",
      required: true,
      hidden: false,
      readOnly: false,
      position: "main",
      cellAlignment: "left",
      hasValidate: false,
      hasIndex: false,
      hasMask: false,
      min: 3,
      max: 100,
      hasSearchIndex: false,
      enableSorting: false,
      enableHiding: true,
    });
  }
  return { resources, fields };
}

function buildOversizeConfig(): AnonymizedConfig {
  const { resources, fields } = buildOversizeResourcesAndFields(3000);
  return {
    collectionCount: resources.length,
    globalCount: 0,
    mediaCollectionCount: 0,
    blockCount: 0,
    fieldCount: fields.length,
    resources,
    blocks: [],
    fields,
    features: buildFeatures(),
    storageAdapterKinds: [],
  };
}

describe("fitTelemetryEvent", () => {
  it("returns an under-cap event unchanged", () => {
    const event = buildBaseEvent(buildSmallConfig());

    expect(fitTelemetryEvent({ event })).toEqual(event);
  });

  it("truncates an oversize config's resources/blocks/fields, keeping every count and features, and fits the cap", () => {
    const oversizeConfig = buildOversizeConfig();
    const event = buildBaseEvent(oversizeConfig);
    expect(Buffer.byteLength(JSON.stringify(event), "utf8")).toBeGreaterThan(TELEMETRY_MAX_BODY_BYTES);

    const fitted = fitTelemetryEvent({ event });

    expect(fitted).toBeDefined();
    expect(fitted?.config).toEqual({
      ...oversizeConfig,
      resources: [],
      blocks: [],
      fields: [],
      truncated: true,
    });
    expect(fitted?.config?.collectionCount).toBe(3000);
    expect(fitted?.config?.fieldCount).toBe(3000);
    expect(fitted?.config?.features).toEqual(oversizeConfig.features);
    expect(Buffer.byteLength(JSON.stringify(fitted), "utf8")).toBeLessThanOrEqual(TELEMETRY_MAX_BODY_BYTES);
  });

  it("drops an event that is still oversize after truncation", () => {
    const hugeStorageAdapterKinds = Array.from({ length: 60_000 }, () => "presigned-url" as const);
    const config: AnonymizedConfig = { ...buildSmallConfig(), storageAdapterKinds: hugeStorageAdapterKinds };
    const event = buildBaseEvent(config);
    expect(Buffer.byteLength(JSON.stringify(event), "utf8")).toBeGreaterThan(TELEMETRY_MAX_BODY_BYTES);

    const truncatedStillOversize: TelemetryEvent = {
      ...event,
      config: { ...config, resources: [], blocks: [], fields: [], truncated: true },
    };
    expect(Buffer.byteLength(JSON.stringify(truncatedStillOversize), "utf8")).toBeGreaterThan(
      TELEMETRY_MAX_BODY_BYTES,
    );

    expect(fitTelemetryEvent({ event })).toBeUndefined();
  });

  it("drops an oversize event with no config at all", () => {
    const hugeEnvironment = { ...buildEnvironment(), vexVersions: { "@vexcms/huge": "x".repeat(600_000) } };
    const event: TelemetryEvent = { ...buildBaseEvent(buildSmallConfig()), config: undefined, environment: hugeEnvironment };
    expect(Buffer.byteLength(JSON.stringify(event), "utf8")).toBeGreaterThan(TELEMETRY_MAX_BODY_BYTES);

    expect(fitTelemetryEvent({ event })).toBeUndefined();
  });
});
