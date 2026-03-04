import { devCommand } from "./commands/dev.js";
import { migrateCommand } from "./commands/migrate.js";
import { logger } from "./lib/logger.js";

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
let once = false;
let url: string | undefined;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--once") {
    once = true;
  } else if (args[i] === "--url" && args[i + 1]) {
    url = args[++i];
  } else if (args[i]?.startsWith("--url=")) {
    url = args[i]!.slice("--url=".length);
  }
}

switch (command) {
  case "dev":
    devCommand({ once }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  case "migrate":
    migrateCommand({ url }).catch((err) => {
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
  migrate [options]   Run auto-migrations against the current deployment.

Dev options:
  --once              Generate schema, push to Convex, and exit

Migrate options:
  --url <url>         Override the Convex deployment URL
`);
    process.exit(command ? 1 : 0);
}
