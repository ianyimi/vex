import { deployCommand } from "./commands/deploy.js";
import { devCommand } from "./commands/dev.js";
import { generateCommand } from "./commands/generate.js";
import { telemetryCommand } from "./commands/telemetry.js";
import { logger } from "./lib/logger.js";

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
let once = false;
let json = false;
let cwd: string | undefined;
let telemetryAction: string | undefined;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--once") {
    once = true;
  } else if (args[i] === "--json") {
    json = true;
  } else if (args[i] === "--cwd" && args[i + 1]) {
    cwd = args[++i];
  } else if (command === "telemetry" && telemetryAction === undefined && !args[i]?.startsWith("--")) {
    telemetryAction = args[i];
  }
}

switch (command) {
  case "dev":
    devCommand({ once, cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "deploy":
    deployCommand().catch((err) => {
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
                      collection config changes. Run your app server (e.g.
                      next dev) in a separate terminal.
  deploy [options]    Generate schema, auto-migrate if enabled, and deploy
                      to production. Replaces \`convex deploy\` in CI.
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
