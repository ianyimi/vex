import { v } from "convex/values";
import type { TelemetryEvent } from "@vexcms/telemetry";

import { internalMutation } from "../_generated/server";
import { safeDeriveTelemetryProject } from "./deriveTelemetryProject";

const TELEMETRY_EVENT_NAMES = ["dev", "deploy", "create"] as const;
const TELEMETRY_FAILURE_STAGES = ["resolveConfig", "loadConfig", "generateSchema", "scaffold"] as const;
const TELEMETRY_ERROR_CODES = [
  "configError",
  "accessConfigError",
  "authConfigError",
  "componentConfigError",
  "storageConfigError",
  "unknown",
] as const;
const TELEMETRY_FRAMEWORKS = ["next", "tanstack", "unknown"] as const;
const TELEMETRY_PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun", "unknown"] as const;
const TELEMETRY_CREATE_TEMPLATES = ["base", "marketing"] as const;

const outcomeValidator = v.union(
  v.object({ status: v.literal("ok") }),
  v.object({
    status: v.literal("failed"),
    stage: v.union(...TELEMETRY_FAILURE_STAGES.map((stage) => v.literal(stage))),
    errorCode: v.union(...TELEMETRY_ERROR_CODES.map((code) => v.literal(code))),
  }),
);

const environmentValidator = v.object({
  vexVersions: v.record(v.string(), v.string()),
  nodeVersion: v.string(),
  os: v.string(),
  arch: v.string(),
  packageManager: v.union(...TELEMETRY_PACKAGE_MANAGERS.map((packageManager) => v.literal(packageManager))),
  framework: v.union(...TELEMETRY_FRAMEWORKS.map((framework) => v.literal(framework))),
});

const createValidator = v.object({
  framework: v.string(),
  template: v.union(...TELEMETRY_CREATE_TEMPLATES.map((template) => v.literal(template))),
  bare: v.boolean(),
  auth: v.object({
    emailPassword: v.boolean(),
    oauthProviderCount: v.number(),
    orgs: v.boolean(),
  }),
  monorepo: v.boolean(),
  initGit: v.boolean(),
  installDependencies: v.boolean(),
});

/**
 * Ingests one telemetry event: inserts the raw row into `telemetryEvents`
 * unconditionally, then upserts the derived `telemetryProjects` row for
 * its `projectId`. The args validator above fully validates every field
 * EXCEPT `config`/`timings` (`v.optional(v.any())`, deliberately
 * unstructured — the payload is the stable contract across
 * `schemaVersion`s, so an old or skewed CLI's `config` shape is never
 * pinned down here) — `event` below is read as `TelemetryEvent` on faith
 * for those two fields alone. A malformed `config` can make
 * `deriveTelemetryProject` throw, which is why this calls
 * `safeDeriveTelemetryProject` instead — it can't let that roll back the
 * raw `telemetryEvents` insert that already landed in this same (atomic)
 * mutation, so a thrown derivation skips the project upsert for this
 * event rather than attempt a partial, config-independent patch.
 */
export const ingest = internalMutation({
  args: {
    schemaVersion: v.literal(1),
    event: v.union(...TELEMETRY_EVENT_NAMES.map((name) => v.literal(name))),
    machineId: v.string(),
    projectId: v.string(),
    sentAt: v.string(),
    environment: environmentValidator,
    outcome: outcomeValidator,
    config: v.optional(v.any()),
    timings: v.optional(v.any()),
    create: v.optional(createValidator),
  },
  handler: async (ctx, args) => {
    const event = args as TelemetryEvent;
    const { outcome } = event;

    await ctx.db.insert("telemetryEvents", {
      event: [event.event],
      schemaVersion: event.schemaVersion,
      machineId: event.machineId,
      projectId: event.projectId,
      outcomeStatus: [outcome.status],
      failureStage: outcome.status === "failed" ? [outcome.stage] : undefined,
      errorCode: outcome.status === "failed" ? [outcome.errorCode] : undefined,
      framework: [event.environment.framework],
      vexCoreVersion: event.environment.vexVersions["@vexcms/core"],
      payload: event,
    });

    const existing = await ctx.db
      .query("telemetryProjects")
      .withIndex("by_projectId", (q) => q.eq("projectId", event.projectId))
      .unique();

    const patch = safeDeriveTelemetryProject({ event, existing });
    if (!patch) return;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("telemetryProjects", patch);
    }
  },
});
