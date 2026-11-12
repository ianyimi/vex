import { deployCommand } from "./commands/deploy.js";
import { devCommand } from "./commands/dev.js";
import { generateCommand } from "./commands/generate.js";
import { telemetryCommand } from "./commands/telemetry.js";
import { logger } from "./lib/logger.js";
import { parseCliArgs } from "./lib/parseArgs.js";

const { command, once, json, cwd, telemetryAction, convexArgs } = parseCliArgs(process.argv.slice(2));

switch (command) {
  case "dev":
    devCommand({ once, cwd, convexArgs }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "deploy":
    deployCommand({ cwd, convexArgs }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "generate":
    generateCommand({ cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "telemetry":
    telemetryCommand({ action: telemetryAction, json, cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  default:
    console.log(`
Usage: vex <command>

Commands:
  dev [options]       Generate vex schema, start convex dev, and watch for
                      collection config changes. Replaces \`convex dev\`. Any
                      flag vex doesn't own (--tail-logs, --run, --configure,
                      --env-file, ...) forwards straight through to \`convex
                      dev\`; --start '<cmd>' runs your app server alongside.
  deploy [options]    Generate schema, auto-migrate if enabled, and deploy
                      to production. Replaces \`convex deploy\` in CI. Any
                      flag vex doesn't own (--cmd, --preview-create, ...)
                      forwards straight through to the final \`convex
                      deploy\` call.
  generate [options]  Regenerate vex.types.ts from the vex config.
  telemetry <action>  Manage anonymous CLI telemetry: enable, disable, or
                      status [--json].

Options:
  --once              (dev) Generate schema, push to Convex, and exit
  --cwd <dir>         Run as if started from <dir>
  --json              (telemetry status) Print the exact payload
`);
    process.exit(command ? 1 : 0);
}
