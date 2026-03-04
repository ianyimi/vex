import { existsSync, readFileSync } from "node:fs";

import {
  generateVexSchema,
  diffSchema,
  planMigration,
} from "@vexcms/core";

import { getOutputPath } from "../lib/generateSchema.js";
import { loadConfig } from "../lib/loadConfig.js";
import { logger } from "../lib/logger.js";
import { executeMigration } from "../lib/migrate.js";
import { resolveConfigPath } from "../lib/resolveConfigPath.js";
import { resolveConvexUrl } from "../lib/resolveConvexUrl.js";

export interface MigrateCommandOptions {
  /** Override the Convex deployment URL. */
  url?: string;
}

/**
 * `vex migrate` — diff the current schema against the config, plan migrations,
 * execute them, then write the new schema.
 */
export async function migrateCommand(
  options: MigrateCommandOptions = {},
): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolveConfigPath(cwd);

  logger.info(`Config found: ${configPath}`);

  const config = await loadConfig(configPath);
  const outputPath = getOutputPath(config, cwd);

  // Generate the new schema from config
  const newContent = generateVexSchema({ config });

  // Read the current schema (if it exists)
  const oldContent = existsSync(outputPath)
    ? readFileSync(outputPath, "utf-8")
    : "";

  if (oldContent === newContent) {
    logger.info("Schema up to date — no migration needed");
    return;
  }

  // Diff and plan
  const diff = diffSchema(oldContent, newContent);

  if (diff.needsMigration.length === 0) {
    logger.info("Schema changed but no fields need migration");
    return;
  }

  const ops = planMigration({ diff, config });

  if (ops.length === 0) {
    logger.info("No migration operations needed (no defaultValues to backfill)");
    return;
  }

  // Resolve Convex URL
  const convexUrl = options.url ?? resolveConvexUrl(cwd);

  if (!convexUrl) {
    logger.error(
      "No Convex URL found. Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL, " +
        "add it to .env.local, or pass --url <url>",
    );
    process.exit(1);
  }

  logger.info(`Migrating ${ops.length} field(s)...`);
  await executeMigration({ convexUrl, operations: ops });
  logger.success("Migration complete");
}
