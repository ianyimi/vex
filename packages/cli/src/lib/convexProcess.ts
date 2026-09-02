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
 * @param cwd - Directory to start the lockfile search from.
 * @returns The detected package manager's invocation (`cmd` plus any
 * wrapper `args`, e.g. `pnpm exec`) used to run `convex` through it;
 * `{ cmd: "npx", args: [] }` when no lockfile is found up the tree.
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
 * @param cwd - Directory to run `convex dev` in; also used to detect the
 * package manager to spawn it through.
 * @returns The spawned, detached child process. It is also stored as the
 * module-level singleton so `waitForDeploy` and `killConvexDev` can await
 * or terminate it later; it resolves nothing itself and may still be
 * starting up when this returns.
 */
export function startConvexDev(cwd: string): ChildProcess {
  const pm = detectPackageManager(cwd);
  const fullArgs = [...pm.args, "convex", "dev"];

  logger.info(`Starting convex dev (${pm.cmd})...`);

  const child = spawn(pm.cmd, fullArgs, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    // detached: true creates a new process group so we can kill the entire
    // group (pnpm + convex dev) with process.kill(-pid). Without this,
    // killing `pnpm exec convex dev` leaves the convex dev child running
    // as an orphan because pnpm does not forward signals to its children.
    detached: true,
  });

  // Prevent the child's process group from keeping the parent alive
  child.unref();

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
 * @param cwd - Directory to run the standalone fallback push in when no
 * `convex dev` process is currently managed.
 * @param timeoutMs - Milliseconds to wait for the next deploy event before
 * giving up and resolving `false`. Defaults to 60 seconds.
 * @returns A promise that resolves `true` once the managed `convex dev`
 * process reports a successful deploy, or `false` if it reports failure,
 * the wait times out, or (when no process is managed) the standalone push
 * fails.
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

/**
 * Resolve every pending `waitForDeploy()` promise with the given outcome
 * and clear the pending list.
 * @param ok - The deploy outcome to resolve each pending promise with;
 * `true` for a successful deploy, `false` for a failure.
 */
function flushResolvers(ok: boolean) {
  const resolvers = deployResolvers;
  deployResolvers = [];
  for (const resolve of resolvers) {
    resolve(ok);
  }
}

/**
 * Kill the managed convex dev process and wait for it to exit.
 * Kills the entire process group (pnpm + convex dev children) so no orphans
 * are left behind when pnpm fails to forward the signal.
 */
export async function killConvexDev(): Promise<void> {
  if (!convexChild || convexChild.killed) return;

  const child = convexChild;
  const pid = child.pid;

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    // Kill the whole process group so pnpm's child (convex dev) also dies
    try {
      if (pid) process.kill(-pid, "SIGTERM");
    } catch {
      // Process group may already be gone — fall back to direct kill
      child.kill("SIGTERM");
    }
  });
}

/**
 * Push the current schema by running `convex dev --once` (typecheck and
 * codegen disabled). Used as the fallback push when `waitForDeploy` is
 * called without a managed `convex dev` process — e.g. `vex dev --once`,
 * or a schema migration that does not override `pushSchema`.
 * @param cwd - Directory to run the `convex` command in.
 * @returns `true` if the push succeeded, `false` otherwise.
 */
function pushSchemaStandalone(cwd: string): boolean {
  return runConvexCommand(cwd, ["dev", "--once", "--typecheck", "disable", "--codegen", "disable"]);
}

/**
 * Run `convex deploy` to push to production.
 * @param cwd - Directory to run the `convex deploy` command in.
 * @returns `true` if the deploy succeeded, `false` otherwise.
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
