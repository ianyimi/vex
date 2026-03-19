import { deployCommand } from "./commands/deploy.js";
import { devCommand } from "./commands/dev.js";
import { generateCommand } from "./commands/generate.js";
import { logger } from "./lib/logger.js";

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
let once = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--once") {
    once = true;
  }
}

switch (command) {
  case "dev":
    devCommand({ once }).catch((err) => {
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
    generateCommand().catch((err) => {
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
  generate            Regenerate typed collection API files and run eslint --fix.

Dev options:
  --once              Generate schema, push to Convex, and exit
`);
    process.exit(command ? 1 : 0);
}
