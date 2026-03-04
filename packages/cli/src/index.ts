import { devCommand } from "./commands/dev.js";
import { logger } from "./lib/logger.js";

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
let once = false;
let run: string | undefined;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--once") {
    once = true;
  } else if (args[i] === "--run" && args[i + 1]) {
    run = args[++i];
  } else if (args[i]?.startsWith("--run=")) {
    run = args[i]!.slice("--run=".length);
  }
}

switch (command) {
  case "dev":
    devCommand({ once, run }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;

  default:
    console.log(`
Usage: vex <command>

Commands:
  dev [options]    Watch vex.config and regenerate vex.schema.ts on changes,
                   then start your dev server alongside the watcher.

Options:
  --once                  Generate once and exit (no watcher, no dev server)
  --run "<command>"       Override the dev server command to run

Dev server resolution (highest priority wins):
  1. --run flag
  2. devCommand in vex.config.ts
  3. package.json scripts.dev (auto-detected)
`);
    process.exit(command ? 1 : 0);
}
