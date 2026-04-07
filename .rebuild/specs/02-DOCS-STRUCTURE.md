# 02 — Docs Structure + Feature Build Pipeline

## Overview

Establishes the VexCMS Starlight docs structure, the `DefaultsShowcase` Astro component,
the `feature-checklist.md` standards file, four focused sub-agent skills, and updates to
`/dev-spec` and `/guide` to complete the agent-assisted feature build pipeline.

After this spec, every new feature you build has a clear, repeatable pipeline:
build → `/sync-spec` → sub-agents (JSDoc, guide, typecheck, test) → done.

## Design Decisions

- **By-package nav with two audience sections per package.** Each package (`core`, `react`, `next`,
  `cli`) has "Using VexCMS" (end-user guides: defaults, examples) and "Extending VexCMS"
  (adapter-author guides: interface callouts, minimal impl). Cross-package concepts link between sections.
- **Sub-agents are narrow by design.** Each agent skill file covers exactly one task and reads
  only what it needs. This keeps them fast, focused, and maintainable as the codebase grows.
- **Context-switch detection is git-diff-based.** When `/dev-spec` runs, it checks unchecked spec
  boxes against the filesystem. If a file exists but its box is unchecked, the agent notes it as
  likely resolved and checks git diff to confirm before auto-running sync-spec.
- **`DefaultsShowcase` takes a plain JSON prop.** No coupling to field implementations — the guide
  author (or `/guide` agent) passes in a defaults object. The component renders a styled table.
- **Roadmap.json links to specs.** Each milestone entry gets a `spec` field pointing to the spec file.

## Out of Scope

- Actual guide content for any feature (written as features are built via `/guide`)
- DefaultsShowcase receiving live data from field implementations (future spec)
- A full pipeline orchestration skill (user runs sub-agents individually or via `/feature-checklist`)
- Updating roadmap.md page layout beyond adding spec links

## Target Directory Structure

```
apps/docs/
├── src/
│   ├── components/
│   │   └── DefaultsShowcase.astro       # NEW — defaults table component
│   └── content/docs/
│       ├── index.mdx                    # UPDATE — VexCMS intro with package cards
│       ├── roadmap.md                   # UPDATE — milestone entries link to specs
│       ├── core/
│       │   ├── index.mdx                # NEW — core package overview
│       │   ├── using/
│       │   │   └── index.mdx            # NEW — "Using VexCMS" landing for core
│       │   └── extending/
│       │       └── index.mdx            # NEW — "Extending VexCMS" landing for core
│       ├── react/
│       │   ├── index.mdx                # NEW — react package overview
│       │   └── using/
│       │       └── index.mdx            # NEW — "Using VexCMS" landing for react
│       └── next/
│           ├── index.mdx                # NEW — next package overview
│           └── using/
│               └── index.mdx            # NEW — "Using VexCMS" landing for next
├── astro.config.mjs                     # UPDATE — full sidebar config
│
agent-os/
└── standards/
    └── feature-checklist.md             # NEW — what "done" means for every feature
│
.claude/commands/
├── jsdoc-agent.md                       # NEW — sub-agent: write missing JSDoc
├── guide-agent.md                       # NEW — sub-agent: write MDX guide
├── typecheck-agent.md                   # NEW — sub-agent: run tsc, report errors
├── test-agent.md                        # NEW — sub-agent: run vitest, report failures
├── dev-spec.md                          # UPDATE — Phase 0 context check + embed checklist
└── guide.md                             # UPDATE — two audience types + DefaultsShowcase usage
```

## Implementation Order

1. **Step 1** — Sidebar config + folder structure. After this, `pnpm dev` shows the correct nav.
2. **Step 2** — `DefaultsShowcase` component. After this, guides can use it immediately.
3. **Step 3** — `agent-os/standards/feature-checklist.md`. After this, the standard is written down.
4. **Step 4** — Four sub-agent skill files. After this, each pipeline task has a focused agent.
5. **Step 5** — Update `/dev-spec` and `/guide`. After this, the full pipeline is wired up.

---

## Step 1: Sidebar Config + Folder Structure

Restructure the docs content directory and update `astro.config.mjs` with the full sidebar.

- [ ] Create `apps/docs/src/content/docs/core/index.mdx`
- [ ] Create `apps/docs/src/content/docs/core/using/index.mdx`
- [ ] Create `apps/docs/src/content/docs/core/extending/index.mdx`
- [ ] Create `apps/docs/src/content/docs/react/index.mdx`
- [ ] Create `apps/docs/src/content/docs/react/using/index.mdx`
- [ ] Create `apps/docs/src/content/docs/next/index.mdx`
- [ ] Create `apps/docs/src/content/docs/next/using/index.mdx`
- [ ] Update `apps/docs/src/content/docs/index.mdx`
- [ ] Update `apps/docs/src/data/roadmap.json` to add `spec` field to each milestone
- [ ] Update `apps/docs/src/content/docs/roadmap.md` to show spec links
- [ ] Update `apps/docs/astro.config.mjs`
- [ ] Run `pnpm dev --filter docs` — verify sidebar renders correctly with no errors

### File: `apps/docs/astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypedoc from 'starlight-typedoc';

export default defineConfig({
  integrations: [
    starlight({
      title: 'VexCMS',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ianyimi/vex' }],
      plugins: [
        starlightTypedoc({
          entryPoints: ['../../packages/core/src/index.ts'],
          tsconfig: '../../packages/core/tsconfig.json',
          output: 'api/core',
          sidebar: { label: 'API Reference', collapsed: true },
        }),
      ],
      sidebar: [
        { label: 'Introduction', slug: 'index' },
        { label: 'Roadmap', slug: 'roadmap' },
        {
          label: 'Core',
          items: [
            { label: 'Overview', slug: 'core/index' },
            {
              label: 'Using VexCMS',
              autogenerate: { directory: 'core/using' },
            },
            {
              label: 'Extending VexCMS',
              autogenerate: { directory: 'core/extending' },
            },
            // API Reference injected by starlight-typedoc under api/core
          ],
        },
        {
          label: 'React',
          items: [
            { label: 'Overview', slug: 'react/index' },
            {
              label: 'Using VexCMS',
              autogenerate: { directory: 'react/using' },
            },
          ],
        },
        {
          label: 'Next.js',
          items: [
            { label: 'Overview', slug: 'next/index' },
            {
              label: 'Using VexCMS',
              autogenerate: { directory: 'next/using' },
            },
          ],
        },
      ],
    }),
  ],
});
```

### File: `apps/docs/src/content/docs/index.mdx`

```mdx
---
title: VexCMS
description: A full-stack CMS built on Convex and Next.js.
template: splash
hero:
  tagline: Type-safe content management for modern Next.js apps.
  actions:
    - text: Get started
      link: /core/
      icon: right-arrow
    - text: View roadmap
      link: /roadmap/
      icon: list-format
      variant: minimal
---

import { CardGrid, Card } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="@vexcms/core" icon="puzzle">
    Field types, schema generation, and the framework adapter contract.
    [Core docs →](/core/)
  </Card>
  <Card title="@vexcms/react" icon="react">
    React field components and the ReactHKT adapter.
    [React docs →](/react/)
  </Card>
  <Card title="@vexcms/next" icon="rocket">
    Next.js page, layout, and server utilities.
    [Next.js docs →](/next/)
  </Card>
</CardGrid>
```

### File: `apps/docs/src/content/docs/core/index.mdx`

```mdx
---
title: Core
description: The framework-agnostic foundation of VexCMS — field types, schema generation, and the framework adapter contract.
---

`@vexcms/core` provides everything that is not tied to a UI framework:
field type definitions, Convex schema generation, Zod input schemas, and
the `defineFrameworkAdapter` contract that React and Next packages implement.

## Sections

- **[Using VexCMS](/core/using/)** — Define collections, configure fields, generate schemas.
- **[Extending VexCMS](/core/extending/)** — Build custom field types and framework adapters.
- **[API Reference](/api/core/)** — Full TypeDoc-generated reference for all exports.
```

### File: `apps/docs/src/content/docs/core/using/index.mdx`

```mdx
---
title: Using VexCMS — Core
description: How to define collections and fields using @vexcms/core.
---

Guides for developers using `@vexcms/core` to configure their CMS.

Guides in this section will be added as features are implemented.
```

### File: `apps/docs/src/content/docs/core/extending/index.mdx`

```mdx
---
title: Extending VexCMS — Core
description: How to build custom field types and framework adapters.
---

Guides for adapter authors extending VexCMS with custom implementations.

Guides in this section will be added as features are implemented.
```

### File: `apps/docs/src/content/docs/react/index.mdx`

```mdx
---
title: React
description: React field components and the ReactHKT framework adapter for VexCMS.
---

`@vexcms/react` provides the React implementation of the VexCMS framework adapter —
field input and cell components typed via `ReactHKT`.

## Sections

- **[Using VexCMS](/react/using/)** — Use React field components in your admin UI.
- **[API Reference](/api/core/)** — Shared types live in `@vexcms/core`.
```

### File: `apps/docs/src/content/docs/react/using/index.mdx`

```mdx
---
title: Using VexCMS — React
description: How to use @vexcms/react field components.
---

Guides for developers building admin UIs with `@vexcms/react`.

Guides in this section will be added as features are implemented.
```

### File: `apps/docs/src/content/docs/next/index.mdx`

```mdx
---
title: Next.js
description: Next.js page, layout, and server utilities for VexCMS.
---

`@vexcms/next` re-exports everything from `@vexcms/react` and adds
Next.js-specific utilities for server components and route handlers.

## Sections

- **[Using VexCMS](/next/using/)** — Set up VexCMS admin routes in a Next.js app.
```

### File: `apps/docs/src/content/docs/next/using/index.mdx`

```mdx
---
title: Using VexCMS — Next.js
description: How to set up VexCMS in a Next.js application.
---

Guides for developers integrating VexCMS into Next.js apps.

Guides in this section will be added as features are implemented.
```

### File: `apps/docs/src/data/roadmap.json` (UPDATE)

Add a `spec` field to each milestone pointing to the spec file. Example for the first milestone:

```json
{
  "milestones": [
    {
      "version": "0.1.0-alpha",
      "label": "Core Foundation",
      "status": "in_progress",
      "spec": ".rebuild/specs/01-CORE-REACT-INTEGRATION.md",
      "description": "Field system, schema generation, React adapter, CLI tooling, docs site.",
      "features": [...]
    }
  ]
}
```

---

## Step 2: DefaultsShowcase Component

An Astro component that renders a styled defaults reference table. Used in end-user guides
to show what each default value is and what it means — replacing the raw JSDoc defaults block.

- [ ] Create `apps/docs/src/components/DefaultsShowcase.astro`
- [ ] Restart `pnpm dev` and verify no component errors

### File: `apps/docs/src/components/DefaultsShowcase.astro`

The component takes a `defaults` prop — a JSON object where each key is a config property name
and the value has `default` (the actual default value as a string) and `description` (what it does).
Optional `title` prop labels the table.

```astro
---
/**
 * Renders a reference table of default values for a field or config object.
 *
 * Used in end-user guides to show what each option defaults to and what it means.
 * The /guide agent populates this from the JSDoc defaults block on Input types.
 *
 * @example
 * ```mdx
 * import DefaultsShowcase from '../../../components/DefaultsShowcase.astro';
 *
 * <DefaultsShowcase
 *   title="text() defaults"
 *   defaults={{
 *     required:      { default: 'false',   description: 'Field is optional by default' },
 *     'admin.hidden':    { default: 'false',   description: 'Visible in the admin form' },
 *     'admin.readOnly':  { default: 'false',   description: 'Editable by default' },
 *     'admin.position':  { default: '"main"',  description: 'Placed in the main content column' },
 *     'admin.width':     { default: '"full"',  description: 'Spans the full form width' },
 *   }}
 * />
 * ```
 */

interface DefaultEntry {
  default: string;
  description: string;
}

interface Props {
  defaults: Record<string, DefaultEntry>;
  title?: string;
}

const { defaults, title } = Astro.props;
const entries = Object.entries(defaults);
---

<div class="defaults-showcase not-content">
  {title && <p class="defaults-title">{title}</p>}
  <table>
    <thead>
      <tr>
        <th>Property</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {entries.map(([key, entry]) => (
        <tr>
          <td><code>{key}</code></td>
          <td><code>{entry.default}</code></td>
          <td>{entry.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<style>
  .defaults-showcase {
    margin: 1.5rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--sl-color-gray-5);
  }

  .defaults-title {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--sl-color-gray-3);
    padding: 0.5rem 1rem;
    margin: 0;
    background: var(--sl-color-gray-6);
    border-bottom: 1px solid var(--sl-color-gray-5);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th {
    text-align: left;
    padding: 0.5rem 1rem;
    background: var(--sl-color-gray-6);
    font-weight: 600;
    color: var(--sl-color-gray-2);
    border-bottom: 1px solid var(--sl-color-gray-5);
  }

  td {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--sl-color-gray-6);
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }

  code {
    font-size: 0.8rem;
    background: var(--sl-color-gray-6);
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
  }
</style>
```

---

## Step 3: Feature Checklist Standards File

The canonical definition of "done" for every developer-facing feature. Agents read this
when running `/feature-checklist`. Developers reference it when building.

- [ ] Create `agent-os/standards/` directory
- [ ] Create `agent-os/standards/feature-checklist.md`

### File: `agent-os/standards/feature-checklist.md`

```markdown
# Feature Build Checklist

Every developer-facing feature in VexCMS is complete when all items below are checked off.
Run `/feature-checklist <feature>` to check status automatically.

Sub-agents run in this order: JSDoc → guide → typecheck → test.
Each must pass before the next runs.

---

## 1. Implementation

- [ ] All function bodies implemented — no `throw new Error("Not implemented")`
- [ ] No `// TODO: implement` comments remaining
- [ ] No `as any` casts used as placeholders
- [ ] All edge cases from the spec handled

## 2. Types

- [ ] Input types (`*Input`) have all properties optional
- [ ] Resolved types are explicit interfaces — not `Required<InputType>` or mapped types
- [ ] Properties with defaults are required in the resolved type
- [ ] Properties meaningless when absent (`placeholder`, `description`, `components`) are optional in both types
- [ ] No untyped `any` without an explanatory comment

## 3. JSDoc (run `/jsdoc-agent <file>`)

- [ ] Every exported **function**: summary line, `@param props.fieldName` per field, `@returns`, ≥1 `@example`
- [ ] Every **Input type**: summary, defaults block with `//` comments, `@example` blocks, `@see` to resolved type
- [ ] Every **resolved type**: one-sentence summary, `@see` back to Input type
- [ ] Every **interface property**: one-sentence description
- [ ] No empty JSDoc blocks

## 4. Exports

- [ ] Exported from the package's `src/index.ts`
- [ ] If used by framework packages, exported from `@vexcms/core`
- [ ] No internal helpers accidentally exported

## 5. Docs — End-User Guide (run `/guide-agent <feature> --audience end-user`)

For features used by developers importing the package:

- [ ] Guide exists at `apps/docs/src/content/docs/<package>/using/<feature>.mdx`
- [ ] Guide includes `DefaultsShowcase` with all default values and descriptions
- [ ] Guide includes at least one complete, copy-pasteable code example
- [ ] For fields with options (select, etc.): all valid values shown with descriptions
- [ ] Framework tabs included where the feature differs per framework

## 6. Docs — Adapter Guide (run `/guide-agent <feature> --audience adapter-author`)

For features that adapter authors implement (adapters, plugins, custom field types):

- [ ] Guide exists at `apps/docs/src/content/docs/<package>/extending/<feature>.mdx`
- [ ] Guide includes a TypeScript interface callout showing the exact contract to satisfy
- [ ] Guide includes a minimal complete implementation example
- [ ] Guide links to the API reference page for the relevant interface

## 7. Typecheck (run `/typecheck-agent <package>`)

- [ ] `pnpm --filter <package> typecheck` passes with no errors

## 8. Tests (run `/test-agent <package>`)

- [ ] `pnpm --filter <package> test` passes with no failures
- [ ] New behavior has at least one test covering the happy path
- [ ] Edge cases from the spec have corresponding tests

## 9. Roadmap

- [ ] Feature status updated to `"done"` in `apps/docs/src/data/roadmap.json`

---

## Notes on adapter/plugin features

Adapter features (framework adapters, auth adapters, storage adapters) always require
**both** an end-user guide (how to configure it) and an adapter-author guide (how to
implement it). They are separate pages in different sections.

Plugin features that add new field types require:
- End-user guide for the field (defaults + examples)
- Adapter-author guide if the field has extension points (custom render components)
- New entry in `AdminField` union → all `defineFrameworkAdapter` call sites get a type error
  until they add the new field's component slots
```

---

## Step 4: Sub-Agent Skill Files

Four focused skill files. Each agent reads only what it needs and does exactly one task.
These are invoked by `/feature-checklist` and can also be run manually.

- [ ] Create `.claude/commands/jsdoc-agent.md`
- [ ] Create `.claude/commands/guide-agent.md`
- [ ] Create `.claude/commands/typecheck-agent.md`
- [ ] Create `.claude/commands/test-agent.md`

### File: `.claude/commands/jsdoc-agent.md`

```markdown
# JSDoc Agent — Write Missing JSDoc for a File

Read a source file, identify every exported symbol with missing or incomplete JSDoc,
and write the correct JSDoc following VexCMS conventions. Nothing else.

## Usage

/jsdoc-agent <file-path>

**Examples:**
- `/jsdoc-agent packages/core/src/fields/text/types.ts`
- `/jsdoc-agent packages/core/src/fields/text/config.ts`

---

## Instructions

1. Read the file at the given path
2. Read `agent-os/standards/feature-checklist.md` section 3 (JSDoc requirements)
3. For each exported symbol, check the JSDoc requirements:
   - Functions: summary, `@param props.fieldName` per field, `@returns`, ≥1 `@example`
   - Input types: summary, defaults block with `//` comments, `@example`, `@see`
   - Resolved types: one-sentence summary, `@see` back to Input type
   - Interface properties: one-sentence description
4. Write missing or incomplete JSDoc directly into the file
5. Do NOT change any implementation code — only JSDoc comments
6. Report what was added or updated

## Key Principles

- Read the implementation before writing docs — describe what the code actually does
- Follow the `/document` skill conventions exactly
- Do not add JSDoc to non-exported symbols
- Do not change function signatures, types, or implementations
```

### File: `.claude/commands/guide-agent.md`

```markdown
# Guide Agent — Write an MDX Guide for a Feature

Read a feature's implementation and JSDoc, then write the appropriate MDX guide page.
Audience is required — end-user or adapter-author. Nothing else.

## Usage

/guide-agent <feature> --audience <end-user|adapter-author>

**Examples:**
- `/guide-agent text field --audience end-user`
- `/guide-agent defineFrameworkAdapter --audience adapter-author`
- `/guide-agent storage adapter --audience adapter-author`

---

## Instructions

1. Find the relevant source files in `packages/` for the named feature
2. Read the exported functions, types, JSDoc
3. Read `agent-os/standards/feature-checklist.md` sections 5 and 6 for guide requirements
4. Determine the output path based on audience:
   - `end-user` → `apps/docs/src/content/docs/<package>/using/<feature-slug>.mdx`
   - `adapter-author` → `apps/docs/src/content/docs/<package>/extending/<feature-slug>.mdx`
5. Write the guide following the rules below

### End-user guide structure

```mdx
---
title: <Feature Name>
description: <one sentence>
---

## Overview
One paragraph: what this is and when you use it.

## Defaults

import DefaultsShowcase from '../../../components/DefaultsShowcase.astro';

<DefaultsShowcase
  title="<feature>() defaults"
  defaults={{
    // populate from JSDoc defaults block on the Input type
  }}
/>

## Usage

Minimal example, then a more complete example showing common options.
Framework tabs if behavior differs between React/Next.

## Options

For fields with select/union options: table of all valid values with descriptions.
```

### Adapter-author guide structure

```mdx
---
title: <Feature Name> — Adapter Author Guide
description: <one sentence>
---

## Overview
What this adapter/interface does and when you'd implement it.

## Interface

import { Aside } from '@astrojs/starlight/components';

<Aside type="tip" title="TypeScript contract">
Show the key interface the implementer must satisfy. Link to API reference.
</Aside>

## Minimal implementation

The smallest valid implementation — copy-pasteable starting point.

## Complete example

Full working example with all options shown.
```

## Key Principles

- Read the code first — describe what it actually does
- DefaultsShowcase is mandatory in end-user guides
- TypeScript interface callout is mandatory in adapter-author guides
- No guide is written for unimplemented features
```

### File: `.claude/commands/typecheck-agent.md`

```markdown
# Typecheck Agent — Run TypeScript Type Check

Run `pnpm typecheck` for a specific package and report any errors. Nothing else.

## Usage

/typecheck-agent <package-name>

**Examples:**
- `/typecheck-agent @vexcms/core`
- `/typecheck-agent @vexcms/react`

---

## Instructions

1. Run: `pnpm --filter <package-name> typecheck`
2. If it passes: report "Typecheck passed for <package>"
3. If it fails: report each error with file path and line number
4. Do NOT fix any errors — report only
5. If the `typecheck` script doesn't exist in the package, run `tsc --noEmit` directly

## Key Principles

- Report only. Do not edit any files.
- Include the exact error message and location for each failure.
```

### File: `.claude/commands/test-agent.md`

```markdown
# Test Agent — Run Tests for a Package

Run `pnpm test` for a specific package and report results. Nothing else.

## Usage

/test-agent <package-name>

**Examples:**
- `/test-agent @vexcms/core`
- `/test-agent @vexcms/cli`

---

## Instructions

1. Run: `pnpm --filter <package-name> test`
2. If all tests pass: report "All tests passed for <package> — N tests"
3. If tests fail: report each failing test with:
   - Test name and file path
   - Expected vs received values
   - The specific assertion that failed
4. Do NOT fix any failures — report only

## Key Principles

- Report only. Do not edit any files.
- Include the full test name path (describe block → test name).
- If no tests exist, report that and note which files lack coverage.
```

---

## Step 5: Update `/dev-spec` and `/guide`

Add Phase 0 (context check) to `/dev-spec` and update `/guide` to use audience-specific
structure and reference `DefaultsShowcase`.

- [ ] Update `.claude/commands/dev-spec.md` — add Phase 0 before Phase 1
- [ ] Update `.claude/commands/guide.md` — replace Phase 2 and structure with audience split

### Phase 0 addition for `dev-spec.md`

Add this as the first phase, before "Phase 1: Understand the Feature":

```markdown
### Phase 0: Context Check

Before starting, check whether any previous spec work is in an unresolved state:

1. Find all spec files in `.rebuild/specs/`
2. For each spec with unchecked `- [ ]` boxes:
   a. Check if the file referenced in the checkbox exists in the codebase
   b. If the file exists but the box is unchecked: run `git diff HEAD~5 -- <file>` to confirm
      it was recently changed. If yes, note to the user: "It looks like you resolved
      [step] — I'll run sync-spec to update the spec." Then spawn a sub-agent to run sync-spec.
   c. If the context switched mid-conversation (the user started discussing something unrelated
      before the previous task was marked done): note it briefly — "Checking if [step] was
      resolved..." — check the git diff, and if code changed, run sync-spec silently. If no
      change found, continue without interrupting.
3. After resolving any carry-over items, proceed to Phase 1.

Do NOT block on this. If nothing is unresolved, skip to Phase 1 with no mention of it.
A brief "Checking for unresolved work..." thinking message is acceptable.
After sync-spec runs for any resolved items, the pipeline sub-agents run in order:
jsdoc-agent → guide-agent (end-user, then adapter if applicable) → typecheck-agent → test-agent.
Each must complete without errors before the next runs. If one fails, stop and report to the user.
```

### `/guide` update

Replace Phase 2 in `.claude/commands/guide.md` with this:

```markdown
### Phase 2: Determine audience type

Determine which type of guide to write:

- **End-user guide** — for developers importing the package and using the feature.
  Output path: `apps/docs/src/content/docs/<package>/using/<slug>.mdx`
  Required: DefaultsShowcase with all defaults, complete usage example, framework tabs if applicable.

- **Adapter-author guide** — for developers implementing an interface (adapters, plugins,
  custom field types). Output path: `apps/docs/src/content/docs/<package>/extending/<slug>.mdx`
  Required: TypeScript interface callout with the exact contract, minimal complete implementation.

If the feature has both an end-user surface (configuring it) and an adapter-author surface
(implementing it), write both pages. Example: a storage adapter has a user guide
("how to configure S3") and an adapter-author guide ("how to implement the StorageAdapter interface").

If the audience is ambiguous, default to end-user.
Read `agent-os/standards/feature-checklist.md` sections 5 and 6 for the full requirements.
```

---

## Verification

- [ ] `pnpm dev --filter docs` starts without errors
- [ ] Sidebar shows: Introduction, Roadmap, Core (Overview, Using VexCMS, Extending VexCMS), React, Next.js
- [ ] `DefaultsShowcase` renders a table correctly when used in an MDX file
- [ ] `agent-os/standards/feature-checklist.md` exists and is readable
- [ ] All four sub-agent skill files exist in `.claude/commands/`
- [ ] `/dev-spec` Phase 0 is in place

## Success Criteria

- [ ] Docs sidebar structure is fully in place — no placeholder sidebar items pointing to missing slugs
- [ ] `DefaultsShowcase` component accepts `defaults` prop and renders without errors
- [ ] Feature checklist covers all 9 dimensions: implementation, types, JSDoc, exports, end-user guide, adapter guide, typecheck, tests, roadmap
- [ ] Sub-agents are narrow: each reads only what it needs and does exactly one thing
- [ ] `/dev-spec` Phase 0 detects resolved-but-unchecked spec items and triggers sync-spec automatically
- [ ] `/guide-agent` produces different output for `--audience end-user` vs `--audience adapter-author`
