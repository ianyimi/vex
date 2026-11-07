import { classifyTelemetryError, recordTelemetryEvent } from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { generateAndWrite, type GenerateResult } from "../lib/generateSchema.js";
import { deployToProduction } from "../lib/convexProcess.js";
import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";

import type { VexConfig } from "@vexcms/core";

/**
 * `vex deploy` — generate schema, auto-migrate if enabled, then run
 * `convex deploy` to push to production. Replaces `convex deploy` in CI.
 */
export async function deployCommand(): Promise<void> {
  const cwd = process.cwd();

  let configPath: string;
  try {
    configPath = resolveConfigPath(cwd);
  } catch (error) {
    await recordTelemetryEvent({
      event: "deploy",
      projectDir: cwd,
      outcome: { status: "failed", stage: "resolveConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  if (!isServerConfigPath(configPath)) {
    logger.error(
      `vex deploy requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
    );
    process.exit(1);
  }
  logger.info(`Config found: ${configPath}`);

  let config: VexConfig;
  try {
    config = await loadConfig({ configPath, projectDir: cwd });
  } catch (error) {
    await recordTelemetryEvent({
      event: "deploy",
      projectDir: cwd,
      outcome: { status: "failed", stage: "loadConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }

  // Use `convex deploy` for all schema pushes (interim + final)
  const pushSchema = (pushCwd: string) => deployToProduction(pushCwd);

  let result: GenerateResult;
  try {
    result = await generateAndWrite(config, cwd, configPath, { pushSchema });
  } catch (error) {
    await recordTelemetryEvent({
      event: "deploy",
      projectDir: cwd,
      outcome: { status: "failed", stage: "generateSchema", errorCode: classifyTelemetryError({ error }) },
      hideRunNotice: config.telemetry.hideLogs,
    });
    throw error;
  }
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  // Final deploy — push everything to production
  if (!deployToProduction(cwd)) {
    logger.error("convex deploy failed");
    process.exit(1);
  }

  logger.success("Deployed to production");

  await recordTelemetryEvent({
    event: "deploy",
    projectDir: cwd,
    config: () => anonymizeConfig({ config }),
    outcome: { status: "ok" },
    hideRunNotice: config.telemetry.hideLogs,
  });
}
