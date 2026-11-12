// @ts-nocheck
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

import { classifyTelemetryError, recordTelemetryEvent, TELEMETRY_DEV_TIMEOUT_MS } from "@vexcms/telemetry";
import { anonymizeConfig } from "@vexcms/telemetry/config";

import { generateAndWrite, getOutputPath } from "../lib/generateSchema.js";
import {
  DEV_FINAL_ONLY_FLAGS,
  killConvexDev,
  startConvexDev,
  stripConvexFlags,
  waitForDeploy,
} from "../lib/convexProcess.js";
import { loadConfig, patchConvexTsconfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";
import { traceImports } from "../lib/traceImports.js";
import { createWatcher } from "../lib/watcher.js";

/** Options controlling how `vex dev` runs. */
export interface DevOptions {
  once?: boolean;
  cwd?: string;
  /** Flags forwarded verbatim to `convex dev` (see `parseCliArgs`). */
  convexArgs?: string[];
}

/**
 * Run the `vex dev` workflow: load the config, generate the Convex schema,
 * patch `convex/tsconfig.json` for path aliases, start `convex dev` with
 * every forwarded flag, and watch the config's transitive imports to
 * regenerate the schema on change.
 *
 * With `options.once`, generates and pushes the schema a single time (via a
 * standalone `convex dev --once` push carrying the forwarded flags) instead
 * of starting the long-running watch loop. Interim auto-migration pushes in
 * that mode drop `--run`/`--run-component`/`--start`, so those run once, on
 * the final push.
 * @param options - Run-mode, working-directory and Convex-flag overrides.
 */
export async function devCommand(options: DevOptions = {}) {
  const cwd = options.cwd ? resolve(process.cwd(), options.cwd) : process.cwd();
  const convexArgs = options.convexArgs ?? [];
  const interimPush = (pushCwd: string) =>
    waitForDeploy({ cwd: pushCwd, convexArgs: stripConvexFlags({ convexArgs, flags: DEV_FINAL_ONLY_FLAGS }) });
  let configPath: string;
  try {
    configPath = resolveConfigPath(cwd);
  } catch (error) {
    await recordTelemetryEvent({
      event: "dev",
      projectDir: cwd,
      outcome: { status: "failed", stage: "resolveConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  if (!isServerConfigPath(configPath)) {
    logger.error(
      `vex dev requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
    );
    process.exit(1);
  }
  logger.info(`Config found: ${configPath}`);

  // Initial generation
  const configLoadStart = performance.now();
  let config;
  try {
    config = await loadConfig({ configPath, projectDir: cwd });
  } catch (error) {
    await recordTelemetryEvent({
      event: "dev",
      projectDir: cwd,
      outcome: { status: "failed", stage: "loadConfig", errorCode: classifyTelemetryError({ error }) },
    });
    throw error;
  }
  const configLoadMs = performance.now() - configLoadStart;
  const outputPath = getOutputPath(config, cwd);

  const schemaGenStart = performance.now();
  let result;
  try {
    result = await generateAndWrite(config, cwd, configPath, { pushSchema: interimPush });
  } catch (error) {
    await recordTelemetryEvent({
      event: "dev",
      projectDir: cwd,
      outcome: { status: "failed", stage: "generateSchema", errorCode: classifyTelemetryError({ error }) },
      hideRunNotice: config.telemetry.hideLogs,
    });
    throw error;
  }
  const schemaGenMs = performance.now() - schemaGenStart;
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  // If --once, push schema standalone (no long-running process) and exit.
  // Record the `ok` dev event only after the push resolves — not before it
  // starts — so a receiver hosted on the SAME deployment the push just hit
  // isn't raced (recording earlier can time out the send while the push is
  // still in flight). Report the push result first either way, THEN await
  // the send (unlike watch mode's fire-and-forget, since the process is
  // about to exit and would otherwise kill the send mid-flight) — a failed
  // push uses the default (short) timeout so a dead receiver doesn't delay
  // the already-decided `process.exit(1)`; a successful push can afford
  // the longer `TELEMETRY_DEV_TIMEOUT_MS` since there's nothing left to do
  // but exit 0 either way.
  if (options.once) {
    const ok = await waitForDeploy({ cwd, convexArgs });
    if (!ok) {
      logger.error("Schema push failed");
      await recordTelemetryEvent({
        event: "dev",
        projectDir: cwd,
        config: () => anonymizeConfig({ config }),
        timings: { configLoadMs, schemaGenMs, schemaChanged: result.written },
        outcome: { status: "ok" },
        hideRunNotice: config.telemetry.hideLogs,
      });
      process.exit(1);
    }
    await recordTelemetryEvent({
      event: "dev",
      projectDir: cwd,
      config: () => anonymizeConfig({ config }),
      timings: { configLoadMs, schemaGenMs, schemaChanged: result.written },
      outcome: { status: "ok" },
      timeoutMs: TELEMETRY_DEV_TIMEOUT_MS,
      hideRunNotice: config.telemetry.hideLogs,
    });
    return;
  }

  // Patch convex/tsconfig.json BEFORE starting Convex dev.
  patchConvexTsconfig(cwd);

  // Watch convex/tsconfig.json for changes — if Convex overwrites it
  // during project provisioning, patch it back immediately.
  // Stops after the first successful deploy (only needed during setup).
  const convexTsconfigPath = resolve(cwd, "convex/tsconfig.json");
  let patchDebounce: ReturnType<typeof setTimeout> | null = null;
  const { watch: watchFs, existsSync: fsExistsSync } = await import("node:fs");
  const tsconfigWatcher = fsExistsSync(convexTsconfigPath)
    ? watchFs(convexTsconfigPath, () => {
        if (patchDebounce) clearTimeout(patchDebounce);
        patchDebounce = setTimeout(() => {
          patchConvexTsconfig(cwd);
        }, 100);
      })
    : null;

  // Start convex dev — this is the core of `vex dev`
  startConvexDev({ cwd, convexArgs });

  // Wait for the first deployment. On success, stop the tsconfig watcher
  // (no longer needed). On failure, the watcher already patched the file
  // which triggers Convex to retry. Either way, record the `ok` dev event
  // only now — after the first push resolves, not before it starts — same
  // race-avoidance reason as the `--once` branch above; fire-and-forget
  // here since the process keeps running the watch loop afterward.
  waitForDeploy({ cwd })
    .then(async (deployed) => {
      // Stop watching — Convex only overwrites tsconfig during provisioning
      tsconfigWatcher?.close();

      void recordTelemetryEvent({
        event: "dev",
        projectDir: cwd,
        config: () => anonymizeConfig({ config }),
        timings: { configLoadMs, schemaGenMs, schemaChanged: result.written },
        outcome: { status: "ok" },
        timeoutMs: TELEMETRY_DEV_TIMEOUT_MS,
        hideRunNotice: config.telemetry.hideLogs,
      });

      if (!deployed) {
        // Patch one more time in case the watcher missed it
        patchConvexTsconfig(cwd);
        return;
      }
    })
    .catch(() => {
      tsconfigWatcher?.close();
      patchConvexTsconfig(cwd);
    });

  // Trace the import tree
  let watchedPaths = traceImports(configPath, outputPath);
  logger.info(`Watching ${watchedPaths.length} files for changes...`);

  // Set up watcher
  const watcher = createWatcher(watchedPaths);

  // Debounce + in-flight guard to prevent duplicate regenerations
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let generating = false;
  let pendingChange = false;

  async function regenerate() {
    if (generating) {
      pendingChange = true;
      return;
    }
    generating = true;

    try {
      config = await loadConfig({ configPath, projectDir: cwd });
      const genResult = await generateAndWrite(config, cwd, configPath, { pushSchema: interimPush });

      if (genResult.written) {
        logger.success(`Regenerated ${config.schema.outputPath}`);
      } else {
        logger.info("Schema unchanged, skipped write");
      }

      // Re-trace imports to pick up new files
      const newPaths = traceImports(configPath, outputPath);
      watcher.updatePaths(newPaths);

      if (newPaths.length !== watchedPaths.length) {
        logger.info(`Now watching ${newPaths.length} files`);
      }
      watchedPaths = newPaths;
    } catch (err) {
      logger.error("Generation failed (schema untouched)", err);
    } finally {
      generating = false;
      if (pendingChange) {
        pendingChange = false;
        regenerate();
      }
    }
  }

  watcher.on("all", (_event, changedPath) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const relPath = changedPath.replace(cwd + "/", "");
      logger.info(`Change detected: ${relPath}`);
      regenerate();
    }, 200);
  });

  // Graceful shutdown — wait for convex dev to actually exit before we do.
  // Without the await, the CLI exits immediately after sending SIGTERM to
  // pnpm, which doesn't forward the signal, leaving convex dev as an orphan.
  const shutdown = async () => {
    logger.info("Shutting down...");
    if (debounceTimer) clearTimeout(debounceTimer);
    await Promise.all([killConvexDev(), watcher.close()]);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
