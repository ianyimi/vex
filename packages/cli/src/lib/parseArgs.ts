/**
 * Parsed shape of `vex <command> [...]`'s argv, after vex's own flags
 * (`--once`, `--json`, `--cwd`) are consumed. Everything `deploy` doesn't
 * own — `--cmd`, `--preview-create`, and the rest — passes through as
 * `convexArgs`, forwarded verbatim to the underlying `convex deploy` call.
 */
export interface ParsedCliArgs {
  command: string | undefined;
  once: boolean;
  json: boolean;
  cwd: string | undefined;
  telemetryAction: string | undefined;
  convexArgs: string[];
}

/**
 * Parse `process.argv.slice(2)` into vex's own flags plus, for `deploy`,
 * every leftover argument forwarded to `convex deploy`.
 *
 * `--cwd <dir>` is consumed by vex itself (`deployCommand`'s `cwd`) and
 * never forwarded — `convex deploy` has no `--cwd` flag of its own.
 * `--once`/`--json` are vex-only flags (`dev`/`telemetry`); `deploy` never
 * emits them, so they are never mistaken for `convexArgs`.
 *
 * @param args - `process.argv.slice(2)`.
 * @returns The parsed flags plus `command` and, for `deploy`, `convexArgs`.
 */
export function parseCliArgs(args: string[]): ParsedCliArgs {
  const command = args[0];
  let once = false;
  let json = false;
  let cwd: string | undefined;
  let telemetryAction: string | undefined;
  const convexArgs: string[] = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--once") {
      once = true;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--cwd" && args[i + 1]) {
      cwd = args[++i];
    } else if (command === "telemetry" && telemetryAction === undefined && !arg?.startsWith("--")) {
      telemetryAction = arg;
    } else if (command === "deploy") {
      convexArgs.push(arg);
    }
  }

  return { command, once, json, cwd, telemetryAction, convexArgs };
}
