import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { generateVexSchema } from "@vexcms/core";
import config from "../vex.config";

const appRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const outputRelPath = config.schema.outputPath; // e.g. "/convex/vex.schema.ts"
const vexSchemaPath = resolve(appRoot, outputRelPath.replace(/^\//, ""));
const convexSchemaPath = resolve(appRoot, "convex/schema.ts");

// 1. Generate the vex schema file (always fully overwritten)
const vexSchemaContent = generateVexSchema({ config });
writeFileSync(vexSchemaPath, vexSchemaContent, "utf-8");

// 2. Format the generated file with prettier
try {
  execSync(`npx prettier --write "${vexSchemaPath}"`, {
    cwd: appRoot,
    stdio: "ignore",
  });
} catch {
  // prettier not available — skip formatting
}

console.log(`[vex] Generated ${outputRelPath}`);

// 3. Check if the user's schema.ts needs updating
checkSchemaImports(convexSchemaPath, vexSchemaContent);

/**
 * Compares the exports in the generated vex.schema.ts against what
 * the user's schema.ts currently imports. Reports any missing imports
 * so the user knows to add them.
 *
 * If convex/schema.ts doesn't exist, generates a starter file.
 * If it exists, never modifies it — only prints guidance.
 */
function checkSchemaImports(schemaPath: string, vexContent: string) {
  const exportNames = [...vexContent.matchAll(/^export const (\w+)/gm)].map(
    (m) => m[1],
  );

  if (exportNames.length === 0) return;

  const vexImportPath =
    "./" + outputRelPath.replace(/^\/convex\//, "").replace(/\.ts$/, "");

  if (!existsSync(schemaPath)) {
    // Create a starter schema.ts
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
    console.log("[vex] Created convex/schema.ts with all vex table imports");
    return;
  }

  // Check existing schema.ts for missing imports
  const schemaContent = readFileSync(schemaPath, "utf-8");
  const missing = exportNames.filter(
    (name) => !schemaContent.includes(name),
  );

  if (missing.length > 0) {
    console.log("");
    console.log(
      `[vex] New tables in vex.schema.ts that aren't in your schema.ts yet:`,
    );
    console.log("");
    console.log(
      `  Add to your import: import { ..., ${missing.join(", ")} } from "${vexImportPath}";`,
    );
    console.log(
      `  Add to defineSchema: ${missing.map((n) => `${n},`).join(" ")}`,
    );
    console.log("");
  } else {
    console.log("[vex] convex/schema.ts is up to date");
  }
}
