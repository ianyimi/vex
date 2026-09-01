---
status: draft
spec_id: 2026-08-31-wp2-cli-templates
touches:
  - "packages/core/src/schema/**"
  - "packages/cli/src/**"
  - "packages/cli/tsconfig.check.json"
  - "packages/cli/vitest.config.ts"
  - "packages/cli/README.md"
  - "packages/react/src/components/RenderBlocks*"
  - "packages/react/src/index.ts"
  - "packages/create-vexcms/src/**"
  - "packages/create-vexcms/templates/**"
  - "packages/create-vexcms/README.md"
  - "apps/test/**"
  - ".changeset/config.json"
  - ".changeset/pre.json"
  - ".agent/docs/standards/**"
  - ".agent/docs/product/tech-stack.md"
  - ".agent/docs/product/dev-processes.md"
  - "scripts/vex-dev.mjs"
  - "scripts/update-www-deps.mjs"
  - "scripts/scaffold-smoke.mjs"
  - "scripts/verify-scaffold.mjs"
  - "package.json"
  - "pnpm-workspace.yaml"
  - ".changeset/*.md"
  - ".agent/skills/template-sync/**"
  - "README.md"
  - "apps/docs/src/content/docs/guides/**"
prompt_version: 1
---

# 2026-08-31-wp2-cli-templates — Spec

## Overview

WP-2 of the launch plan: make `pnpm create vexcms` real. Step 0 first executes
D7's rename — `apps/www` becomes `apps/test`, the permanent dogfood app — so
the new www can later be scaffolded from scratch without overwriting it. From
there every step draws **paradigms from `apps/test`** (rebuild's current
conventions: factory-registered API, WP-C theming, auth wiring) and **features
from master** (the reference templates: blocks, seed, bootstrap flow). The CLI
is already ported and running daily (`scripts/vex-dev.mjs` drives `vex dev`),
so the CLI work is a cutover — delete the master-era per-collection file
generation that survived the port as dead weight. The bulk of the package is
authoring the two templates the scaffolder already knows how to install
(`base-nextjs` from apps/test, `marketing-site` from the master reference), a
`RenderBlocks` dispatcher in `@vexcms/react`, `--monorepo`/`--yes` flags, honest
integration tests, and a packed-tarball demo gate that proves
create → install → typecheck → build in a clean directory *before* the alphas
exist on npm. Gates WP-3 (the real `apps/www` is generated from the marketing
template) and the meetup's live-scaffold demo.

## Design Decisions

1. **Cut per-collection generation; don't implement it.** Rebuild registers its
   runtime API through factories (`collectionsApi` in `convex/vex.ts`, globals
   and media factories) — `generateCollectionQueries` is a stub returning `{}`,
   `apps/test/convex/vex/{api,model/api}` are empty, and the only test of the
   path is excluded from both vitest and typecheck. Two conventions is one too
   many. (Interview 2026-08-31.)
2. **No `themeApi()` extraction — templates carry copies, and a `template-sync`
   skill owns the copies.** Supersedes the 2026-08-31 session-log deferral
   ("templates force the design"): the developer chose copy-plus-tooling over
   new public API surface days before the first alpha. The skill turns "add
   this to the templates" into a mechanical, verifiable operation; extraction
   remains available later without breaking scaffolded apps.
3. **First-admin bootstrap is ported from master.** `isBootstrapped` +
   `promoteFirstAdmin` (guarded on zero admin-role users) + a `WelcomePage`
   fallback. Rebuild's better-auth admin plugin sets `defaultRole: "user"`, so
   without this a fresh scaffold has no path to an admin short of editing the
   database by hand — fatal to "stand it up after env vars and dev commands".
4. **Master-parity template split.** `base-nextjs` = working admin shell (auth,
   admin panel, media, users, providers, env plumbing, bootstrap). The
   marketing site is an overlay copied over base with `overwrite: true`
   (existing `overlayTemplate` machinery), replacing `vex.config.ts` and the
   root layout and adding site content, blocks, themes, and seed. The theme
   system rides the overlay only — a bare scaffold stays lean.
5. **The overlay's theme system is apps/test's WP-C shape, not master's.**
   32-token × light/dark via the `themeColors` factory, `ThemeStyle`/`ThemeLive`,
   `convex/theme.ts` — oklch strings stored verbatim. `colorConvert.ts`,
   `culori`, `ThemeInjector`, and the `ui()`-based theme import are cut with
   their field types.
6. **Roadmap block stays defaults-driven with corrected content.** "12 Field
   Types" and an honest shipped/planned list; the collection-driven roadmap is
   WP-3's, for the real site.
7. **`ogImage` becomes `upload({ to: <media> })`** — consistent with the sibling
   SEO/media fields; `metadata.ts` already resolves an id to a URL.
8. **`--monorepo` is catalog-aware.** Its first consumer is WP-3 generating
   the real `apps/www` inside this repo, where P-015 bans literal versions in manifests:
   `@vexcms/*` → `workspace:*`, host-catalog hits → `catalog:`, literals
   otherwise. Standalone scaffolds keep literal versions (a scaffolded app has
   no workspace to inherit from), maintained by `scripts/sync-template-versions.mjs`.
9. **Pre-publish proof via packed tarballs.** `scripts/verify-scaffold.mjs`
   packs the publishables and overrides `@vexcms/*` → `file:` tarballs in a
   clean-dir scaffold — the same class of consumer proof WP-0/WP-A used, and
   the script reruns unchanged (minus overrides) after WP-5 publishes.
10. **Deployment-less build is a template invariant.** The installer seeds
    `.env.local` (generated `BETTER_AUTH_SECRET`, placeholder Convex URLs);
    templates ship generated `convex/_generated` stubs + `vex.schema.ts` +
    `vex.types.ts`; every server-side Convex fetch guards an unreachable
    deployment. The demo gate runs with no Convex login.
11. **Seed fills a complete home page.** Idempotent `seed:init` creates
    siteSettings (activeTheme set), header, footer, the four palettes, and a
    home page assembled from the blocks' corrected defaults — `pnpm seed` and
    the scaffold is a finished marketing site, not an empty shell.
12. **`RenderBlocks` is generically typed over the block union.** The
    `components` map is keyed by `TBlock["blockType"]` with `Extract`-narrowed
    entries, so an app passing its generated `PageBlock` union gets per-renderer
    field autocomplete and excess-property errors on typo'd keys — the giant
    `switch` becomes data without losing any type safety.
13. **`--yes` exists for machines.** Honest tests and the demo gate drive the
    real CLI; a prompt-free path answering every question with its default is
    the cheapest honest automation seam.
14. **The D7 rename lands here, not in WP-3.** The scaffolder must be able to
    generate the new `apps/www` from scratch — impossible while the hand-built
    app occupies the path. `apps/www` → `apps/test` (developer directive
    2026-08-31), keeping its Convex deployment, `.env.local`, and sandbox
    content intact as the permanent dogfood app. Test app = paradigm source;
    master reference = feature source.

## Out of Scope

- Generating the real `apps/www`, `anonRole` read-only admin, roadmap/changelog
  collections and seed content, the `@alpha` dependency flip — WP-3.
- Publishing the alphas, CI hardening — WP-5. Branch promotion — WP-B.
- Cleaning the test app's sandbox junk (console.logs, test fields, "Go to
  Admin" button) — it deliberately stays in `apps/test`; templates simply
  don't inherit it.
- Per-instance admin field components (`admin.components.Field`), `ui`/`tabs`/
  `richtext`/`json` fields — cut by D8; roadmap material.
- `themeApi()` extraction into packages (superseded by DD 2; future work).
- Versioning/drafts anywhere in templates — unshipped feature.
- Auth version bumps (D1), analytics (D5).

## Implementation

### Step 0 — Rename `apps/www` → `apps/test` [agent]

D7 executed early (DD 14): the hand-built app moves out of the scaffolder's
way, unchanged in content — same Convex deployment (`.env.local` moves with
the directory; it is untracked but `git mv` relocates the whole tree on disk),
same sandbox junk, same port 3020. Everything that addresses the app by
package name or path is repointed in the same stroke, including the harness
files whose globs would silently stop matching (cascade-checks: directory
rename). `pnpm-workspace.yaml` needs no edit (`apps/*` glob); `turbo.json` has
no app-specific entries; the lockfile rewrites its importer key on the next
install — expected, and the only change it should show.

- [ ] `git mv apps/www apps/test`
- [ ] `apps/test/package.json` — `"name": "www"` → `"test"`
- [ ] Root `package.json` — `dev:app` filter, `clear` paths
- [ ] `scripts/vex-dev.mjs` — `--cwd apps/test`
- [ ] `.changeset/config.json` — `ignore` entry `"www"` → `"test"`
- [ ] `.changeset/pre.json` — `initialVersions` key `"www"` → `"test"`
- [ ] `scripts/update-www-deps.mjs` — repoint to `apps/test` (legacy
      rebuild-reset helper; flag for post-launch deletion, do not delete here)
- [ ] `.agent/docs/standards/naming-conventions.md` — 4 rule scopes + the
      `logo-cloud.ts` known-inconsistency path
- [ ] `.agent/docs/standards/**` — sweep every `applies_to` glob for
      `apps/www` (frontend/backend domains carry them; `context-rules.yaml`
      shows the compiled hits), then `harness sync`
- [ ] `.agent/docs/product/tech-stack.md` (`www` row) +
      `.agent/docs/product/dev-processes.md` (3 command rows) — rename to
      `test`, note the freed `www` name belongs to WP-3's scaffolded site
- [ ] Open specs' frontmatter sweep — every non-done spec whose `touches:`
      lists `apps/www/**` globs is repointed to `apps/test/**` (done specs
      keep historical paths)
- [ ] `harness struct` (directory-structure.md is already flagged stale)
- [ ] `pnpm install` — lockfile importer `apps/www` → `apps/test`, nothing else

#### apps/test/package.json

One edit — the package name (version and `private` stay):

```json
  "name": "test",
```

#### package.json

Two edits in `scripts`; everything not shown is unchanged:

```json
    "dev:app": "pnpm --filter test dev",
    "clear": "rm -rf apps/test/.next apps/test/node_modules/.cache",
```

#### scripts/vex-dev.mjs

One edit — the spawn line inside `startVex`:

```js
  vexProcess = spawn('node', ['packages/cli/dist/index.js', 'dev', '--cwd', 'apps/test'], {
```

#### .changeset/config.json

In `ignore`, replace `"www"` with `"test"` (the app must never publish under
either name).

#### .changeset/pre.json

In `initialVersions`, rename the `"www"` key to `"test"` (value `"0.1.0"`
unchanged) — changesets otherwise re-adds the renamed package to prerelease
state on the next `changeset version`.

#### .agent/docs/standards/naming-conventions.md

Five mechanical `apps/www` → `apps/test` substitutions: the `scope:` arrays of
`convex-resource-files`, `react-context-suffix`, `auth-file-roles`,
`vexcms-resource-defs`, and the `logo-cloud.ts` entry under "Known
inconsistencies". Run `harness sync` afterwards so `context-rules.yaml`
recompiles (the frontend/backend standards domains carry `apps/www` globs in
their `applies_to` frontmatter — sweep those in the same pass).

Residue check: after this step, `git grep "apps/www"` should hit only
historical documents (launch-plan prose, session logs, commit docs,
`.rebuild/reference/**`, `scripts/REBUILD-RESET-INSTRUCTIONS.md`) and this
spec's own WP-3 forward references — never a config, script, or glob that
executes.

Verify: pnpm install && pnpm build && pnpm typecheck && ! git grep -q "apps/www" -- package.json scripts/vex-dev.mjs .changeset/config.json .agent/docs/standards && harness doctor

### Step 1 — Cut the per-collection generation subsystem from core + cli [agent]

Everything deleted here is master's generated-files convention, dead since the
port: core's `generateCollectionQueries` returns `{}`, the target dirs in
apps/test are empty, and the one test of the path is excluded from both vitest
and typecheck (falsely reported "no dead tests" is exactly how it hid). The cli
suite gains two real unit tests so `passWithNoTests` can go, and `vex generate`
gains the `--cwd` flag `vex dev` already has — the Verify line depends on it.

- [ ] `packages/core/src/schema/generateCollectionQueries.ts` — delete
- [ ] `packages/core/src/schema/index.ts` — drop the export line
- [ ] `packages/cli/src/lib/generateCollectionFiles.ts` — delete
- [ ] `packages/cli/src/lib/generateCollectionFiles.test.ts` — delete
- [ ] `packages/cli/src/commands/generate.ts` — rewrite (no collection files, no eslint pass, `--cwd` support)
- [ ] `packages/cli/src/index.ts` — pass `{ cwd }` to `generateCommand`; update usage text
- [ ] `packages/cli/src/lib/generateSchema.ts` — drop the trailing `generateAndWriteCollectionFiles` call
- [ ] `packages/cli/vitest.config.ts` — remove the exclude and `passWithNoTests`
- [ ] `packages/cli/tsconfig.check.json` — remove both excludes
- [ ] `packages/cli/src/lib/resolveConfigPath.test.ts` — new
- [ ] `packages/cli/src/lib/resolveConvexUrl.test.ts` — new
- [ ] `packages/cli/README.md` — remove the per-collection generation claims
- [ ] Remove the empty `apps/test/convex/vex/api/` and `apps/test/convex/vex/model/` dirs

#### packages/core/src/schema/generateCollectionQueries.ts

Delete the file. `GENERATED_HEADER`, `CollectionQueryImports`, and
`generateCollectionQueries` have no consumers outside
`packages/cli/src/lib/generateCollectionFiles.ts`, which this step also deletes
(workspace-wide grep, 2026-08-31 — `vex.schema.ts`'s banner is a separate
literal inside `generateVexSchema`).

#### packages/core/src/schema/index.ts

Complete file after the edit:

```ts
export * from "./generateVexSchema"
export * from "./migrate"
```

#### packages/cli/src/lib/generateCollectionFiles.ts

Delete, together with `generateCollectionFiles.test.ts`. The test exercises
`computeImportPaths`/`generateAndWriteCollectionFiles` against the core stub —
it can only pass by asserting the behavior of dead code.

#### packages/cli/src/commands/generate.ts

Complete rewrite — the command's honest remaining job is refreshing
`vex.types.ts` (schema emission stays `vex dev`/`vex deploy` territory, as the
old comment already argued; the eslint pass only existed for the generated
dirs):

```ts
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
```

#### packages/cli/src/index.ts

Two edits; everything not shown is unchanged.

**1 — `generate` case.** Pass the parsed flag through:

```ts
  case "generate":
    generateCommand({ cwd }).catch((err) => {
      logger.error("Fatal error", err);
      process.exit(1);
    });
    break;
```

**2 — usage text.** In the `default:` help block, replace the `generate` line
and document the shared flag:

```text
  generate [options]  Regenerate vex.types.ts from the vex config.

Options:
  --once              (dev) Generate schema, push to Convex, and exit
  --cwd <dir>         Run as if started from <dir>
```

#### packages/cli/src/lib/generateSchema.ts

Two edits; everything not shown is unchanged.

**1 — imports.** Remove the line
`import { generateAndWriteCollectionFiles } from "./generateCollectionFiles.js";`

**2 — tail of `generateAndWrite`.** Remove the final block before
`return { written: true };` — the
`// Generate typed per-collection query files` comment and the
`await generateAndWriteCollectionFiles({ config, cwd });` call.

#### packages/cli/vitest.config.ts

Complete file after the edit — the exclusion hid the dead test, and
`passWithNoTests` hid that nothing ran at all:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
```

#### packages/cli/tsconfig.check.json

Complete file after the edit. Both excludes go: the first covered the deleted
test, the second (`src/schema/generateSchema.test.ts`) references a path that
has never existed on this branch. The new test files below typecheck under
`include: ["src"]` because they import vitest APIs explicitly.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "paths": {},
    "noEmit": true,
    "rootDir": "..",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

#### packages/cli/src/lib/resolveConfigPath.test.ts

New file — pins the documented search contract (root before `src/`, `.ts`
before `.mjs` within a dir, actionable error naming every tried path):

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveConfigPath } from "./resolveConfigPath";

describe("resolveConfigPath", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vex-cli-config-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds vex.config.ts in the project root", () => {
    writeFileSync(join(tmpDir, "vex.config.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.ts"));
  });

  it("falls back to src/ when the root has no config", () => {
    mkdirSync(join(tmpDir, "src"));
    writeFileSync(join(tmpDir, "src", "vex.config.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "src", "vex.config.ts"));
  });

  it("prefers any root config over src/ — search dirs are the outer loop", () => {
    mkdirSync(join(tmpDir, "src"));
    writeFileSync(join(tmpDir, "src", "vex.config.ts"), "export default {}");
    writeFileSync(join(tmpDir, "vex.config.mjs"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.mjs"));
  });

  it("throws a message listing every tried path when nothing matches", () => {
    let message = "";
    try {
      resolveConfigPath(tmpDir);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("Could not find vex config");
    expect(message).toContain(resolve(tmpDir, "vex.config.ts"));
    expect(message).toContain(resolve(tmpDir, "src", "vex.config.mjs"));
  });
});
```

#### packages/cli/src/lib/resolveConvexUrl.test.ts

New file — pins env-var precedence over `.env.local`, quote stripping, and the
empty-value → `null` contract:

```ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveConvexUrl } from "./resolveConvexUrl";

describe("resolveConvexUrl", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vex-cli-url-"));
    // Empty string is falsy to the resolver's guards — neutralizes any
    // real values in the developer's shell without deleting them.
    vi.stubEnv("CONVEX_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("prefers the CONVEX_URL env var over everything", () => {
    vi.stubEnv("CONVEX_URL", "https://env.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://public.convex.cloud");
    writeFileSync(join(tmpDir, ".env.local"), "CONVEX_URL=https://file.convex.cloud\n");
    expect(resolveConvexUrl(tmpDir)).toBe("https://env.convex.cloud");
  });

  it("falls back to NEXT_PUBLIC_CONVEX_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://public.convex.cloud");
    expect(resolveConvexUrl(tmpDir)).toBe("https://public.convex.cloud");
  });

  it("parses .env.local, skipping comments and stripping quotes", () => {
    writeFileSync(
      join(tmpDir, ".env.local"),
      '# deployment\nUNRELATED=x\nNEXT_PUBLIC_CONVEX_URL="https://file.convex.cloud"\n',
    );
    expect(resolveConvexUrl(tmpDir)).toBe("https://file.convex.cloud");
  });

  it("returns null when no source has a value", () => {
    expect(resolveConvexUrl(tmpDir)).toBeNull();
  });

  it("returns null for an empty assignment in .env.local", () => {
    writeFileSync(join(tmpDir, ".env.local"), "CONVEX_URL=\n");
    expect(resolveConvexUrl(tmpDir)).toBeNull();
  });
});
```

#### packages/cli/README.md

Three edits; everything not shown is unchanged.

**1 — `vex dev` step list.** Delete step 3
(`Generates typed collection API files (convex/vex/api/*.ts)`) and renumber.

**2 — `vex generate` section.** Replace the description ("Force-regenerates all
typed collection API files" and the paragraph about `convex/vex/api/`,
`model/api/`, eslint, and stale-file cleanup) with:

```text
Regenerates `vex.types.ts` from the vex config. Schema emission and deploys
stay with `vex dev` / `vex deploy`; the runtime API needs no generated files —
it is registered by the factory functions (`collectionsApi`, the globals and
media factories) in your `convex/` directory.
```

**3 — "What It Generates" table.** Drop the `Collection APIs` and `Model APIs`
rows and the trailing sentence about the `AUTO-GENERATED` header cleanup.

#### apps/test/convex/vex/

`rmdir apps/test/convex/vex/api apps/test/convex/vex/model/api apps/test/convex/vex/model`
— all three are empty (git does not track them; they exist only on disk).
`apps/test/convex/vex/{globals,media}.ts` stay — they are the live factory
registrations.

Verify: pnpm --filter @vexcms/core --filter @vexcms/cli build && pnpm --filter @vexcms/core --filter @vexcms/cli typecheck && pnpm --filter @vexcms/cli test && node packages/cli/dist/index.js generate --cwd apps/test && git diff --exit-code apps/test/convex/vex.schema.ts apps/test/src/vex.types.ts

### Step 2 — `RenderBlocks` in `@vexcms/react`, proven against apps/test [agent]

Master's `RenderBlocks` lived in `@vexcms/ui`, which no longer exists; both
templates and the future www need one. The component is generic over the
app's generated block union so the map stays fully typed (DD 12), and
apps/test's `BlockRenderer` switch migrates to it in the same step — the
component ships already proven against live data.

- [ ] `packages/react/src/components/RenderBlocks.tsx` — new
- [ ] `packages/react/src/components/RenderBlocks.test.tsx` — new
- [ ] `packages/react/src/index.ts` — export the component and its types
- [ ] `apps/test/src/app/(frontend)/PageContent.tsx` — replace the switch with `RenderBlocks`

#### packages/react/src/components/RenderBlocks.tsx

New file:

```tsx
import type { ComponentType, ReactNode } from "react";

/** Minimal structural shape `RenderBlocks` needs from a block value. */
export interface RenderableBlock {
  /** Unique per-block id assigned by the blocks field — used as the React key. */
  id: string;
  /** Discriminant naming which block config produced this value. */
  blockType: string;
}

/**
 * Props every block renderer receives: the block value, narrowed to the
 * renderer's own variant when the components map is keyed by a generated
 * union.
 */
export interface BlockComponentProps<TBlock extends RenderableBlock = RenderableBlock> {
  block: TBlock;
}

/**
 * Map from a block union's `blockType` discriminants to their renderers.
 *
 * Keyed by `TBlock["blockType"]` with each entry receiving the
 * `Extract`-narrowed variant — a map typed against a generated union
 * (e.g. `PageBlock`) gets per-renderer field autocomplete, and object
 * literals get excess-property errors on typo'd keys.
 */
export type BlockComponents<TBlock extends RenderableBlock> = {
  [K in TBlock["blockType"]]?: ComponentType<
    BlockComponentProps<Extract<TBlock, { blockType: K }>>
  >;
};

export interface RenderBlocksProps<TBlock extends RenderableBlock> {
  /** The value of a `blocks()` field; `null`/`undefined` renders nothing. */
  blocks: readonly TBlock[] | null | undefined;
  /** Renderer per block type. A missing entry falls through to `fallback`. */
  components: BlockComponents<TBlock>;
  /**
   * Rendered for a `blockType` with no `components` entry — a document can
   * carry blocks a site no longer registers. Omitted → the block is skipped.
   */
  fallback?: ComponentType<BlockComponentProps<TBlock>>;
}

/**
 * Dispatches a blocks-field value to per-type renderers in document order.
 *
 * Replaces the hand-written `switch (block.blockType)` pattern. Keys are
 * `block.id` — unique per entry, stable across reorders in the admin panel.
 *
 * @param props.blocks - Blocks array from a document's blocks field.
 * @param props.components - `blockType` → renderer map.
 * @param props.fallback - Optional renderer for unregistered block types.
 * @returns The rendered sequence, or `null` for an empty/absent array.
 */
export function RenderBlocks<TBlock extends RenderableBlock>(
  props: RenderBlocksProps<TBlock>,
): ReactNode {
  const { blocks, components, fallback: Fallback } = props;
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => {
        // The per-variant map cannot be indexed soundly with the erased
        // union type — safe here because entry K only ever receives blocks
        // whose blockType === K.
        const Component = components[block.blockType as TBlock["blockType"]] as
          | ComponentType<BlockComponentProps<TBlock>>
          | undefined;
        if (Component) return <Component block={block} key={block.id} />;
        if (Fallback) return <Fallback block={block} key={block.id} />;
        return null;
      })}
    </>
  );
}
```

#### packages/react/src/components/RenderBlocks.test.tsx

New file. The narrowing is exercised at compile time — `Hero` reading
`block.heading` under `BlockComponentProps<HeroTestBlock>` only typechecks if
`Extract` narrowing holds; the runtime tests pin dispatch, ordering, fallback,
and the empty states:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RenderBlocks, type BlockComponentProps } from "./RenderBlocks";

type HeroTestBlock = { id: string; blockType: "hero"; heading: string };
type CtaTestBlock = { id: string; blockType: "cta"; label: string };
type TestBlock = HeroTestBlock | CtaTestBlock;

function Hero({ block }: BlockComponentProps<HeroTestBlock>) {
  return <h2>{block.heading}</h2>;
}

function Cta({ block }: BlockComponentProps<CtaTestBlock>) {
  return <button type="button">{block.label}</button>;
}

function Unknown({ block }: BlockComponentProps<TestBlock>) {
  return <p>unknown: {block.blockType}</p>;
}

const blocks: TestBlock[] = [
  { id: "b1", blockType: "hero", heading: "First" },
  { id: "b2", blockType: "cta", label: "Click" },
  { id: "b3", blockType: "hero", heading: "Second" },
];

describe("RenderBlocks", () => {
  it("renders every block through its own component, in document order", () => {
    const { container } = render(
      <RenderBlocks blocks={blocks} components={{ hero: Hero, cta: Cta }} />,
    );
    const rendered = Array.from(container.children).map((el) => el.textContent);
    expect(rendered).toEqual(["First", "Click", "Second"]);
    expect(container.querySelectorAll("h2")).toHaveLength(2);
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });

  it("renders nothing for undefined, null, and empty arrays", () => {
    for (const value of [undefined, null, [] as TestBlock[]]) {
      const { container } = render(
        <RenderBlocks blocks={value} components={{ hero: Hero }} />,
      );
      expect(container.innerHTML).toBe("");
    }
  });

  it("skips blocks with no registered component when there is no fallback", () => {
    const { container } = render(
      <RenderBlocks blocks={blocks} components={{ hero: Hero }} />,
    );
    const rendered = Array.from(container.children).map((el) => el.textContent);
    expect(rendered).toEqual(["First", "Second"]);
  });

  it("routes unregistered block types to the fallback", () => {
    const { container } = render(
      <RenderBlocks blocks={blocks} components={{ hero: Hero }} fallback={Unknown} />,
    );
    const rendered = Array.from(container.children).map((el) => el.textContent);
    expect(rendered).toEqual(["First", "unknown: cta", "Second"]);
  });
});
```

#### packages/react/src/index.ts

One edit — beside the `Icon` exports (everything not shown is unchanged):

```ts
export { RenderBlocks } from "./components/RenderBlocks";
export type {
  BlockComponentProps,
  BlockComponents,
  RenderableBlock,
  RenderBlocksProps,
} from "./components/RenderBlocks";
```

#### apps/test/src/app/(frontend)/PageContent.tsx

Three edits; the nine per-block renderers already have the
`BlockComponentProps`-compatible shape
(`{ block }: { block: Extract<PageBlock, { blockType: "…" }> }`) and are
untouched, as is the sandbox junk above them (it stays in the test app by
design). Everything not
shown is unchanged.

**1 — imports.** Add:

```tsx
import { RenderBlocks, type BlockComponents } from "@vexcms/react";
```

**2 — blocks section inside `PageContent`.** Replace the
`page.blocks.map((block) => <BlockRenderer …/>)` loop (keep the surrounding
`page.blocks && page.blocks.length > 0 &&` section guard so the wrapping
`<section>` doesn't render empty):

```tsx
<RenderBlocks blocks={page.blocks} components={pageBlockComponents} fallback={UnknownBlock} />
```

**3 — replace the `BlockRenderer` function.** Delete it entirely; in its place,
the map (the `satisfies` clause is what keeps every key and signature checked
against the generated union) and the former `default:` case as a named
component:

```tsx
const pageBlockComponents = {
  hero: HeroBlockRenderer,
  feature: FeatureBlockRenderer,
  cta: CtaBlockRenderer,
  testimonial: TestimonialBlockRenderer,
  stats: StatsBlockRenderer,
  "logo-cloud": LogoCloudBlockRenderer,
  faq: FaqBlockRenderer,
  pricing: PricingBlockRenderer,
  content: ContentBlockRenderer,
} satisfies BlockComponents<PageBlock>;

/**
 * Rendered for a block type no longer registered in `pageBlockComponents` —
 * the old `default:` branch of the dispatch switch.
 */
function UnknownBlock({ block }: { block: PageBlock }) {
  return (
    <div className="rounded-lg border border-dashed border-red-300 p-6 text-center text-sm text-muted-foreground">
      Unknown block type:{" "}
      <code className="font-mono text-xs">{(block as { blockType: string }).blockType}</code>
    </div>
  );
}
```

Verify: pnpm --filter @vexcms/react test && pnpm --filter @vexcms/react build && pnpm --filter test typecheck && pnpm --filter test build

### Step 3 — Author `templates/base-nextjs` from apps/test [agent]

Why: the bare scaffold (admin + auth + media, no site content) is the foundation the
marketing overlay lands on, and the structural source of truth is apps/test — not
master. `apps/test` is a hand-built dogfood app, not a template: it carries no
`{{PLACEHOLDER}}` markers, no bootstrap flow, and its Better Auth config lives at
`src/auth/{options,plugins}.ts`. The installer's OAuth/org placeholder machinery
(`packages/create-vexcms/src/installers/{nextjs,base}.ts`, unedited by this step)
hardcodes `convex/auth/options.ts` and `convex/auth/plugins/index.ts` as its target
files — the master/reference template's layout, not apps/test's. This section ports
apps/test's *content and API usage* (the `@vexcms/better-auth` adapter,
`createGetAuth`, the 12-field-type collection/access API, the factory-registered
`collectionsApi`/`mediaApi`/`globalsApi` wiring) into the *file layout the installer
expects*, re-adds the placeholder markers apps/test never needed, strips every
marketing/theme/sandbox concern, and ships a first-admin bootstrap flow ported from
master since apps/test doesn't have one yet.

- [ ] Root config: `package.json`, `tsconfig.json`, `next.config.ts`,
      `eslint.config.mjs`, `postcss.config.mjs`, `convex.json`, `_gitignore`,
      `_env.example`, `_prettierrc`, `_prettierignore`, `components.json`,
      `README.md`
- [ ] `public/favicons/favicon.ico`, `public/{file,globe,next,vercel,window}.svg`
- [ ] `src/env.mjs`, `src/proxy.ts`, `src/vex.config.ts`, `src/lib/utils.ts`
- [ ] `src/db/constants/index.ts`, `src/db/constants/auth.ts`
- [ ] `src/auth/access.ts`, `src/auth/hasPermission.ts`, `src/auth/server.ts`,
      `src/auth/serverUtils.ts`, `src/auth/types.ts`, `src/auth/client.tsx`
- [ ] `src/context/AuthContext.tsx`
- [ ] `src/components/providers/{auth,server,convex,client}.tsx`
- [ ] `src/components/{component-example,example}.tsx`
- [ ] `src/components/WelcomePage.tsx` (new)
- [ ] `src/components/ui/*.tsx` (15 files, verbatim)
- [ ] `src/vexcms/collections/{users,images,index}.ts`
- [ ] `src/app/layout.tsx`, `src/app/globals.css`
- [ ] `src/app/(vexcms)/admin/{layout.tsx,clientProviders.tsx}`,
      `src/app/(vexcms)/admin/[[...path]]/page.tsx`
- [ ] `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/page.tsx` (new)
- [ ] `src/app/(frontend)/auth/[pathname]/{view,page}.tsx`
- [ ] `src/app/(frontend)/@auth/{default,page}.tsx`,
      `src/app/(frontend)/@auth/(...)auth/[pathname]/{view,page}.tsx`
- [ ] `src/app/unauthorized/page.tsx`, `src/app/api/auth/[...all]/route.ts`
- [ ] `convex/schema.ts`, `convex/auth.config.ts`, `convex/http.ts`,
      `convex/convex.config.ts`, `convex/vex.ts`
- [ ] `convex/vex/firstUser.ts` (new, ported from master)
- [ ] `convex/vex/media.ts`, `convex/vex/globals.ts`
- [ ] `convex/auth/options.ts`, `convex/auth/plugins/index.ts` (relocated +
      placeholders), `convex/auth/index.ts` (relocated import),
      `convex/auth/api.ts`, `convex/auth/db.ts`, `convex/auth/sessions.ts`
- [ ] Pre-generated artifacts: `convex/vex.schema.ts`, `convex/_generated/*`,
      `src/vex.types.ts` — produced by the procedure below, never hand-written
- [ ] `packages/create-vexcms/src/installers/base.ts` — extend `configurePort`
- [ ] `scripts/scaffold-smoke.mjs` (new)
- [ ] Root `package.json` — add `jiti: catalog:` devDependency (scaffold-smoke's
      TS-source loader; already a workspace dep of `@vexcms/cli`, not yet declared
      at the root)
- [ ] Run: `pnpm --filter create-vexcms build`, the artifact-generation procedure
      (below), `node scripts/scaffold-smoke.mjs --bare`,
      `node scripts/scaffold-smoke.mjs`

**Excluded from base** (verified absent from every file below, not just believed
absent): theme system (`ThemeStyle.tsx`, `ThemeLive.tsx`, `convex/theme.ts`,
`themes`/`themeColors` collections), `pages`/`headers`/`footers` collections, `nav`
global, all 10 blocks, `convex/seed.ts`, articles/caseStudies/changelog/comments
sandbox collections, `CONTENT_STATUS`/`GLOBAL_SLUG_*` constants, `traces/`,
`AGENTS.md`/`CLAUDE.md`/`skills-lock.json`/`.agents/skills/**` (repo tooling, not
template content), `src/auth/permissions.ts` + `src/auth/access.typecheck.ts`
(both exist only to serve apps/test's editorial custom-action demo — base declares
no custom actions), `src/vexcms/api.ts` (`vexServerApi`, apps/test's only consumer
is the excluded `convex/pages.ts`), `convex/auth/config.ts` (dead — grep confirms
zero importers; superseded by the flat `convex/auth.config.ts` using
`getAuthConfigProvider()`), `convex/vexContext.ts` (dead — grep confirms zero
callers outside its own docstring), `COLLECTION_SLUG_MEDIA` + `AUTH_PROVIDERS` in
`db/constants/index.ts` (both dead, zero importers), `newUserFieldTest` on the
`users` collection (sandbox test field), the `console.log("guard redirect
activated")` in the auth interception modal (debug leftover).

**Translation table.** Relative destinations here — and the relative `#### `
file headings below — resolve under `packages/create-vexcms/templates/base-nextjs/`.

| Source | Template dest | Edit |
|---|---|---|
| `apps/test/package.json` | `package.json` | full rewrite — see below |
| `apps/test/tsconfig.json` | `tsconfig.json` | drop the six `@vexcms/*` source-alias paths (template consumers resolve real npm packages, not monorepo `source` exports); keep `~/*`, `@convex/*` |
| `apps/test/next.config.ts` | `next.config.ts` | drop `repoRoot`/`turbopack.{root,resolveAlias}` (monorepo-only nuqs workaround) and the three `images.remotePatterns` entries (apps/test's own Convex deployment hostname, unknowable at template-author time) — see below |
| `apps/test/eslint.config.mjs` | `eslint.config.mjs` | drop the `{ files: ["**/src/convex/**/*.ts"], plugins: { "@convex-dev": convexPlugin }, rules: convexRules }` block (lines 127–133) — apps/test's own `convex/` lives at the repo root, not `src/convex/`, so this pattern matches nothing there either; it is dead config, not carried forward |
| `apps/test/postcss.config.mjs` | `postcss.config.mjs` | verbatim |
| `apps/test/convex.json` | `convex.json` | verbatim |
| `apps/test/.gitignore` | `_gitignore` | verbatim (underscore rename — `fileOperations.ts`'s `copyTemplate` renames it back on scaffold) |
| `apps/test/.env.local` shape + reference `_env.example` | `_env.example` | full rewrite — see below |
| n/a (apps/test inherits the repo-root prettier config) | `_prettierrc` | from `.rebuild/reference/.../base-nextjs/_prettierrc` verbatim — a standalone scaffold has no monorepo root to inherit from |
| `.rebuild/reference/.../base-nextjs/_prettierignore` | `_prettierignore` | verbatim |
| `apps/test/components.json` | `components.json` | verbatim |
| `.rebuild/reference/.../base-nextjs/README.md` (stand-up shape) | `README.md` | full rewrite — see below |
| `apps/test/public/**` | `public/**` | verbatim binary copy |
| `.rebuild/reference/.../base-nextjs/src/env.mjs` | `src/env.mjs` | verbatim — already carries the exact `{{OAUTH_ENV_SERVER_SCHEMA}}` / `{{OAUTH_ENV_RUNTIME_MAPPING}}` markers `nextjs.ts#updateEnvTs` expects |
| `apps/test/src/proxy.ts` | `src/proxy.ts` | verbatim |
| `apps/test/src/vex.config.ts` | `src/vex.config.ts` | full rewrite — see below |
| `apps/test/src/lib/utils.ts` | `src/lib/utils.ts` | verbatim |
| `apps/test/src/db/constants/index.ts` | `src/db/constants/index.ts` | full rewrite — see below |
| `apps/test/src/db/constants/auth.ts` | `src/db/constants/auth.ts` | full rewrite — see below |
| `apps/test/src/auth/access.ts` | `src/auth/access.ts` | full rewrite — see below |
| `apps/test/src/auth/hasPermission.ts` | `src/auth/hasPermission.ts` | verbatim |
| `apps/test/src/auth/server.ts` | `src/auth/server.ts` | verbatim |
| `apps/test/src/auth/serverUtils.ts` | `src/auth/serverUtils.ts` | verbatim |
| `apps/test/src/auth/types.ts` | `src/auth/types.ts` | verbatim |
| `apps/test/src/auth/client.tsx` | `src/auth/client.tsx` | insert `// {{OAUTH_UI_PROVIDERS}}` above `Link={Link}` and `/* {{EMAIL_PASSWORD_CREDENTIALS}} */` in place of `credentials={true}`; drop `organizationClient()` from the plugins array (org support is server-plugin-conditional via the installer, so the client plugin list defaults symmetric-off too — README notes adding it back manually when `--orgs` is used) — see below |
| `apps/test/src/context/AuthContext.tsx` | `src/context/AuthContext.tsx` | verbatim |
| `apps/test/src/components/providers/auth.tsx` | `src/components/providers/auth.tsx` | verbatim |
| `apps/test/src/components/providers/server.tsx` | `src/components/providers/server.tsx` | verbatim (keeps `@vexcms/react`'s `ThemeProvider` — generic light/dark mode, unrelated to the CMS `themes` collection) |
| `apps/test/src/components/providers/convex.tsx` | `src/components/providers/convex.tsx` | verbatim |
| `apps/test/src/components/providers/client.tsx` | `src/components/providers/client.tsx` | verbatim |
| `apps/test/src/components/component-example.tsx` | `src/components/component-example.tsx` | verbatim (shadcn-init boilerplate) |
| `apps/test/src/components/example.tsx` | `src/components/example.tsx` | verbatim |
| `.rebuild/.../base-nextjs/src/app/(frontend)/page.tsx` (bootstrap logic) | `src/components/WelcomePage.tsx` | extracted into a standalone named-export component, `useSession` import path updated — see below |
| `apps/test/src/components/ui/{input,accordion,badge,textarea,dropdown-menu,separator,select,input-group,field,dialog,combobox,card,button,alert-dialog,label}.tsx` | `src/components/ui/*.tsx` | verbatim, zero delta — stock shadcn output |
| `apps/test/src/vexcms/collections/users.ts` | `src/vexcms/collections/users.ts` | drop the `newUserFieldTest` field — see below |
| `apps/test/src/vexcms/collections/images.ts` | `src/vexcms/collections/images.ts` | verbatim |
| n/a (apps/test's is a marketing barrel) | `src/vexcms/collections/index.ts` | new 2-line barrel — see below |
| `apps/test/src/app/layout.tsx` | `src/app/layout.tsx` | drop `ThemeScript`, `<ThemeStyle />`, `<ThemeLive />` (CMS theme system) — keep fonts/`ServerProviders`/`ClientProviders` — see below |
| `apps/test/src/app/globals.css` | `src/app/globals.css` | verbatim |
| `apps/test/src/app/(vexcms)/admin/layout.tsx` | `src/app/(vexcms)/admin/layout.tsx` | drop `<ThemeStyle scope="admin" />`, `<ThemeLive scope="admin" />` — see below |
| `apps/test/src/app/(vexcms)/admin/clientProviders.tsx` | `src/app/(vexcms)/admin/clientProviders.tsx` | verbatim |
| `apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx` | `src/app/(vexcms)/admin/[[...path]]/page.tsx` | verbatim |
| `apps/test/src/app/(frontend)/layout.tsx` | `src/app/(frontend)/layout.tsx` | verbatim — already header/footer-free |
| — | `src/app/(frontend)/page.tsx` | new thin wrapper around `WelcomePage` — see below |
| `apps/test/src/app/(frontend)/auth/[pathname]/view.tsx` | same path | verbatim |
| `apps/test/src/app/(frontend)/auth/[pathname]/page.tsx` | same path | verbatim |
| `apps/test/src/app/(frontend)/@auth/default.tsx` | same path | verbatim (`export default function Page() { return null }`) |
| `apps/test/src/app/(frontend)/@auth/page.tsx` | same path | verbatim |
| `apps/test/src/app/(frontend)/@auth/(...)auth/[pathname]/view.tsx` | same path | drop `console.log("guard redirect activated")` |
| `apps/test/src/app/(frontend)/@auth/(...)auth/[pathname]/page.tsx` | same path | verbatim |
| `apps/test/src/app/unauthorized/page.tsx` | `src/app/unauthorized/page.tsx` | verbatim |
| `apps/test/src/app/api/auth/[...all]/route.ts` | `src/app/api/auth/[...all]/route.ts` | verbatim |
| `apps/test/convex/schema.ts` | `convex/schema.ts` | trim to users/accounts (hand-written) + auth-plugin tables (session, verification, organization, team, teamMember, member, invitation, apikey, jwks, images, vex_globals); drop pages/headers/footers/themes/articles/case_studies/changelog/comments — see below |
| `apps/test/convex/auth.config.ts` | `convex/auth.config.ts` | verbatim |
| `apps/test/convex/http.ts` | `convex/http.ts` | verbatim |
| `apps/test/convex/convex.config.ts` | `convex/convex.config.ts` | verbatim |
| `apps/test/convex/vex.ts` | `convex/vex.ts` | verbatim |
| `.rebuild/.../base-nextjs/convex/vex/firstUser.ts` | `convex/vex/firstUser.ts` | ported to rebuild's `roles: string[]` field (not master's `role`), `TABLE_SLUG_USERS`; onboarding query/mutations dropped (unshipped, `as any`-typed against a field the schema never declares) — see below |
| `apps/test/convex/vex/media.ts` | `convex/vex/media.ts` | verbatim |
| `apps/test/convex/vex/globals.ts` | `convex/vex/globals.ts` | verbatim |
| `apps/test/src/auth/options.ts` (content) + `.rebuild/.../convex/auth/options.ts` (location + markers) | `convex/auth/options.ts` | relocated to satisfy `nextjs.ts#updateOAuthConfig`'s hardcoded target; content follows apps/test (`@vexcms/better-auth` adapter, `roles` field) — see below |
| `apps/test/src/auth/plugins.ts` (content) + `.rebuild/.../convex/auth/plugins/index.ts` (location + markers) | `convex/auth/plugins/index.ts` | relocated to satisfy `base.ts#configureOrganizations`'s hardcoded target; keeps apps/test's `createPlugins()` factory-function shape (avoids the `convex()` plugin's module-eval-time oidc-provider warning) — see below |
| `apps/test/convex/auth/index.ts` | `convex/auth/index.ts` | import path updated from `~/auth/options` to `./options` (relocated) — see below |
| `apps/test/convex/auth/api.ts` | `convex/auth/api.ts` | verbatim |
| `apps/test/convex/auth/db.ts` | `convex/auth/db.ts` | verbatim |
| `apps/test/convex/auth/sessions.ts` | `convex/auth/sessions.ts` | verbatim |
| n/a — procedure-generated | `convex/vex.schema.ts` | never hand-written — see artifact procedure |
| n/a — procedure-generated | `convex/_generated/*` | never hand-written — see artifact procedure |
| n/a — procedure-generated | `src/vex.types.ts` | never hand-written — see artifact procedure |

#### package.json

Dependencies are literal versions copied from `pnpm-workspace.yaml`'s catalog (P-015
governs the workspace, not published templates — Contract 5). `@vexcms/*` packages
use `~0.1.0-alpha.1` (a range, not a pin) to match `scripts/sync-template-versions.mjs`,
which writes `~${core version}` into every template's `package.json` on `pnpm
version:packages` and explicitly skips any specifier starting with `workspace:`
(so `--monorepo` rewrites, landing in Step 5, are untouched by the sync script).
`motion` has no catalog entry (only the marketing overlay's blocks import it) —
Step4Agent confirmed `13.1.1` (latest stable, web-verified) as the literal per
Contract 5's "absent from catalog" case. `seed` is added unconditionally per
Step4Agent: the overlay ships no `package.json` of its own (`overlayTemplate` is a
plain `fs.copy({ overwrite: true })`, so a `marketing-site/package.json` would have
to duplicate every script, not just add one) — on a `--bare` scaffold the script is
present but unreachable (nothing prompts a bare user to run it; `convex run
seed:init` would 404 since bare ships no `convex/seed.ts`).

##### package.json

```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port=3010",
    "vex:dev": "vex dev",
    "vex:generate": "vex dev --once",
    "vex:update": "pnpm add @vexcms/core@latest @vexcms/react@latest @vexcms/next@latest @vexcms/better-auth@latest @vexcms/file-storage-convex@latest @vexcms/cli@latest",
    "seed": "convex run seed:init",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "secret:create": "openssl rand -base64 32 | tr -d '\\n' | tee /dev/stderr | pbcopy && echo '\\n✓ Secret copied to clipboard'"
  },
  "dependencies": {
    "@base-ui/react": "1.2.0",
    "@better-auth/api-key": "1.6.23",
    "@convex-dev/better-auth": "0.11.5",
    "@convex-dev/react-query": "0.1.0",
    "@daveyplate/better-auth-ui": "3.4.0",
    "@t3-oss/env-nextjs": "0.13.11",
    "@tanstack/react-form": "1.33.1",
    "@tanstack/react-query": "5.101.2",
    "@vexcms/better-auth": "~0.1.0-alpha.1",
    "@vexcms/core": "~0.1.0-alpha.1",
    "@vexcms/file-storage-convex": "~0.1.0-alpha.1",
    "@vexcms/next": "~0.1.0-alpha.1",
    "@vexcms/react": "~0.1.0-alpha.1",
    "better-auth": "1.6.23",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "convex": "1.44.0",
    "convex-helpers": "0.1.120",
    "lucide-react": "0.577.0",
    "motion": "13.1.1",
    "next": "16.3.3",
    "nuqs": "2.9.0",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "shadcn": "3.6.3",
    "tailwind-merge": "3.5.0",
    "tw-animate-css": "1.4.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@convex-dev/eslint-plugin": "1.2.2",
    "@eslint/eslintrc": "3.3.6",
    "@next/eslint-plugin-next": "15.5.20",
    "@tailwindcss/postcss": "4.3.2",
    "@types/node": "20.19.43",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@vexcms/cli": "~0.1.0-alpha.1",
    "babel-plugin-react-compiler": "1.0.0",
    "eslint": "9.39.5",
    "eslint-config-next": "15.5.9",
    "eslint-plugin-import-x": "4.17.1",
    "eslint-plugin-perfectionist": "5.10.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "prettier": "3.9.5",
    "tailwindcss": "4.3.2",
    "typescript": "6.0.3",
    "typescript-eslint": "8.63.0"
  }
}
```

#### next.config.ts

```ts
import type { NextConfig } from "next"

import "./src/env.mjs"

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: ["127.0.01", "localhost"],
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Add your Convex deployment's hostname here once `npx convex dev` has
      // run — Convex file storage URLs are served from `<deployment>.convex.cloud`,
      // e.g. { hostname: "your-deployment-575.convex.cloud" }.
    ],
  },
}

export default nextConfig
```

#### _env.example

```
# Since the ".env.local" file is gitignored, use this file to build a new one
# when you clone the repo. Keep it up to date when you add new variables to
# `.env.local`.

# This file is committed to version control — never put secrets in it.

# When adding new environment variables, update the schema in "src/env.mjs".

NEXT_PUBLIC_CONVEX_URL=""
NEXT_PUBLIC_CONVEX_SITE_URL=""

NEXT_PUBLIC_SITE_URL="http://localhost:3010"
SITE_URL="http://localhost:3010"
BETTER_AUTH_SECRET=""

# {{ENV_OAUTH_VARS}}

```

#### src/vex.config.ts

```ts
import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { authOptions } from "@convex/auth/options"

import { access } from "~/auth/access"
import { images, users } from "~/vexcms/collections"

/**
 * VexCMS configuration for this project.
 *
 * Registers the admin sidebar layout, the Better Auth adapter, Convex file
 * storage, and every collection. Add collections/globals here as you define
 * them — `vex dev` / `vex generate` derive the Convex schema and TypeScript
 * types from this file.
 *
 * @see defineConfig in @vexcms/core
 * @see betterAuthAdapter in @vexcms/better-auth
 */
const vexConfig = defineConfig({
  access,
  admin: {
    sidebar: {
      side: "right",
    },
  },
  authAdapter: betterAuthAdapter({ config: authOptions }),
  storage: {
    adapters: [convexFileStorage({ mediaCollections: [images] })],
  },
  collections: [users],
})

export default vexConfig
```

#### src/db/constants/index.ts

```ts
import { type Doc, type Id } from "@convex/_generated/dataModel"

export * from "./auth"

// Better Auth
export const TABLE_SLUG_USERS = "user" as const
export type UserDoc = Doc<typeof TABLE_SLUG_USERS>
export type UserID = Id<typeof TABLE_SLUG_USERS>

export const TABLE_SLUG_ORGANIZATIONS = "organization" as const
export type OrganizationDoc = Doc<typeof TABLE_SLUG_ORGANIZATIONS>
export type OrganizationID = Id<typeof TABLE_SLUG_ORGANIZATIONS>

export const TABLE_SLUG_ACCOUNTS = "account" as const

export const TABLE_SLUG_SESSIONS = "session" as const
export type Session = Doc<typeof TABLE_SLUG_SESSIONS>
export type SessionID = Id<typeof TABLE_SLUG_SESSIONS>

export const TABLE_SLUG_VERIFICATIONS = "verification" as const
export const TABLE_SLUG_JWKS = "jwks" as const
export const TABLE_SLUG_API_KEYS = "apikey" as const

export const TABLE_SLUG_IMAGES = "images" as const
```

#### src/db/constants/auth.ts

```ts
export const USER_ROLES = {
  admin: "admin",
  user: "user",
} as const
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
```

#### src/auth/access.ts

```ts
import { defineAccess } from "@vexcms/core"

import {
  TABLE_SLUG_ORGANIZATIONS,
  TABLE_SLUG_USERS,
  USER_ROLES,
} from "~/db/constants"
import { images, users } from "~/vexcms/collections"

/**
 * Access control (RBAC) for the admin panel and every registered collection.
 *
 * `admin` gets unrestricted access. `user` can read and update only their own
 * profile row and cannot reach the admin panel. Add a resource here whenever
 * you register a new collection in `vex.config.ts`.
 *
 * @see https://vexcms.dev/docs/access-control
 */
export const access = defineAccess({
  anonRole: USER_ROLES.user,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
  resources: [images, users],
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
    },
    [USER_ROLES.user]: {
      "*": false,
      adminPanel: {
        access: false,
      },
      user: {
        "*": false,
        read: {
          constraints: ({ user, q }) => q.withIndex("by_email", (fq) => fq.eq("email", user.email)),
        },
        update: {
          constraints: ({ user, q }) => q.withIndex("by_email", (fq) => fq.eq("email", user.email)),
        },
      },
    },
  },
})
```

#### src/auth/client.tsx

```tsx
import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { adminClient, anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { env } from "~/env.mjs"

/**
 * Global Better Auth client for this project.
 *
 * Configured with the site's auth base URL and plugins for admin roles,
 * anonymous access, API key auth, and Convex session storage. Add
 * `organizationClient()` from `better-auth/client/plugins` here if you enable
 * organizations (`--orgs`, or by hand later) — the server-side `organization()`
 * plugin alone does not surface org UI on the client.
 *
 * @see signIn, signOut, useSession — destructured from this client
 * @see BetterAuthClientProvider — wraps the app with this client
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [adminClient(), anonymousClient(), apiKeyClient(), convexClient()],
})

export const { signIn, signOut, useSession } = authClient

// eslint-disable-next-line @typescript-eslint/no-empty-function
authClient.$store.listen("$sessionSignal", () => {})

export default function BetterAuthClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  return (
    <AuthUIProvider
      authClient={authClient}
      /* {{EMAIL_PASSWORD_CREDENTIALS}} */
      // {{OAUTH_UI_PROVIDERS}}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => {
        router.refresh()
      }}
      replace={router.replace}
    >
      {children}
    </AuthUIProvider>
  )
}
```

Note: `updateOAuthUIConfig` replaces `/* {{EMAIL_PASSWORD_CREDENTIALS}} */` with
`credentials={true|false}` and `// {{OAUTH_UI_PROVIDERS}}` with `social={{
providers: [...] }}` — both via `replacePlaceholder`, which preserves the
placeholder line's indentation, so the two markers must stay on their own lines
exactly as above.

#### src/components/WelcomePage.tsx

Extracted from the reference template's bootstrap page (master), which apps/test
does not have yet — Contract 3 requires it as a standalone component the overlay's
`PageContent` (Step 4) falls back to when no `home` page document exists. Ported to
rebuild's `roles: string[]` field (master's `firstUser.ts` used a scalar `role`
array under the name `role`; rebuild's `additionalFields.roles` is the real
multi-role field — see `firstUser.ts` below for the same delta).

```tsx
"use client"

import { useMutation, useQuery } from "convex/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { api } from "@convex/_generated/api"
import { useSession } from "~/auth/client"

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Landing UI for a project that has not been bootstrapped yet (no admin user),
 * and the "Go to Admin" / "Sign in" entry point once it has.
 *
 * Renders directly on `templates/base-nextjs`'s home route (no `pages`
 * collection exists there). The marketing overlay's `PageContent` renders it
 * as a fallback instead, when `pages.getBySlug("home")` returns no document.
 *
 * Promotes the first signed-in user to admin exactly once: `promoteFirstAdmin`
 * is a Convex mutation, so concurrent signups cannot both win — Convex
 * serializes mutations, and the loser observes `isBootstrapped` already true.
 */
export function WelcomePage() {
  const isBootstrapped = useQuery(api.vex.firstUser.isBootstrapped)
  const promoteFirstAdmin = useMutation(api.vex.firstUser.promoteFirstAdmin)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [promoting, setPromoting] = useState(false)
  const [navigating, setNavigating] = useState(false)

  // Reset navigating state when the user comes back to the home page
  // (e.g. closing the intercepting auth dialog)
  useEffect(() => {
    if (pathname === "/") {
      setNavigating(false)
    }
  }, [pathname])

  // If the user is signed in and this is a fresh project, try to promote them
  useEffect(() => {
    if (session?.user && isBootstrapped === false && !promoting) {
      setPromoting(true)
      setNavigating(true)
      promoteFirstAdmin()
        .then((result) => {
          if (result.promoted) {
            router.push("/admin")
          } else {
            setNavigating(false)
          }
        })
        .catch(() => {
          setPromoting(false)
          setNavigating(false)
        })
    }
  }, [session, isBootstrapped, promoting, promoteFirstAdmin, router])

  // Treat undefined (query still loading) as not bootstrapped — show the welcome page immediately
  const bootstrapped = isBootstrapped === true

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"

  const handleNavigate = (path: string) => {
    setNavigating(true)
    router.push(path)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">VexCMS</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {bootstrapped
            ? "Your content management system is ready."
            : "Welcome! Create your admin account to get started."}
        </p>
      </div>

      <div className="flex gap-4">
        {session?.user ? (
          <button onClick={() => handleNavigate("/admin")} disabled={navigating} className={buttonClass}>
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Go to Admin Panel"}
          </button>
        ) : bootstrapped ? (
          <button onClick={() => handleNavigate("/auth/sign-in")} disabled={navigating} className={buttonClass}>
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Sign In"}
          </button>
        ) : (
          <button onClick={() => handleNavigate("/auth/sign-up")} disabled={navigating} className={buttonClass}>
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Create Admin Account"}
          </button>
        )}
      </div>

      {promoting && <p className="text-sm text-muted-foreground animate-pulse">Setting up your admin account...</p>}
    </div>
  )
}
```

#### src/app/(frontend)/page.tsx

```tsx
import { WelcomePage } from "~/components/WelcomePage"

export default function Page() {
  return <WelcomePage />
}
```

#### src/vexcms/collections/users.ts

```ts
import { defineCollection } from "@vexcms/core"

import { TABLE_SLUG_USERS } from "~/db/constants"

export const users = defineCollection({
  slug: TABLE_SLUG_USERS,
  admin: {
    icon: "Users",
  },
  labels: {
    singular: "User",
    plural: "Users",
  },
  fields: {
    // Add custom user fields here — the auth adapter already contributes
    // name/email/roles/etc. from Better Auth's schema.
  },
})
```

#### src/vexcms/collections/index.ts

```ts
export * from "./images"
export * from "./users"
```

#### src/app/layout.tsx

```tsx
import type { Metadata } from "next"

import "./globals.css"

import { Geist, Geist_Mono } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  description: "Built with VexCMS",
  icons: { icon: "/favicons/favicon.ico" },
  title: "VexCMS",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} antialiased`} lang="en" suppressHydrationWarning>
      <body>
        <ServerProviders>
          <ClientProviders>{children}</ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
```

#### src/app/(vexcms)/admin/layout.tsx

```tsx
import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { getCurrentUser } from "~/auth/serverUtils"
import config from "~/vex.config"

import { ClientProviders } from "./clientProviders"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  return (
    <ClientProviders>
      <NextAdminLayout config={config} user={user ?? undefined}>
        {children}
      </NextAdminLayout>
    </ClientProviders>
  )
}
```

#### convex/schema.ts

Hand-maintained, not sourced from `vex.schema.ts` for `user`/`account` — matching
apps/test's actual (if slightly redundant) practice: `vex.schema.ts` also emits a
`user` table from the `users` collection config (merged with the Better Auth
adapter's fields), but `schema.ts` never imports it. Better Auth's real schema
needs precision the field-type system doesn't express yet (`v.union(v.null(),
v.string())` for nullable Better Auth columns like `displayUsername`), so the
table stays hand-written here rather than generated.

```ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import { TABLE_SLUG_ACCOUNTS, TABLE_SLUG_USERS } from "~/db/constants"

import {
  apikey,
  images,
  invitation,
  jwks,
  member,
  organization,
  session,
  team,
  teamMember,
  verification,
  vex_globals,
} from "./vex.schema"

export default defineSchema({
  vex_globals,
  images,
  team,
  teamMember,
  organization,
  member,
  invitation,
  session,
  verification,
  apikey,
  jwks,

  [TABLE_SLUG_USERS]: defineTable({
    name: v.string(),
    banExpires: v.optional(v.number()), // admin plugin
    banned: v.optional(v.boolean()), // admin plugin
    banReason: v.optional(v.string()), // admin plugin
    createdAt: v.number(),
    displayUsername: v.optional(v.union(v.null(), v.string())),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.union(v.null(), v.boolean())),
    phoneNumber: v.optional(v.union(v.null(), v.string())),
    phoneNumberVerified: v.optional(v.union(v.null(), v.boolean())),
    role: v.optional(v.string()), // admin plugin — single string in BA 1.6
    roles: v.array(v.string()), // our multi-role field via additionalFields
    twoFactorEnabled: v.optional(v.union(v.null(), v.boolean())),
    updatedAt: v.number(),
    userId: v.optional(v.union(v.null(), v.string())),
    username: v.optional(v.union(v.null(), v.string())),
  }).index("by_email", ["email"]),

  [TABLE_SLUG_ACCOUNTS]: defineTable({
    accessToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    accountId: v.string(),
    createdAt: v.number(),
    idToken: v.optional(v.string()),
    password: v.optional(v.string()),
    providerId: v.string(),
    refreshToken: v.optional(v.string()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    updatedAt: v.number(),
    userId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"]),
})
```

#### convex/vex/firstUser.ts

Ported from master's reference implementation, corrected to rebuild's actual role
field: master's `promoteFirstAdmin` patched a `role: string[]` field, but rebuild's
generated schema carries Better Auth admin plugin's own scalar `role: string`
*separately* from `roles: string[]` — the app's own multi-role field, declared in
`authOptions.user.additionalFields.roles` (`convex/auth/options.ts` below). Patching
`role` would silently write to the wrong field and never satisfy `access.ts`'s
`userRolesField: "roles"` check. Onboarding query/mutations dropped — master's
version cast `vex_onboarding_complete` with `as any` against a field no schema
declares; that's unshipped scaffolding, not part of the bootstrap contract.

```ts
import { ConvexError } from "convex/values"

import { mutation, query } from "../_generated/server"

import { TABLE_SLUG_USERS } from "~/db/constants"
import { USER_ROLES } from "~/db/constants/auth"

/**
 * Check whether the admin panel has been bootstrapped (at least one admin
 * exists). Used by `WelcomePage` to decide between "Sign Up" and "Sign In".
 */
export const isBootstrapped = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query(TABLE_SLUG_USERS).collect()
    return allUsers.some((user) => user.roles?.includes(USER_ROLES.admin))
  },
})

/**
 * Promote the current user to admin if no admin exists yet. Called after the
 * first user signs up.
 *
 * Convex mutations are serialized, so two simultaneous signups cannot both
 * become admin — the second observes the first's promotion and no-ops.
 */
export const promoteFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.email) {
      throw new ConvexError("Not authenticated")
    }

    const currentUser = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!currentUser) {
      throw new ConvexError("User not found")
    }

    const allUsers = await ctx.db.query(TABLE_SLUG_USERS).collect()
    const hasAdmin = allUsers.some((user) => user.roles?.includes(USER_ROLES.admin))

    if (hasAdmin) {
      return { promoted: false }
    }

    const currentRoles = currentUser.roles ?? []
    if (!currentRoles.includes(USER_ROLES.admin)) {
      await ctx.db.patch(currentUser._id, {
        roles: [...currentRoles, USER_ROLES.admin],
      })
    }

    return { promoted: true }
  },
})
```

#### convex/auth/options.ts

Relocated from `apps/test/src/auth/options.ts` — `nextjs.ts#updateOAuthConfig`
hardcodes `convex/auth/options.ts` as its edit target, and this step does not
touch `nextjs.ts`. `generateAuthProvidersBlock` (the function that fills
`{{OAUTH_PROVIDERS}}`) already emits the combined `emailAndPassword` +
`socialProviders` block; `{{EMAIL_PASSWORD_AUTH}}` is a second, graceful-only
marker the same call always strips — kept here only because `updateOAuthConfig`
issues a real (if graceful) replace against it, so its absence would silently
skip a step the installer believes it's running.

```ts
import type { BetterAuthOptions } from "better-auth"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
  USER_ROLES,
} from "~/db/constants"

import { createPlugins } from "./plugins"

export const authOptions: BetterAuthOptions = {
  account: {
    modelName: TABLE_SLUG_ACCOUNTS,
  },
  baseURL: process.env.SITE_URL,
  // {{EMAIL_PASSWORD_AUTH}}
  // {{OAUTH_PROVIDERS}}
  plugins: createPlugins(),
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    modelName: TABLE_SLUG_SESSIONS,
  },
  trustedOrigins: [process.env.SITE_URL!],
  user: {
    additionalFields: {
      roles: {
        type: "string[]",
        defaultValue: [USER_ROLES.user],
        required: true,
      },
    },
    modelName: TABLE_SLUG_USERS,
  },
  verification: {
    modelName: TABLE_SLUG_VERIFICATIONS,
  },
}
```

#### convex/auth/plugins/index.ts

Relocated from `apps/test/src/auth/plugins.ts` — `base.ts#configureOrganizations`
hardcodes `convex/auth/plugins/index.ts` and does two literal `content.replace()`
calls (not the line-preserving `replacePlaceholder` helper): the `{{ORGANIZATIONS_PLUGIN}}`
marker must carry *exactly* two leading spaces, or the add-path silently no-ops.
`{{ORGANIZATIONS_PLUGIN}}` is placed before `nextCookies()`, not after (master's
reference has it after) — apps/test's own docstring says `nextCookies()` must be
last "per convex dev cli warnings"; inserting `organization()` after it would
violate that on every `--orgs` scaffold.

```ts
import { apiKey } from "@better-auth/api-key"
import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "@convex/auth.config"
import { nextCookies } from "better-auth/next-js"
import { admin, anonymous } from "better-auth/plugins"
// {{ORGANIZATIONS_IMPORT}}

import { USER_ROLES } from "~/db/constants"

/**
 * Returns a fresh array of Better Auth plugins for each VexCMS auth session.
 *
 * Returns a new array on every call so that plugin initialization — including
 * the `convex()` factory, which internally calls the deprecated oidc-provider
 * plugin — runs inside `createAuth()` rather than at module-eval time. This
 * lets `http.ts`'s console.warn filter suppress the deprecation noise before
 * it fires.
 */
export const createPlugins = () => [
  admin({
    adminRoles: [USER_ROLES.admin],
    defaultRole: USER_ROLES.user,
  }),
  anonymous(),
  apiKey(),
  convex({ authConfig }),
  // {{ORGANIZATIONS_PLUGIN}}
  // this plugin must be last, per the convex dev CLI's own warnings
  nextCookies(),
]
```

#### convex/auth/index.ts

```ts
import type { GenericActionCtx } from "convex/server"

import { createBetterAuthAdapter } from "@vexcms/better-auth"
import { betterAuth } from "better-auth"

import { authOptions } from "./options"

import type { DataModel } from "../_generated/dataModel"

export const createAuth = (ctx: GenericActionCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) => {
  return betterAuth({
    database: createBetterAuthAdapter(ctx),
    logger: {
      disabled: optionsOnly,
    },
    ...authOptions,
  })
}
```

#### packages/create-vexcms/src/installers/base.ts

`configurePort` currently writes `.env.local` with an *empty* `BETTER_AUTH_SECRET`
— the real secret only lands in `.env.example` via `writeAuthSecret` (a separate,
later step). `.env.local` is the file Next.js and Convex actually load;
`.env.example` is inert boilerplate. Without a real secret and *some* value for
the Convex URL vars, `src/env.mjs`'s zod validation and `new
ConvexReactClient(url)` both throw before `pnpm build` gets anywhere near
rendering a page — Contract 6's deployment-less build requires all five.

**1 — `configurePort`.** Replace the `.env.local` block at the end of the method
(the two lines after `await fs.writeJson(pkgPath, pkg, { spaces: 2 });`, inside
`protected async configurePort(port: number): Promise<void>`):

```ts
  // Create .env.local with a real generated secret and placeholder Convex URLs
  // so a deployment-less `pnpm typecheck` / `pnpm build` survives env
  // validation and `new ConvexReactClient(url)` before `npx convex dev` has
  // ever run.
  const siteUrl = `http://localhost:${port}`;
  const envLocalPath = path.join(this.targetPath, '.env.local');
  const envContent = [
    `NEXT_PUBLIC_SITE_URL=${siteUrl}`,
    `SITE_URL=${siteUrl}`,
    `BETTER_AUTH_SECRET=${this.generateAuthSecret()}`,
    `NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud`,
    `NEXT_PUBLIC_CONVEX_SITE_URL=https://placeholder.convex.site`,
    `CONVEX_DEPLOYMENT=`,
    '',
  ].join('\n');
  await fs.writeFile(envLocalPath, envContent);
```

`generateAuthSecret()` is already a method on this class (used independently by
`writeAuthSecret` for `.env.example`) — no new import needed.

#### scripts/scaffold-smoke.mjs

Drives the installer *programmatically* — not via the interactive CLI, since
`--yes` (Step 5) doesn't exist yet — using `jiti` to import
`packages/create-vexcms/src/installers/index.ts` directly from a plain `.mjs`
script with zero build step. Same pattern `@vexcms/cli`'s `loadConfig.ts` already
uses for `vex.config.ts` (`createJiti(...).import(...)`), reused here rather than
inventing a second TS-loading convention. Asserts the tree, that every rewritten
dotfile lost its underscore, that no `{{...}}` marker survives substitution, and
the Step 4 prohibited-pattern sweep. Reused unchanged by Step 4 (full scaffold)
and Step 6 (graduates into the honest integration test suite) per Contract 7.

```js
#!/usr/bin/env node
/**
 * Scaffolds base-nextjs (optionally + the marketing-site overlay) into a tmp
 * dir via the installer, then asserts: the expected file tree, correct
 * `{{PLACEHOLDER}}` substitution with zero survivors, dotfile renames, and a
 * sweep for API patterns the rebuild dropped.
 *
 * Never touches the network or a live Convex deployment — installDependencies
 * and initGit are always false.
 *
 * Usage: node scripts/scaffold-smoke.mjs [--bare] [--monorepo]
 * Exit: 0 all assertions pass, 1 otherwise (every failure is printed first).
 */
import { createJiti } from "jiti";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const bare = args.includes("--bare");
const monorepo = args.includes("--monorepo");

const failures = [];
function assert(condition, message) {
  if (!condition) failures.push(message);
}

const REQUIRED_BASE_FILES = [
  "package.json",
  ".gitignore",
  ".env.example",
  ".prettierrc",
  "src/vex.config.ts",
  "src/env.mjs",
  "src/auth/client.tsx",
  "src/auth/access.ts",
  "src/components/WelcomePage.tsx",
  "src/vexcms/collections/index.ts",
  "convex/auth/options.ts",
  "convex/auth/plugins/index.ts",
  "convex/auth/index.ts",
  "convex/vex/firstUser.ts",
  "convex/schema.ts",
];

// Pre-generated artifacts are produced by a separate one-time procedure (see
// the spec), not by the installer — this script does not assert their
// presence, since a from-scratch `initProject()` call never runs `vex
// generate` or the Convex CLI.

const REQUIRED_OVERLAY_ONLY_FILES = [
  "src/vexcms/collections/pages.ts",
  "src/vexcms/collections/headers.ts",
  "src/vexcms/collections/footers.ts",
  "src/vexcms/collections/themes.ts",
  "src/vexcms/globals/siteSettings.ts",
  "src/vexcms/blocks/index.ts",
  "convex/seed.ts",
];

const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css"]);

const PROHIBITED_PATTERNS = [
  [/\bobject\(/, "object( — use group("],
  [/\bui\(/, "ui( — dropped from rebuild's field API"],
  [/\btabs\(/, "tabs( — dropped from rebuild's field API"],
  [/\bimageUrl\(/, "imageUrl( — use upload({ to: media })"],
  [/\brichtext\(/, "richtext( — not part of the 12 shipped field types"],
  [/admin\.blockStyles/, "admin.blockStyles — dropped block-style presets"],
  [/_vexDrafts/, "_vexDrafts — versioning/drafts is unshipped"],
  [/livePreview/, "livePreview — versioning/drafts is unshipped"],
  [/vex_status|vex_version/, "vex_status/vex_version — versioning/drafts is unshipped"],
  [/admin:\s*\{\s*components:\s*\{\s*Field:/, "per-instance admin.components.Field — not supported"],
];

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walkTextFiles(dir, visit) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkTextFiles(full, visit);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      await visit(full, await fs.readFile(full, "utf-8"));
    }
  }
}

async function assertTree(projectDir) {
  for (const rel of REQUIRED_BASE_FILES) {
    assert(await pathExists(path.join(projectDir, rel)), `missing ${rel}`);
  }
  for (const rel of ["_gitignore", "_env.example", "_prettierrc"]) {
    assert(!(await pathExists(path.join(projectDir, rel))), `unrenamed dotfile survived: ${rel}`);
  }
  for (const rel of REQUIRED_OVERLAY_ONLY_FILES) {
    const exists = await pathExists(path.join(projectDir, rel));
    if (bare) {
      assert(!exists, `--bare scaffold carries overlay-only file ${rel}`);
    } else {
      assert(exists, `full scaffold missing overlay file ${rel}`);
    }
  }
}

async function assertNoRawPlaceholders(projectDir) {
  await walkTextFiles(projectDir, (file, content) => {
    const match = content.match(/\{\{[A-Z_]+\}\}/);
    if (match) {
      failures.push(`unsubstituted placeholder ${match[0]} in ${path.relative(projectDir, file)}`);
    }
  });
}

async function assertProhibitedPatterns(projectDir) {
  await walkTextFiles(projectDir, (file, content) => {
    for (const [pattern, reason] of PROHIBITED_PATTERNS) {
      if (pattern.test(content)) {
        failures.push(`${path.relative(projectDir, file)} matches prohibited pattern: ${reason}`);
      }
    }
  });
}

async function main() {
  const jiti = createJiti(import.meta.url, { moduleCache: false, fsCache: false });
  const { createInstaller } = await jiti.import(
    path.join(root, "packages/create-vexcms/src/installers/index.ts"),
  );

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vex-scaffold-smoke-"));
  const projectDir = path.join(tmpDir, "smoke-app");
  await fs.mkdir(projectDir, { recursive: true });

  const installer = createInstaller({
    framework: "nextjs",
    projectDir,
    projectName: "smoke-app",
  });

  await installer.initProject({
    projectName: "smoke-app",
    projectDir,
    framework: "nextjs",
    port: 3010,
    bare,
    orgs: false,
    emailPasswordAuth: true,
    oauthProviders: [],
    initGit: false,
    installDependencies: false,
    // `monorepo` is a no-op until Step 5 adds it to `ProjectOptions` — threaded
    // through now so this script needs no change when it lands.
    monorepo,
  });

  await assertTree(projectDir);
  await assertNoRawPlaceholders(projectDir);
  await assertProhibitedPatterns(projectDir);

  await fs.rm(tmpDir, { recursive: true, force: true });

  if (failures.length > 0) {
    console.error(`scaffold-smoke: ${failures.length} failure(s)`);
    for (const f of failures) console.error(`  ✕ ${f}`);
    process.exit(1);
  }
  console.log(`scaffold-smoke: OK (${bare ? "--bare" : "base + marketing-site"}${monorepo ? ", --monorepo" : ""})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

**Pre-generated artifact procedure.**

`convex/_generated/*`, `convex/vex.schema.ts`, and `src/vex.types.ts` are never
hand-written — a from-scratch scaffold must `pnpm typecheck && pnpm build` before
`npx convex dev` has ever run (Contract 6), so these three artifacts have to exist
in the template *before* a user ever runs the CLI. Two real constraints, verified
by reading the actual CLI source rather than assumed:

1. `generateCommand()` (`packages/cli/src/commands/generate.ts`) does not accept
   `--cwd` — only `devCommand` does (`packages/cli/src/index.ts`'s flag parser
   only threads `cwd` into the `dev` case). Solved by setting the *subprocess's*
   `cwd` when invoking `generate` (`execa`/`spawn` with `{ cwd: tmpDir }`), which
   `generateCommand()` picks up via its own internal `process.cwd()` — no CLI
   change needed.
2. Post-Step-1, `generateCommand()` writes only `src/vex.types.ts` (via
   `writeVexTypes`) — it does not call `generateVexSchema`/`generateAndWrite`, so
   it never writes `convex/vex.schema.ts`. Only `vex dev` (and `vex dev --once`)
   calls `generateAndWrite`. `vex dev --once` also pushes to a live Convex
   deployment, which is unavoidable for `convex/_generated/*`: those files are
   produced by the Convex CLI itself (`convex dev` / `convex codegen`), not by
   `@vexcms/cli`, and Convex's codegen needs at least one linked deployment to
   run against.

- [ ] Run the following once, by hand, and commit the resulting three artifacts:
  1. `pnpm --filter create-vexcms build && pnpm --filter @vexcms/cli build`
  2. Pack the 8 publishable `@vexcms/*` packages to a tmp tarball store — the
     same one-tarball-per-package mechanism `scripts/verify-scaffold.mjs`
     (Step 7) builds (AP-017: never key tarballs by a shared version string).
     `@vexcms/*` are pre-alpha and not on npm, so a scaffold outside the
     monorepo has no other way to resolve them.
  3. `node scripts/scaffold-smoke.mjs --bare` against a *modified* run that
     skips the tmp-dir cleanup (or scaffold directly:
     `node -e '...'`/an ad hoc one-off script calling the same
     `createInstaller().initProject()` path) to land a bare scaffold at a
     durable tmp path, e.g. `/tmp/vex-base-artifacts`.
  4. In `/tmp/vex-base-artifacts/package.json`, point every `@vexcms/*`
     dependency at `file:<tarball path>` from step 2, then `pnpm install`
     there (this is the only step that touches the network/disk beyond the
     tmp dir).
  5. `npx convex dev --once --cwd /tmp/vex-base-artifacts` (or plain
     `npx convex dev` once, then Ctrl-C after the first successful push) —
     creates or reuses a scratch Convex project, pushes `convex/schema.ts`,
     and generates `convex/_generated/*` as a side effect of the Convex CLI's
     own codegen.
  6. `node <repo>/packages/cli/dist/index.js generate` run with its process
     `cwd` set to `/tmp/vex-base-artifacts` — writes `src/vex.types.ts` from
     the scaffold's `vex.config.ts`.
  7. Copy `convex/_generated/*`, `convex/vex.schema.ts`, and `src/vex.types.ts`
     from the tmp scaffold back into `packages/create-vexcms/templates/base-nextjs/`,
     verbatim.
  8. Delete the scratch Convex project (dashboard → Settings → Delete Project)
     and the tmp directory.
- [ ] Re-run this procedure whenever `src/vex.config.ts`'s collection set
  changes in a way that would change the generated schema/types shape (i.e.
  whenever `users`/`images`' field config changes) — `template-sync` (Step 8)
  is the long-term mechanism that keeps this from silently rotting.

#### README.md

````md
# {{PROJECT_NAME}}

A VexCMS project built with Next.js, Better Auth, and Convex.

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Convex

```bash
npx convex dev
```

On first run this creates (or links) a Convex project and prints your
deployment's URL and site URL.

### 3. Fill in your environment variables

`.env.local` already has a generated `BETTER_AUTH_SECRET` and a
`http://localhost:3010` `SITE_URL`/`NEXT_PUBLIC_SITE_URL` pair, so the app
builds and typechecks immediately. Replace the placeholder Convex URLs with the
real ones `npx convex dev` printed:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

Then, in the [Convex Dashboard](https://dashboard.convex.dev) → Settings →
Environment Variables, add `BETTER_AUTH_SECRET` (same value as `.env.local`)
and `SITE_URL` (`http://localhost:3010` for local dev).

### 4. Run the dev servers

```bash
# Terminal 1
pnpm vex:dev

# Terminal 2
pnpm dev
```

### 5. Create your admin account

Visit `http://localhost:3010`, click "Create Admin Account", and sign up. The
first user to sign up on a fresh project is automatically promoted to admin —
see `convex/vex/firstUser.ts`. From there, "Go to Admin Panel" opens `/admin`.

<!-- {{OAUTH_SETUP_GUIDE}} -->

## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/         # Public site routes
│   │   ├── (vexcms)/admin/     # Admin panel routes
│   │   └── layout.tsx          # Root layout
│   ├── auth/                   # Auth client + server helpers, access control
│   ├── components/             # React components
│   ├── vexcms/collections/     # Collection definitions
│   ├── vex.config.ts           # VexCMS config
│   └── env.mjs                 # Typed environment variables
├── convex/                     # Convex backend
│   ├── auth/                   # Better Auth config + plugins
│   ├── vex/                    # Bootstrap, media, globals endpoints
│   └── schema.ts               # Database schema
└── .env.local                  # Environment variables (not committed)
```

## Scripts

```bash
pnpm dev              # Start the Next.js dev server
pnpm vex:dev           # Start VexCMS's schema watcher + convex dev
pnpm vex:generate      # Regenerate the Convex schema and types once
pnpm build             # Build for production
pnpm typecheck         # Type check without emitting
pnpm lint              # Lint
pnpm format            # Format with Prettier
pnpm secret:create     # Generate a Better Auth secret
```

## Documentation

- **VexCMS**: [docs.vexcms.dev](https://docs.vexcms.dev)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Better Auth**: [better-auth.com/docs](https://www.better-auth.com/docs)
- **Convex**: [docs.convex.dev](https://docs.convex.dev)

## Deployment

1. `npx convex deploy`
2. In the Convex Dashboard, set `SITE_URL` to your production domain (keep
   `BETTER_AUTH_SECRET` the same, or rotate it and update both places).
3. Deploy the Next.js app (e.g. Vercel) with `NEXT_PUBLIC_CONVEX_URL`,
   `NEXT_PUBLIC_CONVEX_SITE_URL`, `NEXT_PUBLIC_SITE_URL`, and
   `BETTER_AUTH_SECRET` set to their production values.
````

Verify: node scripts/scaffold-smoke.mjs --bare (scaffolds to a tmp dir via the installer with install/git skipped, then asserts the tree, placeholder substitution, and that no `{{...}}` marker survives) — full install/typecheck/build proof lands in Step 7

### Step 4 — Author `templates/marketing-site` overlay [agent]

Ports `.rebuild/reference/create-vexcms-templates/marketing-site` into
`packages/create-vexcms/templates/marketing-site` as the overlay
`templates/base-nextjs` (Step 3) lands on via `overlayTemplate` (plain
`fs.copy(overlayDir, targetDir, { overwrite: true })` — a file-level copy, not
a JSON/AST merge). Every API delta the reference carries from master's older
shape is corrected against the CURRENT `@vexcms/core`: `object()` doesn't
exist (`group()` does), `blocks()` field items get `blockType`/`blockName`/`id`
(never `_key`), globals live in one shared `vex_globals` table read via
`getGlobal`/`upsertGlobal` (never a dedicated `ctx.db.query("site_settings")`),
and `BlockComponentProps` (Contract 1, landing in Step 2) carries only `block`
— no `blockStyles` render prop survives anywhere, independent of the
`admin.blockStyles` config-declaration count. The theme system is copied
verbatim from `apps/test`'s WP-C shape (`themeColors()` factory × `group()`,
not master's 28-field × `tabs()` × `ThemeImportField` shape), and draft/preview
machinery is stripped everywhere since versioning is unshipped.

Relative `#### ` file headings and "Template path" table entries below resolve
under `packages/create-vexcms/templates/marketing-site/`.

- [ ] Collections: `pages` (`title`, `slug` indexed, `blocks` field via
  `blocks({ blocks: pageBlocks, min: 1 })`, `metaTitle`/`metaDescription`
  sidebar fields, `ogImage` as `upload({ to: TABLE_SLUG_MEDIA })` — not
  `imageUrl()`), `headers`, `footers` (both `blocks({ blocks: […], max: 1 })`
  singletons), `themes` (apps/test shape: `group()` light/dark ×
  `themeColors()` factory, incl. `themeColors.ts`); global `siteSettings`
  (`activeTheme`/`adminTheme` relationships to `themes`, plus SEO/social
  fields)
- [ ] 8 colocated blocks `blocks/<Name>/{config.ts,index.tsx}` with deltas:
  `object()` → `group()` (9 call sites across 7 of the 8 blocks — Hero has
  none; see delta table, spec-tasks.md's "×8" undercounts Header's and
  Footer's second array), select `defaultValue` array-wrapped (2 sites:
  Header `actionButtons.variant`, Roadmap `items.status`), `blockStyles`
  stripped (3 config sites: Hero, HowItWorks, Roadmap — each also drops the
  matching `blockStyles` destructure/className in its component, since
  `BlockComponentProps` no longer carries it at all), `IconPickerField` cut at
  its 3 call sites (Features, HowItWorks, Footer `socialLinks`) — the icon
  field becomes plain `text()` holding a lucide name string; each renderer
  keeps its existing `icons[name as keyof typeof icons]` lookup unmodified
- [ ] Roadmap block defaults corrected: "12 Field Types" naming the real list
  (text, url, color, number, checkbox, date, select, relationship, array,
  group, blocks, upload — no richtext/json/tabs), honest shipped/coming-soon/
  planned items consistent with the 2026-08-30-launch-readiness roadmap seed
  section (12 not 11 field types per this step's ground truth; "in progress"
  → "coming-soon" and "exploring" folded into "planned" to match the block's
  own 3-value `statusConfig` renderer, which silently drops any 4th status)
- [ ] Draft/preview machinery stripped: no `_vexDrafts` args, no `/preview`
  routes, no `livePreview` admin config, no `vex_status`/`vex_version` in seed
  data, no `versions: { drafts: true }` on any collection/global
- [ ] `colorConvert.ts` + `culori` dropped entirely (`color()` fields store
  oklch verbatim; `buildThemeCss` from `@vexcms/core` does the CSS-variable
  work); `ThemeInjector.tsx` cut, superseded by `ThemeLive.tsx` (copied
  verbatim from apps/test)
- [ ] `convex/seed.ts` — idempotent `init` `internalMutation` seeding: the 4
  tweakcn palettes from `apps/test/convex/seed.ts`'s `THEME_PRESETS` (name-keyed
  idempotency), `siteSettings` via `upsertGlobal` (`activeTheme` set to the
  seeded "Stark × Ember" id), a main header, a main footer, and a **complete**
  home page assembled from every block's corrected defaults (hero, features,
  how-it-works, roadmap, faq, cta); `created[]`/`skipped[]` return, mirroring
  the reference's idempotency pattern
- [ ] Frontend: `RenderBlocks` from `@vexcms/react` everywhere (`PageContent`,
  `SiteHeader`, `SiteFooter`) — no giant switch; `PageContent` falls back to
  base's `WelcomePage` when no `home` page document exists (Contract 3)
- [ ] Overlay ships **no** `package.json` (fs-extra `overwrite: true` copy
  never touches a file it doesn't carry) — the `motion` dependency and
  `pnpm seed` script both land in `templates/base-nextjs/package.json`
  instead (Step 3, coordinated live via IRC — see below)

**Cross-agent coordination** (resolved, not renegotiated here):

Sent to `Step3Agent` before any code below was written (base package.json is
the only package.json either template gets, per `overlayTemplate`'s
file-level-only copy):

- **Extra third-party dep:** `motion` (npm package `motion`, imported as
  `motion/react` in `motion-primitives/{text-effect,animated-group}.tsx` and
  every block that composes them). Absent from the root `pnpm-workspace.yaml`
  catalog. Latest stable as of 2026-08-31 is `13.1.1` (npmjs.com/package/motion)
  — used as a literal in this step's code, per Contract 5's "absent from
  catalog → latest stable, noting it."
- **Not extra:** `@base-ui/react` and `lucide-react` are already in
  `apps/test/package.json` → already in base's carried-forward deps. `culori`
  is dropped (checkbox above). `next-themes` appears in the reference
  `base-nextjs/package.json` but is never imported anywhere in the reference
  `marketing-site` source — treated as reference cruft, not carried forward.
- **`pnpm seed` script:** `packages/create-vexcms/src/helpers/fileOperations.ts:122`
  — `overlayTemplate` is `fs.copy(overlayDir, targetDir, { overwrite: true })`,
  a plain recursive file copy. Since `marketing-site/package.json` does not
  exist in the overlay tree, the copy never touches base's `package.json` at
  all — a `"seed"` script cannot ride the overlay. Resolution: `"seed": "convex
  run seed:init"` lives unconditionally in `templates/base-nextjs/package.json`
  (a harmless no-op script reference on a bare scaffold that never runs
  `convex run seed:init`).
- **`Accordion`:** FAQ imports `Accordion`/`AccordionItem`/`AccordionTrigger`/
  `AccordionContent` from `@vexcms/react` (`packages/react/src/components/ui/accordion.tsx`
  already wraps `@base-ui/react/accordion` near-identically to the reference's
  colocated copy) — no `ui/accordion.tsx` file in this template at all.
- **Open seam flagged for the lead, not resolved by this step:** `vex.config.ts`
  below (full code) assumes base's collections are named `users`/`media` and
  its auth wiring is `authOptions` from `~/auth/options` — grounded in
  `apps/test/src/vex.config.ts`'s current shape, since Step 3's exact base
  `vex.config.ts` output wasn't final at authoring time. If Step 3 lands
  different names, the stitched spec's Step 4 section needs a one-line
  substitution, not a redesign. Same seam for `~/auth/access.ts` — base-owned,
  outside this step's file list, but `defineAccess`'s `resources` array and
  `permissions.<role>` map must gain `pages`, `headers`, `footers`, `themes`,
  `site_settings` (mirroring the existing `media`/`users` entries) for the
  admin panel to read/write them under RBAC — flagged as a required follow-up
  edit, not performed here since `access.ts` isn't in this step's touched-file
  list (spec-tasks.md's `touches:` frontmatter for this spec doesn't list it
  either).

**File inventory**

```
packages/create-vexcms/templates/marketing-site/
  vex.config.ts                                    (replaces base's)
  src/
    vexcms/
      collections/
        pages.ts  headers.ts  footers.ts  themes.ts  themeColors.ts
      globals/
        siteSettings.ts  index.ts
      blocks/
        config.ts  constants.ts  index.ts
        Hero/{config.ts,index.tsx}       Features/{config.ts,index.tsx}
        HowItWorks/{config.ts,index.tsx} Roadmap/{config.ts,index.tsx}
        CTA/{config.ts,index.tsx}        FAQ/{config.ts,index.tsx}
        Header/{config.ts,index.tsx}     Footer/{config.ts,index.tsx}
    components/
      SiteHeader.tsx  SiteFooter.tsx  ThemeStyle.tsx  ThemeLive.tsx
      motion-primitives/{text-effect.tsx,animated-group.tsx}
    lib/
      metadata.ts
    app/(frontend)/
      layout.tsx  page.tsx  PageContent.tsx  [slug]/page.tsx
  convex/
    pages.ts  headers.ts  footers.ts  siteSettings.ts  theme.ts  seed.ts
```

Cut entirely (present in the reference, no counterpart here):
`src/lib/colorConvert.ts`, `src/components/ThemeInjector.tsx`,
`src/components/admin/{IconPickerField,ThemeImportField,ThemeImport}.tsx`,
`src/components/ui/accordion.tsx` (now `@vexcms/react`'s), `src/db/constants/`
(the overlay's new slugs are additions to base's `db/constants/index.ts`, not
a separate file — see the constants note under Collections below),
`src/app/(frontend)/preview/**`, `src/app/(frontend)/[slug]/PreviewPageContent.tsx`,
`src/app/admin/AdminLayoutWrapper.tsx` (base's, not this template's), no
`package.json` (see coordination note above).

**Collections and globals**

New `db/constants` entries this step needs (additions to base's
`src/db/constants/index.ts` — the overlay does not ship its own copy of that
file; whoever lands this step's edits appends these five lines to base's,
reusing base's existing `TABLE_SLUG_MEDIA`/`TABLE_SLUG_USERS`):

```ts
export const TABLE_SLUG_PAGES = "pages" as const;
export const TABLE_SLUG_HEADERS = "headers" as const;
export const TABLE_SLUG_FOOTERS = "footers" as const;
export const TABLE_SLUG_THEMES = "themes" as const;
export const GLOBAL_SLUG_SITE_SETTINGS = "siteSettings" as const;
```

`GLOBAL_SLUG_SITE_SETTINGS` is `"siteSettings"` (camelCase), matching
`apps/test/src/db/constants/index.ts:67` — **not** the reference's
`"site_settings"` (snake_case); the reference's own `convex/siteSettings.ts`
queries a dedicated `"site_settings"` table directly, which no longer exists
under the current architecture (see the globals note below).

| Source (reference) | Template path | Edits |
|---|---|---|
| `marketing-site/src/vexcms/collections/pages.ts` | `src/vexcms/collections/pages.ts` | Field key `content`→`blocks` (matches `apps/test/src/vexcms/collections/pages.ts:60`'s naming, `interfaceName: "PageBlock"`, `min: 1`); `ogImage: imageUrl(…)` (`pages.ts:51`) → `upload({ to: TABLE_SLUG_MEDIA, label: "OG Image", admin: { position: "sidebar" } })`; drop `admin.livePreview` (`pages.ts:11-13`) and `versions: { drafts: true }` (`pages.ts:63-65`); `slug` field keeps `index: "by_slug"` (`pages.ts:25`) |
| `marketing-site/src/vexcms/collections/headers.ts` | `src/vexcms/collections/headers.ts` | Byte-identical structure; add `index: "by_name"` on the `name` field (needed by `seed.ts`'s idempotency lookup and `convex/headers.ts`'s `getFirst`, absent from the reference at `headers.ts:13-16`) |
| `marketing-site/src/vexcms/collections/footers.ts` | `src/vexcms/collections/footers.ts` | Same one delta: add `index: "by_name"` on `name` |
| `apps/test/src/vexcms/collections/themes.ts` (NOT the reference — see Constraints) | `src/vexcms/collections/themes.ts` | Verbatim copy, zero deltas — already uses `group()` + `themeColors()`, already current-API |
| `apps/test/src/vexcms/collections/themeColors.ts` | `src/vexcms/collections/themeColors.ts` | Verbatim copy, zero deltas |

**`siteSettings` global** — new synthesis (apps/test's `activeTheme`/`adminTheme`
dual-relationship, required by the theme system per Contract 4, merged with
the reference's SEO/social fields, which already correctly used `upload()`
rather than `imageUrl()` for `favicon`/`ogImage` — only `pages.ogImage` needed
that particular fix):

#### src/vexcms/globals/siteSettings.ts

```ts
import { defineGlobal, relationship, text, upload } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_THEMES } from "~/db/constants"

/**
 * Site-wide settings — a singleton `vex_globals` row, not a collection.
 *
 * `activeTheme` is what makes the `themes` collection do something: the root
 * layout follows it. `adminTheme` is optional — leaving it unset (the
 * default) means the admin panel wears the site's theme, matching
 * `apps/test/convex/theme.ts`'s `getAdmin` fallback.
 */
export const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  admin: {
    icon: "Settings",
    description: "Site name, SEO defaults, and the themes applied to the site and the admin panel.",
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
      description: "Used as fallback for logo text, page titles, and meta tags.",
    }),
    description: text({
      label: "Site Description",
    }),
    activeTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Active Theme",
      description: "The theme applied to the public site.",
    }),
    adminTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Admin Theme",
      description: "Optional. Leave empty and the admin panel uses the Active Theme.",
    }),
    favicon: upload({
      to: TABLE_SLUG_MEDIA,
      label: "Favicon",
      admin: { description: "Site favicon image" },
    }),
    metaTitle: text({
      label: "Meta Title",
      admin: { description: "Default <title> tag for the site", position: "sidebar" },
    }),
    metaDescription: text({
      label: "Meta Description",
      admin: { description: "Default meta description for SEO", position: "sidebar" },
    }),
    ogImage: upload({
      to: TABLE_SLUG_MEDIA,
      label: "OG Image",
      admin: { description: "Default Open Graph image for social sharing", position: "sidebar" },
    }),
    twitterHandle: text({
      label: "Twitter Handle",
      admin: { description: "@handle for Twitter cards", position: "sidebar" },
    }),
    googleAnalyticsId: text({
      label: "Google Analytics ID",
      admin: { description: "GA4 measurement ID (G-XXXXXXXXXX)", position: "sidebar" },
    }),
  },
})
```

#### src/vexcms/globals/index.ts

```ts
export * from "./siteSettings"
```

#### vex.config.ts

```ts
import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { access } from "~/auth/access"
import { authOptions } from "~/auth/options"
import { footers, headers, media, pages, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

/**
 * VexCMS configuration for the marketing site.
 *
 * Replaces `templates/base-nextjs`'s bare config wholesale (overlay copy is
 * file-level, not a merge): carries base's `users`/`media` forward unchanged
 * and adds the four marketing collections plus `siteSettings`. `vex dev`/
 * `vex generate` consume this to produce the Convex schema and TypeScript
 * types.
 */
const vexConfig = defineConfig({
  access,
  admin: {
    sidebar: {
      side: "right",
    },
  },
  authAdapter: betterAuthAdapter({ config: authOptions }),
  storage: {
    adapters: [convexFileStorage({ mediaCollections: [media] })],
  },
  collections: [users, media, pages, headers, footers, themes],
  globals: [siteSettings],
})

export default vexConfig
```

**Blocks registry**

#### src/vexcms/blocks/constants.ts

```ts
export const BLOCK_SLUG_HERO = "hero" as const
export const BLOCK_SLUG_FEATURES = "features" as const
export const BLOCK_SLUG_HOW_IT_WORKS = "how_it_works" as const
export const BLOCK_SLUG_ROADMAP = "roadmap" as const
export const BLOCK_SLUG_CTA = "cta" as const
export const BLOCK_SLUG_FAQ = "faq" as const
export const BLOCK_SLUG_HEADER = "header" as const
export const BLOCK_SLUG_FOOTER = "footer" as const
```

#### src/vexcms/blocks/config.ts

```ts
// Block configs only — no React/motion dependencies. Safe to import from
// collections, vex.config.ts, and convex/seed.ts.
import { heroBlock } from "./Hero/config"
import { featuresBlock } from "./Features/config"
import { howItWorksBlock } from "./HowItWorks/config"
import { roadmapBlock } from "./Roadmap/config"
import { ctaBlock } from "./CTA/config"
import { faqBlock } from "./FAQ/config"
import { headerBlock } from "./Header/config"
import { footerBlock } from "./Footer/config"

export const pageBlocks = [heroBlock, featuresBlock, howItWorksBlock, roadmapBlock, ctaBlock, faqBlock]
export const headerBlocks = [headerBlock]
export const footerBlocks = [footerBlock]

export {
  heroBlock,
  featuresBlock,
  howItWorksBlock,
  roadmapBlock,
  ctaBlock,
  faqBlock,
  headerBlock,
  footerBlock,
}
```

#### src/vexcms/blocks/index.ts

```ts
import type { BlockComponentProps } from "@vexcms/react"
import type { ComponentType } from "react"

import {
  BLOCK_SLUG_CTA,
  BLOCK_SLUG_FAQ,
  BLOCK_SLUG_FEATURES,
  BLOCK_SLUG_FOOTER,
  BLOCK_SLUG_HEADER,
  BLOCK_SLUG_HERO,
  BLOCK_SLUG_HOW_IT_WORKS,
  BLOCK_SLUG_ROADMAP,
} from "./constants"
import CTABlock from "./CTA"
import FAQBlock from "./FAQ"
import FeaturesBlock from "./Features"
import FooterBlock from "./Footer"
import HeaderBlock from "./Header"
import HeroBlock from "./Hero"
import HowItWorksBlock from "./HowItWorks"
import RoadmapBlock from "./Roadmap"

/**
 * Block component map for `RenderBlocks` (Contract 1). Loosely typed as
 * `Record<string, …>` rather than a `TBlock`-keyed `BlockComponents<…>` —
 * the real per-slug `PageBlock` union only exists after `vex generate` runs
 * against this config, so this file can't reference it.
 */
export const blockComponents: Record<string, ComponentType<BlockComponentProps>> = {
  [BLOCK_SLUG_CTA]: CTABlock,
  [BLOCK_SLUG_FAQ]: FAQBlock,
  [BLOCK_SLUG_FEATURES]: FeaturesBlock,
  [BLOCK_SLUG_FOOTER]: FooterBlock,
  [BLOCK_SLUG_HEADER]: HeaderBlock,
  [BLOCK_SLUG_HERO]: HeroBlock,
  [BLOCK_SLUG_HOW_IT_WORKS]: HowItWorksBlock,
  [BLOCK_SLUG_ROADMAP]: RoadmapBlock,
}

export { footerBlocks, headerBlocks, pageBlocks } from "./config"
```

(No combined `allBlocks` export — the reference's was unused outside its own
file; nothing here needs a header+footer+page union.)

#### src/vexcms/blocks/Hero/config.ts

```ts
import { defineBlock, text } from "@vexcms/core"

import { BLOCK_SLUG_HERO } from "../constants"

export const heroBlock = defineBlock({
  slug: BLOCK_SLUG_HERO,
  label: "Hero Section",
  fields: {
    badgeText: text({
      label: "Badge Text",
      defaultValue: "Now in public beta",
      admin: { description: "Small text shown in the announcement badge" },
    }),
    badgeLink: text({
      label: "Badge Link",
      defaultValue: "/docs",
      admin: { description: "URL the badge links to" },
    }),
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "The CMS built for Convex",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "Vex CMS gives you a full-featured content management system powered by Convex — real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
    }),
    primaryCtaLabel: text({
      label: "Primary CTA Label",
      required: true,
      defaultValue: "Get Started",
    }),
    primaryCtaHref: text({
      label: "Primary CTA Link",
      required: true,
      defaultValue: "/docs",
    }),
    secondaryCtaLabel: text({
      label: "Secondary CTA Label",
      defaultValue: "View on GitHub",
    }),
    secondaryCtaHref: text({
      label: "Secondary CTA Link",
      defaultValue: "https://github.com/vexcms/vex",
    }),
  },
  admin: {
    icon: "sparkles",
  },
})
```

#### src/vexcms/blocks/Hero/index.tsx

```tsx
"use client"

import type { BlockComponentProps } from "@vexcms/react"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { buttonVariants, cn } from "@vexcms/react"

import { AnimatedGroup } from "~/components/motion-primitives/animated-group"
import { TextEffect } from "~/components/motion-primitives/text-effect"

export { heroBlock } from "./config"

const transitionVariants = {
  item: {
    hidden: {
      filter: "blur(12px)",
      opacity: 0,
      y: 12,
    },
    visible: {
      filter: "blur(0px)",
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
      y: 0,
    },
  },
}

export default function HeroBlock({ block }: BlockComponentProps) {
  const {
    badgeText,
    badgeLink,
    heading,
    subheading,
    primaryCtaLabel,
    primaryCtaHref,
    secondaryCtaLabel,
    secondaryCtaHref,
  } = block as Record<string, string>

  return (
    <div className="overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
      >
        <div className="absolute top-0 left-0 h-320 w-140 -translate-y-87.5 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="absolute top-0 left-0 h-320 w-60 [translate:5%_-50%] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        <div className="absolute top-0 left-0 h-320 w-60 -translate-y-87.5 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>
      <section>
        <div className="relative min-h-[90vh] flex flex-col items-center justify-center">
          <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]" />
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center sm:mx-auto lg:mr-auto">
              {badgeText && badgeLink && (
                <AnimatedGroup
                  // @ts-expect-error motion-primitives Variants type is stricter than the local transitionVariants shape
                  variants={transitionVariants}
                >
                  <Link
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                    href={badgeLink}
                  >
                    <span className="text-foreground text-sm">{badgeText}</span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700" />
                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedGroup>
              )}

              <TextEffect
                as="h1"
                className="mt-8 text-6xl text-balance md:text-7xl lg:mt-16 xl:text-[5.25rem]"
                preset="fade-in-blur"
                speedSegment={0.3}
              >
                {heading ?? ""}
              </TextEffect>
              <TextEffect
                as="p"
                className="mx-auto mt-8 max-w-2xl text-lg text-balance text-muted-foreground"
                delay={0.5}
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
              >
                {subheading ?? ""}
              </TextEffect>

              <AnimatedGroup
                className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                // @ts-expect-error motion-primitives Variants type is stricter than the local transitionVariants shape
                variants={{
                  container: {
                    visible: {
                      transition: {
                        delayChildren: 0.75,
                        staggerChildren: 0.05,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
              >
                <div className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
                  <Link
                    href={primaryCtaHref ?? "/"}
                    className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-5 text-base")}
                  >
                    <span className="text-nowrap">{primaryCtaLabel}</span>
                  </Link>
                </div>
                {secondaryCtaLabel && (
                  <Link
                    href={secondaryCtaHref ?? "/"}
                    className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-10.5 rounded-xl px-5")}
                  >
                    <span className="text-nowrap">{secondaryCtaLabel}</span>
                  </Link>
                )}
              </AnimatedGroup>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

`cn` and `buttonVariants` import from `@vexcms/react` directly (apps/test never
colocates a `~/components/ui/*` re-export layer — confirmed by
`apps/test/src/app/layout.tsx:5` and three other apps/test call sites all
importing straight from `@vexcms/react`).

#### src/vexcms/blocks/Roadmap/config.ts

```ts
import { array, defineBlock, group, select, text } from "@vexcms/core"

import { BLOCK_SLUG_ROADMAP } from "../constants"

export const roadmapBlock = defineBlock({
  slug: BLOCK_SLUG_ROADMAP,
  label: "Roadmap",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Roadmap",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
    }),
    items: array({
      label: "Roadmap Items",
      required: true,
      items: group({
        fields: {
          feature: text({ label: "Feature Name", required: true }),
          description: text({ label: "Description" }),
          status: select({
            label: "Status",
            required: true,
            options: [
              { label: "Shipped", value: "shipped" },
              { label: "Coming Soon", value: "coming-soon" },
              { label: "Planned", value: "planned" },
            ],
            defaultValue: ["shipped"],
          }),
        },
      }),
      defaultValue: [
        {
          feature: "12 Field Types",
          description:
            "text, url, color, number, checkbox, date, select, relationship, array, group, blocks, and upload — no richtext, json, or tabs yet.",
          status: "shipped",
        },
        {
          feature: "Convex Schema Codegen",
          description:
            "vex dev / vex generate write your Convex schema, TypeScript types, and Zod validators from defineCollection() — no hand-written schema.ts.",
          status: "shipped",
        },
        {
          feature: "Real-Time Admin Panel",
          description:
            "DataTable with pagination, live totalDocs, and bulk operations — every list view is a Convex subscription.",
          status: "shipped",
        },
        {
          feature: "Media Library",
          description:
            "Convex file storage adapter with a searchable, paginated media picker built into every upload field.",
          status: "shipped",
        },
        {
          feature: "RBAC & Access Control",
          description:
            "Document-level access rules, indexed constraints that compile to withIndex ranges, per-call access.action/bypass overrides, and an anonRole fallback for public reads.",
          status: "shipped",
        },
        {
          feature: "Custom Theme System",
          description:
            "Database-driven themes with light/dark mode, 32 shadcn tokens per mode, and OKLCH color support — live-updates with zero page reload.",
          status: "shipped",
        },
        {
          feature: "Better Auth Integration",
          description:
            "Email/password and OAuth out of the box, with organizations and API keys as opt-in plugins.",
          status: "shipped",
        },
        {
          feature: "CLI & Scaffolder",
          description:
            "vex dev, vex generate, and create-vexcms for instant project setup — bare or full marketing-site templates.",
          status: "shipped",
        },
        {
          feature: "Versioning & Drafts",
          description: "Draft/publish workflow with live preview — in active development.",
          status: "coming-soon",
        },
        {
          feature: "Richtext, JSON, Email & Textarea Fields",
          description: "Plate.js-powered rich text, plus structured JSON, email, and multi-line text inputs.",
          status: "planned",
        },
        {
          feature: "Form Builder & Lifecycle Hooks",
          description:
            "Composable form fields beyond content editing, plus beforeChange/afterChange hooks for custom side effects.",
          status: "planned",
        },
        {
          feature: "Team Management & API Keys",
          description: "Invite users, assign roles, and issue scoped read-only API tokens for external integrations.",
          status: "planned",
        },
      ],
    }),
  },
  admin: {
    icon: "map",
  },
})
```

#### src/vexcms/blocks/Roadmap/index.tsx

```tsx
"use client"

import type { BlockComponentProps } from "@vexcms/react"

import { Check, Clock, Compass } from "lucide-react"
import { cn } from "@vexcms/react"

export { roadmapBlock } from "./config"

const statusConfig = {
  shipped: {
    label: "Shipped",
    icon: Check,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  "coming-soon": {
    label: "Coming Soon",
    icon: Clock,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  planned: {
    label: "Planned",
    icon: Compass,
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  },
} as const

type RoadmapItem = { feature: string; description?: string; status: "shipped" | "coming-soon" | "planned" }
type StatusKey = keyof typeof statusConfig

const statusOrder: StatusKey[] = ["shipped", "coming-soon", "planned"]

export default function RoadmapBlock({ block }: BlockComponentProps) {
  const { heading, subheading, items } = block as unknown as {
    heading: string
    subheading?: string
    items?: RoadmapItem[]
  }

  const grouped = statusOrder
    .map((status) => ({
      status,
      config: statusConfig[status],
      items: (items ?? []).filter((item) => item.status === status && item.status in statusConfig),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <section className={cn("py-16 md:py-32")}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-semibold text-balance lg:text-5xl">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-4 text-balance">{subheading}</p>}
        </div>

        {grouped.map((group, groupIndex) => {
          const StatusIcon = group.config.icon
          return (
            <div key={group.status} className={groupIndex === 0 ? "mt-16" : "mt-12"}>
              <div className="flex items-center gap-2">
                <StatusIcon className="size-5" />
                <h3 className="text-lg font-semibold">{group.config.label}</h3>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item, itemIndex) => {
                  const BadgeIcon = group.config.icon
                  return (
                    <div key={itemIndex} className="bg-card rounded-xl border p-5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium">{item.feature}</span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            group.config.badgeClass
                          )}
                        >
                          <BadgeIcon className="size-3" />
                          {group.config.label}
                        </span>
                      </div>
                      {item.description && <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

**Remaining 6 blocks** — delta tables (config.ts + index.tsx, both files touched per row):

| Block | Config deltas (cite: reference file:line) | Component deltas |
|---|---|---|
| **Features** | `import { array, defineBlock, object, text } from "@vexcms/core"` (`Features/config.ts:1`) → drop `object`, add `group`; `import IconPickerField from "~/components/admin/IconPickerField"` (`:3`) → delete; `items: object({…})` at `:23` → `items: group({…})`; the `icon` field's `admin: { components: { Field: IconPickerField } }` (`:29-32`) → delete the `admin` block entirely, field becomes bare `icon: text({ label: "Icon", description: "Lucide icon name" })` | `import type { BlockComponentProps } from "@vexcms/ui"` (`Features/index.tsx:1`) → `"@vexcms/react"`; `import { Card, CardContent, CardHeader } from "~/components/ui/card"` (`:6`) → `from "@vexcms/react"`. No `blockStyles` usage present (already `{ block }`-only at `:37`) |
| **HowItWorks** | Same three edits as Features (`object`→`group` at `:23`, `IconPickerField` import+usage cut at `:3` and `:28-30`), plus `admin: { icon: "list-ordered", blockStyles: ["container", "text"] }` (`:65-66`) → drop `blockStyles` line | `import type … from "@vexcms/ui"` → `"@vexcms/react"` (`:3`); `import { cn } from "~/lib/utils"` stays (base-provided `cn`, unrelated to the UI-primitives move); drop `blockStyles` from the destructure (`:17-20`) and the `cn("py-16 md:py-32", blockStyles)` call (`:28`) → `"py-16 md:py-32"` |
| **CTA** | `object`→`group` at `:21` (only site, no IconPickerField, no blockStyles) | `"@vexcms/ui"`→`"@vexcms/react"` (`:1`); `import { buttonVariants } from "~/components/ui/button"` (`:6`) → `from "@vexcms/react"` (keep `cn` from `~/lib/utils`, base-provided) |
| **FAQ** | `object`→`group` at `:27` (only site) | `"@vexcms/ui"`→`"@vexcms/react"` (`:1`); `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "~/components/ui/accordion"` (`:5-10`) → `from "@vexcms/react"` — no colocated `ui/accordion.tsx` in this template |
| **Header** | `object`→`group` at 2 sites: `menuItems.items` (`:26`), `actionButtons.items` (`:41`); `actionButtons.items.fields.variant` `select({…, defaultValue: "default" })` (`:52`) → `defaultValue: ["default"]` | `"@vexcms/ui"`→`"@vexcms/react"` (`:3`); `import { buttonVariants } from "~/components/ui/button"` (`:11`) → `from "@vexcms/react"`; `useSession` from `~/auth/client` (`:9`) stays — base-owned auth hook, unchanged; no `blockStyles` in this component |
| **Footer** | `object`→`group` at 2 sites: `links.items` (`:25`), `socialLinks.items` (`:43`); `socialLinks.items.fields.icon`'s `IconPickerField` (`:47-53`) → bare `text()`, same treatment as Features/HowItWorks | `"@vexcms/ui"`→`"@vexcms/react"` (`:1`); no other component-level imports to move (uses only `next/link`, `lucide-react`'s `icons` map — both unchanged) |

**Theme wiring, motion primitives, and remaining frontend files** — translation table:

| Source | Template path | Edits |
|---|---|---|
| `apps/test/src/components/ThemeStyle.tsx` | `src/components/ThemeStyle.tsx` | Verbatim copy, zero deltas |
| `apps/test/src/components/ThemeLive.tsx` | `src/components/ThemeLive.tsx` | Verbatim copy, zero deltas |
| `apps/test/convex/theme.ts` | `convex/theme.ts` | Verbatim copy, zero deltas (already `getGlobal`-based, already current-API) |
| `marketing-site/src/components/motion-primitives/text-effect.tsx` | `src/components/motion-primitives/text-effect.tsx` | Verbatim copy, zero deltas — imports `motion/react` (new base dep, see coordination note) and `~/lib/utils`'s `cn` (base-provided) |
| `marketing-site/src/components/motion-primitives/animated-group.tsx` | `src/components/motion-primitives/animated-group.tsx` | Verbatim copy, zero deltas |
| `marketing-site/src/components/SiteHeader.tsx` | `src/components/SiteHeader.tsx` | `import { RenderBlocks } from "@vexcms/ui"` (`:3`) → `from "@vexcms/react"`; `anyApi.headers.getFirst` (`:16`) now resolves against the `getFirst` query defined below (unchanged call site) |
| `marketing-site/src/components/SiteFooter.tsx` | `src/components/SiteFooter.tsx` | Same single import-source edit, `anyApi.footers.getFirst` |
| `marketing-site/src/lib/metadata.ts` | `src/lib/metadata.ts` | `fetchQuery(api.siteSettings.get)` (`:21`) unchanged — same query name, now backed by `getGlobal` instead of a dedicated table; ogImage-id → URL resolution (`:33-46`, elided in this step's reads) and the rest of the file carry over as-is; no drafts-related args anywhere in this file to strip |
| `marketing-site/src/app/(frontend)/layout.tsx` | `src/app/(frontend)/layout.tsx` | Unchanged — already imports `SiteFooter`/`SiteHeader`/`ThemeStyle` by relative-to-`~` paths that resolve correctly once those files exist at the paths above |
| `marketing-site/src/app/(frontend)/page.tsx` | `src/app/(frontend)/page.tsx` | `fetchQuery(api.pages.getBySlug, { slug: "home", _vexDrafts: false })` (`:15-18`) → drop `_vexDrafts: false` (the `getBySlug` below takes only `{ slug }`) |
| `marketing-site/src/app/(frontend)/[slug]/page.tsx` | `src/app/(frontend)/[slug]/page.tsx` | Same `_vexDrafts` drop; `normalizeSlug(slug)` (`:5,10,15`) → inlined `slug && slug.length > 0 ? slug : "home"` (the reference imports `normalizeSlug` from a `~/lib/utils` that doesn't exist anywhere in the reference tree — unresolvable without either inventing an implementation or risking a `lib/utils.ts` overwrite that could drop base's `cn` export; inlining sidesteps both) |

#### src/app/(frontend)/PageContent.tsx

```tsx
"use client"

import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { RenderBlocks } from "@vexcms/react"

import { WelcomePage } from "~/components/WelcomePage"
import { blockComponents } from "~/vexcms/blocks"

type PageBlockLike = { id: string; blockType: string } & Record<string, unknown>

export interface PageContentProps {
  /** URL slug to render. Omit (or empty) for the home page. */
  slug?: string
  /** Server-fetched `pages.getBySlug` result, hydrated as the query's initial data. */
  initialData?: Record<string, unknown>[]
}

/**
 * Renders one marketing page's blocks via `RenderBlocks` (Contract 1), or
 * falls back to base's bootstrap `WelcomePage` when no `home` page document
 * exists yet — a fresh scaffold before `pnpm seed` has run (Contract 3).
 *
 * `pages.getBySlug` always returns an array (empty when no match — the same
 * shape every collection query returns), so this always reads `pages?.[0]`.
 */
export function PageContent({ slug, initialData }: PageContentProps) {
  const normalizedSlug = slug && slug.length > 0 ? slug : "home"

  const { data: pages, isPending } = useQuery({
    ...convexQuery(anyApi.pages.getBySlug, { slug: normalizedSlug }),
    initialData,
  })

  const page = pages?.[0]

  if (isPending && initialData === undefined) {
    return null
  }

  if (!page) {
    return <WelcomePage />
  }

  return (
    <RenderBlocks
      blocks={page.blocks as PageBlockLike[] | null | undefined}
      components={blockComponents}
    />
  )
}
```

`page.blocks` is cast at the `RenderBlocks` call site rather than typed on
`page` itself — TypeScript doesn't know the real `PageBlock` union until
`vex generate` runs against this template's `vex.config.ts`; that's expected
pre-generation template-authoring widening, not something to work around here.

**Convex functions**

#### convex/pages.ts

```ts
import { v } from "convex/values"

import { TABLE_SLUG_PAGES } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the page document matching the given slug, or an empty array if
 * none exists. Byte-identical in shape to `apps/test/convex/pages.ts:57-77`'s
 * `getBySlug` (same collection-level `find` + `withIndex` + `access.bypass`
 * pattern) with only the collection constant swapped.
 *
 * Access is bypassed: rendered by `[slug]/page.tsx` and `page.tsx` for
 * anonymous visitors, who have no roles and would otherwise be filtered out.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: { bypass: true },
    })
  },
})
```

#### convex/headers.ts

```ts
import { TABLE_SLUG_HEADERS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * The site header — `headers` has one document in practice (seeded as "Main
 * Header"); this returns the first one found, or `null`.
 *
 * Access is bypassed: the header renders on every public route before any
 * session exists.
 */
export const getFirst = query({
  args: {},
  handler: async (ctx) => {
    const [header] = await find({
      ctx,
      collection: TABLE_SLUG_HEADERS,
      limit: 1,
      access: { bypass: true },
    })
    return header ?? null
  },
})
```

#### convex/footers.ts

```ts
import { TABLE_SLUG_FOOTERS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/** Same shape as `convex/headers.ts`'s `getFirst`, for `footers`. */
export const getFirst = query({
  args: {},
  handler: async (ctx) => {
    const [footer] = await find({
      ctx,
      collection: TABLE_SLUG_FOOTERS,
      limit: 1,
      access: { bypass: true },
    })
    return footer ?? null
  },
})
```

#### convex/siteSettings.ts

```ts
import { getGlobal } from "@vexcms/core/server"

import { GLOBAL_SLUG_SITE_SETTINGS } from "~/db/constants"
import config from "~/vex.config"

import { query } from "./_generated/server"

/**
 * Public site settings — name, description, SEO defaults, and the theme
 * references. `siteSettings` lives in the shared `vex_globals` table, so
 * this reads through `getGlobal` rather than a dedicated table (unlike the
 * reference's `ctx.db.query("site_settings")`, which assumes a table that
 * doesn't exist under the current architecture).
 *
 * Access is bypassed: read by `src/lib/metadata.ts` and the root layout for
 * anonymous visitors before any session exists.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await getGlobal({
      ctx,
      config,
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      access: { bypass: true },
    })
  },
})
```

#### convex/seed.ts

```ts
import { getGlobal, upsertGlobal } from "@vexcms/core/server"

import {
  GLOBAL_SLUG_SITE_SETTINGS,
  TABLE_SLUG_FOOTERS,
  TABLE_SLUG_HEADERS,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_THEMES,
} from "~/db/constants"
import config from "~/vex.config"

import { internalMutation } from "./_generated/server"

/**
 * The 4 tweakcn theme presets, lifted verbatim from
 * `apps/test/convex/seed.ts`'s `THEME_PRESETS` (32-token light/dark palettes
 * matching `themeColors.ts`'s `ThemeColorTokenKey` set).
 */
const THEME_PRESETS = [
  {
    name: "Stark × Ember",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "4px",
    light: {
      background: "oklch(96.1% 0 0)",
      foreground: "oklch(13.7% 0 0)",
      card: "oklch(100% 0 0)",
      cardForeground: "oklch(13.7% 0 0)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(13.7% 0 0)",
      primary: "oklch(60.5% 0.175 42)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(98% 0 0)",
      secondaryForeground: "oklch(13.7% 0 0)",
      muted: "oklch(98% 0 0)",
      mutedForeground: "oklch(50.5% 0 0)",
      accent: "oklch(96% 0.025 42)",
      accentForeground: "oklch(52% 0.180 40)",
      destructive: "oklch(57.7% 0.198 27)",
      destructiveForeground: "oklch(98% 0 0)",
      border: "oklch(85% 0 0)",
      input: "oklch(54.6% 0 0)",
      ring: "oklch(60.5% 0.175 42)",
      chart1: "oklch(60.5% 0.175 42)",
      chart2: "oklch(45% 0 0)",
      chart3: "oklch(72% 0.100 60)",
      chart4: "oklch(60% 0.040 30)",
      chart5: "oklch(78% 0 0)",
      sidebar: "oklch(98% 0 0)",
      sidebarForeground: "oklch(13.7% 0 0)",
      sidebarPrimary: "oklch(60.5% 0.175 42)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(96.1% 0 0)",
      sidebarAccentForeground: "oklch(13.7% 0 0)",
      sidebarBorder: "oklch(85% 0 0)",
      sidebarRing: "oklch(60.5% 0.175 42)",
    },
    dark: {
      background: "oklch(13.7% 0 0)",
      foreground: "oklch(95% 0 0)",
      card: "oklch(17.4% 0 0)",
      cardForeground: "oklch(95% 0 0)",
      popover: "oklch(17.4% 0 0)",
      popoverForeground: "oklch(95% 0 0)",
      primary: "oklch(72% 0.175 50)",
      primaryForeground: "oklch(13.7% 0 0)",
      secondary: "oklch(20% 0 0)",
      secondaryForeground: "oklch(95% 0 0)",
      muted: "oklch(20% 0 0)",
      mutedForeground: "oklch(70% 0 0)",
      accent: "oklch(72% 0.175 50 / 0.12)",
      accentForeground: "oklch(72% 0.175 50)",
      destructive: "oklch(63% 0.210 27)",
      destructiveForeground: "oklch(95% 0 0)",
      border: "oklch(25% 0 0)",
      input: "oklch(40% 0 0)",
      ring: "oklch(72% 0.175 50)",
      chart1: "oklch(72% 0.175 50)",
      chart2: "oklch(78% 0 0)",
      chart3: "oklch(78% 0.120 65)",
      chart4: "oklch(60% 0.060 30)",
      chart5: "oklch(45% 0 0)",
      sidebar: "oklch(7% 0 0)",
      sidebarForeground: "oklch(95% 0 0)",
      sidebarPrimary: "oklch(72% 0.175 50)",
      sidebarPrimaryForeground: "oklch(13.7% 0 0)",
      sidebarAccent: "oklch(20% 0 0)",
      sidebarAccentForeground: "oklch(95% 0 0)",
      sidebarBorder: "oklch(25% 0 0)",
      sidebarRing: "oklch(72% 0.175 50)",
    },
  },
  {
    name: "Modern Minimal",
    fontFamily: "Inter, sans-serif",
    radius: "0.375rem",
    light: {
      background: "oklch(100% 0 0)",
      foreground: "oklch(32.11% 0 0)",
      card: "oklch(100% 0 0)",
      cardForeground: "oklch(32.11% 0 0)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(32.11% 0 0)",
      primary: "oklch(62.31% 0.18801 259.81)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(96.7% 0.00287 264.54)",
      secondaryForeground: "oklch(44.61% 0.02631 256.8)",
      muted: "oklch(98.46% 0.00171 247.84)",
      mutedForeground: "oklch(55.1% 0.02336 264.36)",
      accent: "oklch(95.14% 0.02503 236.82)",
      accentForeground: "oklch(37.91% 0.13776 265.52)",
      destructive: "oklch(63.68% 0.20785 25.33)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(92.76% 0.00581 264.53)",
      input: "oklch(92.76% 0.00581 264.53)",
      ring: "oklch(62.31% 0.18801 259.81)",
      chart1: "oklch(62.31% 0.18801 259.81)",
      chart2: "oklch(54.61% 0.21521 262.88)",
      chart3: "oklch(48.82% 0.21717 264.38)",
      chart4: "oklch(42.44% 0.18087 265.64)",
      chart5: "oklch(37.91% 0.13776 265.52)",
      sidebar: "oklch(98.46% 0.00171 247.84)",
      sidebarForeground: "oklch(32.11% 0 0)",
      sidebarPrimary: "oklch(62.31% 0.18801 259.81)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(95.14% 0.02503 236.82)",
      sidebarAccentForeground: "oklch(37.91% 0.13776 265.52)",
      sidebarBorder: "oklch(92.76% 0.00581 264.53)",
      sidebarRing: "oklch(62.31% 0.18801 259.81)",
    },
    dark: {
      background: "oklch(20.46% 0 0)",
      foreground: "oklch(92.19% 0 0)",
      card: "oklch(26.86% 0 0)",
      cardForeground: "oklch(92.19% 0 0)",
      popover: "oklch(26.86% 0 0)",
      popoverForeground: "oklch(92.19% 0 0)",
      primary: "oklch(62.31% 0.18801 259.81)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(26.86% 0 0)",
      secondaryForeground: "oklch(92.19% 0 0)",
      muted: "oklch(23.93% 0 0)",
      mutedForeground: "oklch(71.55% 0 0)",
      accent: "oklch(37.91% 0.13776 265.52)",
      accentForeground: "oklch(88.23% 0.05706 254.13)",
      destructive: "oklch(63.68% 0.20785 25.33)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(37.15% 0 0)",
      input: "oklch(37.15% 0 0)",
      ring: "oklch(62.31% 0.18801 259.81)",
      chart1: "oklch(71.37% 0.14338 254.62)",
      chart2: "oklch(62.31% 0.18801 259.81)",
      chart3: "oklch(54.61% 0.21521 262.88)",
      chart4: "oklch(48.82% 0.21717 264.38)",
      chart5: "oklch(42.44% 0.18087 265.64)",
      sidebar: "oklch(20.46% 0 0)",
      sidebarForeground: "oklch(92.19% 0 0)",
      sidebarPrimary: "oklch(62.31% 0.18801 259.81)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(37.91% 0.13776 265.52)",
      sidebarAccentForeground: "oklch(88.23% 0.05706 254.13)",
      sidebarBorder: "oklch(37.15% 0 0)",
      sidebarRing: "oklch(62.31% 0.18801 259.81)",
    },
  },
  {
    name: "Violet Bloom",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    radius: "1.4rem",
    light: {
      background: "oklch(99.4% 0 0)",
      foreground: "oklch(0% 0 0)",
      card: "oklch(99.4% 0 0)",
      cardForeground: "oklch(0% 0 0)",
      popover: "oklch(99.11% 0 0)",
      popoverForeground: "oklch(0% 0 0)",
      primary: "oklch(53.93% 0.27129 286.75)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(95.4% 0.00626 255.48)",
      secondaryForeground: "oklch(13.44% 0 0)",
      muted: "oklch(97.02% 0 0)",
      mutedForeground: "oklch(43.86% 0 0)",
      accent: "oklch(93.93% 0.02876 266.37)",
      accentForeground: "oklch(54.45% 0.19034 259.48)",
      destructive: "oklch(62.9% 0.19024 23.07)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(93% 0.00939 286.22)",
      input: "oklch(94.01% 0 0)",
      ring: "oklch(0% 0 0)",
      chart1: "oklch(74.59% 0.14834 156.45)",
      chart2: "oklch(53.93% 0.27129 286.75)",
      chart3: "oklch(73.36% 0.17578 50.55)",
      chart4: "oklch(58.28% 0.18094 259.73)",
      chart5: "oklch(55.9% 0 0)",
      sidebar: "oklch(97.77% 0.00513 247.88)",
      sidebarForeground: "oklch(0% 0 0)",
      sidebarPrimary: "oklch(0% 0 0)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(94.01% 0 0)",
      sidebarAccentForeground: "oklch(0% 0 0)",
      sidebarBorder: "oklch(94.01% 0 0)",
      sidebarRing: "oklch(0% 0 0)",
    },
    dark: {
      background: "oklch(22.23% 0.00601 271.14)",
      foreground: "oklch(95.51% 0 0)",
      card: "oklch(25.68% 0.00762 274.65)",
      cardForeground: "oklch(95.51% 0 0)",
      popover: "oklch(25.68% 0.00762 274.65)",
      popoverForeground: "oklch(95.51% 0 0)",
      primary: "oklch(61.32% 0.22941 291.74)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(29.4% 0.01301 272.93)",
      secondaryForeground: "oklch(95.51% 0 0)",
      muted: "oklch(29.4% 0.01301 272.93)",
      mutedForeground: "oklch(70.58% 0 0)",
      accent: "oklch(27.95% 0.03685 260.03)",
      accentForeground: "oklch(78.57% 0.11535 246.66)",
      destructive: "oklch(71.06% 0.16615 22.22)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(32.89% 0.00922 268.38)",
      input: "oklch(32.89% 0.00922 268.38)",
      ring: "oklch(61.32% 0.22941 291.74)",
      chart1: "oklch(80.03% 0.18206 151.71)",
      chart2: "oklch(61.32% 0.22941 291.74)",
      chart3: "oklch(80.77% 0.10349 19.57)",
      chart4: "oklch(66.91% 0.15686 260.11)",
      chart5: "oklch(70.58% 0 0)",
      sidebar: "oklch(20.11% 0.00394 286.04)",
      sidebarForeground: "oklch(95.51% 0 0)",
      sidebarPrimary: "oklch(61.32% 0.22941 291.74)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(29.4% 0.01301 272.93)",
      sidebarAccentForeground: "oklch(61.32% 0.22941 291.74)",
      sidebarBorder: "oklch(32.89% 0.00922 268.38)",
      sidebarRing: "oklch(61.32% 0.22941 291.74)",
    },
  },
  {
    name: "T3 Chat",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "0.5rem",
    light: {
      background: "oklch(97.54% 0.00844 325.64)",
      foreground: "oklch(32.57% 0.11612 325.04)",
      card: "oklch(97.54% 0.00844 325.64)",
      cardForeground: "oklch(32.57% 0.11612 325.04)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(32.57% 0.11612 325.04)",
      primary: "oklch(53.16% 0.14089 355.2)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(86.96% 0.06751 334.9)",
      secondaryForeground: "oklch(44.48% 0.13406 324.8)",
      muted: "oklch(93.95% 0.02604 331.55)",
      mutedForeground: "oklch(49.24% 0.12445 324.45)",
      accent: "oklch(86.96% 0.06751 334.9)",
      accentForeground: "oklch(44.48% 0.13406 324.8)",
      destructive: "oklch(52.48% 0.13678 20.83)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(85.68% 0.08288 328.91)",
      input: "oklch(85.17% 0.05582 336.6)",
      ring: "oklch(59.16% 0.21798 0.58)",
      chart1: "oklch(60.38% 0.23628 344.47)",
      chart2: "oklch(44.45% 0.22507 300.62)",
      chart3: "oklch(37.9% 0.04376 226.15)",
      chart4: "oklch(83.3% 0.11852 88.35)",
      chart5: "oklch(78.43% 0.12563 59)",
      sidebar: "oklch(93.6% 0.02881 320.58)",
      sidebarForeground: "oklch(49.48% 0.19094 354.54)",
      sidebarPrimary: "oklch(39.63% 0.02513 285.2)",
      sidebarPrimaryForeground: "oklch(96.68% 0.01243 337.52)",
      sidebarAccent: "oklch(97.89% 0.00132 106.42)",
      sidebarAccentForeground: "oklch(39.63% 0.02513 285.2)",
      sidebarBorder: "oklch(93.83% 0.00255 48.72)",
      sidebarRing: "oklch(59.16% 0.21798 0.58)",
    },
    dark: {
      background: "oklch(24.09% 0.0201 307.53)",
      foreground: "oklch(83.98% 0.03874 309.54)",
      card: "oklch(28.03% 0.02323 307.54)",
      cardForeground: "oklch(84.56% 0.03016 341.46)",
      popover: "oklch(15.48% 0.01316 338.9)",
      popoverForeground: "oklch(96.47% 0.00914 341.8)",
      primary: "oklch(46.07% 0.18535 4.1)",
      primaryForeground: "oklch(85.6% 0.06185 346.37)",
      secondary: "oklch(31.37% 0.03057 310.06)",
      secondaryForeground: "oklch(84.83% 0.03825 307.96)",
      muted: "oklch(26.34% 0.02189 309.47)",
      mutedForeground: "oklch(79.4% 0.0372 307.1)",
      accent: "oklch(36.49% 0.05079 308.49)",
      accentForeground: "oklch(96.47% 0.00914 341.8)",
      destructive: "oklch(22.58% 0.05243 12.61)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(32.86% 0.01535 343.45)",
      input: "oklch(33.87% 0.0195 332.83)",
      ring: "oklch(59.16% 0.21798 0.58)",
      chart1: "oklch(53.16% 0.14089 355.2)",
      chart2: "oklch(56.33% 0.19123 306.86)",
      chart3: "oklch(72.27% 0.1502 60.58)",
      chart4: "oklch(61.93% 0.20294 312.74)",
      chart5: "oklch(61.18% 0.2093 6.14)",
      sidebar: "oklch(18.93% 0.01632 331.05)",
      sidebarForeground: "oklch(86.07% 0.02927 343.66)",
      sidebarPrimary: "oklch(48.82% 0.21717 264.38)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(23.37% 0.02608 338.2)",
      sidebarAccentForeground: "oklch(96.74% 0.00133 286.38)",
      sidebarBorder: "oklch(0% 0 0)",
      sidebarRing: "oklch(59.16% 0.21798 0.58)",
    },
  },
]

/**
 * Initialize a fresh scaffold with a complete marketing site: the 4 theme
 * presets ("Stark × Ember" active by default), site settings, a header, a
 * footer, and a fully assembled home page built from every block's shipped
 * defaults.
 *
 * Safe to run repeatedly — every insert is guarded by an existence check
 * keyed on a natural identifier (theme/header/footer name, page slug, or the
 * `siteSettings` singleton), so re-running after hand-edits in the admin
 * panel never duplicates or clobbers them.
 *
 * Run from terminal: `npx convex run seed:init`
 */
export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []

    let activeThemeId: string | null = null
    for (const preset of THEME_PRESETS) {
      const existing = await ctx.db
        .query(TABLE_SLUG_THEMES)
        .withIndex("by_name", (q) => q.eq("name", preset.name))
        .first()
      if (existing) {
        skipped.push(`theme:${preset.name}`)
        if (preset.name === "Stark × Ember") activeThemeId = existing._id
        continue
      }
      const id = await ctx.db.insert(TABLE_SLUG_THEMES, preset)
      created.push(`theme:${preset.name}`)
      if (preset.name === "Stark × Ember") activeThemeId = id
    }

    const existingSettings = await getGlobal({
      ctx,
      config,
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      access: { bypass: true },
    })
    if (existingSettings) {
      skipped.push("siteSettings")
    } else {
      await upsertGlobal({
        ctx,
        config,
        slug: GLOBAL_SLUG_SITE_SETTINGS,
        data: {
          name: "My Site",
          description: "Built with Vex CMS.",
          activeTheme: activeThemeId ? [activeThemeId] : [],
        },
        access: { bypass: true },
      })
      created.push("siteSettings")
    }

    const existingHeader = await ctx.db
      .query(TABLE_SLUG_HEADERS)
      .withIndex("by_name", (q) => q.eq("name", "Main Header"))
      .first()
    if (existingHeader) {
      skipped.push("header")
    } else {
      await ctx.db.insert(TABLE_SLUG_HEADERS, {
        name: "Main Header",
        content: [
          {
            blockType: "header",
            blockName: "Site Header",
            id: "main-header",
            logoText: "My Site",
            logoHref: "/",
            menuItems: [
              { label: "Features", href: "/features" },
              { label: "Roadmap", href: "/roadmap" },
              { label: "Docs", href: "/docs" },
            ],
            actionButtons: [
              { label: "GitHub", href: "https://github.com/vexcms/vex", variant: "ghost" },
              { label: "Get Started", href: "/docs", variant: "default" },
            ],
          },
        ],
      })
      created.push("header")
    }

    const existingFooter = await ctx.db
      .query(TABLE_SLUG_FOOTERS)
      .withIndex("by_name", (q) => q.eq("name", "Main Footer"))
      .first()
    if (existingFooter) {
      skipped.push("footer")
    } else {
      await ctx.db.insert(TABLE_SLUG_FOOTERS, {
        name: "Main Footer",
        content: [
          {
            blockType: "footer",
            blockName: "Site Footer",
            id: "main-footer",
            logoText: "My Site",
            copyright: "My Site. All rights reserved.",
            links: [
              { label: "Features", href: "/features" },
              { label: "Roadmap", href: "/roadmap" },
              { label: "Documentation", href: "/docs" },
            ],
            socialLinks: [{ platform: "GitHub", href: "https://github.com/vexcms/vex", icon: "Github" }],
          },
        ],
      })
      created.push("footer")
    }

    const existingHome = await ctx.db
      .query(TABLE_SLUG_PAGES)
      .withIndex("by_slug", (q) => q.eq("slug", "home"))
      .first()
    if (existingHome) {
      skipped.push("page:home")
    } else {
      await ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "Home",
        slug: "home",
        blocks: [
          {
            blockType: "hero",
            blockName: "Hero",
            id: "home-hero",
            badgeText: "Now in public beta",
            badgeLink: "/docs",
            heading: "The CMS built for Convex",
            subheading:
              "Vex CMS gives you a full-featured content management system powered by Convex — real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
            primaryCtaLabel: "Get Started",
            primaryCtaHref: "/docs",
            secondaryCtaLabel: "View on GitHub",
            secondaryCtaHref: "https://github.com/vexcms/vex",
          },
          {
            blockType: "features",
            blockName: "Features",
            id: "home-features",
            heading: "Everything you need to manage content",
            subheading:
              "Built on Convex's real-time infrastructure with a developer experience that doesn't compromise on power.",
            features: [
              {
                title: "Real-Time by Default",
                description:
                  "Every query is live. Content updates appear instantly across all connected clients — no polling, no webhooks.",
                icon: "Zap",
              },
              {
                title: "Type-Safe Schemas",
                description:
                  "Define your collections with TypeScript. Vex generates Convex schemas, Zod validators, and typed queries automatically.",
                icon: "Shield",
              },
              {
                title: "Developer First",
                description:
                  "Code-first configuration, CLI tooling, and a clean API. Build with the tools you already know and love.",
                icon: "Code",
              },
            ],
          },
          {
            blockType: "how_it_works",
            blockName: "How It Works",
            id: "home-how-it-works",
            heading: "Get started in minutes",
            subheading: "From zero to a fully functional CMS in four steps. No boilerplate, no config files to wrestle with.",
            steps: [
              {
                icon: "Terminal",
                title: "Scaffold your project",
                description:
                  "Run npx create-vexcms@latest to get a Next.js app with Convex, authentication, and the admin panel pre-configured.",
              },
              {
                icon: "Code",
                title: "Define your schema",
                description:
                  "Use defineCollection() and field helpers to declare your content model in TypeScript. Vex generates your Convex schema, types, and queries automatically.",
              },
              {
                icon: "LayoutGrid",
                title: "Build with blocks",
                description:
                  "Compose pages from reusable content blocks. Each block is a React component with a typed config — drag, drop, and edit inline from the admin panel.",
              },
              {
                icon: "Rocket",
                title: "Deploy and go live",
                description:
                  "Push to Convex and deploy your Next.js app. Real-time content updates flow to every connected client instantly.",
              },
            ],
          },
          {
            blockType: "roadmap",
            blockName: "Roadmap",
            id: "home-roadmap",
            heading: "Roadmap",
            subheading:
              "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
            items: [
              {
                feature: "12 Field Types",
                description:
                  "text, url, color, number, checkbox, date, select, relationship, array, group, blocks, and upload — no richtext, json, or tabs yet.",
                status: "shipped",
              },
              {
                feature: "Convex Schema Codegen",
                description:
                  "vex dev / vex generate write your Convex schema, TypeScript types, and Zod validators from defineCollection() — no hand-written schema.ts.",
                status: "shipped",
              },
              {
                feature: "Real-Time Admin Panel",
                description:
                  "DataTable with pagination, live totalDocs, and bulk operations — every list view is a Convex subscription.",
                status: "shipped",
              },
              {
                feature: "Media Library",
                description:
                  "Convex file storage adapter with a searchable, paginated media picker built into every upload field.",
                status: "shipped",
              },
              {
                feature: "RBAC & Access Control",
                description:
                  "Document-level access rules, indexed constraints that compile to withIndex ranges, per-call access.action/bypass overrides, and an anonRole fallback for public reads.",
                status: "shipped",
              },
              {
                feature: "Custom Theme System",
                description:
                  "Database-driven themes with light/dark mode, 32 shadcn tokens per mode, and OKLCH color support — live-updates with zero page reload.",
                status: "shipped",
              },
              {
                feature: "Better Auth Integration",
                description: "Email/password and OAuth out of the box, with organizations and API keys as opt-in plugins.",
                status: "shipped",
              },
              {
                feature: "CLI & Scaffolder",
                description:
                  "vex dev, vex generate, and create-vexcms for instant project setup — bare or full marketing-site templates.",
                status: "shipped",
              },
              {
                feature: "Versioning & Drafts",
                description: "Draft/publish workflow with live preview — in active development.",
                status: "coming-soon",
              },
              {
                feature: "Richtext, JSON, Email & Textarea Fields",
                description: "Plate.js-powered rich text, plus structured JSON, email, and multi-line text inputs.",
                status: "planned",
              },
              {
                feature: "Form Builder & Lifecycle Hooks",
                description:
                  "Composable form fields beyond content editing, plus beforeChange/afterChange hooks for custom side effects.",
                status: "planned",
              },
              {
                feature: "Team Management & API Keys",
                description: "Invite users, assign roles, and issue scoped read-only API tokens for external integrations.",
                status: "planned",
              },
            ],
          },
          {
            blockType: "faq",
            blockName: "FAQ",
            id: "home-faq",
            heading: "Frequently Asked Questions",
            subheading: "Everything you need to know about Vex CMS and building with Convex.",
            supportLink: "https://github.com/vexcms/vex/issues",
            items: [
              {
                question: "What is Vex CMS?",
                answer:
                  "Vex CMS is a headless content management system built on Convex. It provides real-time data, type-safe schemas, RBAC, and a beautiful admin panel — all configured with TypeScript.",
              },
              {
                question: "How is Vex different from other headless CMS platforms?",
                answer:
                  "Vex is powered by Convex's real-time database, so content updates are instant across all clients — no polling, no webhooks. Your schema is defined in code, giving you full type safety from database to frontend.",
              },
              {
                question: "Do I need to know Convex to use Vex CMS?",
                answer:
                  "Basic familiarity helps, but Vex handles most of the complexity for you. The CLI generates your Convex schema, queries, and types automatically from your collection definitions.",
              },
              {
                question: "Is Vex CMS free?",
                answer:
                  "Yes — Vex CMS is open source and free to use. You only pay for your Convex usage, which has a generous free tier for most projects.",
              },
              {
                question: "How do I get started?",
                answer:
                  "Run npx create-vexcms@latest to scaffold a new project with Vex CMS pre-configured — Next.js app, Convex backend, authentication, and admin panel in under a minute.",
              },
            ],
          },
          {
            blockType: "cta",
            blockName: "CTA",
            id: "home-cta",
            heading: "Ready to build with Vex CMS?",
            subheading: "Get started in minutes with create-vexcms. Real-time content management powered by Convex.",
            actions: [
              { label: "Get Started", href: "/docs" },
              { label: "View on GitHub", href: "https://github.com/vexcms/vex" },
            ],
          },
        ],
      })
      created.push("page:home")
    }

    return { created, skipped }
  },
})
```

Verify: node scripts/scaffold-smoke.mjs (full scaffold; tree + placeholder assertions; seed file parses; no `object(`, `ui(`, `tabs(`, `imageUrl(`, `richtext(`, `blockStyles`, `_vexDrafts`, scalar select `defaultValue` anywhere in the scaffolded output)

### Step 5 — `--monorepo` and `--yes` flags in create-vexcms [agent]

WP-3 generates the real `apps/www` by running this same scaffolder inside the
`vex.git` repo, where P-015 forbids literal version specifiers in any
manifest — so a monorepo-targeted scaffold cannot ship the template's
catalog-resolved literals verbatim, it has to rewrite them against the host's
own `pnpm-workspace.yaml` catalog. Steps 6 and 7's automation additionally
need to drive the CLI with zero prompts. This step adds both entry points as
plain flags on the existing 8-prompt flow, touching nothing about the prompts
themselves beyond making them skippable.

- [ ] `packages/create-vexcms/src/index.ts` — add `--monorepo`/`--yes` commander options; `--yes` answers all 8 prompts with their existing defaults; `--monorepo` resolves the target directory to `apps/<name>` under the detected workspace root and refuses to overwrite an existing directory
- [ ] `packages/create-vexcms/src/installers/types.ts` — add `monorepo`, `workspaceRoot`, `yes` to `ProjectOptions`
- [ ] `packages/create-vexcms/src/installers/base.ts` — new `applyMonorepoRewrite` step in `initProject`; git init and dependency install are skipped whenever `options.monorepo` is true, independent of what the (possibly `--yes`-answered) prompts resolved to
- [ ] `packages/create-vexcms/src/helpers/monorepo.ts` — new: `findWorkspaceRoot`, `readWorkspaceCatalog`, and the pure `rewriteManifestForMonorepo` mapper
- [ ] `packages/create-vexcms/src/__tests__/monorepo.test.ts` — new: exact-value test for `rewriteManifestForMonorepo`
- [ ] `pnpm-workspace.yaml` — add `yaml` to the catalog (workspace-file parsing)
- [ ] `packages/create-vexcms/package.json` — `yaml` picked up as `catalog:`
- [ ] `pnpm --filter create-vexcms build`
- [ ] `node packages/create-vexcms/dist/index.js scaffold-smoke --monorepo --yes` (inside the repo)
- [ ] `pnpm --filter scaffold-smoke typecheck`
- [ ] `rm -rf apps/scaffold-smoke`

#### packages/create-vexcms/src/helpers/monorepo.ts

New file. `findWorkspaceRoot` is the walk-up search index.ts uses to locate
`pnpm-workspace.yaml` before it decides where to scaffold; `readWorkspaceCatalog`
turns that root into the plain `{ name: version }` map the rewrite needs;
`rewriteManifestForMonorepo` is the pure mapper the test below exercises
directly. It calls `sort-package-json` itself so every caller gets a
correctly sorted manifest for free (the dependency is already declared —
P-015's `catalog:` entry below just gives `yaml` the same treatment).

```ts
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

export interface FindWorkspaceRootProps {
  /** Directory to start the upward search from — typically `process.cwd()`. */
  cwd: string
}

/**
 * Walks up from `cwd` looking for a `pnpm-workspace.yaml` — the same marker
 * pnpm itself uses to locate a workspace root — and returns the first
 * directory that contains one.
 *
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
 */
export async function readWorkspaceCatalog(props: ReadWorkspaceCatalogProps): Promise<Record<string, string>> {
  const { workspaceRoot } = props;
  const raw = await fs.readFile(path.join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf-8');
  const parsed = parseYaml(raw) as { catalog?: Record<string, string> };
  return parsed.catalog ?? {};
}

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
```

#### packages/create-vexcms/src/__tests__/monorepo.test.ts

New file, colocated with the package's existing `__tests__/` layout
(`fileOperations.test.ts`, `validation.test.ts`) rather than the repo-wide
colocated-`.test.ts` convention — this package already established the
`__tests__/` pattern and a second convention beside it is not welcome.
`rewriteManifestForMonorepo` is pure, so the test drives it directly with a
real manifest and a real catalog map and asserts the exact rewritten object —
no mocks, no existence guards (AP-009, AP-013).

```ts
import { describe, it, expect } from 'vitest';
import { rewriteManifestForMonorepo } from '../helpers/monorepo.js';

describe('rewriteManifestForMonorepo', () => {
  it('maps @vexcms/* to workspace:*, catalog-known deps to catalog:, and keeps other literals', () => {
    const manifest = {
      name: 'scaffold-smoke',
      version: '0.1.0',
      dependencies: {
        '@vexcms/core': '0.1.0-alpha.1',
        '@vexcms/react': '0.1.0-alpha.1',
        next: '16.3.3',
        'left-pad': '1.3.0',
      },
      devDependencies: {
        typescript: '6.0.3',
        'some-unlisted-tool': '2.0.0',
      },
    };
    const catalog = {
      next: '16.3.3',
      typescript: '6.0.3',
    };

    const result = rewriteManifestForMonorepo({ manifest, catalog });

    expect(result.dependencies).toEqual({
      '@vexcms/core': 'workspace:*',
      '@vexcms/react': 'workspace:*',
      'left-pad': '1.3.0',
      next: 'catalog:',
    });
    expect(result.devDependencies).toEqual({
      'some-unlisted-tool': '2.0.0',
      typescript: 'catalog:',
    });
    expect(result.name).toBe('scaffold-smoke');
    expect(result.version).toBe('0.1.0');
  });

  it('leaves a manifest with no dependency sections unchanged', () => {
    const manifest = { name: 'bare', version: '0.0.1' };

    const result = rewriteManifestForMonorepo({ manifest, catalog: { next: '16.3.3' } });

    expect(result).toEqual({ name: 'bare', version: '0.0.1' });
  });

  it('never touches a dependency the host catalog does not know, even if the name looks similar', () => {
    const manifest = {
      name: 'scaffold-smoke',
      dependencies: { 'next-auth': '5.0.0' },
    };

    const result = rewriteManifestForMonorepo({ manifest, catalog: { next: '16.3.3' } });

    expect(result.dependencies).toEqual({ 'next-auth': '5.0.0' });
  });
});
```

#### packages/create-vexcms/src/installers/types.ts

**1 — `ProjectOptions` additions.** Inside the `ProjectOptions` interface,
after the existing `installDependencies: boolean` member:

```ts
  /**
   * When true, scaffold into `apps/<name>` under the detected pnpm workspace
   * root and rewrite dependency protocols (`workspace:*` / `catalog:`)
   * instead of running a standalone install (`--monorepo`).
   */
  monorepo: boolean
  /**
   * Absolute path to the host pnpm workspace root (the directory containing
   * `pnpm-workspace.yaml`), resolved by walking up from `cwd` when
   * `monorepo` is true. `null` outside `--monorepo` mode.
   */
  workspaceRoot: string | null
  /**
   * When true, every interactive prompt was skipped and answered with its
   * default (`--yes`, for automation). Scaffolding behavior is fully
   * captured by the resolved fields above — this flag is recorded for
   * diagnostics only, nothing downstream branches on it directly.
   */
  yes: boolean
```

#### packages/create-vexcms/src/index.ts

**1 — commander options.** Inside the `Command` builder chain, immediately
after `.option('--orgs', 'Enable multi-tenant organizations')` and before
`.version('0.0.2')`:

```ts
  .option('--monorepo', 'Scaffold into apps/<name> under the detected pnpm workspace root, rewriting dependencies to workspace/catalog protocols')
  .option('--yes', 'Accept every prompt default without rendering (for automation)')
```

**2 — opts type.** The `program.opts<...>()` call widens to:

```ts
const opts = program.opts<{ bare?: boolean; orgs?: boolean; monorepo?: boolean; yes?: boolean }>();
```

**3 — flags read at the top of `main()`.** Immediately after
`const bare = opts.bare ?? false;`:

```ts
  const yes = opts.yes ?? false;
  const monorepo = opts.monorepo ?? false;
```

**4 — project name resolution.** The `if (args[0]) { ... } else { ... }`
block around prompt `(1/8)` gains a `--yes` branch before the interactive
fallback (the prompt's own `default` is `'my-vexcms-app'`, so `--yes` reuses
it verbatim):

```ts
  let inputArg: string;
  if (args[0]) {
    inputArg = args[0];
  } else if (yes) {
    inputArg = 'my-vexcms-app';
  } else {
    inputArg = await input({
      message: '(1/8) What is your project named?',
      default: 'my-vexcms-app',
      validate: (value) => {
        const name = value.includes('/') ? path.basename(value) : value;
        if (name === '.') return true;
        const result = validateProjectName(name);
        if (result.valid) return true;
        return result.errors[0] ?? 'Invalid project name';
      },
    });
  }
```

**5 — target directory resolution.** The comment
`// Resolve the target directory — supports relative paths like "apps/test"`
through the existing `checkDirectoryExists`/`isDirectoryEmpty` block becomes
a `monorepo`/non-`monorepo` branch. Non-monorepo keeps today's behavior
verbatim; `--monorepo` walks up for `pnpm-workspace.yaml`, errors with an
actionable message if none is found, targets `apps/<projectName>`, and
refuses to overwrite an existing directory outright (stricter than the
empty-directory allowance the non-monorepo path keeps):

```ts
  // Resolve the target directory — supports relative paths like "apps/test",
  // or --monorepo's apps/<name> under the detected workspace root.
  let targetDir: string;
  let workspaceRoot: string | null = null;

  if (monorepo) {
    workspaceRoot = await findWorkspaceRoot({ cwd: process.cwd() });
    if (!workspaceRoot) {
      console.error(chalk.red('\nError: --monorepo requires a pnpm workspace.'));
      console.error(chalk.yellow(`No pnpm-workspace.yaml was found walking up from ${process.cwd()}.`));
      console.error(chalk.yellow('Run this command from inside a pnpm workspace, or drop --monorepo.'));
      process.exit(1);
    }

    targetDir = path.join(workspaceRoot, 'apps', projectName);
    if (await checkDirectoryExists(targetDir)) {
      console.error(chalk.red(`\nError: 'apps/${projectName}' already exists under ${workspaceRoot}.`));
      console.error(chalk.yellow('--monorepo refuses to scaffold over an existing directory.'));
      process.exit(1);
    }
  } else {
    targetDir = inputArg === '.'
      ? process.cwd()
      : path.resolve(process.cwd(), inputArg);
    if (await checkDirectoryExists(targetDir)) {
      if (!(await isDirectoryEmpty(targetDir))) {
        displayDirectoryNotEmptyError();
        process.exit(1);
      }
    }
  }
```

**6 — framework prompt `(2/8)`.** The `select` prompt has no `default` field
— `--yes` cannot "read the default" for it, so it picks the only
conservative choice: `'nextjs'` is the sole implemented framework (`tanstack`
re-prompts forever, per the existing `while` loop).

```ts
  let framework: Framework;
  if (yes) {
    // No prompt default exists here; "nextjs" is the only implemented
    // framework (createInstaller throws on "tanstack"), so --yes picks it.
    framework = 'nextjs';
  } else {
    while (true) {
      framework = await select<Framework>({
        message: '(2/8) Select a framework:',
        choices: [
          { name: 'Next.js (Recommended)', value: 'nextjs' },
          { name: 'TanStack Start (Coming Soon)', value: 'tanstack' },
        ],
      });
      if (framework === 'tanstack') {
        console.log(chalk.yellow('\n  TanStack Start support is coming soon! Please select Next.js for now.\n'));
        continue;
      }
      break;
    }
  }
```

**7 — port prompt `(3/8)`.** Reuses the prompt's own `default: '3010'`:

```ts
  let port: number;
  if (yes) {
    port = 3010;
  } else {
    const portInput = await input({
      message: '(3/8) Dev server port:',
      default: '3010',
      validate: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 65535) return 'Must be a valid port number (1-65535)';
        return true;
      },
    });
    port = parseInt(portInput, 10);
  }
```

**8 — email/password prompt `(4/8)`.** Reuses `default: true`:

```ts
  const emailPasswordAuth = yes
    ? true
    : await confirm({
        message: '(4/8) Enable email/password authentication?',
        default: true,
      });
```

**9 — organizations prompt `(5/8)`.** `--orgs` still takes priority over
both `--yes` and the prompt, matching today's `opts.orgs ?? await confirm(...)`
short-circuit; `--yes` reuses `default: false`:

```ts
  const orgs = opts.orgs ?? (yes
    ? false
    : await confirm({
        message: '(5/8) Enable multi-tenant (organizations)?',
        default: false,
      }));
```

**10 — OAuth providers prompt `(6/8)`.** `checkbox()` is given no `checked`
entries, so its unrendered default selection is the empty array — `--yes`
reproduces that exactly, no guessing involved:

```ts
  const popularProviders = getPopularProviders();
  const additionalProviders = getAdditionalProviders();

  const allProviderChoices = [
    ...popularProviders.map(p => ({
      name: p.name,
      value: p.id,
    })),
    { name: '── Additional providers ──', value: '__separator__', disabled: true as const },
    ...additionalProviders.map(p => ({
      name: p.name,
      value: p.id,
    })),
  ];

  const oauthProviders = yes
    ? []
    : await checkbox({
        message: '(6/8) Select OAuth providers (space to toggle, enter to confirm):',
        choices: allProviderChoices,
      });
```

**11 — Git init prompt `(7/8)`.** Reuses `default: true`. `--monorepo`'s
unconditional skip (root git owns it) is enforced in `base.ts#initProject`,
not here — this only resolves what the flag/prompt itself would answer:

```ts
  const initGit = yes
    ? true
    : await confirm({
        message: '(7/8) Initialize a Git repository?',
        default: true,
      });
```

**12 — install prompt `(8/8)`.** Reuses `default: false`:

```ts
  const installDependencies = yes
    ? false
    : await confirm({
        message: '(8/8) Install dependencies?',
        default: false,
      });
```

**13 — `ProjectOptions` construction.** The `options` object literal gains
the three new fields:

```ts
  const options: ProjectOptions = {
    projectName,
    projectDir: targetDir,
    framework,
    port,
    bare,
    orgs,
    emailPasswordAuth,
    oauthProviders,
    initGit,
    installDependencies,
    monorepo,
    workspaceRoot,
    yes,
  };
```

**14 — follow-up commands.** After the existing
`displaySuccessMessage(options.projectName, targetDir, inputArg === '.');`
call, before the closing brace of `main()`:

```ts
  if (monorepo && workspaceRoot) {
    console.log(chalk.cyan(`  Run 'pnpm install' from ${workspaceRoot} to link the new workspace member.`));
    console.log();
  }
```

**15 — import.** Alongside the existing
`import { createProjectDirectory, getTargetDirectory } from './helpers/fileOperations.js';`
line:

```ts
import { findWorkspaceRoot } from './helpers/monorepo.js';
```

#### packages/create-vexcms/src/installers/base.ts

**1 — import.** Alongside the existing
`import { copyTemplate, overlayTemplate } from '../helpers/fileOperations.js';`
line:

```ts
import { readWorkspaceCatalog, rewriteManifestForMonorepo } from '../helpers/monorepo.js';
```

**2 — `applyMonorepoRewrite`.** New protected method, placed directly after
`configurePort` (both are the two package.json-mutating steps the class
owns):

```ts
  /**
   * Rewrites the scaffolded `package.json` for life inside a host pnpm
   * workspace (`--monorepo`). `@vexcms/*` dependencies become
   * `workspace:*`; any other dependency the host's `pnpm-workspace.yaml`
   * catalog also pins becomes `catalog:`; everything else keeps its
   * literal, catalog-resolved version. No-op when `options.monorepo` is
   * false or `options.workspaceRoot` is unset.
   *
   * @param options - Resolved project options; only `monorepo`/`workspaceRoot` are consulted.
   */
  protected async applyMonorepoRewrite(options: ProjectOptions): Promise<void> {
    if (!options.monorepo || !options.workspaceRoot) return;

    const pkgPath = path.join(this.targetPath, 'package.json');
    const manifest = await fs.readJson(pkgPath);
    const catalog = await readWorkspaceCatalog({ workspaceRoot: options.workspaceRoot });
    const rewritten = rewriteManifestForMonorepo({ manifest, catalog });

    await fs.writeJson(pkgPath, rewritten, { spaces: 2 });
  }
```

**3 — `initProject` orchestration.** A new step is inserted between the
existing "Generate auth secret" block and the "Initialize Git repository"
block; the two existing `if` gates immediately after it grow a `!options.monorepo`
guard so the flag's "skip git init + install (root install owns it)" rule
holds regardless of what the (possibly `--yes`-answered) `initGit`/
`installDependencies` prompts resolved to:

```ts
    // Step 10.5: Rewrite package.json for the host workspace (--monorepo only)
    if (options.monorepo) {
      const monorepoSpinner = ora('Rewriting dependencies for the host workspace...').start();
      try {
        await this.applyMonorepoRewrite(options);
        monorepoSpinner.succeed('Dependencies rewritten for the host workspace');
      } catch (error) {
        monorepoSpinner.fail('Failed to rewrite dependencies for the host workspace');
        throw error;
      }
    }

    // Step 10: Initialize Git repository (optional; --monorepo defers to the host repo)
    if (options.initGit && !options.monorepo) {
      await this.initGitRepo();
    }

    // Step 11: Install dependencies (optional; --monorepo defers to the host's install)
    if (options.installDependencies && !options.monorepo) {
      await this.installDependencies();
      await this.lintCode();
      await this.formatCode();
    }
```

#### pnpm-workspace.yaml

**1 — catalog entry.** Inside the `catalog:` block, alphabetically between
`vitest: 4.1.10` and `zod: 4.4.3`:

```yaml
  vitest: 4.1.10
  yaml: 2.9.0
  zod: 4.4.3
```

#### packages/create-vexcms/package.json

**1 — dependency.** In `dependencies`, after `"validate-npm-package-name": "catalog:"`:

```json
    "validate-npm-package-name": "catalog:",
    "yaml": "catalog:"
```

Verify: pnpm --filter create-vexcms build && node packages/create-vexcms/dist/index.js scaffold-smoke --monorepo --yes (inside the repo) && pnpm --filter scaffold-smoke typecheck && rm -rf apps/scaffold-smoke

### Step 6 — Honest integration tests [agent]

Why: the current suite is falsely green — every scaffold assertion in
`integration.test.ts` (7 single guards + 4 paired guards = 15 call sites) and
`fileOperations.test.ts` (2 more) opens with `if (!fs.existsSync(...)) return;`,
so an empty `templates/` directory makes every one of those tests report a
pass. `validation.test.ts` carries no such guard and needs no change. This
step rewrites the suite to scaffold real projects through the programmatic
entry point — `createInstaller({ framework, projectDir, projectName
}).initProject(options)` with `installDependencies: false, initGit: false`
(skips step 11 — install/lint/format — and the git-init/commit half of step
10 in `VexFrameworkInstaller#initProject`; every file-producing step still
runs) — and asserts the result against a single shared manifest exported from
`scripts/scaffold-smoke.mjs`, so the CLI smoke script and the vitest suite
can never drift into checking two different trees (AP-013, Contract 7).

- [ ] `packages/create-vexcms/src/__tests__/integration.test.ts` — full rewrite: hard `beforeAll` template-presence gate, three shared fixtures (bare / full / monorepo) scaffolded once via the installer, assertions against the `scaffold-smoke.mjs` manifest plus `.env.local`, package.json protocol, overlay-merge, and placeholder-substitution checks
- [ ] `packages/create-vexcms/src/__tests__/fileOperations.test.ts` — same hard-fail policy: `describe('copyTemplate', ...)` gets a `beforeAll` gate, both silent-return guards removed; `describe('overlayTemplate', ...)` untouched (already template-independent, no guards)
- [ ] `packages/create-vexcms/src/__tests__/validation.test.ts` — swept, no guard found, no change
- [ ] `scripts/scaffold-smoke.mjs` — graduates into exporting `EXPECTED_TREE`, `PROHIBITED_PATTERNS`, and `assertScaffold({ targetDir, mode })`; its CLI tail (`node scripts/scaffold-smoke.mjs [--bare] [--monorepo]`) becomes a thin caller of the same function the tests import
- [ ] Run `pnpm --filter create-vexcms test` (green)
- [ ] Run the negative gate: point the suite at an empty templates dir, confirm it FAILS, restore, confirm green again

#### packages/create-vexcms/src/__tests__/integration.test.ts

New file body (complete replacement — every case below scaffolds through the
real installer; nothing is a silent no-op if the templates are missing).

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createInstaller } from '../installers/index.js';
import type { ProjectOptions } from '../installers/types.js';
import { assertScaffold, PROHIBITED_PATTERNS } from '../../../../scripts/scaffold-smoke.mjs';

/**
 * Integration tests that scaffold real projects through the installer and
 * verify the output end to end. Template presence is a hard prerequisite,
 * never a silent skip (AP-013) — see the negative-gate procedure in the
 * Step 6 spec section for how this gate is proven to actually fail.
 */

const templatesDir = process.env.VEX_TEMPLATES_DIR_OVERRIDE
  ? path.resolve(process.env.VEX_TEMPLATES_DIR_OVERRIDE)
  : path.resolve(import.meta.dirname, '../../templates');
const baseTemplateDir = path.join(templatesDir, 'base-nextjs');
const marketingTemplateDir = path.join(templatesDir, 'marketing-site');

const YES_DEFAULTS = {
  framework: 'nextjs' as const,
  port: 3010,
  orgs: false,
  emailPasswordAuth: true,
  oauthProviders: [] as string[],
  initGit: false,
  installDependencies: false,
  yes: true,
};

async function scaffold(overrides: {
  projectName: string;
  projectDir: string;
  bare: boolean;
  monorepo: boolean;
}): Promise<void> {
  const options: ProjectOptions = { ...YES_DEFAULTS, ...overrides };
  const installer = createInstaller({
    framework: options.framework,
    projectDir: options.projectDir,
    projectName: options.projectName,
  });
  await installer.initProject(options);
}

let tmpRoot: string;
let bareDir: string;
let fullDir: string;
let monorepoDir: string;
let monorepoWorkspaceRoot: string;
let hostCatalog: Record<string, string>;

beforeAll(async () => {
  if (!fs.existsSync(baseTemplateDir)) {
    throw new Error(
      `templates/base-nextjs is missing at ${baseTemplateDir} — Step 3 ` +
        '(author templates/base-nextjs from apps/test) has not landed. ' +
        'This suite refuses to pass against an absent template.'
    );
  }
  if (!fs.existsSync(marketingTemplateDir)) {
    throw new Error(
      `templates/marketing-site is missing at ${marketingTemplateDir} — Step 4 ` +
        '(author templates/marketing-site overlay) has not landed. ' +
        'This suite refuses to pass against an absent template.'
    );
  }

  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vex-scaffold-'));

  bareDir = path.join(tmpRoot, 'bare-project');
  fs.ensureDirSync(bareDir);
  await scaffold({ projectName: 'bare-project', projectDir: bareDir, bare: true, monorepo: false });

  fullDir = path.join(tmpRoot, 'full-project');
  fs.ensureDirSync(fullDir);
  await scaffold({ projectName: 'full-project', projectDir: fullDir, bare: false, monorepo: false });

  // Build the host catalog FROM the bare scaffold's own resolved deps, so the
  // monorepo rewrite is observable regardless of which literal versions the
  // templates carry — every non-@vexcms dep the bare project ships is added
  // to the fake workspace catalog under its own literal version.
  const barePkg = fs.readJsonSync(path.join(bareDir, 'package.json'));
  hostCatalog = {};
  for (const [name, version] of Object.entries({
    ...(barePkg.dependencies ?? {}),
    ...(barePkg.devDependencies ?? {}),
  }) as [string, string][]) {
    if (!name.startsWith('@vexcms/')) hostCatalog[name] = version;
  }

  monorepoWorkspaceRoot = path.join(tmpRoot, 'host-workspace');
  fs.ensureDirSync(monorepoWorkspaceRoot);
  const catalogLines = Object.entries(hostCatalog).map(
    ([name, version]) => `  ${JSON.stringify(name)}: ${JSON.stringify(version)}`
  );
  fs.writeFileSync(
    path.join(monorepoWorkspaceRoot, 'pnpm-workspace.yaml'),
    ['packages:', '  - "apps/*"', 'catalog:', ...catalogLines, ''].join('\n')
  );

  monorepoDir = path.join(monorepoWorkspaceRoot, 'apps', 'monorepo-project');
  fs.ensureDirSync(monorepoDir);
  await scaffold({ projectName: 'monorepo-project', projectDir: monorepoDir, bare: false, monorepo: true });
}, 120_000);

afterAll(() => {
  if (tmpRoot) fs.removeSync(tmpRoot);
});

describe('template markers (Contract 4 — installer is the source of truth)', () => {
  it('base-nextjs template source carries every marker the installer substitutes', () => {
    const authOptions = fs.readFileSync(path.join(baseTemplateDir, 'convex/auth/options.ts'), 'utf-8');
    expect(authOptions).toContain('// {{OAUTH_PROVIDERS}}');
    expect(authOptions).toContain('// {{EMAIL_PASSWORD_AUTH}}');

    const authClient = fs.readFileSync(path.join(baseTemplateDir, 'src/auth/client.tsx'), 'utf-8');
    expect(authClient).toContain('// {{OAUTH_UI_PROVIDERS}}');
    expect(authClient).toContain('/* {{EMAIL_PASSWORD_CREDENTIALS}} */');

    const envExample = fs.readFileSync(path.join(baseTemplateDir, '.env.example'), 'utf-8');
    expect(envExample).toContain('# {{ENV_OAUTH_VARS}}');

    const envMjs = fs.readFileSync(path.join(baseTemplateDir, 'src/env.mjs'), 'utf-8');
    expect(envMjs).toContain('// {{OAUTH_ENV_SERVER_SCHEMA}}');
    expect(envMjs).toContain('// {{OAUTH_ENV_RUNTIME_MAPPING}}');

    const readme = fs.readFileSync(path.join(baseTemplateDir, 'README.md'), 'utf-8');
    expect(readme).toContain('<!-- {{OAUTH_SETUP_GUIDE}} -->');

    const pkg = fs.readFileSync(path.join(baseTemplateDir, 'package.json'), 'utf-8');
    expect(pkg).toContain('{{PROJECT_NAME}}');
  });

  it('bare scaffold resolves every installer-substitution marker to real content', () => {
    const pkg = fs.readJsonSync(path.join(bareDir, 'package.json'));
    expect(pkg.name).toBe('bare-project');
    expect(JSON.stringify(pkg)).not.toContain('{{PROJECT_NAME}}');

    const authOptions = fs.readFileSync(path.join(bareDir, 'convex/auth/options.ts'), 'utf-8');
    expect(authOptions).not.toContain('{{OAUTH_PROVIDERS}}');
    expect(authOptions).not.toContain('{{EMAIL_PASSWORD_AUTH}}');

    const authClient = fs.readFileSync(path.join(bareDir, 'src/auth/client.tsx'), 'utf-8');
    expect(authClient).not.toContain('{{OAUTH_UI_PROVIDERS}}');
    expect(authClient).not.toContain('{{EMAIL_PASSWORD_CREDENTIALS}}');

    const envExample = fs.readFileSync(path.join(bareDir, '.env.example'), 'utf-8');
    expect(envExample).not.toContain('{{ENV_OAUTH_VARS}}');

    const envMjs = fs.readFileSync(path.join(bareDir, 'src/env.mjs'), 'utf-8');
    expect(envMjs).not.toContain('{{OAUTH_ENV_SERVER_SCHEMA}}');
    expect(envMjs).not.toContain('{{OAUTH_ENV_RUNTIME_MAPPING}}');

    const readme = fs.readFileSync(path.join(bareDir, 'README.md'), 'utf-8');
    expect(readme).not.toContain('{{OAUTH_SETUP_GUIDE}}');
  });
});

describe('canonical scaffold tree (single source of truth: scripts/scaffold-smoke.mjs)', () => {
  it('bare scaffold matches the exported "bare" manifest exactly', () => {
    const { ok, errors } = assertScaffold({ targetDir: bareDir, mode: 'bare' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it('full (marketing overlay) scaffold matches the exported "full" manifest exactly', () => {
    const { ok, errors } = assertScaffold({ targetDir: fullDir, mode: 'full' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it('monorepo scaffold has full-manifest tree parity (only its package.json protocol differs)', () => {
    const { ok, errors } = assertScaffold({ targetDir: monorepoDir, mode: 'full' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });
});

describe('prohibited legacy API patterns (Step 4 Verify list)', () => {
  it('marketing-site scaffold contains none of the pre-rebuild API patterns', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        const source = fs.readFileSync(full, 'utf-8');
        for (const { label, test } of PROHIBITED_PATTERNS) {
          if (test(source)) offenders.push(`${label} in ${path.relative(fullDir, full)}`);
        }
      }
    };
    walk(fullDir);
    expect(offenders).toEqual([]);
  });
});

describe('.env.local (Contract 6 — deployment-less build)', () => {
  it('writes a generated secret and placeholder Convex URLs for both bare and full scaffolds', () => {
    for (const dir of [bareDir, fullDir]) {
      const envLocal = fs.readFileSync(path.join(dir, '.env.local'), 'utf-8');
      const secretMatch = envLocal.match(/^BETTER_AUTH_SECRET=([0-9a-f]{64})$/m);
      expect(secretMatch).not.toBeNull();
      expect(envLocal).toContain('NEXT_PUBLIC_SITE_URL=http://localhost:3010');
      expect(envLocal).toContain('SITE_URL=http://localhost:3010');
      expect(envLocal).toContain('NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud');
      expect(envLocal).toContain('NEXT_PUBLIC_CONVEX_SITE_URL=https://placeholder.convex.site');
      expect(envLocal).toContain('CONVEX_DEPLOYMENT=');
    }
  });
});

describe('package.json protocol per mode (Contract 5 / Contract 8)', () => {
  it('bare scaffold uses literal versions only', () => {
    const pkg = fs.readFileSync(path.join(bareDir, 'package.json'), 'utf-8');
    expect(pkg).not.toMatch(/workspace:/);
    expect(pkg).not.toMatch(/"catalog:/);
  });

  it('full (standalone) scaffold uses literal versions only', () => {
    const pkg = fs.readFileSync(path.join(fullDir, 'package.json'), 'utf-8');
    expect(pkg).not.toMatch(/workspace:/);
    expect(pkg).not.toMatch(/"catalog:/);
  });

  it('monorepo scaffold rewrites @vexcms/* to workspace:* and host-catalog deps to catalog:', () => {
    const pkg = fs.readJsonSync(path.join(monorepoDir, 'package.json'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;

    for (const [name, spec] of Object.entries(allDeps)) {
      if (name.startsWith('@vexcms/')) {
        expect(spec).toBe('workspace:*');
      } else if (name in hostCatalog) {
        expect(spec).toBe('catalog:');
      } else {
        expect(spec).not.toMatch(/^(workspace:|catalog:)/);
      }
    }
  });
});

describe('overlay merge behavior (Contract 2 — template split)', () => {
  it('marketing-only collections/globals are present in full and absent in bare', () => {
    const marketingOnly = [
      'src/vexcms/collections/pages.ts',
      'src/vexcms/collections/headers.ts',
      'src/vexcms/collections/footers.ts',
      'src/vexcms/collections/themes.ts',
      'src/vexcms/globals/siteSettings.ts',
      'convex/seed.ts',
    ];
    for (const rel of marketingOnly) {
      expect(fs.existsSync(path.join(bareDir, rel))).toBe(false);
      expect(fs.existsSync(path.join(fullDir, rel))).toBe(true);
    }
  });

  it('base auth/admin/media files survive the overlay unchanged in both modes', () => {
    const baseOwned = [
      'package.json',
      'convex/auth/adapter/index.ts',
      'convex/auth/db.ts',
      'src/vexcms/auth.ts',
      '.gitignore',
    ];
    for (const rel of baseOwned) {
      expect(fs.existsSync(path.join(bareDir, rel))).toBe(true);
      expect(fs.existsSync(path.join(fullDir, rel))).toBe(true);
    }
  });

  it('overlay replaces vex.config.ts with the marketing-site version (overwrite: true)', () => {
    const bareConfig = fs.readFileSync(path.join(bareDir, 'vex.config.ts'), 'utf-8');
    expect(bareConfig).toContain('collections: []');

    const fullConfig = fs.readFileSync(path.join(fullDir, 'vex.config.ts'), 'utf-8');
    expect(fullConfig).toContain('collections: [pages, headers, footers, themes, users]');
    expect(fullConfig).toContain('globals: [siteSettings]');
  });
});

describe('vex scripts (base template contract)', () => {
  it('package.json carries the vex:dev / vex:generate / vex:update scripts', () => {
    const pkg = fs.readJsonSync(path.join(bareDir, 'package.json'));
    expect(pkg.scripts['vex:dev']).toBe('vex dev');
    expect(pkg.scripts['vex:generate']).toBe('vex dev --once');
    expect(pkg.scripts['vex:update']).toContain('@vexcms/core@latest');
  });
});
```

#### packages/create-vexcms/src/__tests__/fileOperations.test.ts

`describe('overlayTemplate', ...)` (lines 50-130 of the current file) only
ever touches synthetic tmp fixtures it builds itself — no guard there, no
change. `describe('copyTemplate', ...)` depends on the real `base-nextjs`
template and currently swallows its absence twice; both edits below apply to
that block.

**1 — import `beforeAll` alongside the existing vitest imports.**
```ts
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
```

**2 — `describe('copyTemplate', ...)` gets a hard-fail gate; both tests drop their `if (!fs.existsSync(templateDir)) return;` guard.**
```ts
describe('copyTemplate', () => {
  const templateDir = path.resolve(import.meta.dirname, '../../templates/base-nextjs');

  beforeAll(() => {
    if (!fs.existsSync(templateDir)) {
      throw new Error(
        `templates/base-nextjs is missing at ${templateDir} — Step 3 ` +
          '(author templates/base-nextjs from apps/test) has not landed. ' +
          'This suite refuses to pass against an absent template.'
      );
    }
  });

  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vex-copy-test-'));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('copies template files to target directory', async () => {
    const targetDir = path.join(tmpDir, 'output');
    await copyTemplate('nextjs', targetDir);

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'vex.config.ts'))).toBe(true);
  });

  it('renames _gitignore to .gitignore', async () => {
    const targetDir = path.join(tmpDir, 'output');
    await copyTemplate('nextjs', targetDir);

    expect(fs.existsSync(path.join(targetDir, '.gitignore'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '_gitignore'))).toBe(false);
  });
});
```

#### packages/create-vexcms/src/__tests__/validation.test.ts

Swept for the same policy: `validateProjectName` is pure and every test calls
it directly with an inline string — there is no `fs.existsSync` guard, no
template dependency, and nothing to make honest. No change.

#### scripts/scaffold-smoke.mjs

Graduates from a Step 3/4 standalone CLI check into the shared manifest both
this script and `integration.test.ts` import. `EXPECTED_TREE`,
`PROHIBITED_PATTERNS`, and `assertScaffold` are the interface: pure, synchronous,
and independent of how `targetDir` was populated — both callers scaffold with
the installer first, then hand the resulting directory to `assertScaffold`.
This script drives `createInstaller` from the **built** `dist/` output (it
runs standalone via `node`, matching Step 5's own verify invocation style);
the vitest suite drives the same class from `src/` directly.

```js
#!/usr/bin/env node
/**
 * scripts/scaffold-smoke.mjs
 *
 * Scaffolds a template combination into a tmp directory via the create-vexcms
 * installer (no install, no git) and asserts the result: expected file tree,
 * resolved placeholder markers, and absence of pre-rebuild API patterns.
 *
 * `EXPECTED_TREE`, `PROHIBITED_PATTERNS`, and `assertScaffold` are exported so
 * packages/create-vexcms/src/__tests__/integration.test.ts shares this
 * script's manifest instead of maintaining a second, driftable copy — this
 * script and the vitest suite are two callers of one assertion module.
 *
 * CLI usage: node scripts/scaffold-smoke.mjs [--bare] [--monorepo]
 */
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createInstaller } from '../packages/create-vexcms/dist/installers/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CUT_ADMIN_COMPONENTS = [
  'src/components/admin/ColorCell.tsx',
  'src/components/admin/ColorField.tsx',
  'src/components/admin/ThemeImportField.tsx',
  'src/components/admin/ThemeImport.tsx',
  'src/components/admin/IconPickerField.tsx',
];

const DEAD_GENERATION_DIRS = ['convex/vex/api', 'convex/vex/model'];

const BLOCK_NAMES = ['Hero', 'Features', 'CTA', 'FAQ', 'Header', 'Footer', 'HowItWorks', 'Roadmap'];

const BARE_REQUIRED = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'vex.config.ts',
  '.gitignore',
  '.env.example',
  '.env.local',
  'README.md',
  'src/env.mjs',
  'src/app/layout.tsx',
  'convex/auth/adapter/index.ts',
  'convex/auth/db.ts',
  'convex/auth/sessions.ts',
  'convex/auth/options.ts',
  'convex/auth/plugins/index.ts',
  'src/auth/client.tsx',
  'src/vexcms/auth.ts',
  'src/vexcms/collections/index.ts',
  'convex/vex/auth.ts',
  'convex/vex/firstUser.ts',
  'src/components/WelcomePage.tsx',
  'convex/vex.schema.ts',
  'src/vex.types.ts',
  'convex/_generated/api.d.ts',
  'convex/_generated/dataModel.d.ts',
  'convex/_generated/server.d.ts',
];

const MARKETING_ONLY = [
  'src/vexcms/collections/pages.ts',
  'src/vexcms/collections/headers.ts',
  'src/vexcms/collections/footers.ts',
  'src/vexcms/collections/themes.ts',
  'src/vexcms/globals/index.ts',
  'src/vexcms/globals/siteSettings.ts',
  'convex/seed.ts',
  ...BLOCK_NAMES.flatMap((name) => [
    `src/vexcms/blocks/${name}/config.ts`,
    `src/vexcms/blocks/${name}/index.tsx`,
  ]),
];

// Cut/dead regardless of mode: draft-preview machinery and per-instance admin
// field components are unshipped, and the per-collection generation dirs are
// dead in every scaffold (Step 1).
const ALWAYS_FORBIDDEN = [...DEAD_GENERATION_DIRS, ...CUT_ADMIN_COMPONENTS, 'src/app/(frontend)/preview'];

export const EXPECTED_TREE = {
  bare: {
    required: BARE_REQUIRED,
    forbidden: [...MARKETING_ONLY, 'src/vexcms/blocks', 'src/vexcms/globals', ...ALWAYS_FORBIDDEN],
  },
  full: {
    required: [...BARE_REQUIRED, ...MARKETING_ONLY],
    forbidden: ALWAYS_FORBIDDEN,
  },
};

export const PROHIBITED_PATTERNS = [
  { label: 'object(', test: (source) => /\bobject\(/.test(source) },
  { label: 'ui(', test: (source) => /\bui\(/.test(source) },
  { label: 'tabs(', test: (source) => /\btabs\(/.test(source) },
  { label: 'imageUrl(', test: (source) => /\bimageUrl\(/.test(source) },
  { label: 'richtext(', test: (source) => /\brichtext\(/.test(source) },
  { label: 'blockStyles', test: (source) => /\bblockStyles\b/.test(source) },
  { label: '_vexDrafts', test: (source) => /_vexDrafts/.test(source) },
  {
    // Heuristic, not a parser: flags a scalar string literal following any
    // `defaultValue:` that appears after a `select(` earlier in the same
    // file. Good enough for a whole-output sweep (Step 4's Verify phrasing
    // is itself output-wide, not call-scoped).
    label: 'scalar select() defaultValue',
    test: (source) => /select\(\{[\s\S]*?defaultValue:\s*(?!\[)['"]/m.test(source),
  },
];

const PLACEHOLDER_RE = /\{\{[A-Z0-9_]+\}\}/g;
const SKIP_DIRS = new Set(['node_modules', '.git', '.next']);

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/**
 * Asserts a scaffolded project directory against the manifest for `mode`.
 * Pure/sync — callers scaffold with the installer first, then hand the
 * resulting `targetDir` here. `mode` is `"bare"` or `"full"`; a monorepo
 * scaffold is tree-identical to `"full"` (only its package.json protocol
 * differs, which callers assert separately).
 *
 * @param {{ targetDir: string, mode: "bare" | "full" }} props
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function assertScaffold({ targetDir, mode }) {
  const manifest = EXPECTED_TREE[mode];
  if (!manifest) throw new Error(`assertScaffold: unknown mode "${mode}"`);

  const errors = [];

  for (const rel of manifest.required) {
    if (!fs.existsSync(path.join(targetDir, rel))) {
      errors.push(`missing required path: ${rel}`);
    }
  }
  for (const rel of manifest.forbidden) {
    if (fs.existsSync(path.join(targetDir, rel))) {
      errors.push(`forbidden path present: ${rel}`);
    }
  }

  for (const file of walkFiles(targetDir)) {
    const source = fs.readFileSync(file, 'utf-8');
    const rel = path.relative(targetDir, file);

    const markers = source.match(PLACEHOLDER_RE);
    if (markers) {
      for (const marker of new Set(markers)) {
        errors.push(`surviving placeholder marker ${marker} in ${rel}`);
      }
    }

    if (!/\.(ts|tsx)$/.test(file)) continue;
    for (const { label, test } of PROHIBITED_PATTERNS) {
      if (test(source)) errors.push(`prohibited pattern "${label}" in ${rel}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function manifestSize(mode) {
  const manifest = EXPECTED_TREE[mode];
  return manifest.required.length + manifest.forbidden.length;
}

async function scaffoldToTemp({ mode, monorepo }) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vex-scaffold-smoke-'));
  const targetDir = monorepo
    ? path.join(tmpRoot, 'host-workspace', 'apps', 'smoke-project')
    : path.join(tmpRoot, 'smoke-project');

  if (monorepo) {
    fs.ensureDirSync(path.join(tmpRoot, 'host-workspace'));
    fs.writeFileSync(
      path.join(tmpRoot, 'host-workspace', 'pnpm-workspace.yaml'),
      'packages:\n  - "apps/*"\ncatalog: {}\n'
    );
  }
  fs.ensureDirSync(targetDir);

  const installer = createInstaller({ framework: 'nextjs', projectDir: targetDir, projectName: 'smoke-project' });
  await installer.initProject({
    projectName: 'smoke-project',
    projectDir: targetDir,
    framework: 'nextjs',
    port: 3010,
    bare: mode === 'bare',
    monorepo,
    yes: true,
    orgs: false,
    emailPasswordAuth: true,
    oauthProviders: [],
    initGit: false,
    installDependencies: false,
  });

  return { targetDir, tmpRoot };
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--bare') ? 'bare' : 'full';
  const monorepo = args.includes('--monorepo');

  const { targetDir, tmpRoot } = await scaffoldToTemp({ mode, monorepo });
  const { ok, errors } = assertScaffold({ targetDir, mode });
  fs.removeSync(tmpRoot);

  if (!ok) {
    console.error(`scaffold-smoke (${mode}${monorepo ? ', monorepo' : ''}) FAILED:`);
    for (const error of errors) console.error(`  x ${error}`);
    process.exit(1);
  }
  console.log(
    `scaffold-smoke (${mode}${monorepo ? ', monorepo' : ''}) passed — ` +
      `${manifestSize(mode)} tree assertions, 0 placeholder survivors, 0 prohibited patterns.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

Negative gate (AP-013) — a gate that has never been made to fail is a guess,
not a proof. `integration.test.ts` reads its template root from
`VEX_TEMPLATES_DIR_OVERRIDE` precisely so this procedure never has to edit
test source:

```sh
mkdir -p /tmp/vex-empty-templates
VEX_TEMPLATES_DIR_OVERRIDE=/tmp/vex-empty-templates pnpm --filter create-vexcms exec vitest run src/__tests__/integration.test.ts
# expect: FAILS — beforeAll throws "templates/base-nextjs is missing ... Step 3 ... has not landed."
rm -rf /tmp/vex-empty-templates

pnpm --filter create-vexcms test
# expect: PASSES (green) — restored to the real templates/ dir
```

- [ ] Negative-gate run against `/tmp/vex-empty-templates` recorded as FAILED
- [ ] Restore run (`pnpm --filter create-vexcms test`) recorded as PASSED

Verify: pnpm --filter create-vexcms test (green), then the negative gate: temporarily point the suite at an empty templates dir and confirm it FAILS before restoring

### Step 7 — Packed-tarball demo gate: `scripts/verify-scaffold.mjs` [agent]

This is the WP-2 demo gate: prove that `pnpm create vexcms` produces a working
project from the packed alpha tarballs, entirely outside this repo, before
anything is published to npm. `scripts/verify-scaffold.mjs` packs the 8
publishable packages into per-package tarballs (AP-017: one output dir each,
since every package shares the `0.1.0-alpha.1` version and a shared dir makes
"find the tarball for this package" ambiguous — `scripts/check-packed-manifests.mjs`
already hit this bug once), scaffolds both `templates/base-nextjs` (`--bare`)
and `templates/marketing-site` (full) via the built CLI's `--yes` flag
(Contract 8), overrides every `@vexcms/*` + `create-vexcms` dependency to a
`file:` tarball path so `pnpm install` resolves against exactly what will
ship, then runs `install`/`typecheck`/`build` per scaffold with streamed
output and a per-template summary. A `--negative` mode reuses the same
pipeline with one override mapping deliberately broken, so the gate proves
it can fail (AP-013) instead of being vacuously green.

- [x] `scripts/verify-scaffold.mjs` — new: packs the 8 publishable packages to a tmp store (one dir per package, AP-017), scaffolds `templates/base-nextjs` (`--bare`) and `templates/marketing-site` (full) outside the repo via the built CLI with `--yes`, injects `pnpm.overrides` pointing every packed package at its tarball, runs `pnpm install`/`typecheck`/`build` per scaffold with streamed output, prints a per-template pass/fail summary, and exits non-zero on any failure; `--keep` preserves the tmp dirs, `--negative` runs the AP-013 self-test
- [x] `package.json` — add the `verify:scaffold` script
- [x] `pnpm --filter "@vexcms/*" --filter create-vexcms build` — precondition run before the gate; the script asserts `dist/` exists for each publishable and fails fast naming this exact command if it doesn't, but never rebuilds itself
- [x] Run `node scripts/verify-scaffold.mjs` (both templates) and `node scripts/verify-scaffold.mjs --negative` (the negative test); record both outputs in the spec (the implement loop fills this in)

#### scripts/verify-scaffold.mjs

New file. Node ESM, kebab-case, zero external dependencies — packing uses
`pnpm pack` via `child_process`, scaffolding drives the built CLI's own
`dist/index.js` as a child process, and override injection is plain
`fs`/`JSON`. Mirrors `scripts/check-packed-manifests.mjs`'s per-package
mkdtemp pattern and `scripts/sync-template-versions.mjs`'s workspace-derived
package enumeration (`packages/*/package.json`, `!pkg.private`) — never a
hardcoded package list, since that list already rotted once through the
rebuild rename.

Both `--negative` outcomes intentionally `return 1`: if the corrupted
mapping makes `pnpm install` fail (expected), that failure — and the
resulting exit 1 — is the proof the gate works. If install unexpectedly
*succeeds* despite the broken mapping, that means the override injection
isn't actually pinning the scaffold to local tarballs, which is the more
alarming outcome and must not be allowed to exit 0 either. The printed
message, not the exit code, is what tells a human which branch happened —
matching the Verify line's literal "confirm exit 1".

```js
#!/usr/bin/env node

/**
 * Packed-tarball demo gate for `pnpm create vexcms`.
 *
 * Proves the WP-2 deliverable end to end, outside this repo, before the
 * alphas exist on npm: pack every publishable package, scaffold both
 * templates against those tarballs (not the workspace), and run a real
 * install + typecheck + build. This is the same class of proof
 * `scripts/check-packed-manifests.mjs --packed` uses for the manifest
 * invariants, extended to a full project build.
 *
 * Usage:
 *   node scripts/verify-scaffold.mjs             pack + scaffold both templates, install/typecheck/build each
 *   node scripts/verify-scaffold.mjs --keep      preserve the tmp pack/scaffold dirs for debugging
 *   node scripts/verify-scaffold.mjs --negative  AP-013 self-test: corrupt one override mapping and confirm
 *                                                 the pipeline (correctly) fails — see the file-level note
 *                                                 above `runNegativeSelfTest` for why exit is always 1
 *
 * Precondition (not performed here — a stale dist would silently pack stale
 * code): `pnpm --filter "@vexcms/*" --filter create-vexcms build`.
 *
 * Exits non-zero if any template's install/typecheck/build fails, or if the
 * negative self-test is requested (see above).
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const cliArgs = process.argv.slice(2);
const keep = cliArgs.includes("--keep");
const negative = cliArgs.includes("--negative");

/**
 * Derives the publishable package list from the workspace itself — a
 * hardcoded list already rotted once through the rebuild rename
 * (`@vexcms/ui` -> `@vexcms/react`, etc., see `sync-template-versions.mjs`).
 *
 * @returns {Array<{ dir: string, name: string }>} absolute package dir and
 *   its manifest name, for every non-private `packages/*` package.
 */
function readPublishablePackages() {
  const packagesDir = path.join(root, "packages");
  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDir, entry.name))
    .map((dir) => ({ dir, pkgPath: path.join(dir, "package.json") }))
    .filter(({ pkgPath }) => fs.existsSync(pkgPath))
    .map(({ dir, pkgPath }) => ({
      dir,
      pkg: JSON.parse(fs.readFileSync(pkgPath, "utf-8")),
    }))
    .filter(({ pkg }) => pkg.name && !pkg.private)
    .map(({ dir, pkg }) => ({ dir, name: pkg.name }));
}

/**
 * Fails fast with a precise, actionable message instead of a confusing
 * `pnpm pack`/`ENOENT` failure deep inside the pipeline.
 *
 * @param {Array<{ dir: string, name: string }>} publishables
 */
function assertBuilt(publishables) {
  const missing = [];

  for (const { dir, name } of publishables) {
    if (name === "create-vexcms") continue; // checked precisely below
    if (!fs.existsSync(path.join(dir, "dist"))) missing.push(name);
  }

  const cliEntry = path.join(root, "packages/create-vexcms/dist/index.js");
  if (!fs.existsSync(cliEntry)) missing.push("create-vexcms");

  if (missing.length > 0) {
    throw new Error(
      `missing build output for: ${missing.join(", ")}.\n` +
        `  Run: pnpm --filter "@vexcms/*" --filter create-vexcms build\n` +
        `  (this gate packs and scaffolds only — it never rebuilds, so a stale dist would silently pack stale code)`
    );
  }
}

/**
 * Packs every publishable package with `pnpm pack`, one destination
 * directory per package (AP-017) — every package shares the same
 * `0.1.0-alpha.1` version, so a shared output dir makes "find the tarball
 * for this package" ambiguous and silently attributes the first tarball to
 * every package.
 *
 * @param {Array<{ dir: string, name: string }>} publishables
 * @param {string} outRoot existing tmp directory to pack into
 * @returns {Map<string, string>} package name -> absolute tarball path
 */
function packPublishables(publishables, outRoot) {
  const tarballs = new Map();

  for (const { dir, name } of publishables) {
    const outDir = path.join(outRoot, path.basename(dir));
    fs.mkdirSync(outDir, { recursive: true });

    execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
      cwd: dir,
      stdio: "pipe",
    });

    const tarball = fs.readdirSync(outDir).find((file) => file.endsWith(".tgz"));
    if (!tarball) {
      throw new Error(`pnpm pack produced no .tgz for ${name} in ${outDir}`);
    }
    tarballs.set(name, path.join(outDir, tarball));
  }

  return tarballs;
}

/**
 * Runs one subprocess step with streamed stdio, recording pass/fail instead
 * of throwing — callers decide whether to continue the pipeline.
 *
 * @param {string} label human-readable step name for the summary
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {{ label: string, ok: boolean, exitCode: number | null, ms: number }}
 */
function runStep(label, command, args, cwd) {
  console.log(`  \u2192 ${label}`);
  const start = Date.now();
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  const ok = result.status === 0;
  const ms = Date.now() - start;
  console.log(
    ok
      ? `  \u2713 ${label} (${ms}ms)`
      : `  \u2717 ${label} \u2014 exit ${result.status} (${ms}ms)`
  );
  return { label, ok, exitCode: result.status, ms };
}

/**
 * Points every packed package's dependents at its local tarball instead of
 * the registry, via `pnpm.overrides` — this is what makes the install
 * actually exercise what would ship, rather than whatever `@vexcms/*`
 * version last hit npm.
 *
 * @param {string} projectDir absolute path to a scaffolded project
 * @param {Map<string, string>} tarballs package name -> absolute tarball path
 */
function injectOverrides(projectDir, tarballs) {
  const pkgPath = path.join(projectDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`${pkgPath} does not exist \u2014 scaffold did not produce a package.json`);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.pnpm = pkg.pnpm ?? {};
  pkg.pnpm.overrides = {
    ...pkg.pnpm.overrides,
    ...Object.fromEntries([...tarballs].map(([name, tarball]) => [name, `file:${tarball}`])),
  };

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

/**
 * Scaffolds one template via the built CLI, injects tarball overrides, then
 * runs install/typecheck/build — stopping at the first failing step so a
 * broken scaffold doesn't spend minutes typechecking a project that never
 * installed.
 *
 * @param {{ key: string, label: string, bare: boolean, cliEntry: string, scaffoldRoot: string, tarballs: Map<string, string> }} params
 * @returns {{ key: string, label: string, steps: Array<{ label: string, ok: boolean }> }}
 */
function runTemplate({ key, label, bare, cliEntry, scaffoldRoot, tarballs }) {
  console.log(`\n=== ${label} ===`);
  const steps = [];
  const ok = (step) => {
    steps.push(step);
    return step.ok;
  };

  const scaffoldArgs = [cliEntry, key, "--yes", ...(bare ? ["--bare"] : [])];
  if (!ok(runStep("scaffold (create-vexcms --yes)", "node", scaffoldArgs, scaffoldRoot))) {
    return { key, label, steps };
  }

  const projectDir = path.join(scaffoldRoot, key);
  const overrideStart = Date.now();
  try {
    injectOverrides(projectDir, tarballs);
    ok({ label: "inject pnpm.overrides", ok: true, ms: Date.now() - overrideStart });
    console.log(`  \u2713 inject pnpm.overrides (${Date.now() - overrideStart}ms)`);
  } catch (error) {
    ok({ label: "inject pnpm.overrides", ok: false, ms: Date.now() - overrideStart });
    console.error(`  \u2717 inject pnpm.overrides \u2014 ${error.message}`);
    return { key, label, steps };
  }

  const remainingSteps = [
    ["pnpm install", ["install", "--no-frozen-lockfile"]],
    ["pnpm typecheck", ["run", "typecheck"]],
    ["pnpm build", ["run", "build"]],
  ];
  for (const [stepLabel, args] of remainingSteps) {
    if (!ok(runStep(stepLabel, "pnpm", args, projectDir))) break;
  }

  return { key, label, steps };
}

/**
 * Templates exercised by the gate — `bare: true` drives the CLI's `--bare`
 * flag (base-nextjs shape, no marketing overlay), `bare: false` scaffolds
 * the full marketing-site overlay on top of it (Contract 2).
 */
const TEMPLATES = [
  { key: "base-nextjs", label: "templates/base-nextjs (--bare)", bare: true },
  { key: "marketing-site", label: "templates/marketing-site (full)", bare: false },
];

/**
 * @param {Array<{ key: string, label: string, steps: Array<{ label: string, ok: boolean }> }>} results
 * @returns {number} 0 if every template's steps were all green, else 1
 */
function printSummary(results) {
  console.log("\nSummary:");
  let failed = false;
  for (const { label, steps } of results) {
    const firstFailure = steps.find((step) => !step.ok);
    if (firstFailure) failed = true;
    console.log(
      firstFailure
        ? `  \u2717 ${label} \u2014 failed at "${firstFailure.label}"`
        : `  \u2713 ${label} \u2014 all steps green`
    );
  }
  return failed ? 1 : 0;
}

/**
 * AP-013 self-test: packs normally, then deliberately points the
 * `@vexcms/core` override at a tarball path that does not exist, and runs
 * the exact same `runTemplate` pipeline real invocations use (not a mocked
 * shortcut — a fake negative test that skips the real install proves
 * nothing).
 *
 * Both outcomes return 1 by design:
 * - `pnpm install` fails on the broken path (expected) \u2014 that failure is
 *   the proof this gate is not vacuously green.
 * - `pnpm install` unexpectedly succeeds \u2014 the override mechanism isn't
 *   actually pinning dependencies, which is the more alarming case and must
 *   not be allowed to exit 0 either.
 * The console message, not the exit code, tells a human which branch fired.
 *
 * @param {{ publishables: Array<{ dir: string, name: string }>, cliEntry: string }} params
 * @returns {number} always 1 \u2014 see above
 */
function runNegativeSelfTest({ publishables, cliEntry }) {
  console.log(
    "Negative self-test: pack normally, then corrupt the @vexcms/core override to point\n" +
      "at a tarball that does not exist. `pnpm install` MUST fail \u2014 that failure is what\n" +
      "proves this gate is not vacuously green (AP-013)."
  );

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negative-pack-"));
  const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negative-scaffold-"));

  try {
    const tarballs = packPublishables(publishables, packRoot);
    if (!tarballs.has("@vexcms/core")) {
      throw new Error("negative self-test expects @vexcms/core among the packed tarballs");
    }
    tarballs.set("@vexcms/core", path.join(packRoot, "core", "does-not-exist-0.0.0.tgz"));

    const { steps } = runTemplate({
      key: "negative-check",
      label: "negative self-test (--bare, broken @vexcms/core override)",
      bare: true,
      cliEntry,
      scaffoldRoot,
      tarballs,
    });

    const install = steps.find((step) => step.label === "pnpm install");
    if (install?.ok) {
      console.error(
        "\n\u2717 CRITICAL: pnpm install SUCCEEDED despite a broken @vexcms/core override mapping. " +
          "The override injection is not actually pinning the scaffold to local tarballs \u2014 " +
          "this gate cannot be trusted to catch a real packaging regression."
      );
      return 1;
    }

    console.log(
      "\n\u2713 negative self-test passed: pnpm install correctly failed on the broken mapping. " +
        "verify-scaffold.mjs is sensitive to a broken override, as required."
    );
    return 1;
  } finally {
    if (keep) {
      console.log(`--keep: preserved ${packRoot} and ${scaffoldRoot}`);
    } else {
      fs.rmSync(packRoot, { recursive: true, force: true });
      fs.rmSync(scaffoldRoot, { recursive: true, force: true });
    }
  }
}

function main() {
  console.log("verify-scaffold: packed-tarball demo gate\n");

  const publishables = readPublishablePackages();
  assertBuilt(publishables);
  const cliEntry = path.join(root, "packages/create-vexcms/dist/index.js");

  if (negative) {
    process.exit(runNegativeSelfTest({ publishables, cliEntry }));
  }

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-pack-"));
  const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-scaffold-"));

  let exitCode = 0;
  try {
    console.log(`Packing ${publishables.length} publishable package(s)...`);
    const tarballs = packPublishables(publishables, packRoot);
    for (const [name, tarball] of tarballs) {
      console.log(`  \u2713 ${name} \u2192 ${tarball}`);
    }

    const results = TEMPLATES.map((template) =>
      runTemplate({ ...template, cliEntry, scaffoldRoot, tarballs })
    );

    exitCode = printSummary(results);
  } finally {
    if (keep) {
      console.log(`\n--keep: preserved ${packRoot} and ${scaffoldRoot}`);
    } else {
      fs.rmSync(packRoot, { recursive: true, force: true });
      fs.rmSync(scaffoldRoot, { recursive: true, force: true });
    }
  }

  process.exit(exitCode);
}

try {
  main();
} catch (error) {
  console.error(`\nverify-scaffold: ${error.message}`);
  process.exit(1);
}
```

#### package.json

**1 — scripts.** Inside `scripts`, immediately after the `release` entry,
add the gate:

```json
"verify:scaffold": "node scripts/verify-scaffold.mjs",
```

Verify: node scripts/verify-scaffold.mjs (both `--bare` and full: scaffold outside the repo via `--yes`, apply overrides, pnpm install + typecheck + build, all green) && the negative test: break one tarball mapping and confirm exit 1

#### Recorded output

Precondition: `pnpm --filter "@vexcms/*" --filter create-vexcms build` (all 8 publishables
plus `create-vexcms` built clean before the gate ran; the gate never rebuilds itself).

`node scripts/verify-scaffold.mjs` (both templates, packed tarballs, scaffolded outside the
repo via `--yes`, `pnpm.overrides` injected, install/typecheck/build per scaffold — condensed
to the step markers and summary; the full run also streams `pnpm install`'s dependency tree and
`next build`'s route table, elided here as non-diagnostic):

```text
verify-scaffold: packed-tarball demo gate

Packing 8 publishable package(s)...
  ✓ @vexcms/better-auth → /tmp/vex-verify-pack-A1mqCi/better-auth/vexcms-better-auth-0.1.0-alpha.1.tgz
  ✓ @vexcms/cli → /tmp/vex-verify-pack-A1mqCi/cli/vexcms-cli-0.1.0-alpha.1.tgz
  ✓ @vexcms/core → /tmp/vex-verify-pack-A1mqCi/core/vexcms-core-0.1.0-alpha.1.tgz
  ✓ create-vexcms → /tmp/vex-verify-pack-A1mqCi/create-vexcms/create-vexcms-0.1.0-alpha.1.tgz
  ✓ @vexcms/file-storage-convex → /tmp/vex-verify-pack-A1mqCi/file-storage-convex/vexcms-file-storage-convex-0.1.0-alpha.1.tgz
  ✓ @vexcms/next → /tmp/vex-verify-pack-A1mqCi/next/vexcms-next-0.1.0-alpha.1.tgz
  ✓ @vexcms/react → /tmp/vex-verify-pack-A1mqCi/react/vexcms-react-0.1.0-alpha.1.tgz
  ✓ @vexcms/richtext-plate → /tmp/vex-verify-pack-A1mqCi/richtext-plate/vexcms-richtext-plate-0.1.0-alpha.1.tgz

=== templates/base-nextjs (--bare) ===
  ✓ scaffold (create-vexcms --yes) (280ms)
  ✓ inject pnpm.overrides (0ms)
  ✓ pnpm install (11256ms)
  ✓ pnpm typecheck (2493ms)
  ✓ pnpm build (9281ms)

=== templates/marketing-site (full) ===
  ✓ scaffold (create-vexcms --yes) (347ms)
  ✓ inject pnpm.overrides (0ms)
  ✓ pnpm install (9634ms)
  ✓ pnpm typecheck (2972ms)
  ✓ pnpm build (10334ms)

Summary:
  ✓ templates/base-nextjs (--bare) — all steps green
  ✓ templates/marketing-site (full) — all steps green
```

Exit code: `0`.

`node scripts/verify-scaffold.mjs --negative` (AP-013 self-test — packs normally, then points
the `@vexcms/core` override at a tarball that does not exist; both possible outcomes intentionally
`return 1`, so exit code alone can't distinguish them — the printed message is what a human reads):

```text
verify-scaffold: packed-tarball demo gate

Negative self-test: pack normally, then corrupt the @vexcms/core override to point
at a tarball that does not exist. `pnpm install` MUST fail — that failure is what
proves this gate is not vacuously green (AP-013).

=== negative self-test (--bare, broken @vexcms/core override) ===
  ✓ scaffold (create-vexcms --yes) (308ms)
  ✓ inject pnpm.overrides (0ms)
  → pnpm install
 ENOENT  ENOENT: no such file or directory, open '/tmp/vex-verify-negative-pack-xj0MP8/core/does-not-exist-0.0.0.tgz'

This error happened while installing a direct dependency of /tmp/vex-verify-negative-scaffold-gYi0wm/negative-check

  ✗ pnpm install — exit 254 (364ms)

✓ negative self-test passed: pnpm install correctly failed on the broken mapping. verify-scaffold.mjs is sensitive to a broken override, as required.
```

Exit code: `1` (expected branch: `pnpm install` failed on the corrupted mapping, proving the
override injection actually pins the scaffold to local tarballs rather than the registry).

A second, fully manual negative test (independent of `--negative`, run directly against a
`--keep`-preserved scaffold's `package.json`) corroborates the mechanism: hand-editing
`pnpm.overrides["@vexcms/core"]` to a nonexistent tarball path made `pnpm install` fail with the
same `ENOENT` (`exit 254`); restoring the original tarball path and re-running `pnpm install`
in the same directory succeeded again (`Done in 339ms`, exit `0`) — confirming the break was
real, isolated to the one mapping, and cleanly reversible.

### Step 8 — `template-sync` skill, docs, changesets [agent]

Why: the developer chose template *copies* over a `themeApi()`-style extraction — the only thing
keeping `templates/base-nextjs` and `templates/marketing-site` honest against apps/test over time is
a harness skill an agent can invoke after every future change ("add this to the templates"). The
root/docs quickstart one-liner was deliberately left as WP-4's manual-install stopgap pending real
templates; this step restores it now that Steps 3–7 shipped them. Changesets for the four touched
publishables must exist before the WP-5 alpha publish.

- [ ] `.agent/skills/template-sync/SKILL.md` — new skill
- [ ] `harness sync` — regenerate `context-rules.yaml`/bridges after adding the skill
- [ ] `README.md` — Quick Start stand-up sequence restored to the real `pnpm create vexcms@latest` flow
- [ ] `apps/docs/src/content/docs/guides/quickstart.mdx` — new Starlight guide, same one-liner + stand-up sequence
- [ ] `packages/create-vexcms/README.md` — full rewrite: flags, template inventory, stand-up sequence
- [ ] `.changeset/drop-collection-query-stub.md` — new (`@vexcms/core`, patch)
- [ ] `.changeset/drop-collection-generation.md` — new (`@vexcms/cli`, minor)
- [ ] `.changeset/render-blocks.md` — new (`@vexcms/react`, minor)
- [ ] `.changeset/create-vexcms-templates.md` — new (`create-vexcms`, minor)
- [ ] `harness doctor` — confirm zero new errors (verify gate)

#### .agent/skills/template-sync/SKILL.md

New skill. Frontmatter triggers match the three developer phrasings plus the slash form; model
role is `default` — classifying which template owns a diff and translating it through the
prohibited-pattern/marker/version rules is real judgment, not the mechanical rewrite `document`
(`smol`) does, but it is not the from-scratch design work `dev-spec`/`polish` (`slow`) do.

```markdown
---
name: template-sync
description: Keep the create-vexcms templates (`base-nextjs`, `marketing-site`) honest against
  the app they were authored from — apps/test is the source of truth, the templates are
  hand-maintained copies with no extraction layer. Triggers on "add this to the templates",
  "save this to the create templates", "sync templates", "/template-sync". Reads the just-landed
  diff, classifies which template owns it, and applies the app-to-template translation rules
  before reverifying both scaffolds.
harness_model_role: default
---

# Template Sync

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps
1. **Load the reference.** Read the app→template translation table in
   `.agent/docs/specs/2026-08-31-wp2-cli-templates/spec.md` before touching anything — it is the
   authoritative source-path → template-path → edit mapping this skill applies. Never invent a
   mapping the spec already states; if the just-landed change has no entry, extend the table in
   the spec first (small addition, same format) rather than guessing an ad hoc translation.
2. **Identify the just-landed change.** Prefer the current session's context (the diff just
   discussed or applied). Absent that, run `git status --porcelain` then `git diff` against the
   files it lists, scoped to `packages/core/src/**`, `packages/react/src/**`,
   `apps/test/src/**`, and `apps/test/convex/**` — the only trees a template copy is ever sourced
   from. Ignore changes under `.agent/`, `.changeset/`, `scripts/`, and the templates themselves.
3. **Classify ownership.** Decide which template(s) the change belongs in against the
   base-vs-overlay boundary: `templates/base-nextjs` owns auth, the admin panel, media, users,
   providers, env plumbing, and the first-admin bootstrap flow (`convex/vex/firstUser.ts`,
   `WelcomePage.tsx`) — never pages, blocks, themes, or site content.
   `templates/marketing-site` is an overlay applied over base with `overwrite: true` and owns
   pages/headers/footers/themes(+`themeColors`) collections, the `siteSettings` global, the 8
   colocated `blocks/<Name>/{config.ts,index.tsx}`, theme wiring copies (`ThemeStyle`,
   `ThemeLive`, `convex/theme.ts`), `convex/seed.ts`, and the frontend routes/components that
   render them. A file that exists in both trees (rare — e.g. a shared provider) is translated
   into both; grep both template roots for the source file's basename to check before assuming
   single ownership.
4. **Apply the translation rules** to every touched file, in this order:
   - **Strip sandbox junk.** Debug-only routes, `apps/test` fixtures, and dev-console scaffolding
     never cross into a template — apps/test and apps/test are allowed to carry junk a shipped
     scaffold is not.
   - **Preserve `{{...}}` installer markers.** Before overwriting a template file wholesale, diff
     it against its last-known translation to recover any `{{PROJECT_NAME}}` / OAuth / org / env
     markers and underscore-renamed dotfiles (`_gitignore`, `_env.example`, `_prettierrc`, …) it
     carries — cross-check the exact marker names against
     `packages/create-vexcms/src/installers/{base,nextjs,providers,string-utils}.ts`, the source
     of truth for what the installer substitutes. A marker silently dropped from a template is a
     scaffold that ships literal `{{PROJECT_NAME}}` in a user's project.
   - **Version protocol (Contract 5).** Third-party dependency versions in a template
     `package.json` are literals copied from the resolved `pnpm-workspace.yaml` catalog entry;
     `@vexcms/*` dependencies pin to the current workspace package version. Never write
     `catalog:` or `workspace:` into a template file — those protocols apply only during
     `--monorepo` rewriting. Re-run `node scripts/sync-template-versions.mjs` rather than
     hand-editing a version string.
   - **Prohibited-pattern sweep.** Grep every translated file for `object(`, `ui(`, `tabs(`,
     `imageUrl(`, `richtext(`, `admin.blockStyles`, a scalar (non-array) `select`
     `defaultValue`, `_vexDrafts`, `livePreview`, `vex_status`/`vex_version`, and any
     per-instance `admin.components.Field` — none may survive translation. These are current-API
     violations or unshipped-feature (versioning/drafts) leftovers, not stylistic nits.
   - **Regenerate template artifacts when schema/types changed.** If the change touched
     `vex.config.ts`, a collection, a block config, or anything under `packages/core/src/schema`,
     do not hand-edit the template's `convex/_generated/*`, `convex/vex.schema.ts`, or
     `src/vex.types.ts`. Follow the Step 3 procedure: scaffold the affected template to a tmp dir
     via the built installer, run `vex generate` there, then copy the produced artifacts back
     into the template tree.
5. **Verify.** Run `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs`
   (full marketing scaffold) — both must exit 0 before the sync is considered done, even when the
   change only touched base files (the marketing overlay is applied on top of base and can
   surface a base regression the bare run alone would miss).
6. **Record.** Append one line to `.agent/docs/harness-changelog.md`: date, the template files
   touched, a one-line summary of the translated change, and the trigger quote (e.g. `"add this
   to the templates"`) — same format as every other harness-changelog entry.
7. **Report.** List every template file added/changed/deleted, grouped by template, and confirm
   both `scaffold-smoke.mjs` runs exited 0. Nothing is synced silently.
```

#### README.md

Anchor: inside `## Quick Start`, the `cd my-site` / `pnpm dev` shell block and the following
`Then open …` line (immediately after the "By default this includes…" paragraph). The one-liner
scaffold command and its `--bare`/`--orgs` paragraph above are unchanged. The env-var/dev-command
sequence below replaces the old two-line stub with what Steps 3/7 actually proved: a fresh
scaffold needs `npx convex dev` once to mint real deployment URLs before `pnpm dev` can run, and
the first signed-up user is auto-promoted to admin rather than landing on `/admin` directly.

**1 — real stand-up sequence.**

````markdown
```bash
cd my-site
npx convex dev
```

First run only — this links or creates your Convex deployment and prints the real
`NEXT_PUBLIC_CONVEX_URL`/`NEXT_PUBLIC_CONVEX_SITE_URL`. Paste them into `.env.local`, replacing
the generated `https://placeholder.convex.cloud`/`.convex.site` values; leave `Ctrl-C` for now.

```bash
pnpm dev        # Next.js + convex dev + the vex watcher, together
```

Open `http://localhost:3010` (or your chosen port). Sign up — the first account is automatically
promoted to admin and redirected into `/admin`.
````

#### apps/docs/src/content/docs/guides/quickstart.mdx

New file — the docs-site counterpart to the README sequence above, in the guides autogenerate
group (`apps/docs/astro.config.mjs`'s `sidebar` already autogenerates `guides/`; no config change
needed).

````mdx
---
title: Quickstart
description: Scaffold a complete Next.js + Convex + VexCMS project and reach a signed-in admin panel in under five minutes.
---

VexCMS ships a scaffolding CLI that generates a complete Next.js + Convex project — auth, admin
panel, and (by default) a marketing site starter — ready to run.

## Scaffold a project

```bash
pnpm create vexcms@latest my-site
```

By default this includes the full marketing-site starter: pages, headers, footers, themes, and a
seeded home page built from the shipped content blocks. Pass `--bare` for an empty project with
no starter collections, or `--orgs` to enable multi-tenant organizations. See the
[`create-vexcms` flags reference](https://github.com/ianyimi/vex/blob/master/packages/create-vexcms/README.md)
for the full list, including `--monorepo` and `--yes`.

## Stand up your deployment

```bash
cd my-site
npx convex dev
```

The first run links or creates your Convex deployment and prints your real
`NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL`. Copy them into `.env.local`,
replacing the scaffolded `https://placeholder.convex.cloud` / `.convex.site` placeholders, then
stop the process.

## Run the dev servers

```bash
pnpm dev
```

This starts Next.js, `convex dev`, and the `vex` config watcher together. Open
`http://localhost:3010` (or the port you chose while scaffolding).

## Create your admin account

Sign up from the landing page. The **first** account created is automatically promoted to admin
and redirected into `/admin` — every VexCMS project boots from an empty database with no
pre-seeded credentials.

## Next steps

- Define your own content in `vex.config.ts` — see the [field types](/fields/text/) reference.
- Wire OAuth providers or organizations — see the [authentication guide](/guides/auth/).
- Adding VexCMS to an existing Next.js + Convex app instead of scaffolding fresh? See the root
  [README's manual setup section](https://github.com/ianyimi/vex#manual-setup).
````

#### packages/create-vexcms/README.md

Full rewrite. The prior version documented only `--bare`/`--orgs`, described the marketing
template's now-unshipped draft/preview/versioning fields, and split the stand-up sequence across
manual env-var edits and a `vex:dev`/`vex:generate` script pair the current templates don't ship.

````markdown
# create-vexcms

Scaffolding CLI for [VexCMS](https://github.com/ianyimi/vex) projects. Creates a complete
Next.js application with a Convex backend, Better Auth authentication, and a self-hosted admin
panel — ready to run.

## Usage

```bash
pnpm create vexcms@latest
```

Or with a project name:

```bash
pnpm create vexcms@latest my-project
```

Supports relative paths, including scaffolding straight into a monorepo app directory:

```bash
pnpm create vexcms@latest apps/website
```

## Flags

| Flag | Description |
|------|-------------|
| `--bare` | Skip the marketing-site overlay. Scaffolds `base-nextjs` alone — auth, admin panel, media, and no starter collections. |
| `--orgs` | Enable multi-tenant organizations (adds the Better Auth organizations plugin). |
| `--monorepo` | Scaffold into `apps/<name>` under the nearest ancestor `pnpm-workspace.yaml` instead of a standalone project. Rewrites `@vexcms/*` dependencies to `workspace:*` and any dependency present in the host workspace's catalog to `catalog:`; every other dependency stays a literal version. Skips `git init` and dependency install — the root workspace owns both. |
| `--yes` | Accept every interactive prompt's default (bare: no, orgs: no, port: `3010`, no OAuth providers, git init: yes, install: no) — no prompts at all. |

```bash
# Empty project, no pre-built collections
pnpm create vexcms@latest my-app --bare

# Project with multi-tenant organizations
pnpm create vexcms@latest my-app --orgs

# Non-interactive, defaults only
pnpm create vexcms@latest my-app --yes

# Inside a pnpm workspace, catalog-aware
pnpm create vexcms@latest my-app --monorepo --yes
```

## Interactive prompts

Skipped entirely by `--yes` (each falls back to its default); otherwise the CLI walks you
through:

1. **Project name** — validates npm package name rules; `.` scaffolds into the current directory
2. **Framework** — Next.js (TanStack Start is not yet implemented)
3. **Dev server port** — default `3010`
4. **Email/password auth** — enable or disable (default: yes)
5. **Organizations** — multi-tenant support (default: no; skipped if `--orgs` was passed)
6. **OAuth providers** — multi-select from Better Auth's supported providers
7. **Git repository** — run `git init` (default: yes; skipped under `--monorepo`)
8. **Install dependencies** — run the package manager install (default: no; skipped under `--monorepo`)

## Templates

### `base-nextjs`

The foundation every scaffold starts from — used alone when `--bare` is passed:

- Better Auth wired through `@vexcms/better-auth`, with email/password and any selected OAuth
  providers
- Admin panel mounted at `/admin` via `@vexcms/next`
- Media collection backed by `@vexcms/file-storage-convex`
- Users collection merged from the auth adapter
- First-admin bootstrap: the first account created anywhere in the project is auto-promoted to
  admin (`convex/vex/firstUser.ts`); until then, the home route renders a `WelcomePage` prompting
  sign-up instead of a `404`
- No pages, blocks, themes, or site content — `vex.config.ts` ships an empty `collections: []`
  overlay slot

### `marketing-site` (default)

An overlay applied over `base-nextjs` with file-level overwrite, adding a complete marketing
site:

- Collections: `pages`, `headers`, `footers`, `themes` (with a `themeColors` sub-shape)
- Global: `siteSettings` (active theme, admin theme, site name)
- 8 content blocks (`blocks/<Name>/{config.ts,index.tsx}`) rendered anywhere via `RenderBlocks`
  from `@vexcms/react` — no hand-rolled block-type switch
- Theme system: database-driven CSS custom properties (`ThemeStyle` for first paint,
  `ThemeLive` for live updates), seeded with four starter palettes
- `convex/seed.ts` — an idempotent `init` mutation seeding site settings, a header, a footer, the
  starter palettes, and a complete home page from the blocks' own defaults (`pnpm seed`)

## Getting started

After scaffolding:

```bash
cd my-project
pnpm install            # skip if you answered "yes" to install during scaffolding
```

### 1. Stand up your Convex deployment

```bash
npx convex dev
```

First run only — links or creates a Convex project and prints your real
`NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL`. Paste them into `.env.local`,
replacing the generated placeholder values so the app stops pointing at
`https://placeholder.convex.cloud`. Leave `Ctrl-C` once it reports functions are ready.

### 2. Configure environment variables

The installer writes `.env.local` with a generated `BETTER_AUTH_SECRET`,
`NEXT_PUBLIC_SITE_URL`, and `SITE_URL` already filled in — only the two Convex URLs above need
replacing for local dev. In the [Convex Dashboard](https://dashboard.convex.dev), add
`BETTER_AUTH_SECRET` and `SITE_URL` under **Settings → Environment Variables** using the same
values so server-side auth checks and email links resolve correctly.

### 3. Run the dev servers

```bash
pnpm dev        # Next.js + convex dev + the vex config watcher, together
```

### 4. Create your admin account

Open `http://localhost:3010` (or your chosen port) and sign up. The first account created is
automatically promoted to admin and redirected into `/admin`.

### Available scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js, `convex dev`, and the `vex` watcher together |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check the project |
| `pnpm seed` | Run the marketing-site seed mutation (marketing-site only) |
| `pnpm secret:create` | Generate a random 32-character secret and copy it to the clipboard |

## Monorepo mode (`--monorepo`)

Run from inside an existing pnpm workspace to scaffold a new app under it instead of a
standalone project:

```bash
pnpm create vexcms@latest my-app --monorepo --yes
```

The installer walks up from the current directory for the nearest `pnpm-workspace.yaml`, targets
`apps/my-app`, rewrites every `@vexcms/*` dependency to `workspace:*` and any dependency also
present in the host workspace's catalog to `catalog:` (other dependencies keep literal
versions), and skips both `git init` and dependency install — the root workspace owns them.

## Versioning

`create-vexcms` is versioned alongside every `@vexcms/*` package. Running
`pnpm create vexcms@latest` always scaffolds with the latest package versions; pin a specific
release the same way:

```bash
pnpm create vexcms@0.1.0
```

The scaffolded project's `@vexcms/*` dependencies match the version of `create-vexcms` used to
generate it.

## License

Apache-2.0
````

#### .changeset/drop-collection-query-stub.md

```markdown
---
"@vexcms/core": patch
---

Remove the dead `generateCollectionQueries` stub and its `GENERATED_HEADER`/
`CollectionQueryImports` exports. Rebuild's runtime API is factory-registered
(`collectionsApi`, globals/media factories) — nothing consumed the per-collection generator,
which only ever returned `{}`.
```

#### .changeset/drop-collection-generation.md

```markdown
---
"@vexcms/cli": minor
---

Drop per-collection Convex file generation (`generateCollectionFiles`, and the call to it from
`vex generate`/`vex dev`). The emitted `convex/vex/api/*` and `convex/vex/model/api/*` files had
no consumers under the factory-registered runtime API (`collectionsApi` et al.) — `vex
generate`/`vex dev` now only write `vex.schema.ts` and `vex.types.ts`.

BREAKING: a project relying on the generated per-collection query/mutation files must migrate to
the factory-registered API exposed by `@vexcms/core`. Bumped `minor` rather than `major` —
these packages are pre-1.0 alpha.
```

#### .changeset/render-blocks.md

```markdown
---
"@vexcms/react": minor
---

Add `RenderBlocks` — a generic, typed dispatcher for `blocks()` field content: a `components`
map keyed by `blockType`, each entry narrowed via `Extract<TBlock, { blockType: K }>`, an
optional `fallback` for unrecognized block types, and `block.id` as the React key. Exported
alongside `RenderBlocksProps`, `BlockComponents`, and `BlockComponentProps`. Replaces the
hand-rolled block-type switch every consumer previously wrote — proven against `apps/test`'s
`PageContent` — and is what both `create-vexcms` templates use to render page, header, and
footer content.
```

#### .changeset/create-vexcms-templates.md

```markdown
---
"create-vexcms": minor
---

Ship real `base-nextjs` and `marketing-site` templates, previously README stubs: auth, admin
panel, media, users, and the first-admin bootstrap flow in `base-nextjs`; pages, headers,
footers, themes, `siteSettings`, 8 marketing blocks, theme wiring, and seed data in the
`marketing-site` overlay. Add `--monorepo` (catalog-aware, targets `apps/<name>` under the
nearest `pnpm-workspace.yaml`) and `--yes` (accepts every prompt's default) flags.
```

**Prerelease-mode note.** `.changeset/pre.json` has `"mode": "pre"` (tag `alpha`), so `changeset
version` does not apply these patch/minor bumps directly — while in pre mode every non-major
changeset only increments the shared prerelease integer (`0.1.0-alpha.N` → `0.1.0-alpha.N+1`).
The `patch`/`minor` distinction above is not cosmetic, though: it is stored in each changeset and
consulted the moment `changeset pre exit` cuts the first stable release, and it drives which
CHANGELOG.md section (`Patch Changes` vs `Minor Changes`) each entry lands under today. Separately,
all four packages plus `@vexcms/next`, `@vexcms/better-auth`, `@vexcms/file-storage-convex`, and
`@vexcms/richtext-plate` sit in the same `fixed` group in `.changeset/config.json` — they release
in lockstep at the same version number, so `pnpm changeset status` reports all eight, not just the
four with new changesets here.

Verify: harness doctor (no new errors) && pnpm changeset status shows core, cli, react, create-vexcms

## Verification

1. Step gates, in order — each leaves the workspace green:
   full `pnpm install && pnpm build && pnpm typecheck` + zero live `apps/www`
   references + `harness doctor` (Step 0),
   `pnpm --filter @vexcms/core --filter @vexcms/cli build typecheck test` (Step 1),
   `pnpm --filter @vexcms/react test build && pnpm --filter test typecheck build` (Step 2),
   `node scripts/scaffold-smoke.mjs --bare` / (full) (Steps 3–4),
   in-repo `--monorepo` scaffold + `pnpm --filter <name> typecheck` (Step 5),
   `pnpm --filter create-vexcms test` + the AP-013 negative gate (Step 6),
   `node scripts/verify-scaffold.mjs` both templates + negative test (Step 7),
   `harness doctor` + `pnpm changeset status` (Step 8).
2. Whole-workspace close-out: `pnpm build && pnpm typecheck && pnpm test`
   (974-test baseline from WP-C; Step 1 removes 1 dead file and adds 9 tests,
   Step 2 adds 4).
3. The WP-2 demo gate (launch plan): in a clean directory outside the repo,
   create → install → typecheck → build all green — this is Step 7's script,
   executed for both templates, before WP-5 publishes anything.
