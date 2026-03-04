import { execSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { logger } from "./logger.js";

/** Singleton state for the managed convex dev child process. */
let convexChild: ChildProcess | null = null;
let deployResolvers: Array<(ok: boolean) => void> = [];

/**
 * Patterns that indicate convex dev has finished deploying.
 * Convex prints to stderr via ora/logToStderr:
 *   "✔ HH:MM:SS Convex functions ready! (duration)"
 * On failure it prints "✗" or schema validation errors.
 */
const DEPLOY_SUCCESS_RE = /functions ready|successfully deployed/i;
const DEPLOY_FAILURE_RE =
  /schema validation error|error:|✗|unable to push|invalid schema/i;

interface PackageManager { cmd: string; args: string[] }

const LOCK_FILES: Array<{ file: string; pm: PackageManager }> = [
  { file: "pnpm-lock.yaml", pm: { cmd: "pnpm", args: ["exec"] } },
  { file: "yarn.lock", pm: { cmd: "yarn", args: [] } },
  { file: "bun.lockb", pm: { cmd: "bunx", args: [] } },
  { file: "bun.lock", pm: { cmd: "bunx", args: [] } },
  { file: "package-lock.json", pm: { cmd: "npx", args: [] } },
];

/**
 * Detect the package manager. Checks lock files in `cwd` first, then
 * walks up the directory tree. Falls back to npx if nothing is found.
 */
function detectPackageManager(cwd: string): PackageManager {
  let dir = resolve(cwd);
  const root = dirname(dir) === dir ? dir : undefined;

  while (true) {
    for (const { file, pm } of LOCK_FILES) {
      if (existsSync(resolve(dir, file))) return pm;
    }
    const parent = dirname(dir);
    if (parent === dir || dir === root) break;
    dir = parent;
  }

  return { cmd: "npx", args: [] };
}

/**
 * Spawn `convex dev` with piped stdout/stderr so we can detect
 * deployment events. Output is forwarded to the console.
 */
export function startConvexDev(cwd: string): ChildProcess {
  const pm = detectPackageManager(cwd);
  const fullArgs = [...pm.args, "convex", "dev"];

  logger.info(`Starting convex dev (${pm.cmd})...`);

  const child = spawn(pm.cmd, fullArgs, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
  });

  convexChild = child;

  const handleOutput = (data: Buffer) => {
    const text = data.toString();
    // Forward to console
    process.stdout.write(text);

    // Check for deployment signals
    if (DEPLOY_SUCCESS_RE.test(text)) {
      flushResolvers(true);
    } else if (DEPLOY_FAILURE_RE.test(text)) {
      flushResolvers(false);
    }
  };

  child.stdout?.on("data", handleOutput);
  child.stderr?.on("data", (data: Buffer) => {
    const text = data.toString();
    process.stderr.write(text);

    // Convex dev writes success/failure messages to stderr
    if (DEPLOY_SUCCESS_RE.test(text)) {
      flushResolvers(true);
    } else if (DEPLOY_FAILURE_RE.test(text)) {
      flushResolvers(false);
    }
  });

  child.on("error", (err) => {
    logger.error(`convex dev error: ${err.message}`);
    flushResolvers(false);
  });

  child.on("exit", (code, signal) => {
    convexChild = null;
    flushResolvers(false);

    if (signal) {
      logger.info(`convex dev killed by ${signal}`);
    } else if (code !== 0 && code !== null) {
      logger.error(`convex dev exited with code ${code}`);
      process.exit(code);
    }
  });

  return child;
}

/**
 * Wait for the running `convex dev` process to complete its next deployment.
 *
 * Returns `true` if deployment succeeded, `false` if it failed or timed out.
 * If no convex dev process is running, falls back to running `convex dev --once`.
 */
export function waitForDeploy(
  cwd: string,
  timeoutMs = 60_000,
): Promise<boolean> {
  // No managed process — fall back to standalone push
  if (!convexChild) {
    return Promise.resolve(pushSchemaStandalone(cwd));
  }

  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      // Remove this resolver from the list
      deployResolvers = deployResolvers.filter((r) => r !== wrappedResolve);
      logger.warn("Timed out waiting for Convex to deploy schema");
      resolve(false);
    }, timeoutMs);

    const wrappedResolve = (ok: boolean) => {
      clearTimeout(timer);
      resolve(ok);
    };

    deployResolvers.push(wrappedResolve);
  });
}

/** Resolve all pending waitForDeploy() promises. */
function flushResolvers(ok: boolean) {
  const resolvers = deployResolvers;
  deployResolvers = [];
  for (const resolve of resolvers) {
    resolve(ok);
  }
}

/** Kill the managed convex dev process. */
export function killConvexDev(): void {
  if (convexChild && !convexChild.killed) {
    convexChild.kill("SIGTERM");
  }
}

/**
 * Standalone push using `convex dev --once` or `convex deploy`.
 * Used when no convex dev process is running (--once mode, deploy, migrate).
 */
function pushSchemaStandalone(cwd: string): boolean {
  return runConvexCommand(cwd, ["dev", "--once", "--typecheck", "disable", "--codegen", "disable"]);
}

/**
 * Run `convex deploy` to push to production.
 */
export function deployToProduction(cwd: string): boolean {
  return runConvexCommand(cwd, ["deploy"]);
}

function runConvexCommand(cwd: string, convexArgs: string[]): boolean {
  const pm = detectPackageManager(cwd);
  const cmd = [pm.cmd, ...pm.args, "convex", ...convexArgs].join(" ");

  logger.info(`Running: ${cmd}`);
  try {
    execSync(cmd, {
      cwd,
      stdio: "inherit",
      timeout: 120_000,
    });
    logger.success("Convex command succeeded");
    return true;
  } catch (err) {
    const output =
      err && typeof err === "object" && "stderr" in err
        ? String((err as any).stderr).slice(0, 300)
        : "";
    logger.warn(`Convex command failed${output ? `: ${output}` : ""}`);
    return false;
  }
}
