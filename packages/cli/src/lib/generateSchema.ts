import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { VexConfig } from "@vexcms/core";
import {
  generateVexSchema,
  diffSchema,
  makeFieldsOptional,
  addRemovedFieldsAsOptional,
  planMigration,
} from "@vexcms/core";

import { waitForDeploy } from "./convexProcess.js";
import { logger } from "./logger.js";
import { executeMigration, executeFieldRemoval } from "./migrate.js";
import { resolveConvexUrl } from "./resolveConvexUrl.js";

export interface GenerateResult {
  /** Whether the file was actually written (false = unchanged, skipped) */
  written: boolean;
}

export async function generateAndWrite(
  config: VexConfig,
  cwd: string,
): Promise<GenerateResult> {
  const outputRelPath = config.schema.outputPath; // e.g. "/convex/vex.schema.ts"
  const vexSchemaPath = resolve(cwd, outputRelPath.replace(/^\//, ""));
  const convexSchemaPath = resolve(cwd, "convex/schema.ts");

  // Generate the final schema content
  const content = generateVexSchema({ config });

  // Format content before comparison so Prettier-formatted files match correctly
  const finalSchema = await formatString(content, vexSchemaPath);

  // Compare with existing file — skip write if unchanged
  const existing = existsSync(vexSchemaPath)
    ? readFileSync(vexSchemaPath, "utf-8")
    : "";

  if (existing === finalSchema) {
    return { written: false };
  }

  // Auto-migrate if enabled
  let migrationOk = true;

  if (config.schema.autoMigrate && existing) {
    const diff = diffSchema(existing, finalSchema);
    const convexUrl = resolveConvexUrl(cwd);

    const fieldsToMakeOptional = diff.needsMigration.filter(
      (f) => !f.isOptional,
    );
    const hasAdditions = diff.needsMigration.length > 0;
    const hasRemovals = diff.removedFields.length > 0;

    if ((hasAdditions || hasRemovals) && convexUrl) {
      try {
        // Phase 1: Build and deploy an interim schema that Convex can accept.
        // - New required fields → made optional (so existing docs pass validation)
        // - Removed fields → re-added as optional (so docs with the field still pass)
        let interim = finalSchema;

        if (fieldsToMakeOptional.length > 0) {
          interim = makeFieldsOptional(interim, fieldsToMakeOptional);
        }
        if (hasRemovals) {
          interim = addRemovedFieldsAsOptional(interim, diff.removedFields);
        }

        // Write the interim schema (may be same as final if only adding optional fields)
        const formattedInterim = await formatString(interim, vexSchemaPath);
        writeFileSync(vexSchemaPath, formattedInterim, "utf-8");

        if (interim !== finalSchema) {
          const desc: string[] = [];
          if (fieldsToMakeOptional.length > 0) {
            desc.push(
              `added as optional: ${fieldsToMakeOptional.map((f) => `${f.table}.${f.field}`).join(", ")}`,
            );
          }
          if (hasRemovals) {
            desc.push(
              `kept as optional: ${diff.removedFields.map((f) => `${f.table}.${f.field}`).join(", ")}`,
            );
          }
          logger.info(`Wrote interim schema — ${desc.join("; ")}`);
        } else {
          logger.info("Wrote schema with new fields");
        }

        // Wait for convex dev to deploy the schema
        const deployed = await waitForDeploy(cwd);
        if (!deployed) {
          migrationOk = false;
          throw new Error("Failed to deploy schema");
        }

        // Phase 2a: Remove fields from documents
        if (hasRemovals) {
          await executeFieldRemoval({ convexUrl, fields: diff.removedFields });
        }

        // Phase 2b: Backfill new fields with default values
        if (hasAdditions) {
          const ops = planMigration({ diff, config });
          if (ops.length > 0) {
            await executeMigration({ convexUrl, operations: ops });
          }
        }

        // Phase 3: If interim differs from final, write the final schema
        // and wait for deployment again
        if (interim !== finalSchema) {
          writeFileSync(vexSchemaPath, finalSchema, "utf-8");
          logger.info("Wrote final schema (fields now required)");

          const finalDeployed = await waitForDeploy(cwd);
          if (!finalDeployed) {
            logger.warn("Final schema deployment failed — interim left in place");
            migrationOk = false;
          }
        }
      } catch (err) {
        migrationOk = false;
        logger.warn("autoMigrate: migration failed");
        logger.error("Migration error", err);
      }
    } else if ((hasAdditions || hasRemovals) && !convexUrl) {
      logger.warn("autoMigrate: no Convex URL found, skipping migration");
    }
  }

  if (!migrationOk) {
    logger.warn(
      "Skipped writing final schema — interim schema left in place until migration succeeds",
    );
  } else {
    // Write the final schema if it hasn't been written already by the migration flow.
    // The migration flow writes the file itself (interim then final), so we only
    // need to write here for non-migration cases (autoMigrate off, no existing file,
    // or no fields needing migration).
    const current = existsSync(vexSchemaPath)
      ? readFileSync(vexSchemaPath, "utf-8")
      : "";
    if (current !== finalSchema) {
      writeFileSync(vexSchemaPath, finalSchema, "utf-8");
    }
  }

  // Check if schema.ts needs updating
  checkSchemaImports(convexSchemaPath, content, outputRelPath);

  return { written: true };
}

/**
 * Format a string with Prettier (if available). Returns the original
 * string unchanged when Prettier is not installed or fails.
 */
async function formatString(
  source: string,
  filepath: string,
): Promise<string> {
  try {
    const prettier = await import("prettier");
    const options = (await prettier.resolveConfig(filepath)) ?? {};
    return await prettier.format(source, { ...options, filepath });
  } catch {
    return source;
  }
}

function checkSchemaImports(
  schemaPath: string,
  vexContent: string,
  outputRelPath: string,
) {
  const exportNames = [...vexContent.matchAll(/^export const (\w+)/gm)].map(
    (m) => m[1],
  );

  if (exportNames.length === 0) return;

  const vexImportPath =
    "./" + outputRelPath.replace(/^\/convex\//, "").replace(/\.ts$/, "");

  if (!existsSync(schemaPath)) {
    const content = [
      'import { defineSchema } from "convex/server";',
      "",
      `import { ${exportNames.join(", ")} } from "${vexImportPath}";`,
      "",
      "export default defineSchema({",
      "  // Vex CMS tables (imported from vex.schema.ts)",
      ...exportNames.map((name) => `  ${name},`),
      "",
      "  // Add your custom tables below:",
      "});",
      "",
    ].join("\n");
    writeFileSync(schemaPath, content, "utf-8");
    logger.success("Created convex/schema.ts with all vex table imports");
    return;
  }

  const schemaContent = readFileSync(schemaPath, "utf-8");
  const missing = exportNames.filter(
    (name) => !schemaContent.includes(name!),
  );

  if (missing.length > 0) {
    logger.warn(
      `New tables not yet in your schema.ts: ${missing.join(", ")}`,
    );
    logger.info(
      `  Add to import: import { ..., ${missing.join(", ")} } from "${vexImportPath}";`,
    );
    logger.info(
      `  Add to defineSchema: ${missing.map((n) => `${n},`).join(" ")}`,
    );
  }
}

/** Returns the resolved output path for the vex schema file. */
export function getOutputPath(config: VexConfig, cwd: string): string {
  return resolve(cwd, config.schema.outputPath.replace(/^\//, ""));
}
