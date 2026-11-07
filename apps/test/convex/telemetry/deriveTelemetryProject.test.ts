import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@vexcms/telemetry";

import type { Doc, Id } from "../_generated/dataModel";
import {
  deriveTelemetryProject,
  safeDeriveTelemetryProject,
  type TelemetryProjectPatch,
} from "./deriveTelemetryProject";

function asExistingRow(patch: TelemetryProjectPatch): Doc<"telemetryProjects"> {
  const existingId = "scratch-project" as Id<"telemetryProjects">;
  return { _id: existingId, _creationTime: 0, ...patch };
}

const baseEnvironment = {
  vexVersions: { "@vexcms/core": "0.1.0-alpha.27" },
  nodeVersion: "v20.11.0",
  os: "darwin",
  arch: "arm64",
  packageManager: "pnpm",
  framework: "next",
} satisfies TelemetryEvent["environment"];

const sampleConfig = {
  collectionCount: 1,
  globalCount: 0,
  mediaCollectionCount: 0,
  blockCount: 0,
  fieldCount: 2,
  resources: [
    {
      path: "c1",
      kind: "collection",
      drafts: false,
      livePreview: false,
      timestamps: true,
      indexCount: 0,
      hookCounts: { beforeChange: 0, beforeDelete: 0, afterChange: 1, afterDelete: 0 },
      savedViewCount: 1,
      defaultSortIsCustom: true,
      bulkDelete: true,
    },
  ],
  blocks: [],
  fields: [
    { path: "c1.f1", type: "text", required: true },
    { path: "c1.f2", type: "select", hasMany: false, optionCount: 2 },
  ],
  features: {
    drafts: false,
    livePreview: false,
    conditions: false,
    slots: false,
    inputMasks: false,
    localization: false,
    auth: true,
    authAdapter: "betterAuth",
    access: {
      enabled: true,
      roleCount: 2,
      ruleCount: 3,
      fieldPermissionRuleCount: 1,
      queryConstraintRuleCount: 1,
      callbackRuleCount: 1,
      customActionCount: 0,
      customResourceCount: 0,
      organizations: false,
    },
    hookCount: 1,
  },
  storageAdapterKinds: ["presigned-url"],
} satisfies NonNullable<TelemetryEvent["config"]>;

describe("deriveTelemetryProject", () => {
  it("produces a complete patch for a project's first (config-bearing) event", () => {
    const event: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: sampleConfig,
    };

    const patch = deriveTelemetryProject({ event, existing: null });

    expect(patch).toMatchObject({
      projectId: "project-1",
      devEventCount: 1,
      deployEventCount: 0,
      createEventCount: 0,
      failedEventCount: 0,
      lastEvent: ["dev"],
      lastOutcomeStatus: ["ok"],
      lastFailureStage: undefined,
      lastErrorCode: undefined,
      framework: ["next"],
      packageManager: ["pnpm"],
      os: "darwin",
      nodeMajor: 20,
      vexCoreVersion: "0.1.0-alpha.27",
      collectionCount: 1,
      fieldCount: 2,
      fieldTypes: ["select", "text"],
      hookCount: 1,
      accessEnabled: true,
      accessRuleCount: 3,
      storageUsesPresignedUrl: true,
      configTruncated: undefined,
    });
    expect(patch.latestConfig).toEqual(sampleConfig);
  });

  it("carries forward config-derived and scaffold columns when a later event has no config (a failed load)", () => {
    const createEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "create",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: sampleConfig,
      create: {
        framework: "nextjs",
        template: "base",
        bare: true,
        auth: { emailPassword: true, oauthProviderCount: 1, orgs: false },
        monorepo: false,
        initGit: true,
        installDependencies: false,
      },
    };
    const existing = asExistingRow(deriveTelemetryProject({ event: createEvent, existing: null }));

    const failedEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "failed", stage: "loadConfig", errorCode: "configError" },
    };

    const patch = deriveTelemetryProject({ event: failedEvent, existing });

    expect(patch).toMatchObject({
      failedEventCount: 1,
      devEventCount: 1,
      createEventCount: 1,
      lastOutcomeStatus: ["failed"],
      lastFailureStage: ["loadConfig"],
      lastErrorCode: ["configError"],
      collectionCount: 1,
      fieldCount: 2,
      fieldTypes: ["select", "text"],
      scaffoldTemplate: ["base"],
      scaffoldBare: true,
    });
    expect(patch.latestConfig).toEqual(sampleConfig);
    expect(patch.firstSeenAt).toBe(existing.firstSeenAt);
  });

  it("on a truncated config, updates scalar/feature/access columns from the real payload but carries forward fieldTypes unchanged", () => {
    const firstEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: sampleConfig,
    };
    const existing = asExistingRow(deriveTelemetryProject({ event: firstEvent, existing: null }));

    const truncatedConfig = {
      ...sampleConfig,
      collectionCount: 50,
      fieldCount: 300,
      resources: [],
      blocks: [],
      fields: [],
      features: {
        ...sampleConfig.features,
        hookCount: 7,
        access: { ...sampleConfig.features.access, ruleCount: 12 },
      },
      truncated: true,
    } satisfies NonNullable<TelemetryEvent["config"]>;

    const truncatedEvent: TelemetryEvent = {
      schemaVersion: 1,
      event: "deploy",
      machineId: "machine-1",
      projectId: "project-1",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: truncatedConfig,
    };

    const patch = deriveTelemetryProject({ event: truncatedEvent, existing });

    expect(patch).toMatchObject({
      configTruncated: true,
      collectionCount: 50,
      fieldCount: 300,
      hookCount: 7,
      accessRuleCount: 12,
      fieldTypes: existing.fieldTypes,
    });
    expect(patch.fieldTypes).toEqual(["select", "text"]);
    expect(patch.latestConfig).toEqual(truncatedConfig);
  });

  it("on a project's first-ever event arriving already truncated, leaves fieldTypes unset instead of inventing values", () => {
    const truncatedConfig = {
      ...sampleConfig,
      resources: [],
      blocks: [],
      fields: [],
      truncated: true,
    } satisfies NonNullable<TelemetryEvent["config"]>;

    const event: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-2",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: truncatedConfig,
    };

    const patch = deriveTelemetryProject({ event, existing: null });

    expect(patch).toMatchObject({
      configTruncated: true,
      collectionCount: sampleConfig.collectionCount,
      fieldCount: sampleConfig.fieldCount,
      fieldTypes: undefined,
    });
  });

  it("deriveTelemetryProject throws for a config missing features/fields", () => {
    const malformedConfig = { collectionCount: 1 } as unknown as NonNullable<TelemetryEvent["config"]>;
    const event: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-3",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: malformedConfig,
    };

    expect(() => deriveTelemetryProject({ event, existing: null })).toThrow();
  });

  it("safeDeriveTelemetryProject does not throw for the same malformed config, logging instead and returning undefined", () => {
    const malformedConfig = { collectionCount: 1 } as unknown as NonNullable<TelemetryEvent["config"]>;
    const event: TelemetryEvent = {
      schemaVersion: 1,
      event: "dev",
      machineId: "machine-1",
      projectId: "project-3",
      sentAt: new Date().toISOString(),
      environment: baseEnvironment,
      outcome: { status: "ok" },
      config: malformedConfig,
    };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const patch = safeDeriveTelemetryProject({ event, existing: null });

    expect(patch).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});
