import fs from 'fs-extra';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import sortPackageJson from 'sort-package-json';

/**
 * Minimal package.json shape this module reads and rewrites. Only the
 * dependency sections are inspected; every other field passes through
 * untouched, and the index signature keeps arbitrary extra fields legal.
 */
export interface PackageManifest {
  [key: string]: unknown
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/** Props for {@link findWorkspaceRoot}. */
export interface FindWorkspaceRootProps {
  /** Directory to start the upward search from — typically `process.cwd()`. */
  cwd: string
}

/**
 * Walks up from `cwd` looking for a `pnpm-workspace.yaml` — the same marker
 * pnpm itself uses to locate a workspace root — and returns the first
 * directory that contains one.
 *
 * @param props - Input props.
 * @returns The absolute workspace root, or `null` once the filesystem root is reached with no match.
 */
export async function findWorkspaceRoot(props: FindWorkspaceRootProps): Promise<string | null> {
  const { cwd } = props;
  let dir = path.resolve(cwd);

  while (true) {
    if (await fs.pathExists(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Props for {@link readWorkspaceCatalog}. */
export interface ReadWorkspaceCatalogProps {
  /** Absolute path to the workspace root (the directory containing `pnpm-workspace.yaml`). */
  workspaceRoot: string
}

/**
 * Reads and parses the host workspace's `pnpm-workspace.yaml`, returning its
 * top-level `catalog:` map (package name -> pinned version). A missing or
 * empty `catalog:` block resolves to `{}`; the named `catalogs:` block (e.g.
 * `peers`) is intentionally ignored — only the default catalog drives
 * `--monorepo` rewriting.
 *
 * @param props - Input props.
 * @returns The workspace's default `catalog:` map as package name → pinned
 *   version; `{}` when the block is missing or empty.
 */
export async function readWorkspaceCatalog(props: ReadWorkspaceCatalogProps): Promise<Record<string, string>> {
  const { workspaceRoot } = props;
  const raw = await fs.readFile(path.join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf-8');
  const parsed = parseYaml(raw) as { catalog?: Record<string, string> };
  return parsed.catalog ?? {};
}

/** Props for {@link rewriteManifestForMonorepo}. */
export interface RewriteManifestForMonorepoProps {
  /** Parsed package.json of the freshly scaffolded project. */
  manifest: PackageManifest
  /** Package name -> version map read from the host root's `pnpm-workspace.yaml` `catalog:` block. */
  catalog: Record<string, string>
}

const MONOREPO_DEPENDENCY_FIELDS = ['dependencies', 'devDependencies'] as const;

/**
 * Rewrites a scaffolded project's dependency versions for life inside a host
 * pnpm workspace (`--monorepo` mode): `@vexcms/*` packages become
 * `workspace:*` (the project now lives beside them in the same workspace);
 * any other dependency whose name the host catalog also pins becomes
 * `catalog:`, deferring to the host's version; everything else keeps its
 * literal, catalog-resolved version verbatim. Runs the result through
 * `sort-package-json` so the rewritten manifest matches repo convention.
 *
 * Pure — takes and returns plain objects, performs no I/O.
 *
 * @param props - Input props.
 * @returns The rewritten manifest — `@vexcms/*` deps as `workspace:*`,
 *   catalog-matched deps as `catalog:`, everything else untouched — sorted
 *   via `sort-package-json`.
 */
export function rewriteManifestForMonorepo(props: RewriteManifestForMonorepoProps): PackageManifest {
  const { manifest, catalog } = props;
  const rewritten: PackageManifest = { ...manifest };

  for (const field of MONOREPO_DEPENDENCY_FIELDS) {
    const deps = manifest[field];
    if (!deps) continue;

    const rewrittenDeps: Record<string, string> = {};
    for (const [name, version] of Object.entries(deps)) {
      if (name.startsWith('@vexcms/')) {
        rewrittenDeps[name] = 'workspace:*';
      } else if (name in catalog) {
        rewrittenDeps[name] = 'catalog:';
      } else {
        rewrittenDeps[name] = version;
      }
    }
    rewritten[field] = rewrittenDeps;
  }

  return sortPackageJson(rewritten) as PackageManifest;
}
