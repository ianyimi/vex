import { execFileSync, spawn, type ChildProcess } from "node:child_process";
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
 * @param props - Input props.
 * @param props.cwd - Directory to run `convex dev` in; also used to detect
 * the package manager to spawn it through.
 * @param props.convexArgs - Flags forwarded verbatim to `convex dev` (e.g.
 * `--tail-logs always`, `--start 'next dev'`, `--configure existing`).
 * @returns The spawned, detached child process. It is also stored as the
 * module-level singleton so `waitForDeploy` and `killConvexDev` can await
 * or terminate it later; it resolves nothing itself and may still be
 * starting up when this returns.
 */
export function startConvexDev(props: { cwd: string; convexArgs?: string[] }): ChildProcess {
  const { cwd } = props;
  const pm = detectPackageManager(cwd);
  const fullArgs = [...pm.args, "convex", "dev", ...(props.convexArgs ?? [])];

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
 * If no convex dev process is running, falls back to a standalone
 * `convex dev --once` push (see `buildDevOnceArgs`).
 * @param props - Input props.
 * @param props.cwd - Directory to run the standalone fallback push in when
 * no `convex dev` process is currently managed.
 * @param props.convexArgs - Flags forwarded to the standalone fallback
 * push; ignored while a managed `convex dev` process is running, which
 * already received them at start.
 * @param props.timeoutMs - Milliseconds to wait for the next deploy event
 * before giving up and resolving `false`. Defaults to 60 seconds.
 * @returns A promise that resolves `true` once the managed `convex dev`
 * process reports a successful deploy, or `false` if it reports failure,
 * the wait times out, or (when no process is managed) the standalone push
 * fails.
 */
export function waitForDeploy(props: {
  cwd: string;
  convexArgs?: string[];
  timeoutMs?: number;
}): Promise<boolean> {
  const { cwd, convexArgs = [], timeoutMs = 60_000 } = props;
  if (!convexChild) {
    return Promise.resolve(runConvexCommand(cwd, buildDevOnceArgs(convexArgs)));
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
 * Build the argv (after `convex`) for a standalone one-shot push:
 * `dev --once` plus every forwarded flag. Typecheck and codegen default to
 * `disable` (vex already generated the schema, and a push should not fail
 * on an unrelated type error) unless the caller passed its own
 * `--typecheck` / `--codegen`, in either `--flag value` or `--flag=value`
 * form.
 * @param convexArgs - Flags forwarded from the vex command line.
 * @returns The argv for `convex`, e.g. `["dev", "--once", "--typecheck",
 * "disable", "--codegen", "disable", "--tail-logs", "disable"]`.
 */
export function buildDevOnceArgs(convexArgs: string[]): string[] {
  const sets = (flag: string) => convexArgs.some((arg) => arg === flag || arg.startsWith(`${flag}=`));
  return [
    "dev",
    "--once",
    ...(sets("--typecheck") ? [] : ["--typecheck", "disable"]),
    ...(sets("--codegen") ? [] : ["--codegen", "disable"]),
    ...convexArgs,
  ];
}

/**
 * Run `convex deploy` to push to production. Runs with no timeout — unlike
 * every other `convex` command vex runs — because a caller-passed `--cmd`
 * makes the deploy also run the project's own build, which can take
 * much longer than the standard 120-second ceiling.
 * @param props - Input props.
 * @param props.cwd - Directory to run the `convex deploy` command in.
 * @param props.convexArgs - Extra flags forwarded verbatim to `convex
 * deploy` (e.g. `--cmd`, `--preview-create`).
 * @returns `true` if the deploy succeeded, `false` otherwise.
 */
export function deployToProduction(props: { cwd: string; convexArgs?: string[] }): boolean {
  return runConvexCommand(props.cwd, ["deploy", ...(props.convexArgs ?? [])], { timeoutMs: null });
}

/**
 * Remove the given value-taking flags (and their values) from `convexArgs`,
 * preserving the order of everything else. Handles both `--flag value` and
 * `--flag=value`. Used for interim schema pushes, so a flag that triggers
 * work after a push (`convex deploy --cmd`, `convex dev --run`) runs once,
 * on the final push, not on every interim one.
 * @param props - Input props.
 * @param props.convexArgs - Flags as collected by `parseCliArgs`.
 * @param props.flags - Flag names to remove, e.g. `["--cmd", "--cmd-url-env-var-name"]`.
 * @returns `convexArgs` without the named flags or their values.
 */
export function stripConvexFlags(props: { convexArgs: string[]; flags: string[] }): string[] {
  const stripped: string[] = [];
  for (let i = 0; i < props.convexArgs.length; i++) {
    const arg = props.convexArgs[i];
    if (props.flags.includes(arg)) {
      i++;
      continue;
    }
    if (props.flags.some((flag) => arg.startsWith(`${flag}=`))) continue;
    stripped.push(arg);
  }
  return stripped;
}

/** `convex deploy` flags that run the project's build; final deploy only. */
export const DEPLOY_FINAL_ONLY_FLAGS = ["--cmd", "--cmd-url-env-var-name"];

/** `convex dev` flags that run something after a push; final push only. */
export const DEV_FINAL_ONLY_FLAGS = ["--run", "--run-component", "--start"];

function runConvexCommand(
  cwd: string,
  convexArgs: string[],
  options?: { timeoutMs?: number | null },
): boolean {
  const pm = detectPackageManager(cwd);
  const argv = [...pm.args, "convex", ...convexArgs];
  const timeoutMs = options?.timeoutMs === undefined ? 120_000 : options.timeoutMs;

  logger.info(`Running: ${pm.cmd} ${argv.join(" ")}`);
  try {
    execFileSync(pm.cmd, argv, {
      cwd,
      stdio: "inherit",
      ...(timeoutMs === null ? {} : { timeout: timeoutMs }),
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

