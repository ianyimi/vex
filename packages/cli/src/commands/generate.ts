import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { resolveConfigPath } from "../lib/resolveConfigPath.js";
import { deriveConvexDir, generateAndWriteCollectionFiles } from "../lib/generateCollectionFiles.js";

export async function generateCommand() {
  const cwd = process.cwd();
  const configPath = resolveConfigPath(cwd);
  logger.info(`Config found: ${configPath}`);

  const config = await loadConfig(configPath);

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
    logger.info("All collection API files up to date");
  } else {
    if (written.length > 0) {
      logger.success(`Generated ${written.length} file(s): ${written.join(", ")}`);
    }
    if (deleted.length > 0) {
      logger.success(`Deleted ${deleted.length} stale file(s): ${deleted.join(", ")}`);
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
