import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { VexConfig } from "@vexcms/core";
import {
  generateCollectionQueries,
  GENERATED_HEADER,
  type CollectionQueryImports,
} from "@vexcms/core";

function ensureRelative(p: string): string {
  return p.startsWith(".") ? p : "./" + p;
}

/**
 * Compute the relative import paths needed inside generated files.
 *
 * API files live at:       `{cwd}/{convexDir}/vex/api/{slug}.ts`
 * Model files live at:     `{cwd}/{convexDir}/vex/model/api/{slug}.ts`
 */
export function computeImportPaths(props: {
  cwd: string;
  convexDir: string;
}): CollectionQueryImports {
  const root = resolve(props.cwd);
  const apiDir = resolve(props.cwd, props.convexDir, "vex/api");
  const modelApiDir = resolve(props.cwd, props.convexDir, "vex/model/api");
  const generatedAbs = resolve(props.cwd, props.convexDir, "_generated");
  const authAbs = resolve(props.cwd, props.convexDir, "vex/auth");

  // From api/ dir
  const toRootFromApi = relative(apiDir, root).replace(/\\/g, "/");
  const vexConfigFromApi = ensureRelative(toRootFromApi) + "/vex.config";
  const generatedDirFromApi = ensureRelative(relative(apiDir, generatedAbs).replace(/\\/g, "/"));
  const authFromApi = ensureRelative(relative(apiDir, authAbs).replace(/\\/g, "/"));

  // From model/api/ dir
  const generatedDirFromModel = ensureRelative(relative(modelApiDir, generatedAbs).replace(/\\/g, "/"));

  return {
    vexConfigFromApi,
    generatedDirFromApi,
    authFromApi,
    generatedDirFromModel,
  };
}

/**
 * Derive the convex directory from the schema outputPath.
 * e.g. "/convex/vex.schema.ts" → "convex"
 */
export function deriveConvexDir(props: { outputPath: string }): string {
  let p = props.outputPath;
  if (p.startsWith("/")) p = p.slice(1);
  const dir = dirname(p);
  return dir === "." ? "." : dir;
}

/**
 * Clean stale generated .ts files from a directory.
 * Only deletes files that start with GENERATED_HEADER.
 * Skips files present in `keepSet`.
 */
function cleanStaleFiles(dir: string, keepSet: Set<string>, deleted: string[], prefix: string) {
  if (!existsSync(dir)) return;
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));
  for (const filename of files) {
    if (keepSet.has(filename)) continue;
    const fullPath = join(dir, filename);
    const firstLine = readFileSync(fullPath, "utf-8").split("\n")[0];
    if (firstLine?.startsWith(GENERATED_HEADER)) {
      unlinkSync(fullPath);
      deleted.push(prefix + filename);
    }
  }
}

/**
 * Collect the expected set of collection slugs from the config.
 */
function getExpectedSlugs(config: VexConfig): string[] {
  const slugs = config.collections.map((c) => c.slug);
  if (config.media?.collections) {
    for (const c of config.media.collections) {
      slugs.push(c.slug);
    }
  }
  if (config.auth?.collections) {
    for (const c of config.auth.collections) {
      if (c.generateApi && !slugs.includes(c.slug)) {
        slugs.push(c.slug);
      }
    }
  }
  return slugs.sort();
}

/**
 * Check whether the generated files on disk match the current config.
 * Returns true if all expected files exist and no stale files are present.
 */
function isUpToDate(vexDir: string, expectedSlugs: string[]): boolean {
  const apiDir = join(vexDir, "api");
  const modelApiDir = join(vexDir, "model/api");

  // Both dirs must exist
  if (!existsSync(apiDir) || !existsSync(modelApiDir)) return false;

  const expectedApiFiles = new Set([
    ...expectedSlugs.map((s) => `${s}.ts`),
    "index.ts",
  ]);
  const expectedModelFiles = new Set(expectedSlugs.map((s) => `${s}.ts`));

  // Check api/ dir — every expected file must exist, no stale generated files
  const apiFiles = readdirSync(apiDir).filter((f) => f.endsWith(".ts"));
  for (const f of expectedApiFiles) {
    if (!apiFiles.includes(f)) return false;
  }
  for (const f of apiFiles) {
    if (!expectedApiFiles.has(f)) {
      // Stale file — but only if it's generated (has our header)
      const firstLine = readFileSync(join(apiDir, f), "utf-8").split("\n")[0];
      if (firstLine?.startsWith(GENERATED_HEADER)) return false;
    }
  }

  // Check model/api/ dir
  const modelFiles = readdirSync(modelApiDir).filter((f) => f.endsWith(".ts"));
  for (const f of expectedModelFiles) {
    if (!modelFiles.includes(f)) return false;
  }
  for (const f of modelFiles) {
    if (!expectedModelFiles.has(f)) {
      const firstLine = readFileSync(join(modelApiDir, f), "utf-8").split("\n")[0];
      if (firstLine?.startsWith(GENERATED_HEADER)) return false;
    }
  }

  return true;
}

/**
 * Write generated collection query files and delete stale ones.
 *
 * Skips entirely when all expected files already exist and no stale
 * generated files are present. Only runs the full codegen when files
 * are missing or collections have been added/removed.
 *
 * Writes to two directories under `{convexDir}/vex/`:
 * - `api/{slug}.ts` + `api/index.ts` — Convex query/mutation exports
 * - `model/api/{slug}.ts` — typed model functions
 */
export async function generateAndWriteCollectionFiles(props: {
  config: VexConfig;
  cwd: string;
  /** Skip the up-to-date check and always regenerate. */
  force?: boolean;
}): Promise<{ written: string[]; deleted: string[] }> {
  const convexDir = deriveConvexDir({ outputPath: props.config.schema.outputPath });
  const vexDir = resolve(props.cwd, convexDir, "vex");

  // Fast path: skip if all files exist and no stale files
  if (!props.force) {
    const expectedSlugs = getExpectedSlugs(props.config);
    if (isUpToDate(vexDir, expectedSlugs)) {
      return { written: [], deleted: [] };
    }
  }

  const imports = computeImportPaths({ cwd: props.cwd, convexDir });

  // Generate all files — keys are paths relative to vex/ dir
  const files = generateCollectionQueries({ config: props.config, imports });

  // Ensure directories exist
  mkdirSync(join(vexDir, "api"), { recursive: true });
  mkdirSync(join(vexDir, "model/api"), { recursive: true });

  const written: string[] = [];
  const deleted: string[] = [];

  // Write each generated file (skip unchanged)
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = join(vexDir, relPath);
    if (existsSync(fullPath)) {
      const existing = readFileSync(fullPath, "utf-8");
      if (existing === content) continue;
    }
    writeFileSync(fullPath, content, "utf-8");
    written.push(relPath);
  }

  // Build sets of filenames to keep in each directory
  const apiKeep = new Set<string>();
  const modelKeep = new Set<string>();
  for (const relPath of Object.keys(files)) {
    if (relPath.startsWith("api/")) {
      apiKeep.add(relPath.slice("api/".length));
    } else if (relPath.startsWith("model/api/")) {
      modelKeep.add(relPath.slice("model/api/".length));
    }
  }

  // Clean stale files in both directories
  cleanStaleFiles(join(vexDir, "api"), apiKeep, deleted, "api/");
  cleanStaleFiles(join(vexDir, "model/api"), modelKeep, deleted, "model/api/");

  return { written, deleted };
}
