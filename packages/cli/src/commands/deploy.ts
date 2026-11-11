import { classifyTelemetryError, recordTelemetryEvent } from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { generateAndWrite, type GenerateResult } from "../lib/generateSchema.js";
import { deployToProduction, stripCmdFlags } from "../lib/convexProcess.js";
import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";

import type { VexConfig } from "@vexcms/core";

/** Options for {@link deployCommand}, parsed from the `vex deploy` argv. */
export interface DeployCommandOptions {
  /** Run as if started from this directory (default `process.cwd()`). */
  cwd?: string;
  /** Flags vex doesn't own, forwarded to the final `convex deploy` call. */
  convexArgs?: string[];
}

/**
 * `vex deploy` — generate schema, auto-migrate if enabled, then run
 * `convex deploy` to push to production. Replaces `convex deploy` in CI.
 * `options.convexArgs` forwards straight through to the final deploy; the
 * auto-migration interim pushes strip `--cmd`/`--cmd-url-env-var-name` from
 * it so a custom build command runs once, not on every interim push.
 *
 * @param options - Parsed `vex deploy` options; both fields optional.
 * @returns Resolves once the final deploy succeeds; exits the process on failure.
 */
export async function deployCommand(options: DeployCommandOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const convexArgs = options.convexArgs ?? [];

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

  // Use `convex deploy` for all schema pushes (interim + final). Interim
  // pushes strip --cmd/--cmd-url-env-var-name so the build command runs
  // once, on the final deploy below.
  const pushSchema = (pushCwd: string) =>
    deployToProduction({ cwd: pushCwd, convexArgs: stripCmdFlags(convexArgs) });

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

  // Final deploy — push everything to production, with every caller-passed
  // flag (including --cmd) forwarded.
  if (!deployToProduction({ cwd, convexArgs })) {
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
