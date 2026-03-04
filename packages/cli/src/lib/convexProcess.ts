import { execSync, spawn, type ChildProcess } from "node:child_process";
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

/**
 * Spawn `npx convex dev` with piped stdout/stderr so we can detect
 * deployment events. Output is forwarded to the console.
 */
export function startConvexDev(cwd: string): ChildProcess {
  logger.info("Starting convex dev...");

  const child = spawn("npx", ["convex", "dev"], {
    cwd,
    shell: true,
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
 * If no convex dev process is running, falls back to `convex dev --once`.
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
 * Standalone push using `npx convex dev --once`.
 * Used when no convex dev process is running (--once mode, migrate command).
 */
function pushSchemaStandalone(cwd: string): boolean {
  logger.info("Pushing schema to Convex...");
  try {
    execSync("npx convex dev --once --typecheck disable --codegen disable", {
      cwd,
      stdio: "pipe",
      timeout: 60_000,
    });
    logger.success("Schema pushed successfully");
    return true;
  } catch (err) {
    const output =
      err && typeof err === "object" && "stderr" in err
        ? String((err as any).stderr).slice(0, 300)
        : "";
    logger.warn(`Schema push failed${output ? `: ${output}` : ""}`);
    return false;
  }
}
