// @ts-nocheck
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

import type { VexConfig } from "@vexcms/core";
import {
  generateVexSchema,
  generateVexTypes,
  diffSchema,
  makeFieldsOptional,
  addRemovedFieldsAsOptional,
  planMigration,
} from "@vexcms/core";

import { waitForDeploy } from "./convexProcess.js";
import { generateAndWriteCollectionFiles } from "./generateCollectionFiles.js";
import { logger } from "./logger.js";
import { executeMigration, executeFieldRemoval, backfillVersionStatus } from "./migrate.js";
import { resolveConvexUrl } from "./resolveConvexUrl.js";

/**
 * Result of a `generateAndWrite` run.
 */
export interface GenerateResult {
  /** Whether the file was actually written (false = unchanged, skipped) */
  written: boolean;
}

/**
 * Optional overrides accepted by `generateAndWrite`.
 */
export interface GenerateOptions {
  /** Override the push function used to deploy schema to Convex. */
  pushSchema?: (cwd: string) => boolean | Promise<boolean>;
}

/**
 * Generates `vex.types.ts` and the vex schema file for `config`, then keeps
 * `convex/schema.ts` and Convex in sync with the result.
 *
 * Writes `vex.types.ts` next to `configPath` (best-effort — failures are
 * logged, not thrown). Generates the schema content and, if there are no
 * collections to emit, returns early. Otherwise formats the schema with the
 * project's detected formatter and skips the write when the formatted
 * content already matches what's on disk. When `config.schema.autoMigrate`
 * is enabled and a previous schema exists, computes the field diff, writes
 * and deploys an interim schema with new/removed fields made optional, runs
 * field-removal and backfill migrations against Convex, then writes and
 * deploys the final schema. Also syncs `convex/schema.ts` imports with the
 * vex schema's exports, backfills `vex_status` on versioned collections,
 * and regenerates the per-collection query files.
 *
 * @param config - The loaded vex config describing collections and schema output settings.
 * @param cwd - Project root used to resolve output paths and locate Convex/formatter binaries.
 * @param configPath - Absolute path to `vex.config.ts`, used to place `vex.types.ts` alongside it.
 * @param options - Optional overrides; currently only a custom `pushSchema` deploy function.
 * @returns `{ written: false }` when the config has no collections to emit; otherwise `{ written: true }` once schema generation (and any auto-migration) has completed.
 */
export async function generateAndWrite(
  config: VexConfig,
  cwd: string,
  configPath: string,
  options?: GenerateOptions,
): Promise<GenerateResult> {
  const outputRelPath = config.schema.outputPath; // e.g. "/convex/vex.schema.ts"
  const vexSchemaPath = resolve(cwd, outputRelPath.replace(/^\//, ""));
  const convexSchemaPath = resolve(cwd, "convex/schema.ts");

  // Generate and write vex.types.ts — always placed next to vex.config.ts
  try {
    const typesContent = generateVexTypes({ config });
    const typesPath = resolve(dirname(configPath), "vex.types.ts");
    const formattedTypes = formatString(typesContent, typesPath, cwd);
    const existingTypes = existsSync(typesPath)
      ? readFileSync(typesPath, "utf-8")
      : "";
    if (existingTypes !== formattedTypes) {
      writeFileSync(typesPath, formattedTypes, "utf-8");
      logger.success("Generated vex.types.ts");
    }
  } catch (err) {
    logger.warn("Type generation failed (vex.types.ts)");
    logger.error("Type generation error", err);
  }

  // Generate the schema content; bail early if there are no collections to emit
  const { update: shouldWriteSchema, contents: schemaContents } =
    generateVexSchema({ config });
  if (!shouldWriteSchema) {
    return { written: false };
  }

  // Format content before comparison so Prettier-formatted files match correctly
  const finalSchema = formatString(schemaContents, vexSchemaPath, cwd);

  // Compare with existing file — skip write if unchanged
  const existing = existsSync(vexSchemaPath)
    ? readFileSync(vexSchemaPath, "utf-8")
    : "";

  syncSchemaImports(convexSchemaPath, schemaContents, outputRelPath, config);

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
        const formattedInterim = formatString(interim, vexSchemaPath, cwd);
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

        // Push schema to Convex (uses running convex dev or standalone push)
        const pushFn = options?.pushSchema ?? ((c: string) => waitForDeploy(c));
        const deployed = await pushFn(cwd);
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

          const finalDeployed = await pushFn(cwd);
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
      logger.success(`Generated ${outputRelPath}`);
    }
  }

  // Sync schema.ts imports with vex.schema.ts exports
  syncSchemaImports(convexSchemaPath, schemaContents, outputRelPath, config, existing);

  // Backfill vex_status on versioned collections after schema is deployed.
  // The mutation only patches documents missing vex_status, so this is safe
  // to run on every schema push — most runs patch 0 documents.
  const hasVersioning = config.collections.some((c) => c.versions?.drafts);
  if (hasVersioning) {
    const convexUrl = resolveConvexUrl(cwd);
    if (convexUrl) {
      // Wait for the schema to be deployed before calling the mutation
      const pushFn = options?.pushSchema ?? ((c: string) => waitForDeploy(c));
      const deployed = await pushFn(cwd);
      if (deployed) {
        await backfillVersionStatus({ convexUrl, config });
      }
    }
  }

  // Generate typed per-collection query files
  await generateAndWriteCollectionFiles({ config, cwd });

  return { written: true };
}

/**
 * Walk up from `startDir` looking for `node_modules/.bin/<name>`.
 * Returns the absolute path to the binary, or null if not found.
 *
 * @param name - The binary's file name inside `node_modules/.bin` (e.g. `"prettier"`).
 * @param startDir - Directory to start searching from; each parent directory is checked in turn up to the filesystem root.
 * @returns The absolute path to the binary if found, otherwise `null`.
 */
function findBin(name: string, startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const bin = resolve(dir, "node_modules/.bin", name);
    if (existsSync(bin)) return bin;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Detect which formatter the project uses by reading the `format` (or `fmt`)
 * script from the nearest `package.json`. Falls back to checking installed
 * binaries when no script is found.
 *
 * @param cwd - Project root containing (or near) `package.json` and `node_modules`.
 * @returns `"prettier"` or `"biome"` based on the project's format script or installed binaries, or `null` if neither is detected.
 */
function detectFormatter(cwd: string): "prettier" | "biome" | null {
  try {
    const pkgPath = resolve(cwd, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        scripts?: Record<string, string>;
      };
      const script = pkg.scripts?.format ?? pkg.scripts?.fmt ?? "";
      if (script.includes("prettier")) return "prettier";
      if (script.includes("biome")) return "biome";
    }
  } catch {
    // ignore read/parse errors
  }
  // Fall back to whichever binary is installed
  if (findBin("prettier", cwd)) return "prettier";
  if (findBin("biome", cwd)) return "biome";
  return null;
}

/**
 * Format `source` using the formatter declared in the project's `format` script
 * (Prettier or Biome). Uses stdin so only the generated file content is touched.
 * Returns the original string unchanged when no formatter is found or formatting fails.
 *
 * @param source - The generated source text to format.
 * @param filepath - Path handed to the formatter (e.g. via `--stdin-filepath`) so it can infer the file type; the file itself is not read or written.
 * @param cwd - Project root used to detect and locate the formatter binary.
 * @returns The formatted source text, or `source` unchanged if no formatter is available or the formatter invocation fails.
 */
function formatString(source: string, filepath: string, cwd: string): string {
  const formatter = detectFormatter(cwd);

  if (formatter === "prettier") {
    const bin = findBin("prettier", cwd);
    if (bin) {
      try {
        return execFileSync(
          bin,
          ["--stdin-filepath", filepath, "--log-level", "silent"],
          { input: source, encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] },
        );
      } catch {}
    }
  }

  if (formatter === "biome") {
    const bin = findBin("biome", cwd);
    if (bin) {
      try {
        return execFileSync(
          bin,
          ["format", "--stdin-file-path", filepath],
          { input: source, encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] },
        );
      } catch {}
    }
  }

  return source;
}

function syncSchemaImports(
  schemaPath: string,
  vexContent: string,
  outputRelPath: string,
  config: VexConfig,
  previousVexContent?: string,
) {
  const exportNames = [...vexContent.matchAll(/^export const (\w+)/gm)].map(
    (m) => m[1]!,
  );

  if (exportNames.length === 0) return;

  const vexImportPath =
    "./" + outputRelPath.replace(/^\/convex\//, "").replace(/\.ts$/, "");

  // No existing schema.ts — create one from scratch
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

  let schemaContent = readFileSync(schemaPath, "utf-8");

  // --- Auto-add missing exports ---
  const missing = exportNames.filter((name) => !schemaContent.includes(name));

  if (missing.length > 0) {
    schemaContent = addToImport(schemaContent, missing, vexImportPath);
    schemaContent = addToDefineSchema(schemaContent, missing);
    logger.success(`Added to schema.ts: ${missing.join(", ")}`);
  }

  // --- Auto-remove stale exports ---
  if (config.schema.autoRemove && previousVexContent) {
    const oldExports = [
      ...previousVexContent.matchAll(/^export const (\w+)/gm),
    ].map((m) => m[1]!);
    const newExportSet = new Set(exportNames);
    const removed = oldExports.filter((name) => !newExportSet.has(name));

    if (removed.length > 0) {
      for (const name of removed) {
        const simpleEntryPattern = new RegExp(
          `^[ \\t]*${name}\\s*,?[ \\t]*$`,
          "m",
        );
        const aliasEntryPattern = new RegExp(
          `^[ \\t]*${name}\\s*:\\s*${name}\\s*,?[ \\t]*$`,
          "m",
        );

        const isSimple =
          simpleEntryPattern.test(schemaContent) ||
          aliasEntryPattern.test(schemaContent);

        if (!isSimple) {
          logger.warn(
            `Cannot auto-remove "${name}" from schema.ts — uses a custom pattern. Remove it manually.`,
          );
          continue;
        }

        schemaContent = removeFromImport(schemaContent, name, vexImportPath);
        // Remove the entry line from defineSchema
        schemaContent = schemaContent.replace(simpleEntryPattern, "");
        schemaContent = schemaContent.replace(aliasEntryPattern, "");
        // Clean up any resulting blank lines (collapse double blanks)
        schemaContent = schemaContent.replace(/\n{3,}/g, "\n\n");
        logger.success(`Removed from schema.ts: ${name}`);
      }
    }
  }

  // Write back if changed
  const currentContent = readFileSync(schemaPath, "utf-8");
  if (schemaContent !== currentContent) {
    writeFileSync(schemaPath, schemaContent, "utf-8");
  }
}

/**
 * Add `names` to the vex import statement in schema.ts.
 * Handles both single-line and multi-line import formats.
 *
 * @param content - The `convex/schema.ts` source text to modify.
 * @param names - Export names to add to the import from `importPath`.
 * @param importPath - Module specifier of the existing (or to-be-created) import, e.g. `"./vex.schema"`.
 * @returns `content` with `names` merged into the import from `importPath`; if no matching import exists, a new import statement is appended after the last import (or prepended if the file has none).
 */
function addToImport(
  content: string,
  names: string[],
  importPath: string,
): string {
  const escapedPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match multi-line import: import {\n  ...\n} from "path"
  const multiLineRe = new RegExp(
    `(import\\s*\\{)([^}]*)(\\}\\s*from\\s*["']${escapedPath}["'])`,
    "s",
  );
  const multiMatch = content.match(multiLineRe);

  if (multiMatch) {
    const existingBlock = multiMatch[2]!;
    // Check if it's actually multi-line
    if (existingBlock.includes("\n")) {
      // Multi-line: insert new names before the closing brace
      const newEntries = names.map((n) => `  ${n},\n`).join("");
      return content.replace(
        multiLineRe,
        `$1${existingBlock}${newEntries}$3`,
      );
    }
    // Single-line: add names to the list
    const trimmed = existingBlock.trim().replace(/,\s*$/, "");
    const allNames = trimmed ? `${trimmed}, ${names.join(", ")}` : names.join(", ");
    // Switch to multi-line if many imports
    if (allNames.split(",").length > 3) {
      const items = allNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const block =
        "\n" + items.map((n) => `  ${n},`).join("\n") + "\n";
      return content.replace(multiLineRe, `$1${block}$3`);
    }
    return content.replace(multiLineRe, `$1 ${allNames} $3`);
  }

  // No existing import — add one after the last import line
  const lastImportIdx = content.lastIndexOf("import ");
  if (lastImportIdx !== -1) {
    // Scan forward to the `from "..."` clause to handle multi-line imports
    const fromIdx = content.indexOf(" from ", lastImportIdx);
    const scanFrom = fromIdx !== -1 ? fromIdx : lastImportIdx;
    const lineEnd = content.indexOf("\n", scanFrom);
    const insertPos = lineEnd !== -1 ? lineEnd + 1 : content.length;
    const importLine = `import { ${names.join(", ")} } from "${importPath}";\n`;
    return content.slice(0, insertPos) + importLine + content.slice(insertPos);
  }

  // Fallback: prepend
  return `import { ${names.join(", ")} } from "${importPath}";\n` + content;
}

/**
 * Insert `names` as entries into the `defineSchema({...})` block.
 *
 * @param content - The `convex/schema.ts` source text to modify.
 * @param names - Table identifiers to insert as entries inside `defineSchema({ ... })`.
 * @returns `content` with `names` inserted immediately after the `defineSchema({` opening brace, or unchanged if no `defineSchema({` call is found.
 */
function addToDefineSchema(content: string, names: string[]): string {
  const defineIdx = content.indexOf("defineSchema({");
  if (defineIdx === -1) return content;

  const insertPos = content.indexOf("{", defineIdx) + 1;
  const entries = "\n" + names.map((n) => `  ${n},`).join("\n");
  return content.slice(0, insertPos) + entries + content.slice(insertPos);
}

/**
 * Remove a single `name` from the vex import statement.
 *
 * @param content - The `convex/schema.ts` source text to modify.
 * @param name - Export name to remove from the import from `importPath`.
 * @param importPath - Module specifier of the import to modify, e.g. `"./vex.schema"`.
 * @returns `content` with `name` removed from the import; the entire import statement is dropped if `name` was the last one, and `content` is returned unchanged if no matching import is found.
 */
function removeFromImport(
  content: string,
  name: string,
  importPath: string,
): string {
  const escapedPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const importRe = new RegExp(
    `(import\\s*\\{)([^}]*)(\\}\\s*from\\s*["']${escapedPath}["'])`,
    "s",
  );
  const match = content.match(importRe);
  if (!match) return content;

  const existingBlock = match[2]!;
  // Remove the name from the imports list
  const items = existingBlock
    .split(/,/)
    .map((s) => s.trim())
    .filter((s) => s && s !== name);

  if (items.length === 0) {
    // Remove the entire import line
    return content.replace(
      new RegExp(
        `import\\s*\\{[^}]*\\}\\s*from\\s*["']${escapedPath}["'];?\\s*\\n?`,
        "s",
      ),
      "",
    );
  }

  // Rebuild: multi-line if >3 items, else single-line
  if (items.length > 3) {
    const block = "\n" + items.map((n) => `  ${n},`).join("\n") + "\n";
    return content.replace(importRe, `$1${block}$3`);
  }
  return content.replace(importRe, `$1 ${items.join(", ")} $3`);
}

/**
 * Resolves the absolute output path for the generated vex schema file.
 *
 * @param config - The loaded vex config; `config.schema.outputPath` is the project-relative (leading-slash) output path.
 * @param cwd - Project root the output path is resolved against.
 * @returns The absolute filesystem path where the vex schema file should be written.
 */
export function getOutputPath(config: VexConfig, cwd: string): string {
  return resolve(cwd, config.schema.outputPath.replace(/^\//, ""));
}
