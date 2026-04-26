// @ts-nocheck
import { resolve } from "node:path";
import { generateAndWrite, getOutputPath } from "../lib/generateSchema.js";
import {
  killConvexDev,
  startConvexDev,
  waitForDeploy,
} from "../lib/convexProcess.js";
import { loadConfig, patchConvexTsconfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { backfillVersionStatus } from "../lib/migrate.js";
import { resolveConfigPath } from "../lib/resolveConfigPath.js";
import { resolveConvexUrl } from "../lib/resolveConvexUrl.js";
import { traceImports } from "../lib/traceImports.js";
import { createWatcher } from "../lib/watcher.js";

/**
 *
 */
export interface DevOptions {
  once?: boolean;
  cwd?: string;
}

export async function devCommand(options: DevOptions = {}) {
  const cwd = options.cwd
    ? resolve(process.cwd(), options.cwd)
    : process.cwd();
  const configPath = resolveConfigPath(cwd);
  logger.info(`Config found: ${configPath}`);

  // Initial generation
  let config = await loadConfig(configPath);
  const outputPath = getOutputPath(config, cwd);

  const result = await generateAndWrite(config, cwd, configPath);
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  // If --once, push schema standalone (no long-running process) and exit
  if (options.once) {
    const ok = await waitForDeploy(cwd);
    if (!ok) {
      logger.error("Schema push failed");
      process.exit(1);
    }
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
  startConvexDev(cwd);

  // Wait for the first deployment. On success, stop the tsconfig watcher
  // (no longer needed). On failure, the watcher already patched the file
  // which triggers Convex to retry.
  const hasVersioning = config.collections.some((c) => c.versions?.drafts);
  waitForDeploy(cwd)
    .then(async (deployed) => {
      // Stop watching — Convex only overwrites tsconfig during provisioning
      tsconfigWatcher?.close();

      if (!deployed) {
        // Patch one more time in case the watcher missed it
        patchConvexTsconfig(cwd);
        return;
      }

      if (hasVersioning) {
        const convexUrl = resolveConvexUrl(cwd);
        if (convexUrl) {
          await backfillVersionStatus({ convexUrl, config });
        }
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
      config = await loadConfig(configPath);
      const genResult = await generateAndWrite(config, cwd, configPath);

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
