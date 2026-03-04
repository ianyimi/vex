import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { VexConfig } from "@vexcms/core";
import { generateVexSchema } from "@vexcms/core";

import { logger } from "./logger.js";

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

  // Generate the schema content
  const content = generateVexSchema({ config });

  // Compare with existing file — skip write if unchanged
  if (existsSync(vexSchemaPath)) {
    const existing = readFileSync(vexSchemaPath, "utf-8");
    if (existing === content) {
      return { written: false };
    }
  }

  writeFileSync(vexSchemaPath, content, "utf-8");

  // Try to format with prettier
  await formatWithPrettier(vexSchemaPath, cwd);

  // Check if schema.ts needs updating
  checkSchemaImports(convexSchemaPath, content, outputRelPath);

  return { written: true };
}

async function formatWithPrettier(filePath: string, cwd: string) {
  try {
    const prettier = await import("prettier");
    const source = readFileSync(filePath, "utf-8");
    const options = (await prettier.resolveConfig(filePath)) ?? {};
    const formatted = await prettier.format(source, {
      ...options,
      filepath: filePath,
    });
    writeFileSync(filePath, formatted, "utf-8");
  } catch {
    // Prettier not available or failed — try npx fallback
    try {
      const { execSync } = await import("node:child_process");
      execSync(`npx prettier --write "${filePath}"`, {
        cwd,
        stdio: "ignore",
      });
    } catch {
      // Formatting not available — skip silently
    }
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
