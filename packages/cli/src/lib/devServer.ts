import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { logger } from "./logger.js";

/**
 * Resolve which dev command to run.
 * Priority: --run flag > config.devCommand > package.json scripts.dev
 */
export function resolveDevCommand(opts: {
  runFlag?: string;
  configDevCommand?: string;
  cwd: string;
}): string | undefined {
  if (opts.runFlag) return opts.runFlag;
  if (opts.configDevCommand) return opts.configDevCommand;

  // Auto-detect from package.json
  try {
    const raw = readFileSync(resolve(opts.cwd, "package.json"), "utf-8");
    const pkg = JSON.parse(raw);
    const devScript: string | undefined = pkg?.scripts?.dev;

    // Skip if the dev script IS `vex dev` (would be recursive)
    if (devScript && !devScript.includes("vex dev")) {
      return devScript;
    }
  } catch {
    // No package.json or parse error
  }

  return undefined;
}

/**
 * Spawn the dev server as a child process with inherited stdio.
 * Returns the child process handle for cleanup.
 */
export function spawnDevServer(command: string, cwd: string): ChildProcess {
  logger.info(`Starting: ${command}`);

  const child = spawn(command, {
    cwd,
    shell: true,
    stdio: "inherit",
  });

  child.on("error", (err) => {
    logger.error(`Dev server error: ${err.message}`);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      logger.info(`Dev server killed by ${signal}`);
    } else if (code !== 0 && code !== null) {
      logger.error(`Dev server exited with code ${code}`);
    }
  });

  return child;
}
