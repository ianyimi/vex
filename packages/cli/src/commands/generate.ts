import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { resolveConfigPath } from "../lib/resolveConfigPath.js";
import { writeVexTypes } from "../lib/generateSchema.js";

/**
 * Run the `vex generate` command: load the config and refresh `vex.types.ts`.
 *
 * Deliberately does NOT emit the Convex schema or deploy — that is `vex dev`'s
 * job, and running it here would touch a live deployment from a command whose
 * name promises code generation. There are no per-collection files to
 * generate: the runtime API surface is registered by the factory functions
 * (`collectionsApi`, the globals/media factories) directly in the app's
 * `convex/` files.
 *
 * @param props.cwd - Project directory to run in; defaults to `process.cwd()`.
 */
export async function generateCommand(props?: { cwd?: string }) {
  const cwd = props?.cwd ?? process.cwd();
  const configPath = resolveConfigPath(cwd);
  logger.info(`Config found: ${configPath}`);

  const config = await loadConfig(configPath);

  const typesWritten = writeVexTypes({ config, configPath, cwd });
  if (typesWritten) {
    logger.success("vex.types.ts updated");
  } else {
    logger.info("vex.types.ts already up to date");
  }
}
