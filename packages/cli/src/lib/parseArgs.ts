/**
 * Parsed shape of `vex <command> [...]`'s argv, after vex's own flags are
 * consumed. For the commands that wrap a Convex CLI command (`dev`,
 * `deploy`), every argument vex doesn't own passes through as `convexArgs`,
 * forwarded verbatim to the underlying `convex dev` / `convex deploy` call.
 */
export interface ParsedCliArgs {
  command: string | undefined;
  once: boolean;
  json: boolean;
  cwd: string | undefined;
  telemetryAction: string | undefined;
  convexArgs: string[];
}

/** Commands that wrap a Convex CLI command and forward unknown flags to it. */
export const CONVEX_PASSTHROUGH_COMMANDS = ["dev", "deploy"];

/**
 * Parse `process.argv.slice(2)` into vex's own flags plus, for `dev` and
 * `deploy`, every leftover argument forwarded to `convex dev` / `convex
 * deploy`.
 *
 * vex owns `--cwd <dir>` on every command (Convex has no `--cwd`), `--once`
 * on `dev` (vex runs its own one-shot push), and `--json` on `telemetry`.
 * Everything else on `dev`/`deploy` — `--tail-logs`, `--run`, `--start`,
 * `--configure`, `--cmd`, `--preview-create`, short flags, `--flag=value`
 * forms — is forwarded in its original order. Other commands wrap no Convex
 * command and collect no `convexArgs`.
 *
 * @param args - `process.argv.slice(2)`.
 * @returns The parsed flags plus `command` and, for `dev`/`deploy`, `convexArgs`.
 */
export function parseCliArgs(args: string[]): ParsedCliArgs {
  const command = args[0];
  const forwardsToConvex = command !== undefined && CONVEX_PASSTHROUGH_COMMANDS.includes(command);
  let once = false;
  let json = false;
  let cwd: string | undefined;
  let telemetryAction: string | undefined;
  const convexArgs: string[] = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--cwd" && args[i + 1]) {
      cwd = args[++i];
    } else if (arg === "--once" && command === "dev") {
      once = true;
    } else if (arg === "--json" && command === "telemetry") {
      json = true;
    } else if (command === "telemetry" && telemetryAction === undefined && !arg?.startsWith("--")) {
      telemetryAction = arg;
    } else if (forwardsToConvex) {
      convexArgs.push(arg);
    }
  }

  return { command, once, json, cwd, telemetryAction, convexArgs };
}
