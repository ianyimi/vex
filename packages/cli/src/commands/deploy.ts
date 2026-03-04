import { generateAndWrite } from "../lib/generateSchema.js";
import { deployToProduction } from "../lib/convexProcess.js";
import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { resolveConfigPath } from "../lib/resolveConfigPath.js";

/**
 * `vex deploy` — generate schema, auto-migrate if enabled, then run
 * `convex deploy` to push to production. Replaces `convex deploy` in CI.
 */
export async function deployCommand(): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolveConfigPath(cwd);
  logger.info(`Config found: ${configPath}`);

  const config = await loadConfig(configPath);

  // Use `convex deploy` for all schema pushes (interim + final)
  const pushSchema = (pushCwd: string) => deployToProduction(pushCwd);

  const result = await generateAndWrite(config, cwd, { pushSchema });
  if (result.written) {
    logger.success(`Generated ${config.schema.outputPath}`);
  } else {
    logger.info("Schema up to date (no changes)");
  }

  // Final deploy — push everything to production
  if (!deployToProduction(cwd)) {
    logger.error("convex deploy failed");
    process.exit(1);
  }

  logger.success("Deployed to production");
}
