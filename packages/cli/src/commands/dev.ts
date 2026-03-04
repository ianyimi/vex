import type { ChildProcess } from "node:child_process";

import { resolveDevCommand, spawnDevServer } from "../lib/devServer.js";
import { generateAndWrite, getOutputPath } from "../lib/generateSchema.js";
import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { resolveConfigPath } from "../lib/resolveConfigPath.js";
import { traceImports } from "../lib/traceImports.js";
import { createWatcher } from "../lib/watcher.js";

export interface DevOptions {
  once?: boolean;
  run?: string;
}

export async function devCommand(options: DevOptions = {}) {
  const cwd = process.cwd();
  const configPath = resolveConfigPath(cwd);
  logger.info(`Config found: ${configPath}`);

  // Initial generation
  let config = await loadConfig(configPath);
  const outputPath = getOutputPath(config, cwd);

  const result = await generateAndWrite(config, cwd);
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  // If --once, just generate and exit
  if (options.once) return;

  // Spawn the dev server (if configured)
  let devServerProcess: ChildProcess | undefined;
  const devCmd = resolveDevCommand({
    runFlag: options.run,
    configDevCommand: config.devCommand,
    cwd,
  });

  if (devCmd) {
    devServerProcess = spawnDevServer(devCmd, cwd);
  }

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
      const genResult = await generateAndWrite(config, cwd);

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

  watcher.on("change", (changedPath) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const relPath = changedPath.replace(cwd + "/", "");
      logger.info(`Change detected: ${relPath}`);
      regenerate();
    }, 200);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down...");
    if (debounceTimer) clearTimeout(debounceTimer);
    if (devServerProcess && !devServerProcess.killed) {
      devServerProcess.kill("SIGTERM");
    }
    await watcher.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
