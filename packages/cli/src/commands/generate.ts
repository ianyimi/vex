import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { resolveConfigPath } from "../lib/resolveConfigPath.js";
import {
  deriveConvexDir,
  generateAndWriteCollectionFiles,
} from "../lib/generateCollectionFiles.js";
import { writeVexTypes } from "../lib/generateSchema.js";

/**
 * Run the `vex generate` command: load the config, refresh `vex.types.ts`,
 * generate/update the per-collection Convex API files, delete stale ones for
 * removed collections, and run `eslint --fix` over the generated directories.
 *
 * Deliberately does NOT emit the Convex schema or deploy — that is `vex dev`'s job,
 * and running it here would touch a live deployment from a command whose name
 * promises code generation. Types ARE included: they are derived purely from the
 * config, cost nothing, and leaving them out made `vex generate` silently produce a
 * stale registry, which surfaces much later as missing editor completion and index
 * maps that fall back to `Record<string, readonly string[]>`.
 */
export async function generateCommand() {
  const cwd = process.cwd();
  const configPath = resolveConfigPath(cwd);
  logger.info(`Config found: ${configPath}`);

  const config = await loadConfig(configPath);

  const typesWritten = writeVexTypes({ config, configPath, cwd });

  // Force regeneration by passing through (isUpToDate check still applies,
  // but we want to regenerate even if files exist — user ran this explicitly).
  // We achieve this by calling the function which already handles write-skipping
  // for identical content.
  const { written, deleted } = await generateAndWriteCollectionFiles({
    config,
    cwd,
    force: true,
  });

  if (written.length === 0 && deleted.length === 0) {
    logger.info(
      typesWritten
        ? "Collection API files already up to date"
        : "Types and collection API files already up to date",
    );
  } else {
    if (written.length > 0) {
      logger.success(
        `Generated ${written.length} file(s): ${written.join(", ")}`,
      );
    }
    if (deleted.length > 0) {
      logger.success(
        `Deleted ${deleted.length} stale file(s): ${deleted.join(", ")}`,
      );
    }
  }

  // Run eslint --fix on the generated directories
  const convexDir = deriveConvexDir({ outputPath: config.schema.outputPath });
  const apiDir = resolve(cwd, convexDir, "vex/api");
  const modelApiDir = resolve(cwd, convexDir, "vex/model/api");

  try {
    logger.info("Running eslint --fix on generated files...");
    execSync(`npx eslint --fix "${apiDir}" "${modelApiDir}"`, {
      cwd,
      stdio: "pipe",
    });
    logger.success("eslint --fix complete");
  } catch {
    // eslint may exit non-zero for unfixable warnings — that's OK
    logger.info("eslint --fix finished (some issues may remain)");
  }
}
