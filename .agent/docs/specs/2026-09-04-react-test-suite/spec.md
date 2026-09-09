---
status: draft
spec_id: 2026-09-04-react-test-suite
touches:
  - "packages/react/src/testing/**"
  - "packages/react/src/components/fields/*/testFixture.ts"
  - "packages/react/src/components/fields/**/Input.test.tsx"
  - "packages/react/src/components/fields/**/Input.tsx"
  - "packages/react/package.json"
  - "packages/react/tsup.config.ts"
  - "packages/react/vitest.config.ts"
  - "pnpm-workspace.yaml"
  - "apps/test/package.json"
  - "apps/test/vitest.config.ts"
  - "apps/test/src/**/*.test.ts"
  - "scripts/record-test-findings.mjs"
  - ".agent/docs/specs/2026-09-04-react-test-suite/findings.md"
  - ".agent/docs/standards/testing/react-test-factories.md"
  - ".agent/docs/standards/naming-conventions.md"
prompt_version: 1
---

# 2026-09-04-react-test-suite — Spec

## Overview

Builds a reusable, exported React component test kit for `@vexcms/react`, shipped as a new
`./testing` subpath. It gives every admin-panel field type a shared behavioral contract test
(label association, `readOnly`, validation-error timing, value round-trip, zero a11y
violations), a nested-container test for `array`/`group`/`blocks`, and an RBAC-state test that
exercises the real `defineAccess`/`usePermission` resolution — all as plain exported functions a
consumer calls from their own test file, never as shipped `.test.*` files. `apps/test` is wired
up as the first real external consumer, proving the kit works from outside the package boundary
before anything ships. This is a **low-care override** of the project's high-care default
(`manifest.json#workflow.default_tier`), by explicit developer direction: every step below is
`[agent]`-tagged, full runnable code, no guided stubs — the developer writes none of this.

## Design Decisions

1. **Shared functions, not shipped test files.** `@vexcms/react/testing` exports plain functions
   whose bodies call `describe`/`it`/`expect` themselves (a "shared examples" pattern, the same
   mechanism Storybook's portable stories use to run a UI library's own stories inside a
   consumer's test runner) — never raw `.test.*` source in the published tarball. This sidesteps
   the packaging/versioning problems of shipping test files as public API surface entirely.
2. **Test-runtime dependencies are peer-only on `./testing`.** `vitest`, `@testing-library/react`,
   `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`, `convex-test`,
   `react`, `react-dom` are declared as `peerDependencies` (optional except `react`/`react-dom`),
   never bundled — a duplicate copy of `vitest`/`react` beside the consumer's own is the exact
   dual-module-instance failure `AP-016` already recorded for an undeclared peer in this repo.
3. **Every field type owns everything about itself, in its own folder.** A field type's
   fixture lives at `components/fields/<type>/testFixture.ts`, beside its own `Input.tsx`/
   `Cell.tsx`/`columnDef.tsx` — never in a parallel directory that has to be kept in sync.
   `testing/fixtures/index.ts` is a pure aggregator (one import line + one registry entry per
   type, no data of its own) and `testing/fixtures/index.test.tsx` asserts its keys match
   `ADMIN_FIELDS`, so a forgotten entry fails loudly instead of silently skipping coverage.
   Fixtures are hand-authored, not schema-derived — matches
   `docs/standards/testing/field-type-testing.md`'s existing "construct inline" philosophy.
4. **Every field type's tests are derived from that field's own code, not from a template.**
   Before writing a field's `extra` block the implementing agent reads its JSDoc (stated intent),
   its `types.ts`/`config.ts`/`inputSchema.ts` (the real prop and validation surface), and its
   `Input.tsx` body (every branch, guard and delegated child) — then enumerates tests with
   equivalence partitioning, boundary value analysis, state transitions, error paths and
   interaction sequences. See `## Test Authoring Protocol`. Tests assert **intended** behavior
   from the JSDoc; where the code disagrees with its own documentation the test fails and that is
   the point.
5. **A failing assertion is a deliverable of this spec; a test that cannot run is a defect in it.**
   `/implement`'s verify gate stops after two failed fix attempts and forbids weakening a test to
   go green (`.agent/skills/implement/references/verification.md`) — which would halt the loop on
   the first real bug found. Field steps therefore verify through
   `scripts/record-test-findings.mjs`, which exits non-zero only when a file fails to collect or
   yields zero tests, and records every red assertion to `findings.md` instead. The number of
   failures is the measurement this spec exists to produce.
6. **The relationship field's Convex bridge ships its own minimal, self-contained schema.**
   `packages/core/src/api/test/convex/` is workspace-private and excluded from core's published
   build — unimportable from a published `@vexcms/react` subpath. `testing/convex/schema.ts`
   owns one `documents` table; `createFakeConvexClient` adapts a `convex-test` instance to the
   `{ query(funcName, args) }` shape `@convex-dev/react-query`'s `ConvexQueryClient` calls, so the
   relationship field's data comes from real query execution, never a hand-typed response.
7. **The RBAC-state factory renders against the real `VexAccessProvider`/`usePermission`
   resolution**, never a mocked hook return value — generalizing the pattern already proven in
   `hooks/usePermission.test.tsx`/`useCanAccessAdminPanel.test.tsx`.
8. **Accessibility is checked on every factory-rendered state** via `vitest-axe`, with
   jsdom-incompatible rules (`color-contrast`, `target-size`, `region`) disabled by default and
   the reason documented inline — these are jsdom limitations, not license to hide real defects.
9. **Views, `AdminLayout`/`AdminSidebar`/`AdminTopNav`, and `ui/` primitives are a future pass.**
   The RBAC-state factory is proven this pass at the field-input layer only; applying it to
   `CollectionEditView` etc. is explicitly deferred.
10. **Coverage thresholds are deferred.** `coverage.enabled: true` stays as-is; no
   `coverage.thresholds` gate is added in this pass.

## Out of Scope

- **Fixing** any UI bug this suite surfaces. Recording every one of them to
  `findings.md` IS in scope and is this spec's primary measured output; changing a single line
  of component code to make a red test go green is not. If a field's implementation contradicts
  its own JSDoc, the test asserts the JSDoc and the failure is filed — the fix is a separate
  follow-up pass with its own spec.
- `CollectionEditView`, `CollectionListView`, `GlobalEditView`, `GlobalsListView`,
  `MediaCollectionEditView`, `MediaCollectionListView`, `DashboardView`, `UnauthorizedView`,
  `AdminLayout`, `AdminSidebar`, `AdminTopNav` — a future views pass.
- `ui/` primitives (`button`, `dialog`, `sheet`, `tabs`, `popover`, `command`, `table`,
  `data-table/*`, `datetime/*`, `sidebar`, etc.) not already exercised incidentally by a field
  input's own contract test.
- Coverage threshold policy (global floor vs. per-file ratchet) — deferred to a later decision.
- Real-time/subscription-update testing for the relationship field's Convex bridge —
  `createFakeConvexClient`'s `watchQuery` is a documented no-op stub; only the one-shot
  `useQuery` resolve path is proven.
- Any Vitest workspace/`test.projects` composition — the function-invocation model (Design
  Decision 1) makes it unnecessary for this scope.

## Test Authoring Protocol

Binding for every per-field step (5–12). The point of this spec is not to add tests that pass —
it is to write tests that state what each field is *supposed* to do and let the failures show
where it does not.

### 1. Read the field before writing anything

For the field type a step covers, read in this order and take notes as you go:

| Read | What it tells you |
|---|---|
| `packages/react/src/components/fields/<type>/Input.tsx` — **JSDoc block first** | Stated intent, and usually the hazard the code guards against |
| the same file's body | Every conditional, early return, prop forwarded to a child, `useState`/`useMemo`/callback, `.map()` over config |
| `packages/core/src/fields/<type>/types.ts` | Every prop on `<Type>Field`. Each one the input READS is a codepath |
| `packages/core/src/fields/<type>/config.ts` | Defaults and deep-merge behavior. A nested config object multiplies the render matrix |
| `packages/core/src/fields/<type>/inputSchema.ts` | Every distinct validation failure = a distinct expected error message = a distinct test |
| any sub-component it delegates to | Behavior the input delegates is still behavior the input owes |

Never assume a library's behavior — read the installed source or run it. Several assertions in
these steps were corrected during spec authoring by doing exactly that.

### 2. Do not re-test what the shared factory already covers

`runFieldInputContractSuite` (Step 5) already asserts, for every field type off one
implementation: label rendering + `htmlFor`/`id` association + empty-label fallback to `name` +
`index` variant; `admin.description` presence/absence; `admin.placeholder` forwarding; the two
independent read-only sources (the `readOnly` **prop** vs `fieldDef.admin.readOnly`, separately
and together); required-ness reflected in the label and enforced on submit; the `empty`/`valid`/
`invalid` value states; error timing (nothing before interaction, error after submit, error after
blur once touched, error cleared when valid again); `handleChange` receiving a correctly-typed
value and `handleBlur` firing; `ADMIN_FIELDS[type].defaultValue` seeding; and
`expectNoA11yViolations` in the default, readOnly and error states.

A step's `extra` block covers **only** what is specific to its field type.

### 3. Enumerate with real test-design technique

State in prose above each `extra` block which techniques produced its list:

- **Equivalence partitioning** — one representative per class of input, not one per value.
- **Boundary value analysis** — at / just inside / just outside every numeric or length bound
  (`min`, `max`, string length, array item counts).
- **State transitions** — empty→filled→cleared, closed→open→selected→removed, single↔multi,
  collapsed↔expanded.
- **Error paths** — every distinct schema failure, plus every guard and early return in the
  component. A guard that renders an error message is a codepath owed a test.
- **Interaction sequences** — not one click: type-then-clear, select-then-deselect,
  open-then-Escape, add-then-remove-then-add.

**8–20 type-specific tests per field type** is the realistic range. Fewer means the code was not
read. `relationship`, `upload`, `date` and `blocks` sit at the high end; `checkbox` and `url` at
the low end. Every assertion carries the exact expected value — real error messages derived from
the field's own `inputSchema.ts`, real formatted output from its own config. Never
`expect(x).toBeTruthy()` where the real value is knowable.

### 4. Assert intended behavior, never observed behavior

If the JSDoc says a prop is forwarded and the code does not forward it, **the test asserts the
JSDoc and fails.** Do not soften an assertion to match what the code currently does. Do not fix
the component — that is out of scope (see `## Out of Scope`).

Where intent is genuinely ambiguous (JSDoc silent, code arbitrary), assert the behavior a user
would reasonably expect and mark the ambiguity in a comment on that test. Several such tests in
steps 6 and 12 are written knowing they currently fail — that is deliberate and is the
deliverable.

### 5. Failure triage — read this before running `/implement`

This spec is expected to produce a large number of red assertions. The harness's default verify
gate is incompatible with that: `.agent/skills/implement/references/verification.md` stops the
loop after two failed fix attempts and forbids weakening a test to go green. Under a plain
`vitest run` the first genuine bug would halt implementation, twelve times over.

So the field steps verify through `node scripts/record-test-findings.mjs <test file>`, which
draws the line the implement loop needs:

| Outcome | Meaning | Script exit | What the agent does |
|---|---|---|---|
| Assertion failed | A discovered UI defect — **the deliverable** | **0** | Nothing. It is appended to `findings.md`. Continue to the next step. |
| File failed to transform/import, factory threw during collection, or zero tests collected | A defect in **this spec's own work** | **1** | Fix it and retry, within `/implement`'s normal 2-attempt protocol. |

Consequences that follow from that table, and are not negotiable:

- **Never** edit a component to make a red assertion green. The fix pass is separate.
- **Never** delete, skip, or weaken an assertion to reduce the failure count. The count is the
  measurement.
- A step whose tests all pass is suspicious, not finished — re-read §1 and check the `extra`
  block actually exercises the field's branches.
- `findings.md` is generated. Never hand-edit it; re-run the script.


## Implementation

### Step 1 — Package & tooling scaffolding

Why: Every later step needs the `./testing` subpath, its peer/dev dependencies, and a place to land code, before any factory or fixture exists. Establishes the packaging contract (peer-only test-runtime deps) up front so nothing downstream accidentally bundles a duplicate copy of React/Vitest. Also lands the failure-triage script the per-field steps' Verify commands depend on, so a discovered UI defect never gets confused with a broken test file (see Test Authoring Protocol).

**[agent]**

- [ ] `pnpm-workspace.yaml` — add catalog entries: `vitest-axe`, `@testing-library/user-event`, `@testing-library/jest-dom`, `convex-test` (already present for core; confirm react can reference it)
- [ ] `packages/react/package.json` — new `exports["./testing"]`; `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`, `convex-test`, `react`, `react-dom` as `peerDependencies` (+ matching `catalog:` devDependencies per P-014)
- [ ] `packages/react/tsup.config.ts` — add `src/testing/index.ts` as a second entry point
- [ ] `packages/react/src/testing/index.ts` — empty placeholder barrel (`export {}`) so build passes before any real export exists
- [ ] `scripts/record-test-findings.mjs` — new script: runs `vitest list` then `vitest run --reporter=json` against the given test file(s), records failing assertions to `findings.md`, exits non-zero only on a collection/suite-level failure
- [ ] `.agent/docs/specs/2026-09-04-react-test-suite/findings.md` — new generated-artifact scaffold: header + empty findings table

#### pnpm-workspace.yaml

3 edits. Everything not shown is unchanged. `convex-test` already carries a main-`catalog:` entry (`0.0.38`, currently consumed only by `@vexcms/core`'s devDependencies) — no addition needed there, only the new `catalogs.peers` range below, since react's `./testing` subpath is what newly exposes it as a peer.

**1 — `catalog:` block, testing-library entries.** Immediately before the existing `"@testing-library/react": 16.3.2` line, add `"@testing-library/jest-dom": 7.0.1`; immediately after it, add `"@testing-library/user-event": 14.6.7` (alphabetical order preserved):

```yaml
"@testing-library/jest-dom": 7.0.1
"@testing-library/react": 16.3.2
"@testing-library/user-event": 14.6.7
```

**2 — `catalog:` block, vitest-axe.** Immediately after the existing `vitest: 4.1.10` line, add:

```yaml
vitest-axe: 1.0.0-pre.5 # 0.1.0 (the `latest` dist-tag, published 2022) carries a known vulnerability per Snyk; 1.0.0-pre.5 is the earliest non-vulnerable release and the version this package is tested against — no stable 1.x has shipped.
```

**3 — `catalogs.peers` map, six new ranges.** Insert into the existing `peers:` map, keeping alphabetical order. After `"@tanstack/react-table": ">=8.0.0 <9"`, before `better-auth: ">=1.6.23 <1.7.0"`:

```yaml
"@testing-library/jest-dom": ">=7.0.0 <8"
"@testing-library/react": ">=16.0.0 <17"
"@testing-library/user-event": ">=14.0.0 <15"
```

After `convex: ">=1.44.0 <2"`, before `lucide-react: ">=0.577.0 <1"`:

```yaml
"convex-test": ">=0.0.38 <0.1.0"
```

After `react-dom: ">=18.0.0"`, before `zod: ">=4.0.0 <5"`:

```yaml
vitest: ">=4.0.0 <5"
vitest-axe: ">=1.0.0-pre.5 <2.0.0"
```

Floors per P-012: `@testing-library/react` >=16 because v16 is the first major with React 19 support; `@testing-library/user-event` >=14 because v14 rewrote the API to the async `userEvent.setup()` shape the factories call (v13's synchronous API is incompatible); `@testing-library/jest-dom` >=7 because v7 replaced its v6 jest/vitest-globals peer contract with a straight `@testing-library/dom` peer; `convex-test` is pinned to its current 0.0.x minor since it is pre-1.0 and breaks on every release; `vitest` >=4 matches the tooling major the kit's `expect.extend` typings are written against; `vitest-axe`'s floor is the CVE fix explained inline above.

#### packages/react/package.json

8 edits. Everything not shown is unchanged.

**1 — `exports`: `./testing` subpath.** After the existing `"./styles": "./styles.css"` entry (add a trailing comma to that line), add:

```json
"./testing": {
  "source": "./src/testing/index.ts",
  "types": "./dist/testing/index.d.ts",
  "import": "./dist/testing/index.js"
}
```

**2 — `peerDependencies`: testing-library entries.** After the existing `"@tanstack/react-query": "catalog:peers",` line, add:

```json
"@testing-library/jest-dom": "catalog:peers",
"@testing-library/react": "catalog:peers",
"@testing-library/user-event": "catalog:peers",
```

**3 — `peerDependencies`: convex-test.** After the existing `"convex": "catalog:peers",` line, add:

```json
"convex-test": "catalog:peers",
```

**4 — `peerDependencies`: vitest + vitest-axe.** After the existing `"react-dom": "catalog:peers",` line (currently the last entry), add:

```json
"vitest": "catalog:peers",
"vitest-axe": "catalog:peers",
```

**5 — `peerDependenciesMeta`: mark the new test-runtime peers optional.** Consumers who only import the `"."` entry point (admin components) never touch `./testing` and must not be forced to install vitest/testing-library — the same reasoning already applied to `next`. Around the existing `"next": { "optional": true }` entry, add:

```json
"@testing-library/jest-dom": {
  "optional": true
},
"@testing-library/react": {
  "optional": true
},
"@testing-library/user-event": {
  "optional": true
},
"convex-test": {
  "optional": true
},
"vitest": {
  "optional": true
},
"vitest-axe": {
  "optional": true
}
```

`react` and `react-dom` stay required — the main entry point needs them regardless.

**6 — `devDependencies`: testing-library entries.** Before the existing `"@testing-library/react": "catalog:",` line, add `"@testing-library/jest-dom": "catalog:",`; immediately after it, add `"@testing-library/user-event": "catalog:",`:

```json
"@testing-library/jest-dom": "catalog:",
"@testing-library/react": "catalog:",
"@testing-library/user-event": "catalog:",
```

**7 — `devDependencies`: convex-test.** After the existing `"convex": "catalog:",` line, add:

```json
"convex-test": "catalog:",
```

**8 — `devDependencies`: vitest-axe.** The `"vitest": "catalog:"` line (currently last) gains a trailing comma and is followed by a new last entry:

```json
"vitest": "catalog:",
"vitest-axe": "catalog:"
```

#### packages/react/tsup.config.ts

1 edit. Everything not shown is unchanged.

**1 — `entry`.** Add the testing barrel as a second build entry point:

```ts
entry: ["src/index.ts", "src/testing/index.ts"],
```

`skipNodeModulesBundle: true` already externalizes every `node_modules` import for both entries, so no `external` array change is needed for the new peers this entry pulls in (`vitest`, `@testing-library/*`, `vitest-axe`, `convex-test`).

#### packages/react/src/testing/index.ts

New file — empty placeholder barrel so the build and typecheck pass before any real export exists. Step 14 replaces this entirely.

```ts
export {};
```

#### scripts/record-test-findings.mjs

New file — kebab-case `.mjs` per `naming-conventions.md`'s `script-files` rule. Implements the failure-triage mechanism the Test Authoring Protocol depends on: runs `vitest list` to prove a test file collects, then `vitest run --reporter=json` to execute it, then records every failing assertion into `.agent/docs/specs/2026-09-04-react-test-suite/findings.md` as a markdown table, replacing that file's previous rows so re-runs are idempotent. Exits non-zero only when zero tests were collected or a `testResults[]` entry failed with an empty `assertionResults` array (a collection error); exits zero whenever tests actually ran, regardless of assertion failures.

```js
#!/usr/bin/env node
/**
 * Runs one or more vitest test files and records the result into the
 * 2026-09-04-react-test-suite spec's findings.md, distinguishing the two
 * failure modes the spec's Test Authoring Protocol depends on:
 *
 *   - A FAILING ASSERTION is a discovered UI defect — the intended output of
 *     that spec. It is recorded as a finding; the script still exits 0.
 *   - A TEST FILE THAT CANNOT RUN (transform/import error, a factory that
 *     throws during collection, zero tests collected) is a defect in the
 *     spec's OWN work, not a finding. The script exits non-zero so the
 *     implement loop's normal 2-attempt fix protocol applies.
 *
 * Protocol (verified against the repo's vitest 4.1.10):
 *   1. `vitest list <paths>` — collects without running. A clean, cheap proof
 *      that every file transforms and yields at least one test. Non-zero
 *      exit here means the file itself is broken; treated as a hard failure.
 *   2. `vitest run <paths> --reporter=json --outputFile=<tmp>` — runs the
 *      suite. The JSON report's shape:
 *        { numTotalTests, numFailedTests, testResults: [
 *          { name, status, message, assertionResults: [
 *            { fullName, title, status, failureMessages } ] } ] }
 *      `testResults[n].status === "fail"` with an EMPTY `assertionResults`
 *      is a suite-level collection error, not an assertion failure, and is
 *      also a hard failure even though stage 1 passed.
 *
 * Findings are written to findings.md as a markdown table. Re-running this
 * script for a file replaces that file's previous rows — idempotent.
 *
 * Usage:
 *   node scripts/record-test-findings.mjs <testFile> [testFile...]
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FINDINGS_PATH = path.join(
  REPO_ROOT,
  ".agent/docs/specs/2026-09-04-react-test-suite/findings.md",
);

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: node scripts/record-test-findings.mjs <testFile> [testFile...]");
  process.exit(2);
}

const absTargets = targets.map((t) => path.resolve(REPO_ROOT, t));
for (const abs of absTargets) {
  if (!fs.existsSync(abs)) {
    console.error(`not found: ${path.relative(REPO_ROOT, abs)}`);
    process.exit(2);
  }
}
const relTargets = absTargets.map((abs) => path.relative(REPO_ROOT, abs));

/**
 * Finds the nearest ancestor directory holding a vitest config, so vitest
 * runs with the right root/plugins regardless of which package a test file
 * lives in.
 *
 * @param {string} startDir - Absolute directory to start searching from.
 * @returns {string} Absolute directory to run vitest in.
 */
function findVitestRoot(startDir) {
  let dir = startDir;
  while (dir.startsWith(REPO_ROOT)) {
    const hasConfig = ["ts", "js", "mts", "mjs"].some((ext) =>
      fs.existsSync(path.join(dir, `vitest.config.${ext}`)),
    );
    if (hasConfig) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return REPO_ROOT;
}

const vitestRoot = findVitestRoot(path.dirname(absTargets[0]));

/**
 * Runs a vitest subcommand from `vitestRoot`, tolerating a non-zero exit
 * (the caller decides what a given exit code means).
 *
 * @param {string[]} args - Arguments passed to `vitest`.
 * @returns {{ status: number, output: string }}
 */
function runVitest(args) {
  try {
    const output = execFileSync("pnpm", ["exec", "vitest", ...args], {
      cwd: vitestRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (err) {
    return {
      status: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

// Stage 1: prove every target collects.
const listResult = runVitest(["list", ...absTargets]);
if (listResult.status !== 0) {
  console.error(`vitest list failed (exit ${listResult.status}) — test file does not collect:`);
  console.error(listResult.output);
  process.exit(1);
}

// Stage 2: run and capture the JSON report.
const outFile = path.join(os.tmpdir(), `vitest-findings-${crypto.randomUUID()}.json`);
const runResult = runVitest([
  "run",
  ...absTargets,
  "--reporter=json",
  `--outputFile=${outFile}`,
]);

if (!fs.existsSync(outFile)) {
  console.error(`vitest run produced no report (exit ${runResult.status}):`);
  console.error(runResult.output);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(outFile, "utf-8"));
fs.rmSync(outFile, { force: true });

const totalTests = report.numTotalTests ?? 0;
const failedTests = report.numFailedTests ?? 0;

if (totalTests === 0) {
  console.error("zero tests collected — treating as a defect in this spec's own work");
  process.exit(1);
}

/** @returns {string} the first non-empty line of a message, table-cell-safe. */
function firstLine(message) {
  const line = (message ?? "").split("\n").find((l) => l.trim().length > 0) ?? "unknown";
  return line.trim().replace(/\|/g, "\\|");
}

/** @type {Array<{ file: string, test: string, failure: string }>} */
const findings = [];
let collectionError = false;

for (const testResult of report.testResults ?? []) {
  const file = path.relative(REPO_ROOT, testResult.name);
  const assertionResults = testResult.assertionResults ?? [];

  if (testResult.status === "fail" && assertionResults.length === 0) {
    collectionError = true;
    findings.push({
      file,
      test: "(collection)",
      failure: firstLine(testResult.message ?? "unknown collection error"),
    });
    continue;
  }

  for (const assertion of assertionResults) {
    if (assertion.status !== "failed") continue;
    findings.push({
      file,
      test: assertion.fullName || assertion.title,
      failure: firstLine(assertion.failureMessages?.[0]),
    });
  }
}

recordFindings(relTargets, findings);

console.log(`${totalTests} tests, ${failedTests} failed — recorded to findings.md`);

if (collectionError) {
  console.error(
    "a testResults[] entry failed with empty assertionResults — collection error, not a discovered defect",
  );
  process.exit(1);
}

process.exit(0);

/**
 * Replaces the rows belonging to `files` in findings.md with `findings`,
 * leaving every other file's rows untouched. Idempotent: re-running for the
 * same file(s) never duplicates rows.
 *
 * @param {string[]} files - Repo-root-relative test file paths just run.
 * @param {Array<{ file: string, test: string, failure: string }>} findings
 */
function recordFindings(files, findings) {
  const existing = fs.existsSync(FINDINGS_PATH) ? fs.readFileSync(FINDINGS_PATH, "utf-8") : "";
  const lines = existing.split("\n");

  const headerIndex = lines.findIndex((l) => l.trim().startsWith("| file"));
  const header =
    headerIndex === -1
      ? ["| file | test | failure |", "| --- | --- | --- |"]
      : lines.slice(headerIndex, headerIndex + 2);
  const preamble =
    headerIndex === -1
      ? [
          "# Test Findings",
          "",
          "Generated by `scripts/record-test-findings.mjs` — do not edit by hand. Running the",
          "script for a test file replaces that file's rows. Every row is a failing assertion",
          "discovered by the comprehensive per-field tests: a real UI defect, not a test bug.",
          "Fixing these is out of scope for the 2026-09-04-react-test-suite spec.",
          "",
        ]
      : lines.slice(0, headerIndex);

  const bodyStart = headerIndex === -1 ? 0 : headerIndex + 2;
  const existingRows = headerIndex === -1 ? [] : lines.slice(bodyStart);
  const keptRows = existingRows.filter((row) => {
    if (!row.trim().startsWith("|")) return false;
    const file = row.split("|")[1]?.trim();
    return file && !files.includes(file);
  });

  const newRows = findings.map((f) => `| ${f.file} | ${f.test} | ${f.failure} |`);
  const allRows = [...keptRows, ...newRows].sort();

  const content = [...preamble, ...header, ...allRows, ""].join("\n");
  fs.mkdirSync(path.dirname(FINDINGS_PATH), { recursive: true });
  fs.writeFileSync(FINDINGS_PATH, content);
}
```

#### .agent/docs/specs/2026-09-04-react-test-suite/findings.md

New file — the generated findings artifact, seeded empty. Every later per-field step's Verify
command appends/replaces rows here via `record-test-findings.mjs`; this scaffold is what makes
the file exist (and its table structure parseable) before Step 6 runs.

```md
# Test Findings

Generated by `scripts/record-test-findings.mjs` — do not edit by hand. Running the
script for a test file replaces that file's rows. Every row is a failing assertion
discovered by the comprehensive per-field tests: a real UI defect, not a test bug.
Fixing these is out of scope for the 2026-09-04-react-test-suite spec.

| file | test | failure |
| --- | --- | --- |
```

Verify: `pnpm install && pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react typecheck && node scripts/record-test-findings.mjs packages/react/src/components/RenderBlocks.test.tsx`

(The last command proves the script against an existing passing test file: it must print `N tests, 0 failed — recorded to findings.md` and exit 0, with findings.md's table left empty for that file.)

### Step 2 — jsdom polyfills + accessibility helper **[agent]**

Why: Every factory in every later step renders components and checks accessibility; this
infrastructure must exist first (build-order rule: test infra before test files). Also
centralizes the `ResizeObserver`/`scrollIntoView` stubs currently copy-pasted in
`ui/multi-select.test.tsx`.

- [ ] `packages/react/src/testing/setup.ts` — exported `installDomPolyfills()` (ResizeObserver stub, `scrollIntoView` no-op) for consumers' `test.setupFiles`
- [ ] `packages/react/src/testing/a11y.ts` — `expectNoA11yViolations(container, options?)` wrapping `vitest-axe`, with jsdom-incompatible rules (`color-contrast`, others requiring real layout) disabled by default and documented why
- [ ] `packages/react/src/testing/a11y.test.ts` — asserts a deliberately-broken markup (unlabeled input) fails and a correct one passes

#### packages/react/src/testing/setup.ts

Generalizes the exact `beforeAll` stub already proven in
`components/ui/multi-select.test.tsx` (cmdk's `ResizeObserver` usage and its
scroll-into-view call on the highlighted item) into a standalone, importable
function. Point a consumer's `test.setupFiles` straight at this module
(`@vexcms/react/testing/setup`) and the polyfills install as an import-time
side effect — no extra call needed, though `installDomPolyfills` is also
exported for a setup file that composes it with other setup work.

```ts
class ResizeObserverStub {
  disconnect() {}
  observe() {}
  unobserve() {}
}

/**
 * Installs the jsdom polyfills Vex React's component tests need. jsdom has no
 * layout engine, so it implements neither `ResizeObserver` nor
 * `Element.prototype.scrollIntoView` — both of which cmdk (the primitive
 * behind `MultiSelect`/`Combobox`) calls on mount and on highlight change.
 *
 * Safe to call more than once: both installs are guarded with `??=`.
 */
export function installDomPolyfills(): void {
  // cmdk observes its list for virtual sizing; jsdom has no ResizeObserver.
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  // cmdk scrolls the highlighted item into view; jsdom has no layout.
  Element.prototype.scrollIntoView ??= () => undefined;
}

// Runs immediately so `setupFiles: ["@vexcms/react/testing/setup"]` works with
// no further wiring; re-running via an explicit call elsewhere is a no-op.
installDomPolyfills();
```

#### packages/react/src/testing/a11y.ts

Wraps `vitest-axe`'s `axe()` + `toHaveNoViolations()` behind one assertion
helper, with three rules disabled by default — `color-contrast` and
`target-size` because jsdom does no rendering or layout and both rules can
only return "incomplete" noise without one, and `region` because axe assumes
it is auditing a full page: `expectNoA11yViolations` is called on isolated
component fragments (a single rendered field input, not a `<main>`-wrapped
page), so "content outside a landmark" would fire on every single render —
the exact false positive jest-axe's own "Testing isolated components"
guidance disables `region` for. `vitest-axe/extend-expect` registers both the
runtime matcher and its Vitest `Assertion` type augmentation, so no manual
`expect.extend` or `declare module` block is needed here.

```ts
import "vitest-axe/extend-expect";
import { configureAxe } from "vitest-axe";
import { expect } from "vitest";

/**
 * Rules disabled for every `expectNoA11yViolations` check, keyed by the real
 * reason each is a false positive here rather than a genuine defect:
 * - `color-contrast`, `target-size`: axe needs the browser's real paint and
 *   layout engine to measure rendered colors and pixel dimensions; jsdom does
 *   neither, so both rules return "incomplete" noise instead of a result.
 * - `region`: assumes it is auditing a full page. This helper checks isolated
 *   component fragments rendered by Testing Library, not a `<main>`-wrapped
 *   page, so "content outside a landmark" would fire on every render.
 */
const DISABLED_RULES: Record<string, { enabled: boolean }> = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
  region: { enabled: false },
};

const runAxe = configureAxe({ rules: DISABLED_RULES });

/**
 * Runs `container` through axe-core and asserts it has zero accessibility
 * violations.
 *
 * @param container Element to audit — typically Testing Library's `render()`
 *   result `container`, or `baseElement` for content mounted via a portal.
 * @param options.rules Merges into (and can re-enable) the disabled defaults
 *   above, keyed by axe rule id.
 */
export async function expectNoA11yViolations(
  container: Element,
  options?: { rules?: Record<string, { enabled: boolean }> },
): Promise<void> {
  const results = await runAxe(container, { rules: options?.rules });
  expect(results).toHaveNoViolations();
}
```

#### packages/react/src/testing/a11y.test.ts

```ts
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "./a11y";

describe("expectNoA11yViolations", () => {
  it("rejects markup with an accessibility violation", async () => {
    const container = document.createElement("div");
    container.innerHTML = '<input type="text" />';

    await expect(expectNoA11yViolations(container)).rejects.toThrow(/\(label\)/);
  });

  it("resolves for accessible markup", async () => {
    const container = document.createElement("div");
    container.innerHTML =
      '<label for="name">Name</label><input id="name" type="text" />';

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
```

Verify: `pnpm --filter @vexcms/react test -- testing/a11y`


### Step 3 — Shared RBAC/collection harness fixtures **[agent]**

Why: Both the field-input contract factory (`readOnly` states) and the RBAC-state factory need a real `defineAccess`/`defineCollection` pair and fake users to render against — one shared harness instead of one per field type, generalizing the inline setup already proven in `hooks/usePermission.test.tsx`.

- [ ] `packages/react/src/testing/harness/accessFixtures.ts` — a minimal `defineCollection`, a `defineAccess` matrix covering `{no config, anonymous, denied role, allow-all role, doc-scoped-constraint role}`, fake user objects, and `renderWithVexProviders(ui, { access?, auth? })`
- [ ] `packages/react/src/testing/harness/accessFixtures.test.ts` — self-test that each fixture role resolves the expected `usePermission` boolean through the real `VexAccessProvider`/`VexAuthProvider`

Both files are written as plain `.ts` (no JSX syntax) using `React.createElement` directly — the frozen contract names them `accessFixtures.ts`/`accessFixtures.test.ts`, and every element construction here is either a two-provider wrapper or a single throwaway probe span, not worth a `.tsx` extension change.

#### packages/react/src/testing/harness/accessFixtures.ts

```ts
import type { ReactNode } from "react";
import { createElement } from "react";
import { render } from "@testing-library/react";
import {
  defineAccess,
  defineCollection,
  text,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { VexAccessProvider } from "../../context/VexAccessContext";
import { VexAuthProvider } from "../../context/VexAuthContext";

/**
 * One collection, one shared `defineAccess` matrix, three roles — reused by every
 * factory that needs a real RBAC/collection pair to render against instead of a
 * mock. Generalizes the inline setup proven in `hooks/usePermission.test.tsx`.
 */
export const testCollection = defineCollection({
  slug: "posts",
  fields: {
    status: text({ index: "by_status" }),
  },
});

const access = defineAccess({
  roles: ["denied", "allowed", "scoped"] as const,
  resources: [testCollection],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    // No grants declared for `posts` — every action fails closed (P-007).
    denied: { posts: {} },
    // Role-level allow-all — the documented posture for "grants everything".
    allowed: { posts: { "*": true } },
    // Doc-scoped: only documents with `status: "published"` are readable.
    scoped: {
      posts: {
        read: {
          constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
        },
      },
    },
  },
});

/**
 * One entry per RBAC scenario every factory in this package renders against.
 * `anonymous`/`denied`/`allowed`/`scoped` all point at the same shared `access`
 * matrix — what distinguishes a scenario is which `testUsers` role (if any) is
 * paired with it at the call site, not a different config per key.
 */
export const testAccess: {
  none: undefined;
  anonymous: VexAccessConfig;
  denied: VexAccessConfig;
  allowed: VexAccessConfig;
  scoped: VexAccessConfig;
} = {
  none: undefined,
  anonymous: access,
  denied: access,
  allowed: access,
  scoped: access,
};

/** Fake users, one per role that needs a signed-in caller (`none`/`anonymous` render with no user). */
export const testUsers: { denied: unknown; allowed: unknown; scoped: unknown } = {
  denied: { _id: "u1", roles: "denied" },
  allowed: { _id: "u2", roles: "allowed" },
  scoped: { _id: "u3", roles: "scoped" },
};

/**
 * Wraps `ui` in the real `VexAccessProvider`/`VexAuthProvider` pair — the same
 * providers `usePermission` reads through in the app, so every factory renders
 * against actual RBAC resolution instead of a stubbed context value.
 *
 * @param ui - The tree to render inside both providers.
 * @param options.access - The access config to provide; omit to leave RBAC unconfigured.
 * @param options.auth - The `{ user, organization }` caller to provide; defaults to `{ user: null }`.
 * @returns The `@testing-library/react` render result.
 */
export function renderWithVexProviders(
  ui: ReactNode,
  options?: { access?: VexAccessConfig; auth?: VexApiAuth },
): ReturnType<typeof render> {
  const auth = options?.auth ?? { user: null };
  return render(
    createElement(
      VexAccessProvider,
      { access: options?.access },
      createElement(VexAuthProvider, { value: auth }, ui),
    ),
  );
}
```

#### packages/react/src/testing/harness/accessFixtures.test.ts

```ts
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { usePermission } from "../../hooks/usePermission";
import { renderWithVexProviders, testAccess, testCollection, testUsers } from "./accessFixtures";

/** Renders a fixed `posts`/`read` check so each scenario below asserts one boolean. */
function ReadProbe(props: { data?: { status: string } }) {
  const allowed = usePermission({
    resource: testCollection.slug,
    action: "read",
    data: props.data,
  } as never);
  return createElement("span", { "data-testid": "probe" }, String(allowed));
}

describe("accessFixtures", () => {
  it("none: no access config resolves the literal-check escape hatch (true)", () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.none,
    });
    expect(getByTestId("probe").textContent).toBe("true");
  });

  it("anonymous: access configured but no user fails closed (false)", () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.anonymous,
    });
    expect(getByTestId("probe").textContent).toBe("false");
  });

  it("denied: role has no grants on testCollection (false)", () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.denied,
      auth: { user: testUsers.denied },
    });
    expect(getByTestId("probe").textContent).toBe("false");
  });

  it('allowed: role has "*": true (true)', () => {
    const { getByTestId } = renderWithVexProviders(createElement(ReadProbe), {
      access: testAccess.allowed,
      auth: { user: testUsers.allowed },
    });
    expect(getByTestId("probe").textContent).toBe("true");
  });

  it("scoped: allows a document that satisfies the doc-scoped constraint", () => {
    const { getByTestId } = renderWithVexProviders(
      createElement(ReadProbe, { data: { status: "published" } }),
      { access: testAccess.scoped, auth: { user: testUsers.scoped } },
    );
    expect(getByTestId("probe").textContent).toBe("true");
  });

  it("scoped: denies a document that fails the doc-scoped constraint", () => {
    const { getByTestId } = renderWithVexProviders(
      createElement(ReadProbe, { data: { status: "draft" } }),
      { access: testAccess.scoped, auth: { user: testUsers.scoped } },
    );
    expect(getByTestId("probe").textContent).toBe("false");
  });
});
```

Verify: `pnpm --filter @vexcms/react test -- testing/harness`


### Step 4 — Field fixture contract + registry scaffold **[agent]**

Why: Defines the one shared shape (`FieldFixture`) every per-type fixture and every factory
depends on, and the aggregation point (`fieldFixtures`) that `runVexReactSuite` and the
nested-container factory iterate. Built before any concrete fixture so later steps only add
entries.

#### packages/react/src/testing/fixtures/types.ts

```ts
import type { AdminField, AdminFieldType } from "@vexcms/core";

/**
 * The one shared shape every per-field-type fixture module exports and registers into
 * `fieldFixtures`. `runFieldInputContractSuite` and `runNestedFieldContainerSuite` both
 * consume it generically — a new field type only needs a fixture matching this shape to
 * plug into every shared test factory.
 */
export interface FieldFixture<TField extends AdminField = AdminField, TValue = unknown> {
  /** The field's `type` discriminant, e.g. `"text"` — must match `fieldDef.type`. */
  fieldType: AdminFieldType;
  /** A representative field definition (as produced by the field's builder, e.g. `text()`). */
  fieldDef: TField;
  /** A value that should pass validation and render meaningfully. */
  valid: TValue;
  /** A value that should be rejected when the field is required (often undefined). */
  invalid: TValue | undefined;
  /** The value a brand-new, untouched field starts with. */
  empty: TValue | undefined;
}
```

#### packages/react/src/testing/fixtures/index.ts

```ts
import type { AdminFieldType } from "@vexcms/core";
import type { FieldFixture } from "./types";
// ...import each per-type fixture from its own field folder as it's added by later steps,
// e.g. `import { textFieldFixture } from "../../components/fields/text/testFixture";`...

/**
 * Registry of one representative `FieldFixture` per admin field type. Empty until steps 5–12
 * each add one import (from that field type's own `components/fields/<type>/testFixture.ts`)
 * plus one entry (`text: textFieldFixture`, etc.) — this file stays a pure aggregation point,
 * never gains fixture logic or data of its own. `runVexReactSuite` iterates this registry to
 * run the shared field-input contract against every registered type, and
 * `testing/fixtures/index.test.tsx` (step 12) asserts its keys eventually match
 * `ADMIN_FIELDS`'s.
 */
export const fieldFixtures: Partial<Record<AdminFieldType, FieldFixture>> = {
  // text: textFieldFixture, imported from ../../components/fields/text/testFixture (step 5)
  // number: numberFieldFixture, imported from ../../components/fields/number/testFixture (step 6)
  // checkbox: checkboxFieldFixture, imported from ../../components/fields/checkbox/testFixture (step 6)
  // url: urlFieldFixture, imported from ../../components/fields/url/testFixture (step 6)
  // color: colorFieldFixture, imported from ../../components/fields/color/testFixture (step 6)
  // select: selectFieldFixture, imported from ../../components/fields/select/testFixture (step 7)
  // date: dateFieldFixture, imported from ../../components/fields/date/testFixture (step 8)
  // upload: uploadFieldFixture, imported from ../../components/fields/upload/testFixture (step 9)
  // relationship: relationshipFieldFixture, imported from ../../components/fields/relationship/testFixture (step 11)
  // array: arrayFieldFixture, imported from ../../components/fields/array/testFixture (step 12)
  // group: groupFieldFixture, imported from ../../components/fields/group/testFixture (step 12)
  // blocks: blocksFieldFixture, imported from ../../components/fields/blocks/testFixture (step 12)
};
```

Verify: `pnpm --filter @vexcms/react typecheck`

### Step 5 — Field-input contract factory + first fixture (text)

Why: Proves the whole mechanism end-to-end on the simplest field before scaling to the rest — visible feedback early per build-order rule 2, and the "shared behavior + per-type extension" contract every other field type slots into. The factory now implements the full 10-point generic checklist (label, description, placeholder, both readOnly sources, required, value states, error timing, change/blur wiring, defaultValue, a11y) in one shared place so every later field step only writes what's actually specific to its type.

**[agent]**

- [ ] `packages/react/src/testing/fieldInputContract.ts` — `runFieldInputContractSuite({ fixture, Component, collection?, extra? })`: mounts `Component` inside a real `useForm` + `<AppForm>` pair and asserts, generically for every field type, all 10 checklist items from the design change (label/fallback/index, description, placeholder, both independent readOnly sources, required reflection + validation, empty/valid/invalid value states, full error-timing lifecycle, typed change + blur wiring, `ADMIN_FIELDS` defaultValue seeding, and a11y in three states)
- [ ] `packages/react/src/components/fields/text/testFixture.ts` — `textFieldFixture: FieldFixture<TextField, string>`
- [ ] `packages/react/src/testing/fixtures/index.ts` — registers `text: textFieldFixture`
- [ ] `packages/react/src/components/fields/text/Input.test.tsx` — `runFieldInputContractSuite({ fixture: textFieldFixture, Component: TextFieldInput, extra })` with a 12-test `extra` covering text's own min/max boundaries, the required-vs-min/max message-override trap, and no-client-side-truncation

#### packages/react/src/testing/fieldInputContract.ts

The mount helper renders `Component` inside a real `useForm`/`<AppForm>` pair — never a hand-mocked `FieldApi`. Validation is driven by the real `adminFieldToInputSchema` dispatcher from `@vexcms/core` wired as a **form-level `onSubmit` validator** that returns TanStack Form's documented `{ fields: { [name]: message } }` shape (`node_modules/@tanstack/form-core/dist/esm/types.d.ts`'s `GlobalFormValidationError`) — this is what lets one factory drive real validation for *any* field type without per-type branching, and it is exactly what `createFieldInput`'s `field.state.meta.errors` (read by `FormError`) is populated from. The file is `.ts`, not `.tsx`, so the element tree is built with `createElement`, never JSX.

**Control resolution: accessible-label lookup, not `input.type` branching.** Every field's `FormLabel` wires `htmlFor={name}`/`id={name}` (verified in `form/FormLabel.tsx` and `form/createFieldInput.tsx`'s own JSDoc example), so `screen.getByLabelText(label, { exact: false })` resolves the control for every field type — a plain textbox, a checkbox (`role=checkbox`), a combobox trigger, or a file input — without any fixture needing to declare its own role. `input.type` branching is kept, but demoted to a single internal helper (`setControlValue`) used only to decide *how* to drive a value into whatever `getByLabelText` returns (click for checkbox/radio, type for text-like, no-op for file/custom controls — the field's own `extra` owns those interaction models). This generalizes better than type-branching at the top level because the *lookup* itself never has to guess a shape, only the *interaction*.

**The two readOnly sources are asserted behaviorally, not by hardcoded attribute name.** `text/Input.tsx` maps the `readOnly` prop to `disabled` and `fieldDef.admin.readOnly` to the native `readonly` attribute — two different DOM attributes for two different sources, and the design change explicitly expects other field types to diverge here. The generic factory therefore checks two things for each source independently, and both together: (a) a value-mutation attempt genuinely doesn't change the control (behavioral), and (b) the control exposes *some* standard inert signal (`disabled`, `readonly`, `aria-disabled`, or `aria-readonly`) via `hasInertSignal` — generalizing across whichever specific attribute a given field type chooses, while still failing (a real finding) if a field type wires a source that neither blocks editing nor marks the control.

**Error timing is scoped to what the onSubmit-only harness can actually exercise.** `FormError`'s `showError` is `(isTouched || submissionAttempts > 0) && errorMessage`. Because the harness's only validator is form-level `onSubmit` (kept exactly as before, per the design's Change A instructions), there is no onChange/onBlur validator to populate `meta.errors` from a bare blur — `field.handleBlur` only ever flips `isTouched`, never runs the schema (confirmed against `@tanstack/form-core`'s `FieldApi.handleBlur`/`FormApi._handleSubmit`, which marks **every** field touched as part of submission). So the `isTouched` branch of `showError` is only ever true *together with* `submissionAttempts > 0`, never independently, in this harness. The suite tests exactly that reality — blurring alone shows nothing pre-submit; the error only appears after a submit attempt; clearing an existing error requires typing a valid value and submitting again (since nothing else re-runs the schema) — with a code comment explaining why, rather than asserting a blur-triggered validation path this validator wiring cannot produce.

**`FormDescription` reads `field.description`, not `field.admin.description`.** The design change's checklist shorthand says `fieldDef.admin.description`, but `form/FormDescription.tsx`'s own JSDoc and body read `field.description` — a top-level `BaseField` property, not part of `FieldAdminConfig`. Implemented against the real code, per Change A's own rule that generic assertions must be grounded in what the components actually do.

**`Activity`'s `mode="hidden"` renders `display: none` on the existing DOM node** (React 19.2's `<Activity>`, used by both `FormDescription` and `FormError`) rather than unmounting it — so "absent" assertions use `.not.toBeVisible()` against the paragraph's own CSS class (`.text-muted-foreground` / `.text-destructive`), not `.not.toBeInTheDocument()`.

The "shows an error only after submit" assertion never hardcodes a field-type-specific message — it derives the real one by calling the fixture's own field through `adminFieldToInputSchema(...).safeParse(fixture.invalid)`, so the same assertion works unmodified for every later field type's fixture (text's `"This field is required."`, or whatever a different type's schema produces). That derivation is wrapped in a small `deriveInvalidErrorMessage()` closure so it runs — and can throw on a fixture-authoring bug — inside each `it()`, never at `describe()`-collection time (a thrown fixture bug must fail one test, not abort the whole file's collection).

```ts
import { type ComponentType, createElement } from "react";
import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_FIELDS,
  adminFieldToInputSchema,
  type AdminField,
  type BaseFieldMeta,
  type CollectionConfig,
  type InputComponentProps,
} from "@vexcms/core";
import { AppForm } from "../components/form/AppForm";
import { expectNoA11yViolations } from "./a11y";
import { testCollection } from "./harness/accessFixtures";
import type { FieldFixture } from "./fixtures/types";

export interface FieldInputContractOptions<TField extends AdminField = AdminField, TValue = unknown> {
  fixture: FieldFixture<TField, TValue>;
  Component: ComponentType<InputComponentProps<BaseFieldMeta, TField> & { field?: unknown }>;
  /** Test-only collection config the field is rendered as part of. Defaults to the shared
   * harness's testCollection from testing/harness/accessFixtures.ts if omitted. */
  collection?: CollectionConfig;
  /** Per-type extension point for assertions the shared contract can't generalize
   * (e.g. select's hasMany branch, date's time-picker opt-in). Receives the same options. */
  extra?: (options: FieldInputContractOptions<TField, TValue>) => void;
}

/** The `form.defaultValues` key every mounted field is registered under. */
const FIELD_NAME = "testField";

/**
 * Clones a field definition with shallow overrides, deep-merging `admin` — the
 * one nested object generic assertions need to vary in isolation (`readOnly`,
 * `placeholder`) independent of top-level properties (`label`, `description`,
 * `required`), which live directly on the field, not under `admin`.
 */
function withFieldDef<TField extends AdminField>(
  fieldDef: TField,
  overrides: Partial<TField> & { admin?: Partial<TField["admin"]> },
): TField {
  const { admin, ...rest } = overrides;
  return {
    ...fieldDef,
    ...rest,
    admin: { ...fieldDef.admin, ...admin },
  } as TField;
}

/**
 * Best-effort generic interaction used by every value-mutating assertion below.
 * Handles the two control shapes a fixture is guaranteed to be able to drive
 * generically — a plain text-like control, and a checkbox/radio — and is a
 * deliberate no-op for anything else (file inputs, custom comboboxes): those
 * get their real interaction model exercised by the field type's own `extra`,
 * not a generic guess that would just be wrong.
 */
async function setControlValue(user: UserEvent, control: HTMLElement, value: unknown): Promise<void> {
  const input = control as HTMLInputElement;
  if (input.type === "checkbox" || input.type === "radio") {
    const shouldBeChecked = Boolean(value);
    if (input.checked !== shouldBeChecked) {
      await user.click(input);
    }
    return;
  }
  if (input.type === "file" || control.tagName === "BUTTON") {
    return;
  }
  if (control.tagName === "INPUT" || control.tagName === "TEXTAREA") {
    await user.clear(input);
    const text = value === undefined || value === null ? "" : String(value);
    if (text) {
      await user.type(input, text);
    }
  }
}

/**
 * Like `setControlValue`, but swallows the exception `@testing-library/user-event`
 * v14's `clear()` throws on a genuinely non-editable (disabled/readOnly) control —
 * that throw itself is evidence editing is blocked, not a test bug. Used only by
 * the readOnly-source assertions, which want to prove a value attempt has no
 * effect regardless of whether the underlying library no-ops or throws.
 */
async function attemptEdit(user: UserEvent, control: HTMLElement, value: unknown): Promise<void> {
  try {
    await setControlValue(user, control, value);
  } catch {
    // Non-editable control — the attempt correctly could not proceed.
  }
}

/** Asserts the control's own DOM value/checked state — not the form's — matches `expected`. */
function expectControlValue(control: HTMLElement, expected: unknown): void {
  const input = control as HTMLInputElement;
  if (input.type === "checkbox" || input.type === "radio") {
    expect(input.checked).toBe(Boolean(expected));
    return;
  }
  expect(control).toHaveValue(expected === undefined || expected === null ? "" : String(expected));
}

/**
 * Whether a control exposes ANY standard non-editable signal. The two readOnly
 * sources (design-change item 4) are documented to produce genuinely different
 * DOM attributes per field type (`text/Input.tsx` maps the `readOnly` prop to
 * `disabled` and `fieldDef.admin.readOnly` to the native `readonly` attribute)
 * — checking for any of the four standard signals lets one assertion generalize
 * across that documented inconsistency instead of hardcoding one field type's
 * choice as the only acceptable one.
 */
function hasInertSignal(control: Element): boolean {
  return (
    control.hasAttribute("disabled") ||
    control.hasAttribute("readonly") ||
    control.getAttribute("aria-disabled") === "true" ||
    control.getAttribute("aria-readonly") === "true"
  );
}

/**
 * Mounts `Component` inside a real `useForm`/`<AppForm>` pair — the exact wiring
 * `createFieldInput`-built components expect in production. The mounted form's
 * only validator is a form-level `onSubmit` that delegates to the real
 * `adminFieldToInputSchema` dispatcher, so submitting the form exercises the
 * field's actual production validation, not a test-only stand-in.
 */
function renderField<TField extends AdminField, TValue>(props: {
  Component: FieldInputContractOptions<TField, TValue>["Component"];
  fieldDef: TField;
  collection: CollectionConfig;
  readOnly: boolean;
  initialValue: TValue | undefined;
  index?: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let form: any;

  function Harness() {
    const f = useForm({
      defaultValues: { [FIELD_NAME]: props.initialValue },
      validators: {
        onSubmit: ({ value }) => {
          const schema = adminFieldToInputSchema({ field: props.fieldDef });
          const result = schema.safeParse((value as Record<string, unknown>)[FIELD_NAME]);
          if (result.success) return undefined;
          return {
            fields: { [FIELD_NAME]: result.error.issues[0]?.message ?? "Invalid value" },
          };
        },
      },
    });
    form = f;

    return createElement(
      AppForm,
      { form: f },
      createElement(props.Component, {
        name: FIELD_NAME,
        fieldDef: props.fieldDef,
        collection: props.collection,
        readOnly: props.readOnly,
        index: props.index,
      }),
      createElement("button", { type: "submit" }, "Submit"),
    );
  }

  const result = render(createElement(Harness));
  return {
    ...result,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getForm: (): any => form,
  };
}

/** Call at module top level inside a *.test.tsx file — it calls describe/it itself. */
export function runFieldInputContractSuite<TField extends AdminField, TValue>(
  options: FieldInputContractOptions<TField, TValue>,
): void {
  const { fixture, Component, extra } = options;
  const collection = options.collection ?? testCollection;
  const label = fixture.fieldDef.label || FIELD_NAME;

  /**
   * Derives the fixture's real validation-failure message by actually running
   * its schema against `fixture.invalid` — never a hardcoded, field-type-specific
   * string. Runs inside each `it()` that needs it (never at `describe()`-collection
   * time): a fixture whose `invalid` value doesn't fail its own schema is a
   * fixture-authoring bug and must fail that one test, not abort the whole file.
   */
  function deriveInvalidErrorMessage(): string {
    const schema = adminFieldToInputSchema({ field: fixture.fieldDef });
    const validation = schema.safeParse(fixture.invalid);
    if (validation.success) {
      // Not a fixture-authoring bug in every case: several field types'
      // inputSchema ends in an UNCONDITIONAL `.default(field.defaultValue)`
      // (verified in number's and checkbox's) which is never gated behind
      // `!field.required` the way `applyBaseInputSchemaMeta`'s `.optional()`
      // is — so a missing value is silently replaced by the default and
      // validated as that, and required-ness is unenforceable at the schema
      // level. Failing this one test names that defect and records it; it
      // never aborts collection, so the rest of the file still runs.
      expect.fail(
        `${fixture.fieldType}: schema ACCEPTS its own \`invalid\` fixture value ` +
          `(${JSON.stringify(fixture.invalid)}), so no validation error can ever render. ` +
          `Either the fixture's \`invalid\` value is wrong, or this field type's ` +
          `required-ness is unenforceable — check its inputSchema for an ` +
          `unconditional .default().`,
      );
    }
    return validation.error.issues[0]?.message ?? "Invalid value";
  }

  describe(`${fixture.fieldType} field input contract`, () => {
    // ── 1. Label ────────────────────────────────────────────────────────────
    it("renders a label associated with the input via htmlFor/id", () => {
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      expect(container.querySelector("label")).toHaveAttribute("for", FIELD_NAME);
      expect(screen.getByLabelText(label, { exact: false })).toHaveAttribute("id", FIELD_NAME);
    });

    it("falls back to the field name when fieldDef.label is empty", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { label: "" });
      renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.valid });

      expect(screen.getByLabelText(FIELD_NAME, { exact: false })).toBeInTheDocument();
    });

    it("prefixes the label with a 1-based index when `index` is supplied (nested rendering)", () => {
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
        index: 2,
      });

      const expected = `[3] - ${label}${fixture.fieldDef.required ? "*" : ""}`;
      expect(container.querySelector("label")?.textContent).toBe(expected);
    });

    it("shows a required-asterisk in the label when the field is required", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { required: true });
      const { container } = renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      expect(container.querySelector("label")?.textContent).toBe(`${fieldDef.label || FIELD_NAME}*`);
    });

    it("hides the required-asterisk in the label when the field is not required", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { required: false });
      const { container } = renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      expect(container.querySelector("label")?.textContent).toBe(fieldDef.label || FIELD_NAME);
    });

    it("marks the control as required for assistive tech when the field is required", () => {
      // Ambiguous whether "reflected in the control" (design-change item 5) means a
      // native `required` attribute or `aria-required` — either is accepted.
      // `text/Input.tsx` forwards neither to its `<Input>` (only `disabled`,
      // `readOnly`, `value`, `onChange`, `onBlur`, `placeholder` are forwarded —
      // see Input.tsx), so this is expected to fail for text: a genuine a11y gap
      // surfaced here, not a test bug.
      const fieldDef = withFieldDef(fixture.fieldDef, { required: true });
      renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.valid });

      const control = screen.getByLabelText(fieldDef.label || FIELD_NAME, { exact: false });
      const marked = control.hasAttribute("required") || control.getAttribute("aria-required") === "true";
      expect(marked).toBe(true);
    });

    // ── 2. Description ─────────────────────────────────────────────────────
    // `FormDescription` reads `field.description` (a top-level `BaseField`
    // property), not `field.admin.description` — implemented against the real
    // component, not the design change's checklist shorthand.
    it("renders the field's description when fieldDef.description is set", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { description: "Contract-probe description." });
      renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.valid });

      expect(screen.getByText("Contract-probe description.")).toBeVisible();
    });

    it("hides the description paragraph when fieldDef.description is not set", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { description: undefined });
      const { container } = renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      // `Activity` (React 19.2) renders `display: none` on the existing node when
      // hidden rather than unmounting it, so `.not.toBeVisible()` is the correct
      // matcher — `.not.toBeInTheDocument()` would pass even if the hidden logic
      // were broken and always rendered the paragraph visible with empty text.
      expect(container.querySelector(".text-muted-foreground")).not.toBeVisible();
    });

    // ── 3. Placeholder ──────────────────────────────────────────────────────
    it("forwards fieldDef.admin.placeholder to the control", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { placeholder: "Contract placeholder probe" } });
      renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.empty });

      const control = screen.getByLabelText(fieldDef.label || FIELD_NAME, { exact: false });
      expect(control).toHaveAttribute("placeholder", "Contract placeholder probe");
    });

    // ── 4. Two independent readOnly sources ─────────────────────────────────
    it("the `readOnly` prop disables editing independent of fieldDef.admin.readOnly", async () => {
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { readOnly: false } });
      renderField({ Component, fieldDef, collection, readOnly: true, initialValue: fixture.empty });

      const control = screen.getByLabelText(fieldDef.label || FIELD_NAME, { exact: false });
      await attemptEdit(user, control, fixture.valid);
      expectControlValue(control, fixture.empty);
      expect(hasInertSignal(control)).toBe(true);
    });

    it("fieldDef.admin.readOnly disables editing independent of the `readOnly` prop", async () => {
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { readOnly: true } });
      renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.empty });

      const control = screen.getByLabelText(fieldDef.label || FIELD_NAME, { exact: false });
      await attemptEdit(user, control, fixture.valid);
      expectControlValue(control, fixture.empty);
      expect(hasInertSignal(control)).toBe(true);
    });

    it("disables editing when both readOnly sources are set together", async () => {
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { readOnly: true } });
      renderField({ Component, fieldDef, collection, readOnly: true, initialValue: fixture.empty });

      const control = screen.getByLabelText(fieldDef.label || FIELD_NAME, { exact: false });
      await attemptEdit(user, control, fixture.valid);
      expectControlValue(control, fixture.empty);
      expect(hasInertSignal(control)).toBe(true);
    });

    // ── 5 & 7. Required + error timing ──────────────────────────────────────
    it("shows no validation error before any interaction or submission", () => {
      const errorMessage = deriveInvalidErrorMessage();
      renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    it("blurring an untouched field alone shows no error — this harness's only validator is form-level onSubmit, so isTouched has no error to reveal without a prior submit", () => {
      const errorMessage = deriveInvalidErrorMessage();
      renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      const control = screen.getByLabelText(label, { exact: false });
      fireEvent.blur(control);
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    it("shows the field's validation error only after a submission attempt", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      // Not touched, not yet submitted — FormError has no error to render at all.
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(await screen.findByText(errorMessage)).toBeVisible();
    });

    it("clears the error once the value becomes valid and the form is resubmitted", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      const control = screen.getByLabelText(label, { exact: false });
      await user.click(screen.getByRole("button", { name: /submit/i }));
      expect(await screen.findByText(errorMessage)).toBeVisible();

      // No onChange/onBlur validator is wired (only onSubmit, kept as-is per the
      // design change) — the stale error only clears on a fresh submit that
      // re-runs the schema and gets back a clean result for this field.
      await setControlValue(user, control, fixture.valid);
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    // ── 6. Value states ─────────────────────────────────────────────────────
    (
      [
        ["empty", fixture.empty],
        ["valid", fixture.valid],
        ["invalid", fixture.invalid],
      ] as const
    ).forEach(([name, value]) => {
      it(`renders the ${name} fixture value without crashing or a React input warning`, () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        renderField({ Component, fieldDef: fixture.fieldDef, collection, readOnly: false, initialValue: value });

        const inputWarning = consoleError.mock.calls.some((args) =>
          /uncontrolled|controlled|defaultValue|onChange handler/i.test(String(args[0])),
        );
        expect(inputWarning).toBe(false);
        consoleError.mockRestore();
      });
    });

    // ── 8. Change/blur wiring ───────────────────────────────────────────────
    it("round-trips a typed value through the controlled input", async () => {
      const user = userEvent.setup();
      renderField({ Component, fieldDef: fixture.fieldDef, collection, readOnly: false, initialValue: fixture.empty });

      const control = screen.getByLabelText(label, { exact: false });
      await setControlValue(user, control, fixture.valid);
      expectControlValue(control, fixture.valid);
    });

    it("passes the correctly-typed value (not stringified) to field.handleChange", async () => {
      const user = userEvent.setup();
      const { getForm } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.empty,
      });

      const control = screen.getByLabelText(label, { exact: false });
      await setControlValue(user, control, fixture.valid);
      expect(getForm().getFieldValue(FIELD_NAME)).toStrictEqual(fixture.valid);
    });

    it("calls field.handleBlur on blur, marking the field touched", () => {
      const { getForm } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.empty,
      });

      const control = screen.getByLabelText(label, { exact: false });
      expect(getForm().getFieldMeta(FIELD_NAME)?.isTouched).toBe(false);
      fireEvent.blur(control);
      expect(getForm().getFieldMeta(FIELD_NAME)?.isTouched).toBe(true);
    });

    // ── 9. defaultValue ─────────────────────────────────────────────────────
    it("starts at ADMIN_FIELDS[type].defaultValue when the form is seeded with it", () => {
      const defaultValue = ADMIN_FIELDS[fixture.fieldType].defaultValue as TValue;
      renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: defaultValue,
      });

      expectControlValue(screen.getByLabelText(label, { exact: false }), defaultValue);
    });

    // ── 10. Accessibility ───────────────────────────────────────────────────
    it("has no detectable accessibility violations in its default render", async () => {
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.empty,
      });

      await expectNoA11yViolations(container);
    });

    it("has no detectable accessibility violations when read-only", async () => {
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: true,
        initialValue: fixture.valid,
      });

      await expectNoA11yViolations(container);
    });

    it("has no detectable accessibility violations while showing a validation error", async () => {
      const user = userEvent.setup();
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));
      await screen.findByText(deriveInvalidErrorMessage());
      await expectNoA11yViolations(container);
    });

    extra?.(options);
  });
}
```

#### packages/react/src/components/fields/text/testFixture.ts

```ts
import { text, type TextField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `text` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/text/Input.test.tsx`.
 *
 * `required: true` with no `min`/`max` keeps `textFieldToInputSchema`'s
 * `"This field is required."` message active — `min`/`max` reassign the
 * schema unconditionally in a sibling `if`, silently overriding the
 * required-branch message (`packages/core/src/fields/text/inputSchema.ts`).
 */
export const textFieldFixture: FieldFixture<TextField, string> = {
  fieldType: "text",
  fieldDef: text({ label: "Title", required: true }),
  valid: "Hello World",
  invalid: undefined,
  empty: undefined,
};
```

#### packages/react/src/testing/fixtures/index.ts

2 edits — everything else unchanged.

**1 — import.** Beside the `import type { FieldFixture } from "./types";` line:

```ts
import { textFieldFixture } from "../../components/fields/text/testFixture";
```

**2 — registry entry.** Replace the `// text: textFieldFixture, (step 5)` placeholder:

```ts
  text: textFieldFixture,
```

#### packages/react/src/components/fields/text/Input.test.tsx

Text's own surface beyond the generic checklist is small but has real branching worth pinning: `textFieldToInputSchema` (`packages/core/src/fields/text/inputSchema.ts`) reassigns its Zod schema in two sibling `if`/`else if` blocks keyed on `min`/`max`, and each reassignment is *unconditional* — it does not check whether `required` also set the schema first. Test-design techniques used: **boundary value analysis** (at/just-inside/just-outside `min.value` and `max.value`), **equivalence partitioning** (required×optional crossed with min-only/max-only/both/neither — 4 distinct schema-construction paths), **error-path coverage** (every distinct message: default min, default max, custom min, custom max, required, and the two "required message silently lost" cases), and one **interaction-sequence** check that the input never client-side-enforces `max` (mirrors the established `url` field's "format acceptance is deferred to the schema" pattern). This produces 12 tests — text has real validation surface (unlike checkbox/url's near-zero branching), but no nested config, no async behavior, and no sub-components, so it sits at the low-to-middle of the 8–20 range.

Because each test needs its own `min`/`max`/`required` combination (not just the shared fixture's fixed one), the `extra` here defines its own small `TextValidationHarness` — the same real `useForm`/`<AppForm>`/`onSubmit`-validator wiring `fieldInputContract.ts` uses internally, duplicated locally per the established per-type-extra convention (every other field type's `extra` in this spec defines its own tiny local harness component rather than importing the factory's private `renderField`).

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, text, type CollectionConfig, type TextField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textFieldFixture } from "./testFixture";
import { TextFieldInput } from "./Input";

/**
 * Mounts `TextFieldInput` behind a real `useForm` + `<AppForm>`, wired with the
 * same real `adminFieldToInputSchema`-driven `onSubmit` validator the generic
 * factory uses internally — needed here (rather than the shared fixture's fixed
 * schema) because every boundary test below constructs and submits its own
 * `min`/`max`/`required` combination.
 */
function TextValidationHarness(props: {
  fieldDef: TextField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <TextFieldInput name="testField" fieldDef={props.fieldDef} collection={props.collection} readOnly={false} />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

/** The exact text inside `FormError`'s `<p class="...text-destructive">` — "" when no error is showing. */
function submittedErrorText(container: HTMLElement): string {
  return container.querySelector(".text-destructive")?.textContent ?? "";
}

runFieldInputContractSuite({
  fixture: textFieldFixture,
  Component: TextFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: TextField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <TextValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return submittedErrorText(container);
    }

    describe("text: length boundaries, the required-vs-min/max override trap, and no client-side truncation", () => {
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = text({ label: "Bio", min: { value: 3 } });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = text({ label: "Bio", min: { value: 3 } });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("This field is too short.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = text({ label: "Bio", max: { value: 10 } });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = text({ label: "Bio", max: { value: 10 } });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("This field is too long.");
      });

      it("uses a custom min.error message instead of the default when configured", async () => {
        const fieldDef = text({ label: "Bio", min: { value: 5, error: "Bio needs at least 5 characters." } });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max.error message instead of the default when configured", async () => {
        const fieldDef = text({ label: "Bio", max: { value: 5, error: "Bio can be at most 5 characters." } });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the min-length message, not the required one — inputSchema.ts's `if (field.min)` branch unconditionally reassigns the schema, dropping the required branch's message", async () => {
        const fieldDef = text({ label: "Bio", required: true, min: { value: 3 } });
        expect(await submit(fieldDef, undefined)).toBe("This field is too short.");
      });

      it("required + max only (no min): a missing value silently PASSES validation — the sibling `else if (field.max)` branch drops the required check entirely, not just its message", async () => {
        const fieldDef = text({ label: "Bio", required: true, max: { value: 10 } });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("required + min AND max together: a missing value still fails with the min-length message, not the required one", async () => {
        const fieldDef = text({ label: "Bio", required: true, min: { value: 3 }, max: { value: 10 } });
        expect(await submit(fieldDef, undefined)).toBe("This field is too short.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = text({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = text({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: { value: 5 } });
        render(<TextValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />);

        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "way too long for max");
        expect(input).toHaveValue("way too long for max");
      });
    });
  },
});
```

Verify: `node scripts/record-test-findings.mjs packages/react/src/components/fields/text/Input.test.tsx`

### Step 6 — Simple-value field fixtures + tests (number, checkbox, url, color)

**[agent]**

- [ ] `packages/react/src/components/fields/number/testFixture.ts`
- [ ] `packages/react/src/components/fields/checkbox/testFixture.ts`
- [ ] `packages/react/src/components/fields/url/testFixture.ts`
- [ ] `packages/react/src/components/fields/color/testFixture.ts`
- [ ] `packages/react/src/testing/fixtures/index.ts` (edit — register the four new fixtures)
- [ ] `packages/react/src/components/fields/number/Input.test.tsx`
- [ ] `packages/react/src/components/fields/checkbox/Input.test.tsx`
- [ ] `packages/react/src/components/fields/url/Input.test.tsx`
- [ ] `packages/react/src/components/fields/color/Input.test.tsx`

All four share `text`'s single-primitive-value contract shape — each fixture only differs in the resolved `fieldDef` and its `valid`/`invalid`/`empty` values. Every fixture below sets `required: true`, but `invalid` is NOT uniformly `undefined` — verified against the real schemas rather than assumed. `applyBaseInputSchemaMeta` (`packages/core/src/fields/inputSchemas/utils.ts:32-35`) does skip `.optional()` for required fields, but `numberFieldToInputSchema` and `checkboxFieldToInputSchema` each end in an **unconditional** `.default(field.defaultValue)` that is never gated behind `!field.required`, so `undefined` is silently replaced by the default and PASSES. `number` therefore uses `-1` (a real `min` violation); `checkbox` has no failing value at all (every boolean passes a defaulted `z.boolean()`), so its `invalid: undefined` deliberately trips the shared contract's schema-accepts-invalid assertion, which names that exact defect and records it. `url`/`color` reject `undefined` as documented. `empty` mirrors the `defaultValue` `<type>()` actually resolves to (`ADMIN_FIELDS.number.defaultValue = 0`, `.checkbox.defaultValue = false`, `.url.defaultValue = ""`, `.color.defaultValue = ""` — `packages/core/src/fields/constants.ts:12-34`), i.e. what a brand-new document's form starts with. Each `Input.test.tsx`'s `extra` block below is now derived by reading that type's own `types.ts`/`config.ts`/`inputSchema.ts`/`Input.tsx` (per the design change's Change A) rather than covering "one distinguishing behavior" — see the prose paragraph above each block for the specific findings and techniques used. Two of those findings revise the paragraph above: `numberFieldToInputSchema` and `checkboxFieldToInputSchema` both end every branch in an **unconditional** `.default(field.defaultValue)`, so for those two types specifically an explicitly-`undefined` submitted value is silently replaced by the default and validated as *that* — it is **not** actually rejected as "required" the way the paragraph above assumes. `urlFieldToInputSchema` and `colorFieldToInputSchema` only add `.default()` when `field.defaultValue` is truthy, and both fixtures below resolve an empty-string default, so the original claim holds for those two. This is exercised directly against the real schemas in the `number` and `checkbox` `extra` blocks below, rather than rewritten here, since the generic suite (Step 5) — not this step — owns how `fixture.invalid` itself is exercised.

#### packages/react/src/components/fields/number/testFixture.ts

```ts
import { number, type NumberField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Fixture for the `number` field type — a bounded quantity.
 *
 * `min`/`max` are set so `number/Input.test.tsx`'s `extra` can prove the input
 * performs no client-side range clamping (`NumberFieldInput` never forwards
 * `fieldDef.min`/`fieldDef.max` to the underlying `<input>` — range enforcement
 * lives entirely in `numberFieldToInputSchema` at submit time).
 */
export const numberFieldFixture: FieldFixture<NumberField, number> = {
  fieldType: "number",
  fieldDef: number({
    label: "Quantity",
    required: true,
    min: { value: 0, error: "Quantity cannot be negative." },
    max: { value: 100, error: "Quantity cannot exceed 100." },
  }),
  valid: 42,
  // NOT `undefined`: `numberFieldToInputSchema` ends every branch in an
  // unconditional `.default(field.defaultValue)`, so `undefined` is silently
  // replaced by `0` and PASSES. `-1` genuinely fails, against the real
  // `min` message below, so the shared contract's error-timing test has a
  // real error to render. The unconditional-`.default()` defect itself is
  // pinned by its own test in `Input.test.tsx`.
  invalid: -1,
  empty: 0,
};
```

#### packages/react/src/components/fields/checkbox/testFixture.ts

```ts
import { checkbox, type CheckboxField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/** Fixture for the `checkbox` field type — a boolean toggle. */
export const checkboxFieldFixture: FieldFixture<CheckboxField, boolean> = {
  fieldType: "checkbox",
  fieldDef: checkbox({ label: "Published", required: true }),
  valid: true,
  invalid: undefined,
  empty: false,
};
```

#### packages/react/src/components/fields/url/testFixture.ts

```ts
import { url, type UrlField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Fixture for the `url` field type.
 *
 * `UrlFieldInput` renders `type="text"`, not the browser's native
 * `type="url"` — format validation is deferred entirely to
 * `urlFieldToInputSchema` at submit time (`packages/react/src/components/fields/url/Input.tsx:9-13`).
 */
export const urlFieldFixture: FieldFixture<UrlField, string> = {
  fieldType: "url",
  fieldDef: url({ label: "Website", required: true }),
  valid: "https://example.com",
  invalid: undefined,
  empty: "",
};
```

#### packages/react/src/components/fields/color/testFixture.ts

```ts
import { color, type ColorField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/** Fixture for the `color` field type — hex notation, no theme-token tab. */
export const colorFieldFixture: FieldFixture<ColorField, string> = {
  fieldType: "color",
  fieldDef: color({ label: "Brand Color", required: true, format: "hex" }),
  valid: "#e8622a",
  invalid: undefined,
  empty: "",
};
```

#### packages/react/src/testing/fixtures/index.ts

This edit touches 2 spots in the Step 4 placeholder; everything else in the file is unchanged.

**1 — imports.** Beside the existing per-type fixture imports (added by steps 4–5):

```ts
import { numberFieldFixture } from "../../components/fields/number/testFixture";
import { checkboxFieldFixture } from "../../components/fields/checkbox/testFixture";
import { urlFieldFixture } from "../../components/fields/url/testFixture";
import { colorFieldFixture } from "../../components/fields/color/testFixture";
```

**2 — registry entries.** Replace the four commented placeholders `// number: numberFieldFixture, (step 6)`, `// checkbox: checkboxFieldFixture, (step 6)`, `// url: urlFieldFixture, (step 6)`, `// color: colorFieldFixture, (step 6)` inside `fieldFixtures` with:

```ts
  number: numberFieldFixture,
  checkbox: checkboxFieldFixture,
  url: urlFieldFixture,
  color: colorFieldFixture,
```

#### packages/react/src/components/fields/number/Input.test.tsx

Read `number/types.ts`, `config.ts`, `inputSchema.ts` and `Input.tsx`'s JSDoc first. Findings: `NumberFieldInput` never forwards `fieldDef.min`/`fieldDef.max` as native HTML `min`/`max` attributes, and falls back to `0` (not `""`) via `field.state.value ?? 0` when the value is `undefined` — a fallback distinct from every string-valued field. `numberFieldToInputSchema` bakes in real, distinct `min`/`max` error messages and, more importantly, ends **every** branch (min-only, max-only, both, neither) in an unconditional `.default(field.defaultValue)` — unlike `applyBaseInputSchemaMeta`'s `.optional()`, this is never gated behind `!field.required`, so a missing value is silently replaced by the default and validated as that, not rejected as "required". Techniques used: boundary value analysis at `fieldDef.min`/`max` (just-inside and just-outside, both ends); equivalence partitioning over the typed-string domain (integer, decimal, negative, empty); and an intent-vs-observed-behavior test for clearing the input, since neither the JSDoc nor the component states what a cleared required number field should hold.

```tsx
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { numberFieldToInputSchema, type CollectionConfig, type NumberField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { numberFieldFixture } from "./testFixture";
import { NumberFieldInput } from "./Input";

/**
 * Mounts `NumberFieldInput` behind a real `useForm` + `<AppForm>`, exposing the
 * form's coerced value through a probe element so the raw DOM string can be
 * told apart from the number `NumberFieldInput` actually stores — without
 * hand-mocking TanStack's `FieldApi`.
 */
function NumberHarness(props: {
  fieldDef: NumberField;
  collection: CollectionConfig;
  initialValue: number | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <NumberFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

/**
 * Mounts `NumberFieldInput` with the field's REAL `numberFieldToInputSchema`
 * wired as an explicit `form.Field` `onSubmit` validator, via the documented
 * explicit-`field`-prop escape hatch (`createFieldInput` never attaches
 * validators itself), plus a submit button — so boundary values can be
 * checked against the schema's exact error messages through the real submit
 * path.
 */
function NumberBoundaryHarness(props: {
  fieldDef: NumberField;
  collection: CollectionConfig;
  initialValue: number;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = numberFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <NumberFieldInput
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: numberFieldFixture,
  Component: NumberFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("number: numeric coercion, decimal/negative handling, and the ?? 0 empty fallback", () => {
      it("coerces the typed digits to a number, not a string", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.clear(input);
        await user.type(input, "42");
        // JSON.stringify(42) === "42"; JSON.stringify("42") === '"42"' — the quotes
        // are the only thing that can tell the two apart here.
        expect(screen.getByTestId("value-probe").textContent).toBe("42");
      });

      it("does not forward fieldDef.min/max as native HTML attributes and does not clamp typed values — range enforcement is the schema's job, not the input's", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        expect(input).not.toHaveAttribute("min");
        expect(input).not.toHaveAttribute("max");
        await user.clear(input);
        await user.type(input, "999");
        expect(input).toHaveValue(999);
        expect(screen.getByTestId("value-probe").textContent).toBe("999");
      });

      it("renders 0, not blank, when the field's value is undefined — the field.state.value ?? 0 fallback", () => {
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        expect(input).toHaveValue(0);
      });

      it("accepts and coerces a decimal value", () => {
        // A single fireEvent.change (one native "change" event carrying the
        // final string) rather than userEvent.type — typing "42.5" character
        // by character risks jsdom's <input type="number"> value-sanitization
        // algorithm discarding an intermediate value like "42." before the
        // trailing digit lands.
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        fireEvent.change(input, { target: { value: "42.5" } });
        expect(screen.getByTestId("value-probe").textContent).toBe("42.5");
      });

      it("accepts and coerces a negative value", () => {
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        fireEvent.change(input, { target: { value: "-5" } });
        expect(screen.getByTestId("value-probe").textContent).toBe("-5");
      });

      // Ambiguous intent: neither NumberField's JSDoc nor NumberFieldInput's
      // own JSDoc says what a cleared number field should hold. A user
      // clearing a required numeric field would reasonably expect the value
      // to become empty/undefined so "required" validation can catch it — not
      // silently become a valid 0. `NumberFieldInput` computes
      // `Number(e.target.value)`, and `Number("") === 0`, so it does the
      // latter. This assertion targets the behavior a user would reasonably
      // expect and is EXPECTED TO FAIL against the current implementation —
      // see Change B: a failing assertion here is the deliverable.
      it("clearing the input resets the stored value to empty, not a silently-valid 0", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.clear(input);
        expect(screen.getByTestId("value-probe").textContent).toBe("");
      });
    });

    describe("number: min/max boundary enforcement, exact schema error messages", () => {
      it("accepts the minimum boundary value (0) with no validation error", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue={0} />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Quantity cannot be negative.")).not.toBeInTheDocument();
        expect(screen.queryByText("Quantity cannot exceed 100.")).not.toBeInTheDocument();
      });

      it("rejects one below the minimum (-1) with the field's exact min error message", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue={-1} />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Quantity cannot be negative.")).toBeInTheDocument();
      });

      it("accepts the maximum boundary value (100) with no validation error", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue={100} />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Quantity cannot exceed 100.")).not.toBeInTheDocument();
      });

      it("rejects one above the maximum (101) with the field's exact max error message", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue={101} />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Quantity cannot exceed 100.")).toBeInTheDocument();
      });

      // Real finding from reading numberFieldToInputSchema directly: every
      // branch ends in `.default(field.defaultValue)`, applied
      // unconditionally — not gated behind `!field.required` the way
      // `applyBaseInputSchemaMeta`'s `.optional()` is. A missing value is
      // therefore replaced by the default and validated as THAT, never
      // rejected as "required", even though this fixture's field is required.
      it("the real schema accepts a missing value despite required: true — .default() is unconditional", () => {
        const schema = numberFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse(undefined)).toMatchObject({ success: true, data: 0 });
      });
    });
  },
});
```

#### packages/react/src/components/fields/checkbox/Input.test.tsx

Read `checkbox/types.ts`, `config.ts`, `inputSchema.ts`, `Input.tsx`'s JSDoc, and Base UI's `Checkbox.Root` source first. Findings: `CheckboxFieldInput` passes `hideRequired` to `FormLabel` (suppressing the generic required-asterisk check — covered by the shared factory, not duplicated here) and ORs the `readOnly` prop with `fieldDef.admin.readOnly` into **both** `disabled` and `readOnly`, unlike the split the other three fields use. Base UI's `Checkbox.Root` supports an `indeterminate` prop, but neither `CheckboxField` nor `CheckboxFieldInput` exposes any config surface for it. Critically, `checkboxFieldToInputSchema` — like `numberFieldToInputSchema` — ends in an unconditional `z.boolean().default(field.defaultValue)`, so a required checkbox's "required" never actually blocks an unchecked or missing submission at the schema level. Also, Base UI places the `id` prop on the field's visually-hidden native `<input type="checkbox">`, not the visible `role="checkbox"` span, specifically so a `<label for>` click still forwards natively. Techniques used: state transitions (unchecked → checked → unchecked) plus an interaction-sequence variant through the label instead of the control; a negative/boundary check that indeterminate is architecturally unreachable; and equivalence partitioning over the schema's boolean domain (`true`/`false`/missing) read directly off `checkboxFieldToInputSchema`.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { checkboxFieldToInputSchema, type CheckboxField, type CollectionConfig } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { checkboxFieldFixture } from "./testFixture";
import { CheckboxFieldInput } from "./Input";

/** Mounts `CheckboxFieldInput` behind a real `useForm` + `<AppForm>`. */
function CheckboxHarness(props: {
  fieldDef: CheckboxField;
  collection: CollectionConfig;
  initialValue: boolean;
  readOnly?: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <CheckboxFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
    </AppForm>
  );
}

/**
 * Mounts `CheckboxFieldInput` with the field's REAL `checkboxFieldToInputSchema`
 * wired as an explicit `form.Field` `onSubmit` validator, plus a submit
 * button, to check the field's actual submitted-value semantics through the
 * real submit path.
 */
function CheckboxBoundaryHarness(props: {
  fieldDef: CheckboxField;
  collection: CollectionConfig;
  initialValue: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = checkboxFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <CheckboxFieldInput
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: checkboxFieldFixture,
  Component: CheckboxFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("checkbox: checked/unchecked toggle and label-click delegation", () => {
      it("starts unchecked and toggles to checked on click, then back on a second click", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty ?? false}
          />,
        );
        const box = screen.getByRole("checkbox", { name: options.fixture.fieldDef.label });
        expect(box).not.toBeChecked();
        await user.click(box);
        expect(box).toBeChecked();
        await user.click(box);
        expect(box).not.toBeChecked();
      });

      // `FormLabel` renders `htmlFor={name}`, and Base UI's `Checkbox.Root`
      // places that same id on its visually-hidden native
      // `<input type="checkbox">` (not the visible span) specifically so the
      // browser's native label-click delegation works — exercised end to end.
      it("clicking the field's label toggles the checkbox, the same as clicking the control", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue={false} />,
        );
        const box = screen.getByRole("checkbox", { name: options.fixture.fieldDef.label });
        expect(box).not.toBeChecked();
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).toBeChecked();
      });

      it("clicking the field's label is a no-op when the field is disabled via the readOnly prop", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
            readOnly
          />,
        );
        const box = screen.getByRole("checkbox", { name: options.fixture.fieldDef.label });
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).not.toBeChecked();
      });

      // CheckboxFieldInput ORs BOTH sources into the same disabled/readOnly
      // pair, unlike text/number/url's split — exercising fieldDef.admin.readOnly
      // through the label-click path specifically, since that path is not
      // covered by the shared factory's generic readOnly checks.
      it("clicking the field's label is a no-op when the field is disabled via fieldDef.admin.readOnly instead", async () => {
        const user = userEvent.setup();
        const readOnlyFieldDef: CheckboxField = {
          ...options.fixture.fieldDef,
          admin: { ...options.fixture.fieldDef.admin, readOnly: true },
        };
        render(
          <CheckboxHarness fieldDef={readOnlyFieldDef} collection={collection} initialValue={false} />,
        );
        const box = screen.getByRole("checkbox", { name: options.fixture.fieldDef.label });
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).not.toBeChecked();
      });
    });

    describe("checkbox: indeterminate is architecturally unreachable", () => {
      // Negative/boundary check: Base UI's Checkbox.Root supports an
      // `indeterminate` prop, but CheckboxField/CheckboxFieldInput expose no
      // config surface for it, so the state can never be reached through this
      // field type.
      it("never renders an indeterminate ARIA state", () => {
        render(
          <CheckboxHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue={true} />,
        );
        const box = screen.getByRole("checkbox", { name: options.fixture.fieldDef.label });
        expect(box).not.toHaveAttribute("data-indeterminate");
        expect(box.getAttribute("aria-checked")).not.toBe("mixed");
      });
    });

    describe("checkbox: required means present, not checked", () => {
      // Reading checkboxFieldToInputSchema directly: it always ends in
      // `z.boolean().default(field.defaultValue)`, and
      // applyBaseInputSchemaMeta only conditionally adds `.optional()` — it
      // never strips that unconditional `.default()`. A missing value is
      // therefore replaced with the default and validated as a normal
      // boolean, so "required" never rejects anything at the schema level,
      // checked or not.
      it("accepts true, false, AND a missing value for a required checkbox", () => {
        const schema = checkboxFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse(true)).toMatchObject({ success: true, data: true });
        expect(schema.safeParse(false)).toMatchObject({ success: true, data: false });
        expect(schema.safeParse(undefined)).toMatchObject({ success: true, data: false });
      });

      it("submitting the form with the checkbox left unchecked produces no validation error, even though the field is required", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/url/Input.test.tsx

Read `url/types.ts`, `config.ts`, `inputSchema.ts` and `Input.tsx`'s JSDoc first, then verified `z.url()`'s real behavior directly (zod 4.4.3, `v4/core/schemas.js`): it `.trim()`s the input before parsing (so leading/trailing whitespace passes), imposes **no** protocol restriction unless `.protocol(...)` is explicitly configured (which `urlFieldToInputSchema` never does, so `mailto:`/`ftp://`/any scheme with a colon passes, not just `http`/`https`), and requires an absolute URL — a bare domain or a root-relative path always throws inside `new URL()` and fails. For the required branch (`z.url().min(1, "This field is required.")`), the url-format check runs *before* the length check in the chain, so an empty string surfaces `"Invalid URL"` as `issues[0]` — the message `FormError` actually displays — not `"This field is required."`. Techniques used: error-path coverage over the schema's real accept/reject boundary (relative vs. absolute, protocol-agnostic, whitespace), plus one intent-revealing test on chain ordering.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { urlFieldToInputSchema, type CollectionConfig, type UrlField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { urlFieldFixture } from "./testFixture";
import { UrlFieldInput } from "./Input";

/** Mounts `UrlFieldInput` behind a real `useForm` + `<AppForm>`. */
function UrlHarness(props: {
  fieldDef: UrlField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <UrlFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
    </AppForm>
  );
}

/**
 * Mounts `UrlFieldInput` with the field's REAL `urlFieldToInputSchema` wired
 * as an explicit `form.Field` `onSubmit` validator, plus a submit button, so
 * the schema's actual accepted/rejected notations and exact error messages
 * can be checked through the real submit path.
 */
function UrlBoundaryHarness(props: {
  fieldDef: UrlField;
  collection: CollectionConfig;
  initialValue: string;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = urlFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <UrlFieldInput
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: urlFieldFixture,
  Component: UrlFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("url: the input never format-checks — that is deferred entirely to the schema", () => {
      it('renders a plain text input, not the browser\'s native type="url"', () => {
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        expect(screen.getByLabelText(options.fixture.fieldDef.label, { exact: false })).toHaveAttribute(
          "type",
          "text",
        );
      });

      it("accepts a malformed URL verbatim while typing — no client-side format rejection", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "not-a-valid-url");
        expect(input).toHaveValue("not-a-valid-url");
      });

      it("accepts a well-formed absolute URL while typing", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, options.fixture.valid);
        expect(input).toHaveValue(options.fixture.valid);
      });
    });

    describe("url: urlFieldToInputSchema — absolute-only, protocol-agnostic, whitespace-trimmed", () => {
      it('rejects a bare domain with no scheme ("example.com") with the schema\'s real "Invalid URL" message', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue="" />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "example.com");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
      });

      it('rejects a root-relative path ("/relative/path") the same way — the schema requires an absolute URL', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue="" />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "/relative/path");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
      });

      it("accepts a non-http(s) scheme (mailto:) — urlFieldToInputSchema is not restricted to http/https", async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue="" />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "mailto:test@example.com");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });

      it("accepts a value with leading/trailing whitespace — z.url() trims before validating", async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue="" />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "  https://example.com  ");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });

      // Real finding from reading urlFieldToInputSchema directly: the
      // required branch is `z.url().min(1, "This field is required.")` — the
      // url-format check runs BEFORE the length check in that chain, and an
      // empty string fails the format check too (`new URL("")` throws), so
      // issues[0] — the one FormError displays — is "Invalid URL", not "This
      // field is required.", for an empty required url field.
      it('shows "Invalid URL" (not "This field is required.") as the first error when the required field is left empty', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness fieldDef={options.fixture.fieldDef} collection={collection} initialValue="" />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
        expect(screen.queryByText("This field is required.")).not.toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/color/Input.test.tsx

Read `color/types.ts`, `config.ts`, `inputSchema.ts`, `formats.ts`, `convert.ts`, `Input.tsx`'s JSDoc, and its colocated `utils.ts` first — `utils.test.ts` already covers `readThemeColorTokens()` exhaustively, so nothing here duplicates it; these tests exercise the picker component and the schema instead. Findings: `colorFieldToInputSchema` deliberately accepts **every** supported notation (hex/rgb/hsl/oklch) regardless of `fieldDef.format` — `format` only decides what the picker *writes*, per its own JSDoc — and rejects `var(--token)` unless `themeColors` is on (this fixture leaves it off, the default). The hex pattern rejects 3-digit shorthand but accepts an 8-digit `#RRGGBBAA` alpha suffix, and `Sketch` is mounted with `disableAlpha={false}` unconditionally — alpha is always available, with no per-field toggle. The picker's own "Hex" `EditableInput` (inside the popover) is a real, independently labelled `<input>` whose `onChange` drives the exact same `field.handleChange(serializeColor(...))` path as the outer text box — verified end to end, including the real `@uiw/color-convert` hex→hsva→rgba round trip (`#e8622a` → `{r:232,g:98,b:42,a:1}`, lossless). Techniques used: equivalence partitioning over the 4 accepted notations plus 2 rejection classes (invalid hex, disallowed theme token), both read directly off the schema; and state transitions (closed → open → value-committed → closed) for the picker itself.

```tsx
import { describe, expect, it, beforeAll } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { colorFieldToInputSchema, type ColorField, type CollectionConfig } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { installDomPolyfills } from "../../../testing/setup";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { colorFieldFixture } from "./testFixture";
import { ColorFieldInput } from "./Input";

// The colour picker's popover is positioned by Base UI's floating-ui
// integration, which — like cmdk's virtual list in `ui/multi-select.test.tsx`
// — expects a real layout engine. jsdom has none; install the same
// ResizeObserver/scrollIntoView stubs before opening any popover in this file.
beforeAll(() => {
  installDomPolyfills();
});

/** Mounts `ColorFieldInput` behind a real `useForm` + `<AppForm>`. */
function ColorHarness(props: {
  fieldDef: ColorField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <ColorFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: colorFieldFixture,
  Component: ColorFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;
    const label = options.fixture.fieldDef.label;

    describe("color: the plain text input accepts any notation, mirrored to the swatch", () => {
      it("accepts a hex value and reflects it as the swatch's background colour", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(label, { exact: false });
        await user.type(input, "#ff0000");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        // jsdom normalizes a hex colour assigned to `style.backgroundColor` to rgb().
        expect(swatch.style.backgroundColor).toBe("rgb(255, 0, 0)");
      });

      it("accepts an rgb() value verbatim as the swatch's background colour", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(label, { exact: false });
        await user.type(input, "rgb(0, 128, 0)");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        expect(swatch.style.backgroundColor).toBe("rgb(0, 128, 0)");
      });
    });

    describe("color: colorFieldToInputSchema — format governs the picker's writes, not what submit accepts", () => {
      it('accepts every supported notation on submit even though fieldDef.format is "hex"', () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse("rgb(0, 128, 0)").success).toBe(true);
        expect(schema.safeParse("hsl(120, 100%, 25%)").success).toBe(true);
        expect(schema.safeParse("oklch(50% 0.2 140)").success).toBe(true);
      });

      it("rejects a shorthand/invalid hex with the field's exact real error message", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse("#fff");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Enter a colour, e.g. #E8622A.");
        }
      });

      it("accepts an 8-digit hex value with an alpha channel", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse("#e8622a80").success).toBe(true);
      });

      it("rejects a var(--token) theme reference when themeColors is off (this fixture's default)", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse("var(--primary)");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Enter a colour, e.g. #E8622A.");
        }
      });
    });

    describe("color: the swatch button opens/closes a picker with its own value-commit path", () => {
      it("opens the picker on click, revealing its own Hex sub-input", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        expect(screen.queryByLabelText("Hex")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        expect(await screen.findByLabelText("Hex")).toBeInTheDocument();
      });

      it("closes on Escape", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        await screen.findByLabelText("Hex");
        await user.keyboard("{Escape}");
        await waitFor(() => {
          expect(screen.queryByLabelText("Hex")).not.toBeInTheDocument();
        });
      });

      it("typing a full value into the picker's own Hex sub-input commits through onChange, updating the outer text input and the swatch", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        const hexBox = await screen.findByLabelText("Hex");
        // A single fireEvent.change (one native "change" event carrying the
        // final string) rather than userEvent.type — the Hex sub-input only
        // forwards onChange once ITS OWN local value is a clean 3- or
        // 6-character hex string, so typing character by character fires
        // several intermediate 3-character commits (e.g. "e86") before the
        // full 6-character value lands.
        fireEvent.change(hexBox, { target: { value: "e8622a" } });
        expect(screen.getByLabelText(label, { exact: false })).toHaveValue("#e8622a");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        expect(swatch.style.backgroundColor).toBe("rgb(232, 98, 42)");
      });
    });
  },
});
```

Verify:
```
node scripts/record-test-findings.mjs packages/react/src/components/fields/number/Input.test.tsx && node scripts/record-test-findings.mjs packages/react/src/components/fields/checkbox/Input.test.tsx && node scripts/record-test-findings.mjs packages/react/src/components/fields/url/Input.test.tsx && node scripts/record-test-findings.mjs packages/react/src/components/fields/color/Input.test.tsx
```


### Step 7 — Choice field fixture + test (select)

**[agent]**

Why: `select` is options-driven and has a `hasMany` single/multi branch the flat `runFieldInputContractSuite` contract can't generalize. Read in order before writing anything: `packages/core/src/fields/select/types.ts` (every `SelectFieldInput`/`SelectField` prop — `options`, `hasMany`, `optionInterfaceName`), `config.ts` (defaults — `hasMany: false`, `options: []`, `admin.placeholder: ""`), `inputSchema.ts` (the `z.enum(optionValues)` vs. `z.string()` fallback when no options are configured, and the `hasMany: false` → `.max(1, "Only one value may be selected.")` branch — note `selectFieldToInputSchema` never adds a `.min(1)`, so `required: true` on a `select` only actually rejects `undefined`, not an empty array; verified directly against the schema function), `packages/react/src/components/fields/select/Input.tsx` (JSDoc first — it names the real hazard: fields are rendered generically with no prop channel to say "I'm in a dialog," so the component reads `useModalSurface()` and forwards it as `MultiSelect`'s `modal` prop), `ui/multi-select.tsx` (`toggleValue`'s single-vs-multi branch, the `modal` prop's own JSDoc and `useScrollLock` hazard, `MultiSelectValue`'s placeholder/badge/label-resolution logic, `MultiSelectItem`'s index-keyed rendering), and `useModalSurface.tsx`. Cross-checked against the EXISTING `ui/multi-select.test.tsx` (pins the non-modal scroll-lock case already, referenced below rather than re-proven) and `useModalSurface.test.tsx` (pins the context value itself, referenced rather than re-proven).

- [ ] `packages/react/src/components/fields/select/testFixture.ts` — new file, `selectFieldFixture: FieldFixture<SelectField, string[]>` with a 3-option, `hasMany: true` fixture
- [ ] `packages/react/src/testing/fixtures/index.ts` — add the `select` import + registry entry
- [ ] `packages/react/src/components/fields/select/Input.test.tsx` — new file, `runFieldInputContractSuite` + `extra`

#### packages/react/src/components/fields/select/testFixture.ts

```ts
import { select, type SelectField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

const fieldDef: SelectField = select({
  label: "Status",
  required: true,
  hasMany: true,
  options: [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ],
  admin: {
    placeholder: "Choose a status",
  },
});

/**
 * Fixture for the `select` field type — a multi-option, `hasMany: true`
 * choice field. `fieldDef.options` supplies the three choices the shared
 * contract renders and the `Input.test.tsx` `extra` assertions pick apart.
 * `admin.placeholder` is set (default is `""`, which is falsy and renders
 * nothing) so both the shared contract's placeholder check and this type's
 * own nothing-selected assertion have real text to find.
 *
 * `invalid` is `["retired"]` — a value that is not one of `fieldDef.options`.
 * This is deliberate, not arbitrary: `selectFieldToInputSchema` never adds a
 * `.min(1)` to the array, only `.default(field.defaultValue)`, so on a
 * `select` — unlike `text` — `required: true` does NOT reject an empty
 * selection; both `undefined` and `[]` satisfy the schema via its baked-in
 * default (verified directly: `schema.safeParse(undefined)` and
 * `schema.safeParse([])` both succeed with `data: []`). The only value
 * guaranteed to fail is one outside the configured enum — which is also
 * exactly the "enum-validation failure" the type-specific coverage is asked
 * for. The shared contract's "shows an error only after submission" test
 * exercises it generically, with the real `z.enum(...)` message produced by
 * `packages/core/src/fields/select/inputSchema.ts`
 * (`Invalid option: expected one of "draft"|"published"|"archived"`).
 *
 * A single fixture can only carry one `fieldDef`, so the `hasMany: false`
 * single-select variant, an empty-`options` variant, and a duplicate-value
 * variant are all built inline inside `Input.test.tsx`'s `extra` instead.
 */
export const selectFieldFixture: FieldFixture<SelectField, string[]> = {
  fieldType: "select",
  fieldDef,
  valid: ["draft", "published"],
  invalid: ["retired"],
  empty: [],
};
```

#### packages/react/src/testing/fixtures/index.ts

2 edits; everything else unchanged.

**1 — import.** Beside the other per-type fixture imports:

```ts
import { selectFieldFixture } from "../../components/fields/select/testFixture";
```

**2 — registry entry.** Replace the `// select: selectFieldFixture, (step 7)` placeholder comment:

```ts
  select: selectFieldFixture,
```

#### packages/react/src/components/fields/select/Input.test.tsx

Test design for the `extra` block below: **equivalence partitioning** across labels vs. values and single- vs. multi-select; **boundary value analysis** at zero configured options; **state transitions** across open → select → deselect → close and the placeholder's appear/disappear cycle; **error paths** for the enum-validation failure (covered generically above, via the fixture's now-real `invalid`); and **interaction sequences** for select-then-deselect, escape-to-close, outside-click-to-close, and keyboard-only selection. `SelectHarness` exposes the committed form value through a `form.Subscribe` probe — the same pattern `number/Input.test.tsx` uses — so exact array contents (values vs. labels, one item vs. two) are assertable without hand-mocking TanStack's `FieldApi`.

```tsx
import "@testing-library/jest-dom/vitest";
import { useForm } from "@tanstack/react-form";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { select, type SelectField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { ModalSurfaceProvider } from "../../../hooks/useModalSurface";
import { installDomPolyfills } from "../../../testing/setup";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { selectFieldFixture } from "./testFixture";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { SelectFieldInput } from "./Input";

// cmdk (the popover's option list) observes its list for virtual sizing and
// scrolls the highlighted item into view on mount — jsdom has neither
// ResizeObserver nor layout. Every test in this file opens the popover, so
// install once for the whole file, mirroring `ui/multi-select.test.tsx`.
beforeAll(() => {
  installDomPolyfills();
});

/**
 * Mounts `SelectFieldInput` behind a real `useForm` + `<AppForm>`, exposing
 * the committed form value through a probe element so the exact stored
 * array — values not labels, one item vs. two — is assertable without
 * hand-mocking TanStack's `FieldApi`.
 */
function SelectHarness(props: { fieldDef: SelectField; initialValue: string[] }) {
  const form = useForm({ defaultValues: { choice: props.initialValue } });
  return (
    <AppForm form={form}>
      <SelectFieldInput
        name="choice"
        fieldDef={props.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.choice}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: selectFieldFixture,
  Component: SelectFieldInput,
  extra: ({ fixture }) => {
    describe("select field", () => {
      it("renders every configured option in the popover", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));

        for (const option of fixture.fieldDef.options) {
          expect(
            await screen.findByRole("option", { name: option.label }),
          ).toBeInTheDocument();
        }
      });

      it("stores the option's value, not its label, when a selection is made", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));
      });

      it("renders the configured label, not the raw stored value, for an already-selected option", () => {
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={["published"]} />);

        expect(
          within(screen.getByRole("combobox")).getByText("Published"),
        ).toBeInTheDocument();
      });

      it("opens without crashing and lists no options when fieldDef.options is empty", async () => {
        const user = userEvent.setup();
        const emptyOptionsFieldDef = select({ label: "Status", hasMany: true, options: [] });
        render(<SelectHarness fieldDef={emptyOptionsFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // No option ever appears to `findByRole` on, so wait on the reveal
        // effect's own side effect instead — the search input taking focus,
        // same assertion `ui/multi-select.test.tsx` uses to pin that effect.
        await waitFor(() =>
          expect(document.activeElement?.getAttribute("data-slot")).toBe("command-input"),
        );

        expect(screen.queryAllByRole("option")).toHaveLength(0);
      });

      it("collapses duplicate option values to one stored entry, keyed by value not by row", async () => {
        const user = userEvent.setup();
        const duplicateValueFieldDef = select({
          label: "Status",
          hasMany: true,
          options: [
            { label: "Draft A", value: "dup" },
            { label: "Draft B", value: "dup" },
          ],
        });
        render(<SelectHarness fieldDef={duplicateValueFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // Both rows render — `MultiSelectItem` keys on the option's array
        // index, not its `value`, so a duplicate value never collides as a
        // React key.
        expect(await screen.findByRole("option", { name: "Draft A" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Draft B" })).toBeInTheDocument();

        await user.click(screen.getByRole("option", { name: "Draft A" }));

        // Selection is a `Set<string>` keyed by value — clicking either row
        // selects the same "dup" entry.
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["dup"]));
      });

      it("accumulates selections into the array when hasMany is true", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));
        // hasMany keeps the popover open after a selection — no need to
        // reopen it before picking the second option.
        await user.click(await screen.findByRole("option", { name: "Published" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["draft", "published"]),
        );
      });

      it("replaces rather than appends when hasMany is false, and the stored value stays an array", async () => {
        const user = userEvent.setup();
        const singleFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
        });
        render(<SelectHarness fieldDef={singleFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));

        // Single-select closes the popover on selection; reopen it.
        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Published" }));

        // Still an array — `toggleValue` always calls
        // `onValuesChange([...set])` — just capped at one entry instead of
        // appending a second.
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("clears the selection when hasMany is false and the already-selected option is picked again", async () => {
        const user = userEvent.setup();
        const singleFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
        });
        render(<SelectHarness fieldDef={singleFieldDef} initialValue={["draft"]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        // `toggleValue`'s single branch is `prev.has(value) ? new Set() :
        // new Set([value])` — picking the already-selected option toggles it
        // off, not a no-op.
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify([]));
      });

      it("deselects an option by picking it again while hasMany is true", async () => {
        const user = userEvent.setup();
        render(
          <SelectHarness fieldDef={fixture.fieldDef} initialValue={["draft", "published"]} />,
        );

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("removes a selection by clicking its badge in the trigger", async () => {
        const user = userEvent.setup();
        render(
          <SelectHarness fieldDef={fixture.fieldDef} initialValue={["draft", "published"]} />,
        );

        // `MultiSelectValue` renders a `clickToRemove` badge per selected
        // value even while closed — a second removal path independent of
        // reopening the popover. Scoped to the trigger: the always-mounted
        // hidden item list (kept for `onItemAdded` registration) renders the
        // same label text but is excluded from role/text queries only when
        // scoped — `within` avoids the ambiguity outright.
        const combobox = screen.getByRole("combobox");
        await user.click(within(combobox).getByText("Draft"));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("closes when clicking outside the popover", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        expect(await screen.findByRole("option", { name: "Draft" })).toBeInTheDocument();

        await user.click(document.body);

        await waitFor(() =>
          expect(screen.queryByRole("option", { name: "Draft" })).not.toBeInTheDocument(),
        );
      });

      it("closes on Escape", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        expect(await screen.findByRole("option", { name: "Draft" })).toBeInTheDocument();

        await user.keyboard("{Escape}");

        await waitFor(() =>
          expect(screen.queryByRole("option", { name: "Draft" })).not.toBeInTheDocument(),
        );
      });

      it("selects the highlighted option via ArrowDown + Enter, not only via a mouse click", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // cmdk focuses the search input and highlights the first item on open.
        await screen.findByRole("option", { name: "Draft" });

        await user.keyboard("{ArrowDown}{Enter}");

        // Delegated entirely to cmdk's own keyboard handling — `Input.tsx`
        // forwards the option list and implements no navigation itself.
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("does not lock page scroll when rendered on a plain page (outside a modal surface)", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));

        // `SelectFieldInput` reads `useModalSurface()` and only passes
        // `modal: true` to `MultiSelect` inside a dialog. Rendered on a
        // plain page (no `Modal` ancestor) it must stay non-modal, or Base
        // UI's `useScrollLock` snaps the page to the top and the popover
        // closes itself — see `ui/multi-select.tsx`'s `modal` JSDoc and AP-018.
        expect(document.body.style.position).not.toBe("relative");
        expect(document.body.style.overflow).not.toBe("hidden");
      });

      it("still opens and functions when rendered inside a modal surface (the useModalSurface branch)", async () => {
        const user = userEvent.setup();
        render(
          <ModalSurfaceProvider>
            <SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />
          </ModalSurfaceProvider>,
        );

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));
        // `modal: true` engages Base UI's `useScrollLock`, which only writes
        // `body.style` when the document is actually scrollable — jsdom has
        // no layout, so that half is not observable here. The context value
        // itself (`useModalSurface` returning `true` inside a
        // `ModalSurfaceProvider`) is already pinned by
        // `hooks/useModalSurface.test.tsx`; this test instead proves
        // `SelectFieldInput` actually reads it and wires it through without
        // breaking the popover.
      });

      it("shows the placeholder only while nothing is selected", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        expect(screen.getByText("Choose a status")).toBeInTheDocument();

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        // `MultiSelectValue` only renders the placeholder when
        // `selectedValues.size === 0` — it must disappear the moment a
        // value lands, not just avoid erroring while one is present.
        expect(screen.queryByText("Choose a status")).not.toBeInTheDocument();
      });
    });
  },
});
```

Verify: `node scripts/record-test-findings.mjs packages/react/src/components/fields/select/Input.test.tsx`


### Step 8 — Temporal field fixture + test (date)

Why: `date` has the largest per-type surface in the registry — a date-only/date+time config
branch, a fully deep-merged `time.timePicker` sub-config (`field-config-conventions.md`'s
canonical deep-merge example, `packages/core/src/fields/date/config.ts:57-66`), a calendar that
commits only on an explicit "Done" click, a clear button, `min`/`max` bounds the field's own
JSDoc claims are "validated in the input schema", and an explicit `ADMIN_FIELDS.date.defaultValue
=== undefined` convention (`field-config-conventions.md`) guarding against a silent 1970
pre-fill. Reading `packages/core/src/fields/date/{types.ts,config.ts,inputSchema.ts}`,
`packages/react/src/components/fields/date/Input.tsx`, and
`packages/react/src/components/ui/datetime/{date-picker.tsx,time-picker.tsx,input.tsx}` end to
end surfaces several real gaps between the field's documented intent and its implementation —
those become intentionally red tests (Change B), not softened assertions.
Verify: `node scripts/record-test-findings.mjs packages/react/src/components/fields/date/Input.test.tsx`
- [ ] **[agent]** `packages/react/src/components/fields/date/testFixture.ts` — `dateFieldFixture: FieldFixture<DateField, string>`
- [ ] **[agent]** `packages/react/src/testing/fixtures/index.ts` — register `date: dateFieldFixture`
- [ ] **[agent]** `packages/react/src/components/fields/date/Input.test.tsx` — `runFieldInputContractSuite` + a comprehensive `extra` (14 tests) covering: the date-only/date+time/24-hour trigger-label branches; the `time.timePicker.{hour,minute,second}` per-unit opt-in/opt-out on the inline `TimePicker`; calendar day selection committed only via "Done" vs. discarded via Escape; the clear button; `min`/`max` bounds at both the schema layer and the calendar-forwarding layer; and the `ADMIN_FIELDS.date.defaultValue === undefined` guard — several of these are deliberately red, documented findings (Change B), not softened to match current behavior

#### packages/react/src/components/fields/date/testFixture.ts

New file. `DateFieldInput` stores a Unix-ms timestamp on the form (`field.state.value ? new Date(field.state.value) : undefined` in `Input.tsx`), but `new Date(...)` accepts an ISO string just as well as a number, so the fixture's `TValue = string` (an ISO date string, per the contract) mounts cleanly through the same `Harness` pattern every other fixture uses — no special-casing needed in `fieldInputContract.ts` for this type.

```ts
import { date, type DateField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Fixture for the `date` field type.
 *
 * `valid` is an ISO date string — `DateFieldInput` passes it straight to
 * `new Date(...)`, which parses ISO strings the same way it parses the
 * Unix-ms timestamps the field actually persists.
 */
export const dateFieldFixture: FieldFixture<DateField, string> = {
  fieldType: "date",
  fieldDef: date({ label: "Published At", required: true }),
  valid: "2025-06-15T10:30:00.000Z",
  invalid: undefined,
  empty: undefined,
};
```

#### packages/react/src/testing/fixtures/index.ts

Existing file (built by step 4, already carrying steps 5–7's entries). 2 edits — everything else unchanged.

**1 — import.** Alongside the other per-type fixture imports growing above `fieldFixtures`:

```ts
import { dateFieldFixture } from "../../components/fields/date/testFixture";
```

**2 — registry entry.** Beside the `// text: textFieldFixture, (step 5)` comment placeholder, uncomment the equivalent `date` line:

```ts
  date: dateFieldFixture,
```

#### packages/react/src/components/fields/date/Input.test.tsx

New file. Test-design techniques used, per test-group: **equivalence partitioning** across the
date-only/date+time/24-hour format branches and the per-unit `timePicker` opt-in/opt-out (one
representative render per branch, not one per possible boolean combination); **state
transitions** for the calendar (closed→open→day-selected→committed, and
closed→open→day-selected→discarded-via-Escape) and for the clear button
(filled→cleared); **boundary value analysis** for `min`/`max` (exactly at the boundary vs. one
millisecond past it); and **error paths** for the two `min`/`max` schema gaps and the JSDoc-vs.-
code disagreement documented below. All format assertions read `DateTimePicker`'s trigger label
(`packages/react/src/components/ui/datetime/date-picker.tsx`'s `dislayFormat` memo) and the
inline `TimePicker`'s own trigger label (`date-picker.tsx`'s `display` memo) via structural
regexes — segment counts and separators, never literal date/time digits, since jsdom's rendered
values are local-timezone-dependent. Day selection and the min/max-forwarding gap read
react-day-picker v9's own `data-day="yyyy-MM-dd"` attribute (`node_modules/react-day-picker/dist/esm/DayPicker.js`) directly off each `<td>` cell — a stable,
locale-independent hook, unlike the cell's `aria-label` (react-day-picker's `labelDayButton`
formats a full `"PPPP"` string) or the DayButton's visible text (bare day-of-month digits, which
collide across the leading/trailing days of adjacent months shown by `showOutsideDays`).

Two surfaces named in this step's brief are intentionally **not** tested, because reading the
code shows neither is reachable through `DateFieldInput`'s actual render tree:
- **Keyboard entry of a malformed date string.** `DateFieldInput` only ever renders
  `DateTimePicker`, which is entirely selection-based (calendar day clicks + scrollable
  hour/minute/second lists) — it never renders `DateTimeInput` (`ui/datetime/input.tsx`), the
  package's segmented free-text date input, nor `SimpleTimePicker` (`ui/datetime/time-picker.tsx`).
  Both exist in `ui/datetime` but are unused by this field's component tree, confirmed by
  grepping for their usages. There is no free-text entry point to type a malformed date into, so
  no such test is written.
- **Timezone/DST handling.** `DateTimePickerProps.timezone` exists and is genuinely read
  (`TZDate` construction, the "Timezone: …" caption), but neither `DateFieldInput` (input type)
  nor `DateField` (resolved type) exposes a `timezone` config property, and `Input.tsx` never
  passes a `timezone` prop to `<DateTimePicker>` — it is always `undefined`, so the component
  always operates on plain local-time `Date` objects. No DST-crossing behavior is reachable
  through this field's real config surface, so no such test is written.

Several tests below are marked `KNOWN GAP` and are **expected to fail** against the current
implementation — per Change B, that is the deliverable, not a bug to fix here:
1. **Clearing.** `clearable` is unconditionally passed to `DateTimePicker` and its clear button
   calls `onChange(undefined)`, but `Input.tsx`'s own `handleChange` wrapper is
   `if (date) { fieldRef.current.handleChange(date.getTime()) }` — the `if (date)` guard silently
   drops the clear button's `undefined`, so clicking Clear never actually empties the field.
2. **`min`/`max` schema enforcement.** `DateFieldInput`'s (core) JSDoc says both are "Validated
   in the input schema", but `dateFieldToInputSchema` (`packages/core/src/fields/date/inputSchema.ts`)
   builds a bare `z.number()` (or `.default(now)` for required fields) and never reads
   `field.min`/`field.max` — any timestamp passes regardless of the configured bounds.
3. **`min`/`max` calendar forwarding.** `DateTimePicker` already supports disabling out-of-range
   days when given `min`/`max` (`date-picker.tsx`'s `DayPicker disabled={...}`), but `Input.tsx`'s
   JSX only forwards `value`, `onChange`, `disabled`, `clearable`, `hideTime`, `use12HourFormat`,
   and `timePicker` — `min`/`max` are never threaded through, so the calendar never disables a
   day no matter what `fieldDef.min`/`fieldDef.max` say.

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";
import { adminFieldToInputSchema, date, type DateField } from "@vexcms/core";
import { DateFieldInput } from "./Input";
import { AppForm } from "../../form/AppForm";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { dateFieldFixture } from "./testFixture";
import { testCollection } from "../../../testing/harness/accessFixtures";

// "MMMM d, yyyy" — date-only trigger label (time.hidden: true)
const DATE_ONLY_LABEL = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
// "MMM d, yyyy hh:mm:ss a" — default date+time trigger label (12-hour)
const DATE_TIME_LABEL = /^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2} (AM|PM)$/;
// "MMM d, yyyy HH:mm:ss" — date+time trigger label, time.use12HourFormat: false
const DATE_TIME_24H_LABEL = /^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2}$/;
// inline TimePicker's own button label, seconds hidden (timePicker.second: false, the default)
const TIME_NO_SECONDS = /^\d{2}:\d{2} (AM|PM)$/;
// inline TimePicker's own button label, seconds shown (timePicker.second: true)
const TIME_WITH_SECONDS = /^\d{2}:\d{2}:\d{2} (AM|PM)$/;
// inline TimePicker's own button label, hour hidden (timePicker.hour: false) — only minute + period remain
const TIME_MINUTE_ONLY = /^\d{2} (AM|PM)$/;

function DateHarness(props: { fieldDef: DateField; initialValue: string | undefined }) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <DateFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

/**
 * Finds a clickable, in-range, in-month calendar day cell in an already-open
 * picker — used by the day-selection tests instead of a hardcoded date, since
 * the exact days rendered depend on the fixture's local-timezone-rendered month.
 */
function findSelectableDayCell(container: HTMLElement): HTMLElement {
  const cell = container.querySelector<HTMLElement>(
    "td[data-day]:not([data-outside]):not([data-selected]):not([data-disabled])",
  );
  if (!cell) throw new Error("No selectable day cell found in the open calendar.");
  return cell;
}

runFieldInputContractSuite({
  fixture: dateFieldFixture,
  Component: DateFieldInput,
  extra: ({ fixture }) => {
    describe("date field: date-only vs date+time formatting", () => {
      it("renders a date-only trigger label when time.hidden is true", () => {
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: { ...fixture.fieldDef.time, hidden: true },
            }}
            initialValue={fixture.valid}
          />,
        );
        expect(screen.getByText(DATE_ONLY_LABEL)).toBeInTheDocument();
      });

      it("renders a date+time trigger label in 12-hour format by default", () => {
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        expect(screen.getByText(DATE_TIME_LABEL)).toBeInTheDocument();
      });

      it("renders a 24-hour date+time trigger label when time.use12HourFormat is false", () => {
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: { ...fixture.fieldDef.time, use12HourFormat: false },
            }}
            initialValue={fixture.valid}
          />,
        );
        expect(screen.getByText(DATE_TIME_24H_LABEL)).toBeInTheDocument();
      });
    });

    describe("date field: time.timePicker per-unit opt-in/opt-out", () => {
      it("hides the seconds column by default (timePicker.second: false)", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_NO_SECONDS)).toBeInTheDocument();
      });

      it("shows the seconds column when time.timePicker.second is opted in", async () => {
        const user = userEvent.setup();
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: {
                ...fixture.fieldDef.time,
                timePicker: { ...fixture.fieldDef.time.timePicker, second: true },
              },
            }}
            initialValue={fixture.valid}
          />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_WITH_SECONDS)).toBeInTheDocument();
      });

      it("hides the hour column when time.timePicker.hour is opted out, independently of its minute/second siblings", async () => {
        const user = userEvent.setup();
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: {
                ...fixture.fieldDef.time,
                timePicker: { ...fixture.fieldDef.time.timePicker, hour: false },
              },
            }}
            initialValue={fixture.valid}
          />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_MINUTE_ONLY)).toBeInTheDocument();
      });
    });

    describe("date field: calendar day selection commits only via Done", () => {
      it("selecting a different calendar day and clicking Done commits the new day, preserving the time-of-day", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));

        const initialDate = new Date(fixture.valid);
        const targetCell = findSelectableDayCell(container);
        const targetDay = targetCell.getAttribute("data-day")!; // "yyyy-MM-dd"
        await user.click(targetCell.querySelector("button")!);
        await user.click(screen.getByRole("button", { name: /done/i }));

        const probe = screen.getByTestId("value-probe").textContent;
        const committed = new Date(JSON.parse(probe!) as number);
        const [year, month, day] = targetDay.split("-").map(Number);
        expect(committed.getFullYear()).toBe(year);
        expect(committed.getMonth() + 1).toBe(month);
        expect(committed.getDate()).toBe(day);
        // onDayChanged (date-picker.tsx) only overwrites y/m/d — the clicked day's
        // h/m/s come from whatever internal `date` state already held, unchanged
        // since no time-of-day interaction happened in this test.
        expect(committed.getHours()).toBe(initialDate.getHours());
        expect(committed.getMinutes()).toBe(initialDate.getMinutes());
      });

      it("selecting a day but dismissing with Escape instead of Done leaves the committed value unchanged", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />,
        );
        const before = screen.getByTestId("value-probe").textContent;

        await user.click(screen.getByText(DATE_TIME_LABEL));
        const targetCell = findSelectableDayCell(container);
        await user.click(targetCell.querySelector("button")!);
        await user.keyboard("{Escape}");

        expect(screen.getByTestId("value-probe").textContent).toBe(before);
      });
    });

    describe("date field: clearing to empty", () => {
      it("KNOWN GAP — clicking the clear button never reaches field.handleChange, so the value never actually clears", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        const before = screen.getByTestId("value-probe").textContent;
        expect(before).not.toBe("");

        await user.click(screen.getByRole("button", { name: /clear date/i }));

        // Intended: clearable is unconditionally set on DateTimePicker (Input.tsx), so
        // clicking Clear should empty the field and restore the "Pick a date" placeholder.
        // Actual: Input.tsx's handleChange wrapper is `if (date) { ...handleChange(...) }` —
        // it silently drops the clear button's `onChange(undefined)`, so the form value
        // and the rendered trigger label never change.
        expect(screen.getByTestId("value-probe").textContent).toBe("");
        expect(screen.getByText("Pick a date")).toBeInTheDocument();
      });
    });

    describe('date field: min/max bounds (JSDoc: "Validated in the input schema")', () => {
      it("KNOWN GAP — accepts a timestamp before fieldDef.min: dateFieldToInputSchema never reads field.min", () => {
        const boundary = new Date(fixture.valid).getTime();
        const fieldWithMin: DateField = { ...fixture.fieldDef, min: boundary };
        const belowMin = boundary - 1;

        const result = adminFieldToInputSchema({ field: fieldWithMin }).safeParse(belowMin);

        expect(result.success).toBe(false);
      });

      it("KNOWN GAP — accepts a timestamp after fieldDef.max: dateFieldToInputSchema never reads field.max", () => {
        const boundary = new Date(fixture.valid).getTime();
        const fieldWithMax: DateField = { ...fixture.fieldDef, max: boundary };
        const aboveMax = boundary + 1;

        const result = adminFieldToInputSchema({ field: fieldWithMax }).safeParse(aboveMax);

        expect(result.success).toBe(false);
      });

      it("KNOWN GAP — DateFieldInput never forwards fieldDef.min/max to the calendar, so out-of-range days are never disabled", async () => {
        const user = userEvent.setup();
        const initial = new Date(fixture.valid);
        const fieldWithMin: DateField = { ...fixture.fieldDef, min: initial.getTime() };
        const { container } = render(
          <DateHarness fieldDef={fieldWithMin} initialValue={fixture.valid} />,
        );

        await user.click(screen.getByText(DATE_TIME_LABEL));

        const dayBefore = new Date(initial);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const iso = [
          dayBefore.getFullYear(),
          String(dayBefore.getMonth() + 1).padStart(2, "0"),
          String(dayBefore.getDate()).padStart(2, "0"),
        ].join("-");
        const cell = container.querySelector(`td[data-day="${iso}"]`);

        // Intended: DateTimePicker's own `disabled` prop (date-picker.tsx's DayPicker)
        // already disables days before `min`/after `max` when those props are supplied.
        // Actual: Input.tsx's JSX never forwards `fieldDef.min`/`fieldDef.max` to
        // <DateTimePicker> (only value/onChange/disabled/clearable/hideTime/
        // use12HourFormat/timePicker are passed), so this day is always enabled.
        expect(cell).toHaveAttribute("data-disabled");
      });
    });

    describe("date field: ADMIN_FIELDS.date.defaultValue is undefined, never 0", () => {
      it("date() resolves defaultValue to undefined when unset — unlike number()'s 0 or checkbox()'s false", () => {
        expect(date().defaultValue).toBeUndefined();
      });

      it("mounting a brand-new document (unset defaultValue) shows the 'Pick a date' placeholder, never a Jan 1 1970 date", () => {
        expect(fixture.fieldDef.defaultValue).toBeUndefined();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={undefined} />);
        expect(screen.getByText("Pick a date")).toBeInTheDocument();
        expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
      });
    });
  },
});
```

Verify: `node scripts/record-test-findings.mjs packages/react/src/components/fields/

### Step 9 — Network-backed field fixture + test (upload) **[agent]**

Why: `upload` is async (storage-adapter call, dropzone accept/reject) rather than a synchronous
controlled input — reuses the `File`-mocking and `StorageAdapterContext` pattern already proven
in `media/MediaUploadForm.test.tsx` instead of inventing a new one. `UploadFieldInput` also reads
`VexConfigContext` (media-collection lookup) and nuqs (the picker modal's URL-driven open state)
outside `<AppForm>`, and its filled state queries a document via `@tanstack/react-query` — all four
need stub providers the shared `runFieldInputContractSuite` harness doesn't supply on its own, so
this step wraps `UploadFieldInput` in a small test-only `Component` before handing it to the
factory.

A full read of `packages/core/src/fields/upload/{types,config,inputSchema,validator}.ts`,
`packages/react/src/components/fields/upload/{Input,EmptyInput,FilledInput}.tsx`,
`StorageAdapterContext.tsx`, and the `MediaPicker`/`MediaUploadForm` components the field's picker
delegates to (`MediaUploadDropzone.tsx` turns out to be dead code on this path — nothing renders
it; the actual upload submit in `MediaUploadForm.tsx` does a raw `fetch()`, never
`useStorageAdapterMap()`) surfaced several real gaps against the code's own documented or implied
intent: a dead `if (readOnly)` branch in `Input.tsx` that builds JSX but never `return`s it; an
`EmptyInput` file input hardcoded `multiple` regardless of `hasMany`; no mime-type enforcement on
drag-and-drop despite a configured `accept`; a `required: true` field's Zod schema
(`z.array(z.string())`, no `.min(1)`) that still accepts an empty array; and a swallowed
upload-failure error with no user-facing indicator (`MediaUploadForm.tsx`'s own
`// TODO: Show error toast`). Per this spec's Change A, `extra` below asserts the reasonably-
intended behavior for each of these and lets the ones that currently fail stand as recorded
findings, not softened assertions.

- [x] `packages/react/src/components/fields/upload/testFixture.ts` — `uploadFieldFixture: FieldFixture<UploadField, string[]>` (resolved media-document ids) + `makeFile()` helper
- [x] `packages/react/src/testing/fixtures/index.ts` — register `upload: uploadFieldFixture`
- [x] `packages/react/src/components/fields/upload/Input.test.tsx` — `runFieldInputContractSuite` + a comprehensive `extra` covering the empty/filled render branches, the read-only dead-code branch, the missing-target-collection guard, dropzone accept/reject by mime type, single-vs-multi file staging, the max-capacity boundary, file removal (single row + clear-all), the required-field/empty-array schema gap, and the full mocked upload flow (success round-trip + failure recovery) — wrapped in a stub `StorageAdapterContextProvider`

#### packages/react/src/components/fields/upload/testFixture.ts

New file. Unchanged by this pass — Change A only expands `Input.test.tsx`'s `extra`.

```ts
import { ADMIN_FIELDS, upload } from "@vexcms/core";
import type { UploadField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Builds a `File` for upload-field tests. The byte payload is a fixed stub —
 * `UploadFieldInput`'s dropzone and `MediaUploadForm`'s staging list only
 * ever read `File.name`/`File.type`, never the bytes.
 *
 * @param name — File name, e.g. `"cover.png"`.
 * @param type — MIME type. Defaults to `"image/png"`.
 * @returns A `File` usable as `fireEvent.change`'s `target.files` entry.
 */
export function makeFile(name: string, type = "image/png"): File {
  return new File(["stub-file-content"], name, { type });
}

/**
 * Fixture for `UploadField` — the stored value is `string[]` of resolved
 * media-document ids. `hasMany: true` + `max: 3` exercises the multi-file
 * path; `required: true` makes `invalid` (`undefined`) a real validation
 * failure instead of a no-op.
 */
export const uploadFieldFixture: FieldFixture<UploadField, string[]> = {
  fieldType: ADMIN_FIELDS.upload.type,
  fieldDef: upload({
    to: "images",
    label: "Cover Images",
    required: true,
    hasMany: true,
    max: 3,
    accept: "image/*",
  }),
  valid: ["images_1", "images_2"],
  invalid: undefined,
  empty: undefined,
};
```

#### packages/react/src/testing/fixtures/index.ts

Existing file (Step 4 creates it empty; steps 5–8 add their own imports/entries in parallel) —
2 edits, everything else unchanged. Unchanged by this pass.

**1 — import.** Beside the `// ...import each per-type fixture as it's added by later steps...`
comment, add:

```ts
import { uploadFieldFixture } from "../../components/fields/upload/testFixture";
```

**2 — registry entry.** Beside the `// text: textFieldFixture, (step 5)` placeholder inside
`fieldFixtures`, add:

```ts
  upload: uploadFieldFixture, // (step 9)
```

#### packages/react/src/components/fields/upload/Input.test.tsx

New file. `extra` applies equivalence partitioning (one dropzone mime-mismatch case, one
`hasMany: false` case — not every possible file type/mode), boundary value analysis
(`mediaIds.length` at vs. just-under `fieldDef.max`), state transitions (empty → staged-but-not-
submitted → filled via a mocked upload; filled → one item removed → filled; filled → cleared →
empty), error paths (the missing-target-collection guard, the required+empty-array schema gap,
the swallowed upload-failure error), and one full interaction sequence (select file → picker
opens → submit → mocked storage round-trip → picker closes → filled state). Assertions target the
code's evident intent — a dropzone declaring `accept` should reject a non-matching drop,
`hasMany: false` should stage exactly one file, `required: true` should reject an empty array, a
failed upload should tell the user — rather than its current output, so several are expected to
fail; each of those carries a `[finding]` marker in its title and an inline comment explaining the
gap, per Change B these are recorded, not softened. The mocked-upload-flow tests replace
`@convex-dev/react-query`'s `useConvexMutation` and `../../../hooks`'s `useVexMutation` with
`vi.fn()`s (spread over the real modules via `importOriginal`, so `convexQuery` — which
`UploadItemRow`'s `get()` call still needs for every other test in this file — is untouched) and
stub `global.fetch`, so the real submit path in `MediaUploadForm.tsx` (`generateUploadUrl` →
`fetch` → `createMediaDocument`) runs against controlled responses instead of a real network call.

```tsx
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { useForm } from "@tanstack/react-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminFieldToInputSchema, text } from "@vexcms/core";
import type {
  BaseFieldMeta,
  ClientVexConfig,
  InputComponentProps,
  MediaCollectionConfig,
  UploadField,
} from "@vexcms/core";

import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { uploadFieldFixture, makeFile } from "./testFixture";
import { AppForm } from "../../form";
import { StorageAdapterContextProvider, VexConfigContext } from "../../../context";
import { UploadFieldInput } from "./Input";

// Mocked around the real modules (not replaced wholesale) so every OTHER test
// in this file that renders `UploadItemRow` (which calls `get()` -> the real
// `convexQuery`) keeps working unchanged. Only the two mutation hooks
// `MediaUploadForm.tsx` actually calls are swapped for controllable `vi.fn()`s.
const { generateUploadUrlMock, createMediaDocMock } = vi.hoisted(() => ({
  generateUploadUrlMock: vi.fn(),
  createMediaDocMock: vi.fn(),
}));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@convex-dev/react-query")>();
  return { ...actual, useConvexMutation: () => generateUploadUrlMock };
});

vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../hooks")>();
  return { ...actual, useVexMutation: () => ({ mutateAsync: createMediaDocMock }) };
});

// Minimal inline mock — mirrors the pattern in `media/MediaUploadForm.test.tsx`.
// Only the fields the upload field's render tree reads: `slug` (matches the
// fixture's `to`), `labels.plural` (the "Browse …" button text), and
// `meta.storageAdapter` (looked up by `MediaUploadForm`).
function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {
      alt: text({ required: false }),
      filename: text({ required: false }),
    },
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

// Minimal client config — only `mediaCollections` is read on this path
// (`config.mediaCollections.find((mc) => mc.slug === fieldDef.to)` in both
// `Input.tsx` and `FilledInput.tsx`/`MediaPicker.tsx`).
const stubClientConfig = {
  mediaCollections: [makeMockMediaCollection()],
} as unknown as ClientVexConfig;

/**
 * Wraps `UploadFieldInput` with every context it reads outside `<AppForm>`:
 * `VexConfigContext` (media-collection lookup), a nuqs testing adapter (the
 * picker modal's URL-driven open state), a stub `StorageAdapterContextProvider`,
 * and the Convex/TanStack Query providers `MediaUploadForm`/`UploadItemRow`
 * need to mount without throwing — the same combination already proven in
 * `media/MediaUploadForm.test.tsx`. Passed as `runFieldInputContractSuite`'s
 * `Component` in place of the bare `UploadFieldInput`.
 */
function TestUploadFieldInput({
  name,
  fieldDef,
  readOnly,
  collection,
  index,
}: InputComponentProps<BaseFieldMeta, UploadField> & { field?: unknown }) {
  const queryClient = new QueryClient();
  const convexClient = new ConvexReactClient("https://example.convex.cloud");
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter>
          <VexConfigContext.Provider value={stubClientConfig}>
            <StorageAdapterContextProvider
              adapterClients={{ convex: async () => ({ storageId: "stub-id" }) }}
            >
              <UploadFieldInput
                name={name}
                fieldDef={fieldDef}
                readOnly={readOnly}
                collection={collection}
                index={index}
              />
            </StorageAdapterContextProvider>
          </VexConfigContext.Provider>
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </ConvexProvider>
  );
}

/** Mounts `TestUploadFieldInput` behind a real `useForm` + `<AppForm>`, per the shared harness's mounting mechanism. */
function Harness({
  fieldDef,
  readOnly,
  initialValue,
}: {
  fieldDef: UploadField;
  readOnly: boolean;
  initialValue: string[] | undefined;
}) {
  const form = useForm({ defaultValues: { testField: initialValue } });
  return (
    <AppForm form={form}>
      <TestUploadFieldInput
        name="testField"
        fieldDef={fieldDef}
        collection={testCollection}
        readOnly={readOnly}
      />
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: uploadFieldFixture,
  Component: TestUploadFieldInput,
  extra: ({ fixture }) => {
    beforeEach(() => {
      generateUploadUrlMock.mockReset();
      createMediaDocMock.mockReset();
      vi.unstubAllGlobals();
    });

    describe("upload field: empty vs. filled render branches", () => {
      it("renders the empty-state dropzone when there is no value, and the filled-state item list when there is", () => {
        const empty = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        expect(empty.getByText("Drop files here or click to browse")).toBeInTheDocument();
        expect(empty.container.querySelectorAll('button[title="Remove"]')).toHaveLength(0);

        const filled = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(filled.queryByText("Drop files here or click to browse")).not.toBeInTheDocument();
        expect(filled.container.querySelectorAll('button[title="Remove"]')).toHaveLength(2);
      });

      it("[finding] shows a static '—' placeholder for a read-only field with no files, instead of the interactive dropzone", () => {
        // `Input.tsx` builds this exact JSX for `readOnly && value.length === 0`
        // — `<div className="text-sm text-muted-foreground">—</div>` — inside an
        // `if (readOnly) { <>...</>; }` block that never `return`s it. Execution
        // falls through to the interactive (but prop-disabled) dropzone below
        // instead. This asserts the code's own evident intent.
        render(<Harness fieldDef={fixture.fieldDef} readOnly={true} initialValue={fixture.empty} />);
        expect(screen.getByText("—")).toBeInTheDocument();
      });

      it("throws the config guard's exact message when fieldDef.to doesn't match any configured media collection", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const orphanFieldDef = { ...fixture.fieldDef, to: "does-not-exist" } as unknown as UploadField;
        try {
          expect(() =>
            render(
              <Harness fieldDef={orphanFieldDef} readOnly={false} initialValue={fixture.empty} />,
            ),
          ).toThrow('Media collection "does-not-exist" not found in config.');
        } finally {
          consoleError.mockRestore();
        }
      });
    });

    describe("upload field: dropzone accept/reject + file count", () => {
      it("declares the configured accept type on the dropzone, and disables it (rejects interaction) when read-only", () => {
        const editable = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const editableInput = editable.container.querySelector('input[type="file"]');
        expect(editableInput).toHaveAttribute("accept", fixture.fieldDef.accept);
        expect(editableInput).not.toBeDisabled();

        const readOnlyRender = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={true} initialValue={fixture.empty} />,
        );
        const readOnlyInput = readOnlyRender.container.querySelector('input[type="file"]');
        expect(readOnlyInput).toBeDisabled();
        expect(
          within(readOnlyRender.container).getByRole("button", { name: "Browse Images" }),
        ).toBeDisabled();
      });

      it("stages a selected file as a pending upload, without submitting it", async () => {
        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(fileInput, { target: { files: [makeFile("cover.png")] } });

        // The picker opens on the "upload" tab with the file staged in
        // MediaUploadForm's accordion — the button still reads "Create &
        // select (1)", not "Uploading…", so nothing has been submitted yet.
        expect(await screen.findByText("cover.png")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Create & select (1)" })).toBeTruthy();
      });

      it("[finding] stages a dropped file whose type doesn't match the configured accept, instead of rejecting it", async () => {
        // `accept` on an `<input type="file">` only filters the OS file-picker
        // dialog — it has NEVER filtered drag-and-drop, in any browser. A
        // dropzone that advertises `accept: "image/*"` should therefore filter
        // drops itself; `UploadEmpty`'s `handleDrop` never checks `file.type`
        // at all, so a mismatched drop is staged exactly like a match.
        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const dropzone = fileInput.parentElement as HTMLElement;
        const mismatchedFile = makeFile("document.pdf", "application/pdf");

        fireEvent.drop(dropzone, { dataTransfer: { files: [mismatchedFile] } });
        // Flush the async `openPicker()` (a nuqs `setActiveField` call) one tick
        // either way, since there's no positive event to await for a rejection.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
      });

      it("[finding] stages every selected file even when hasMany is false", async () => {
        // `EmptyInput`'s file input is hardcoded `multiple` regardless of
        // `fieldDef.hasMany`, and `handleFilesSelected` keeps the whole
        // FileList — a single-select field should stage only the first file.
        const singleFieldDef = { ...fixture.fieldDef, hasMany: false, max: 1 };
        render(<Harness fieldDef={singleFieldDef} readOnly={false} initialValue={undefined} />);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(fileInput, {
          target: { files: [makeFile("first.png"), makeFile("second.png")] },
        });

        expect(await screen.findByText("first.png")).toBeInTheDocument();
        expect(screen.queryByText("second.png")).not.toBeInTheDocument();
      });
    });

    describe("upload field: filled-state file management", () => {
      it("disables 'Edit …' once mediaIds.length reaches fieldDef.max, and shows the exact n/max count", () => {
        const belowLimit = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(belowLimit.getByRole("button", { name: "Edit Images" })).not.toBeDisabled();
        expect(belowLimit.getByText("2/3")).toBeInTheDocument();

        const atLimit = render(
          <Harness
            fieldDef={fixture.fieldDef}
            readOnly={false}
            initialValue={["images_1", "images_2", "images_3"]}
          />,
        );
        expect(atLimit.getByRole("button", { name: "Edit Images" })).toBeDisabled();
        expect(atLimit.getByText("3/3")).toBeInTheDocument();
      });

      it("removes a single already-uploaded file via its row's Remove button, keeping the rest", () => {
        const { container } = render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(screen.getByText("2/3")).toBeInTheDocument();
        const removeButtons = container.querySelectorAll('button[title="Remove"]');
        expect(removeButtons).toHaveLength(2);

        fireEvent.click(removeButtons[0]);

        expect(screen.getByText("1/3")).toBeInTheDocument();
        expect(container.querySelectorAll('button[title="Remove"]')).toHaveLength(1);
      });

      it("clears every file via the multi-mode 'Clear' button, and the empty-state dropzone reappears", () => {
        // `Clear` calls `fieldApi.setValue([])` directly — it never goes through
        // `Input.tsx`'s own `handleRemove(undefined)` "remove all" branch, which
        // is unreachable dead code as a result (nothing else calls `onRemove()`
        // with no id).
        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.valid} />,
        );
        expect(screen.queryByText("Drop files here or click to browse")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Clear" }));

        expect(screen.getByText("Drop files here or click to browse")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Browse Images" })).toBeInTheDocument();
      });
    });

    describe("upload field: required-field schema behavior", () => {
      it("[finding] a required field's schema still accepts an empty array", () => {
        // `uploadFieldToInputSchema` wraps `z.array(z.string())` with no
        // `.min(1)` — `applyBaseInputSchemaMeta` only ever adds `.optional()`
        // for non-required fields, never a non-empty check for required ones.
        // A required upload field should reject "no files", the same way a
        // required text field rejects an empty string.
        expect(fixture.fieldDef.required).toBe(true);
        const schema = adminFieldToInputSchema({ field: fixture.fieldDef });
        const result = schema.safeParse([]);
        expect(result.success).toBe(false);
      });
    });

    describe("upload field: full upload flow via a mocked storage adapter", () => {
      it("round-trips a resolved media id through the picker's upload flow — the field ends up holding a string[] and the modal closes", async () => {
        generateUploadUrlMock.mockResolvedValue({ url: "https://storage.example/put/1" });
        vi.stubGlobal(
          "fetch",
          vi.fn().mockResolvedValue({ ok: true, json: async () => ({ storageId: "stub-storage-id" }) }),
        );
        createMediaDocMock.mockResolvedValue("new-media-id");

        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [makeFile("cover.png")] } });

        const submitButton = await screen.findByRole("button", { name: "Create & select (1)" });
        fireEvent.click(submitButton);

        // `onComplete` -> `MediaPicker.handleUploadComplete` -> `onSelect` ->
        // `Input.tsx`'s `handleSelect` -> `field.handleChange(mediaIds)` +
        // `closePicker()` — the modal unmounts and the filled state (hasMany
        // controls) takes over.
        await waitFor(() =>
          expect(screen.queryByRole("button", { name: "Create & select (1)" })).not.toBeInTheDocument(),
        );
        expect(screen.getByRole("button", { name: "Edit Images" })).toBeInTheDocument();

        expect(generateUploadUrlMock).toHaveBeenCalledWith({ adapter: "convex", collection: "images" });
        expect(createMediaDocMock).toHaveBeenCalledWith({
          adapter: "convex",
          collectionSlug: "images",
          storageId: "stub-storage-id",
          filename: "cover.png",
          mimeType: "image/png",
          size: expect.any(Number), // byte length of testFixture's incidental stub payload
          alt: "",
        });
      });

      it("[finding] recovers from a failed storage upload — the button un-sticks and the staged file survives for a retry, but nothing tells the user it failed", async () => {
        generateUploadUrlMock.mockResolvedValue({ url: "https://storage.example/put/1" });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

        render(
          <Harness fieldDef={fixture.fieldDef} readOnly={false} initialValue={fixture.empty} />,
        );
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [makeFile("cover.png")] } });

        const submitButton = await screen.findByRole("button", { name: "Create & select (1)" });
        fireEvent.click(submitButton);

        // Genuinely correct behavior today: `MediaUploadForm.tsx`'s `onSubmit`
        // catches the `!uploadResponse.ok` throw, so `form.state.isSubmitting`
        // still settles back to false and `form.reset()` is skipped — the
        // button un-sticks from "Uploading…" and the staged file isn't dropped.
        expect(await screen.findByRole("button", { name: "Create & select (1)" })).not.toBeDisabled();
        expect(screen.getByText("cover.png")).toBeInTheDocument();
        expect(createMediaDocMock).not.toHaveBeenCalled();

        // The catch block's only action is `console.error("Upload failed:", error)`
        // — see its own `// TODO: Show error toast` — so there is no accessible
        // indicator a user could notice. This asserts the reasonably-expected
        // outcome (some accessible error indicator exists) and documents the gap.
        expect(screen.queryByRole("alert")).not.toBeNull();
      });
    });
  },
});
```

Verify: `node scripts/record-test-findings.mjs packages/react/src/components/fields/upload/Input.test.tsx`

### Step 10 — Relationship field convex-test bridge (spike) **[agent]**

Why: Isolates the highest-risk technical integration — rendering a Convex-query-backed
component in jsdom while its data comes from a real `convex-test` execution — before the
full relationship suite (step 11) is built on top of it.

**Resolved, with evidence:**

**(a) Does `convexTest()` execute correctly from a `jsdom`-environment test file?** Yes, no
per-file environment override or patch is required. Traced both sides:

- `convex-test`'s only Web-Crypto call is `crypto.subtle.digest("SHA-256", …)`
  (`convex-test/dist/index.js`'s `blobSha`), used solely by its file-storage blob-hashing
  path — never reached by a plain `ctx.db.insert()` / `ctx.db.query().collect()`, which is
  all this bridge needs. `convex-test` has no other Node-only surface (no
  `AsyncLocalStorage`, no dynamic `require`/`import()`); `@edge-runtime/vm` is only a
  *devDependency of convex-test's own test suite*, not a runtime peer requirement for
  consumers.
- Even if a future handler did touch it: directly instantiating jsdom 26.1.0 shows its own
  `window.crypto` lacks `.subtle` — but Vitest's jsdom environment (`vitest/dist/chunks/…`,
  `populateGlobal`'s `KEYS`/`getWindowKeys`) never copies `crypto` (or `setTimeout`,
  `Date`) from jsdom's `window` onto the test global at all, *because* Node already
  provides them and neither name appears in Vitest's curated DOM-key list. Node's own
  `crypto.subtle` (fully functional) is what a jsdom test actually sees.
- `packages/react/vitest.config.ts` already defaults every file's `environment` to
  `"jsdom"` (unlike core, which mandates `edge-runtime` — see
  `docs/standards/testing/convex-integration-testing.md`). Since there's nothing to
  override *away from*, `bridge.test.ts` needs **no** `// @vitest-environment` pragma.
- **Residual risk (documented, not eliminated):** jsdom runs `convex-test` inside the
  plain Node process, not the isolated `@edge-runtime/vm` sandbox core's suite runs
  under for module-execution fidelity to the real Convex isolate. Code that happens to
  reach a Node-only global unavailable in production Convex would silently pass here
  without that isolation catching it. Flagged inline in `bridge.test.ts` below, not
  solved — solving it would mean switching this package's default environment, which is
  out of scope for a spike.

**(b) Reuse core's real `find`/`search` handlers via `@vexcms/core/server`, or ship a
minimal self-contained schema+handler?** Self-contained — required, not optional:

- `@vexcms/core/server` (`packages/core/package.json`'s `"./server"` export) does expose
  `find()`, but its server signature (`packages/core/src/api/find/server.ts`) requires a
  full `GenericQueryServerParams` — a real `CollectionConfig`, resolved `access`, and a
  `ctx` bound to core's own augmented `GeneratedVexTypes`. Driving it would additionally
  require importing core's `src/api/test/convex/schema.ts` + `_generated/api.ts` fixture,
  which `tsconfig.build.json` excludes from core's published build — workspace-private,
  unimportable from a published `@vexcms/react` subpath (core's own comment on that stub
  file confirms: *"never actually imported at runtime"* outside core's own suite).
- More fundamentally: core's own convex-test usage never calls a *registered* Convex
  `query()` function via `t.query()` — every core suite calls plain exported TS functions
  (`find`, `create`) directly inside `t.run()` with a raw `ctx`. There is no pre-existing
  "real registered query + generated `api` reference" for `@vexcms/react` to import even
  if the fixture directory were public.
- `@vexcms/react`'s bridge therefore ships its own minimal schema (`schema.ts`, one
  `documents` table) and its own function-name→handler lookup table (`bridge.ts`),
  reusing the exact reference-construction convention core's own production code already
  uses for the identical no-codegen problem — `anyApi.<module>.<export> as
  FunctionReference<…>` (`packages/core/src/api/convex.ts`'s `vexConvexApi.find:
  anyApi.vex.find as FunctionReference<…>`) — rather than inventing a second one. Step 11
  is where the *real* core `find`/RBAC logic gets exercised against this bridge's seeded
  data; this step proves only the wiring.
- Traced `@convex-dev/react-query`'s call path to confirm exactly what the fake client
  must implement: `convexQuery(funcRef, args)` stores `getFunctionName(funcRef)` — a
  plain **string** — in the query's `queryKey`, cast to `typeof funcRef` only so the
  TanStack types line up (`@convex-dev/react-query/src/index.ts`, `convexQuery` and
  `ConvexQueryClient.queryOptions`). `ConvexQueryClient.queryFn()` destructures that same
  string back out of `context.queryKey` and calls `this.convexClient.query(func, args)` —
  under jsdom, `isServer` (`typeof window === "undefined"`) is `false`, so the
  `serverHttpClient` branch never runs and only `.query()` needs implementing for the
  fetch that actually resolves `useQuery`'s data. `ConvexQueryClient`'s `QueryCache`
  subscription also calls `.watchQuery(func, args, {})` once per mounted query (its
  `"added"` cache event) for live-update push — this bridge stubs that as a no-op
  (documented below) since nothing in this spike asserts a *second* update after the
  initial resolve.

- [x] `packages/react/src/testing/convex/schema.ts` — minimal Convex schema (one `documents` table) sufficient to seed relationship targets
- [x] `packages/react/src/testing/convex/bridge.ts` — `createFakeConvexClient(t)` adapting a `convex-test` instance's `.query()` to the `{ query(funcName, args) }` shape `ConvexQueryClient` calls, with the function-name→reference lookup table
- [x] `packages/react/src/testing/convex/bridge.test.ts` — seeds one document via `convex-test`, renders a `useQuery(convexQuery(...))` consumer through the fake client in jsdom, asserts the real data resolves

#### packages/react/src/testing/convex/schema.ts

```ts
import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
} from "convex/server";
import { v } from "convex/values";

/**
 * Minimal, self-contained Convex schema for `@vexcms/react`'s `./testing`
 * subpath — one `documents` table, just enough to seed relationship targets
 * for the convex-test bridge (`bridge.ts`) and the relationship field
 * fixture built on top of it (spec step 11).
 *
 * Deliberately NOT `packages/core/src/api/test/convex/schema.ts`: that
 * fixture lives under core's `src/api/test/**`, which `tsconfig.build.json`
 * excludes from core's published output — workspace-private, unimportable
 * from a published `@vexcms/react` subpath. `./testing` ships to consumers,
 * so its own Convex fixtures must be self-contained rather than reaching
 * into a sibling package's private test-only directory.
 */
const schema = defineSchema({
  documents: defineTable({
    title: v.string(),
  }),
});

export default schema;

/**
 * Data model derived from this file's own schema — used by `bridge.ts` to
 * type `ctx.db` inside fake query handlers, and by `bridge.test.ts` to type
 * seeded/returned documents.
 */
export type TestDataModel = DataModelFromSchemaDefinition<typeof schema>;

/** A document from one of this schema's tables, Convex system fields included. */
export type TestDoc<TableName extends keyof TestDataModel> = DocumentByName<
  TestDataModel,
  TableName
>;
```

#### packages/react/src/testing/convex/bridge.ts

```ts
import {
  anyApi,
  getFunctionName,
  type FunctionReference,
  type GenericMutationCtx,
} from "convex/server";
import type { convexTest, TestConvex } from "convex-test";

import schema, { type TestDataModel, type TestDoc } from "./schema";

/**
 * A fake query handler runs inside `t.run()` against convex-test's mock
 * backend — the same execution path
 * `docs/standards/testing/convex-integration-testing.md` documents for
 * `@vexcms/core`'s own suite — rather than a registered Convex `query()`
 * function. This test kit ships no `convex/` function files at all (only
 * `schema.ts`), so `t.query()`/`t.mutation()` have nothing to resolve;
 * `createFakeConvexClient` bridges that gap by dispatching on the
 * function-name string `@convex-dev/react-query` already extracts.
 */
type FakeQueryHandler = (
  ctx: GenericMutationCtx<TestDataModel>,
  args: Record<string, unknown>,
) => Promise<unknown>;

/**
 * Function-name → handler lookup table. Keys are the exact string
 * `getFunctionName()` produces for a `"modulePath:exportName"` reference —
 * the same string `convexQuery()` embeds in its query key
 * (`getFunctionName(funcRef) as unknown as typeof funcRef`, see
 * `@convex-dev/react-query`'s `src/index.ts`) and the same string
 * `ConvexQueryClient.queryFn()` reads back out of that query key before
 * calling `this.convexClient.query(func, args)`. Extend this table — never
 * `createFakeConvexClient`'s signature, which is frozen across every step
 * that consumes it — when a later step needs another fake query.
 */
const QUERY_HANDLERS: Record<string, FakeQueryHandler> = {
  "documents:list": async (ctx) => ctx.db.query("documents").collect(),
};

/**
 * `documents:list`'s function reference, typed for `convexQuery()` call
 * sites. Built the same way `@vexcms/core`'s own `vexConvexApi` builds
 * references without generated codegen (`packages/core/src/api/convex.ts`):
 * `anyApi.<module>.<export>` cast to the exact `FunctionReference` shape.
 * `anyApi` is a `Proxy` that manufactures a `"module:export"` name for any
 * property path without a real registered Convex function behind it — this
 * name only ever gets resolved back through `QUERY_HANDLERS` above, never
 * against a real backend.
 */
export const documentsListQuery = anyApi.documents.list as FunctionReference<
  "query",
  "public",
  Record<string, never>,
  TestDoc<"documents">[]
>;

/**
 * Adapts a `convex-test` instance into the minimal `ConvexReactClient` shape
 * `ConvexQueryClient` needs at runtime: `.query(func, args)` for `queryFn`'s
 * one-shot fetch (what actually resolves `useQuery`'s `data`), and
 * `.watchQuery(func, args, opts)` for the `QueryCache` subscription
 * `ConvexQueryClient` sets up on every `"added"` cache event once it's
 * `.connect()`-ed to a `QueryClient`. Cast the result to `ConvexReactClient`
 * at the call site.
 *
 * `watchQuery` is a no-op stub: it never pushes a live update. Real-time
 * subscription updates are the one behavior this bridge does not attempt —
 * `queryFn`'s one-shot fetch is what this spike proves resolves real data;
 * nothing in this test kit asserts an update arriving *after* the initial
 * render. A future step that needs live-update assertions must replace this
 * stub with one that actually re-queries and calls `onUpdate`.
 */
export function createFakeConvexClient(t: ReturnType<typeof convexTest>): unknown {
  // `t`'s frozen parameter type is intentionally schema-erased (every other
  // step's call site is written against it with no knowledge of this file's
  // schema). This bridge's own lookup table is written against ITS OWN
  // schema, so re-asserting that specific, already-known schema here is safe.
  const typedT = t as TestConvex<typeof schema>;

  return {
    query: async (
      func: FunctionReference<"query"> | string,
      args: Record<string, unknown> = {},
    ) => {
      const name = typeof func === "string" ? func : getFunctionName(func);
      const handler = QUERY_HANDLERS[name];
      if (!handler) {
        throw new Error(`createFakeConvexClient: no fake query handler registered for "${name}"`);
      }
      return typedT.run((ctx) => handler(ctx, args));
    },
    watchQuery: () => ({
      onUpdate: () => () => {},
      localQueryResult: () => undefined,
    }),
  };
}
```

#### packages/react/src/testing/convex/bridge.test.ts

```tsx
import "@testing-library/jest-dom";

import { ConvexQueryClient, convexQuery } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { createFakeConvexClient, documentsListQuery } from "./bridge";
import schema, { type TestDoc } from "./schema";

// This suite runs under `packages/react/vitest.config.ts`'s package-wide
// `environment: "jsdom"` — no `// @vitest-environment` override needed, jsdom
// is already the default here (unlike `@vexcms/core`, which mandates
// `edge-runtime`; see docs/standards/testing/convex-integration-testing.md).
//
// Residual risk, documented not eliminated: convex-test's own suite is
// exercised under an isolated `@edge-runtime/vm` sandbox upstream; running it
// here under plain Node-in-jsdom instead means any code path that happened to
// lean on a Node-only global unavailable in production Convex would silently
// pass here without that isolation catching it. Concretely checked for THIS
// file: convex-test's only Web-Crypto call (`crypto.subtle.digest`, used by
// its file-storage blob-hashing path) is never reached by the plain
// `db.insert`/`db.query().collect()` calls below, and Vitest's jsdom
// environment leaves Node's native `crypto`/`setTimeout`/`Date` untouched
// regardless (it only copies DOM-specific globals onto the test global).

function DocumentsList() {
  const { data } = useQuery(convexQuery(documentsListQuery, {}));
  const docs = (data ?? []) as TestDoc<"documents">[];
  return (
    <ul>
      {docs.map((doc) => (
        <li key={doc._id}>{doc.title}</li>
      ))}
    </ul>
  );
}

describe("createFakeConvexClient", () => {
  test("useQuery(convexQuery(...)) resolves real convex-test data through the fake client", async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await ctx.db.insert("documents", { title: "Hello from convex-test" });
    });

    const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(fakeClient);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
    });
    convexQueryClient.connect(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsList />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Hello from convex-test")).toBeInTheDocument();
  });
});
```

Verify: `pnpm --filter @vexcms/react test -- testing/convex/bridge`


### Step 11 — Relationship field fixture + test

Why: completes the field-type list and exercises the debounced search, popover picker,
and selected-doc chip rendering against data computed by the real core `find`/`search`/`get`
query logic via the Step 10 convex-test bridge — not a mocked hook. `runFieldInputContractSuite`'s
bare `<AppForm>` harness (spec-contract) doesn't wire `VexConfigContext` or a `QueryClient`, so
its generic assertions exercise `RelationshipFieldInput`'s own "unknown target collection" guard;
the real picker (search, select, single vs `hasMany`) is covered here by `extra`, which renders
its own harness with both providers wired to the bridge. Change A widens that `extra` block from
a thin illustrative sample into a comprehensive suite over the field's whole real surface — the
`enabled: open` query gate, the 200ms debounce's actual deferral, the searchable-vs-list branch
`useRelationshipPickerOptions` takes based on the target collection's `useAsTitle`, loading and
empty states, the hasMany/single selection state machines (including the chip's own remove
button, whose `disabled` prop turns out to be inverted — a real defect the intended-behavior test
surfaces per Change B), an orphaned-reference edge case (a selected id whose document was
deleted), and `resolveRelationshipPreview`'s field-over-collection-over-default precedence —
derived by reading `Input.tsx`'s JSDoc and body first, per Change A. This step also widens Step
10's `testing/convex/schema.ts`/`bridge.ts` (only a `documents:list` handler existed) with the
`vex:search`/`vex:get`/`vex:find` handlers `RelationshipFieldInput`'s real code paths actually
call — Step 10 built its `QUERY_HANDLERS` table specifically so later steps could extend it.

**[agent]**

- [ ] `packages/react/src/testing/convex/schema.ts` — widen the `documents` table with a
  `search_title` search index (extends Step 10)
- [ ] `packages/react/src/testing/convex/bridge.ts` — register `"vex:search"`/`"vex:get"`/
  `"vex:find"` fake query handlers backed by `@vexcms/core/server`'s real `search`/`get`/`find`
  (extends Step 10)
- [ ] `packages/react/src/components/fields/relationship/testFixture.ts` —
  `relationshipFieldFixture: FieldFixture<RelationshipField<CollectionFieldMeta>, string[]>`,
  the shared `relationshipTargetCollection`, and `relationshipTargetCollectionByCreationTime` (a
  `useAsTitle: "_creationTime"` variant exercising `useRelationshipPickerOptions`'s non-searchable
  branch)
- [ ] `packages/react/src/testing/fixtures/index.ts` — import + registry entry for `relationship`
- [ ] `packages/react/src/components/fields/relationship/Input.test.tsx` —
  `runFieldInputContractSuite` + a comprehensive `extra` covering target-collection resolution,
  the picker query's `enabled: open` gating, the 200ms debounce's real deferral, the
  searchable-vs-list branch, loading/empty states, the hasMany/single selection state machines
  (including the chip remove button's disabled-prop defect), an orphaned-reference edge case, and
  `resolveRelationshipPreview`'s 3-level precedence

#### packages/react/src/testing/convex/schema.ts

One edit: the `documents` table gains a `.searchIndex()` so `search()`'s `useAsTitle`-driven
lookup (`search_<useAsTitle>`, matching `collectionConfigToVexSchema`'s auto-generated name for
a collection with `admin.useAsTitle: "title"`) has something to query against.

**1 — the `documents` table.** Replace the body of the `defineSchema` call:

```ts
const schema = defineSchema({
  documents: defineTable({
    title: v.string(),
  }).searchIndex("search_title", { searchField: "title", filterFields: [] }),
});
```

#### packages/react/src/testing/convex/bridge.ts

Three edits, all additive — `QUERY_HANDLERS` is a plain object literal designed to be extended
per-consumer; `createFakeConvexClient`'s signature and dispatch logic are untouched.

**1 — imports.** Beside the existing `schema` import:

```ts
import type { GenericId } from "convex/values";
import { find, get, search } from "@vexcms/core/server";
```

**2 — `QUERY_HANDLERS` entries.** Alongside the existing `"documents:list"` entry — `search`/`get`/
`find` resolve `TCollectionSlug`/`DataModel` from the arguments given, need no `config` (omitting
it makes `resolveAccessCall` return `access: undefined`, i.e. RBAC bypassed — this bridge is a
data-shape spike, not an RBAC one; Step 13 owns RBAC coverage):

```ts
  "vex:search": async (ctx, args) =>
    search({
      ctx,
      collection: "documents",
      query: args.query as string,
      searchIndexName: args.searchIndexName as string,
      searchField: args.searchField as string,
    }),
  "vex:get": async (ctx, args) =>
    get({ ctx, id: args.id as GenericId<"documents">, collection: "documents" }),
  "vex:find": async (ctx) => find({ ctx, collection: "documents" }),
```

(`getFunctionName(vexConvexApi.search)` → `"vex:search"`, `getFunctionName(vexConvexApi.get)` →
`"vex:get"`, `getFunctionName(vexConvexApi.find)` → `"vex:find"` — all three `anyApi.vex.*`
references declared in `packages/core/src/api/convex.ts`. `"vex:find"` IS needed here, unlike a
first pass over this bridge assumed: `relationshipTargetCollection`'s `useAsTitle` is `"title"`, a
non-system field, so THAT collection alone only ever exercises `useRelationshipPickerOptions`'s
`vexConvexApi.search` branch — but Change A requires covering its OTHER branch too (`useAsTitle`
is `"_id"`/`"_creationTime"` → `vexConvexApi.find`, search disabled), which is why
`testFixture.ts` below adds a second target collection, `relationshipTargetCollectionByCreationTime`,
backed by the same `documents` table.)

#### packages/react/src/components/fields/relationship/testFixture.ts

```ts
import {
  defineCollection,
  relationship,
  text,
  type CollectionFieldMeta,
  type RelationshipField,
} from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";
import { testCollection } from "../../../testing/harness/accessFixtures";

/**
 * Target collection for the relationship picker under test. Its slug
 * ("documents") and `admin.useAsTitle: "title"` match the `documents` table
 * and `search_title` index seeded by the Step 10 convex-test bridge
 * (`testing/convex/schema.ts`). Labels are set explicitly rather than
 * relying on `defineCollection`'s auto-pluralization of an already-plural
 * slug.
 */
export const relationshipTargetCollection = defineCollection({
  slug: "documents",
  labels: { singular: "Document", plural: "Documents" },
  fields: { title: text({ required: true }) },
  admin: { useAsTitle: "title" },
});

/**
 * Second target collection, same underlying `documents` table, but with
 * `admin.useAsTitle: "_creationTime"` — a system field. Exercises
 * `useRelationshipPickerOptions`'s OTHER branch: `isSearchable` becomes
 * `false` (its check is `useAsTitle !== "_id" && useAsTitle !== "_creationTime"`),
 * so the picker calls `vexConvexApi.find` — which ignores the search text
 * entirely — instead of `vexConvexApi.search`. Used only by the
 * non-searchable-branch test in `Input.test.tsx`'s `extra`; the default
 * `relationshipFieldFixture`/`relationshipTargetCollection` above stay wired
 * to the searchable path.
 */
export const relationshipTargetCollectionByCreationTime = defineCollection({
  slug: "documents",
  labels: { singular: "Document", plural: "Documents" },
  fields: { title: text({ required: true }) },
  admin: { useAsTitle: "_creationTime" },
});

/**
 * `meta.collectionSlug` mirrors what `defineCollection` stamps onto every
 * field it owns (`populateCollectionFieldMeta` in `collections/config.ts`) —
 * here, the shared harness's `testCollection` ("posts"), standing in for
 * the collection this relationship field is rendered as part of.
 */
const fieldDef = relationship<CollectionFieldMeta>({
  collection: { slug: "documents" },
  hasMany: true,
  required: true,
  meta: { collectionSlug: testCollection.slug },
});

/**
 * `valid`/`invalid`/`empty` only exercise the shared contract's generic
 * assertions — `runFieldInputContractSuite`'s bare `<AppForm>` harness
 * doesn't wire `VexConfigContext`, so those generic states render
 * `RelationshipFieldInput`'s "Unknown collection" guard regardless of the
 * value. The real picker (debounced search, select/remove, single vs
 * `hasMany`) is covered by this field's `extra` in `Input.test.tsx`,
 * rendered with `VexConfigContext` and the Step 10 convex-test bridge wired
 * in against real seeded documents.
 */
export const relationshipFieldFixture: FieldFixture<RelationshipField<CollectionFieldMeta>, string[]> = {
  fieldType: "relationship",
  fieldDef,
  valid: ["kg2fake00000000000000001;documents"],
  invalid: undefined,
  empty: [],
};
```

#### packages/react/src/testing/fixtures/index.ts

Two edits.

**1 — import.** Beside the other per-type fixture imports:

```ts
import { relationshipFieldFixture } from "../../components/fields/relationship/testFixture";
```

**2 — registry entry.** Beside the `// text: textFieldFixture, (step 5)` comment placeholder
inside `fieldFixtures`:

```ts
  relationship: relationshipFieldFixture,
```

#### packages/react/src/components/fields/relationship/Input.test.tsx

Test design techniques used, enumerated per the contract: **equivalence partitioning** over
`useRelationshipPickerOptions`'s `useAsTitle` branch (a non-system field vs. `_creationTime`) and
over `hasMany` (single vs. multi); **boundary value analysis** on single-select's value array,
which must never exceed length 1 (replace-not-append when a second doc is chosen, clear-to-`[]`
when the same doc is chosen again); **state transitions** for closed→open→selected→removed (both
via re-clicking the list row and via the chip's own remove button), empty→typed→cleared search
text, and pending→resolved query state; **error paths** for the missing-target-collection guard
and for a selected id that no longer resolves (its document was deleted after being referenced);
and **interaction sequences** for select-then-reselect-to-toggle, type-then-assert-still-old-
results-then-wait-past-the-debounce, and open→select→reopen→select-again. Per Change A, the chip
remove-button test asserts the INTENDED behavior (enabled while the field is editable) even though
`Input.tsx`'s `disabled={!readOnly || fieldDef.admin.readOnly}` is inverted relative to
`handleRemove`'s own guard (`if (readOnly || fieldDef.admin.readOnly) return;`) — that assertion is
expected to FAIL, recording a real defect rather than being softened to match the current code.
For the 200ms debounce, real timers (a genuine `setTimeout`-driven wait via `waitFor`) were chosen
over `vi.useFakeTimers()`: `userEvent`'s per-keystroke internal delays and `convex-test`'s
real-microtask-driven query resolution both need to interleave with the debounce's own timer, and
mixing fake timers with two other independently-scheduled async systems is exactly the kind of
setup vitest 4's fake-timer/`userEvent` combination is documented to deadlock or misfire on; the
real 200ms wait costs one deliberately-slow test, not a flaky suite. The test that proves
deferral (not just eventual convergence) asserts the OLD result set is still on screen
immediately after typing, before ever calling `waitFor`.

```tsx
import "@testing-library/jest-dom";

import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import type { ConvexReactClient } from "convex/react";
import type { DataModelFromSchemaDefinition, GenericMutationCtx } from "convex/server";
import type { Id } from "convex/values";
import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import {
  defineConfig,
  defineCollection,
  sanitizeConfigForClient,
  text,
  type ClientVexConfig,
  type CollectionFieldMeta,
  type RelationshipField,
  type RelationshipPreviewProps,
} from "@vexcms/core";

import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import {
  relationshipFieldFixture,
  relationshipTargetCollection,
  relationshipTargetCollectionByCreationTime,
} from "./testFixture";
import { createFakeConvexClient } from "../../../testing/convex/bridge";
import schema from "../../../testing/convex/schema";
import { RelationshipFieldInput } from "./Input";

type SchemaCtx = GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>;

/**
 * Seeds `seedTitles` into a fresh convex-test instance (capturing their
 * real generated ids in insertion order — never hand-typed), optionally
 * mutates further via `afterSeed` (e.g. deleting a doc to produce a stale
 * reference), wires the fake convex client through a real
 * `ConvexQueryClient` + `QueryClient` (byte-for-byte the same wiring
 * `testing/convex/bridge.test.ts` proved in Step 10), and renders
 * `RelationshipFieldInput` inside the real `useForm`/`AppForm` harness plus
 * a `VexConfigContext` that registers `relationshipTargetCollection` by
 * default. Returns the `render()` result plus `queryClient` (to inspect
 * query-cache state directly — e.g. proving `enabled: open` gating) and
 * `seededIds`.
 */
async function renderRelationship(
  overrides: {
    fieldDef?: RelationshipField<CollectionFieldMeta>;
    config?: ClientVexConfig;
    initialValue?: string[] | ((seededIds: string[]) => string[]);
    seedTitles?: string[];
    afterSeed?: (ctx: SchemaCtx, seededIds: string[]) => Promise<void>;
  } = {},
) {
  const t = convexTest(schema);
  const seededIds: string[] = [];
  await t.run(async (ctx) => {
    for (const title of overrides.seedTitles ?? ["Alpha", "Bravo", "Charlie"]) {
      seededIds.push(await ctx.db.insert("documents", { title }));
    }
    await overrides.afterSeed?.(ctx, seededIds);
  });

  const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);

  const config =
    overrides.config ??
    sanitizeConfigForClient(defineConfig({ collections: [relationshipTargetCollection] }));
  const fieldDef = overrides.fieldDef ?? relationshipFieldFixture.fieldDef;
  const initialValue =
    typeof overrides.initialValue === "function"
      ? overrides.initialValue(seededIds)
      : (overrides.initialValue ?? []);

  function Harness() {
    const form = useForm({ defaultValues: { testField: initialValue } });
    return (
      <QueryClientProvider client={queryClient}>
        <VexConfigContext.Provider value={config}>
          <AppForm form={form}>
            <RelationshipFieldInput
              name="testField"
              fieldDef={fieldDef}
              collection={testCollection}
              readOnly={false}
            />
          </AppForm>
        </VexConfigContext.Provider>
      </QueryClientProvider>
    );
  }

  return { ...render(<Harness />), queryClient, seededIds };
}

/** Scopes queries to the popover's list of candidate rows, disambiguating
 * them from the trigger button — which, in single-select mode, gets
 * re-labeled with the selected doc's own preview text once something is
 * chosen (`data-slot="popover-content"`, `ui/popover.tsx`). */
const popoverContent = () =>
  document.querySelector('[data-slot="popover-content"]') as HTMLElement;

function FieldLevelPreview({ doc }: RelationshipPreviewProps) {
  return <span>Field preview: {String((doc as Record<string, unknown>).title)}</span>;
}

function CollectionLevelPreview({ doc }: RelationshipPreviewProps) {
  return <span>Collection preview: {String((doc as Record<string, unknown>).title)}</span>;
}

runFieldInputContractSuite({
  fixture: relationshipFieldFixture,
  Component: RelationshipFieldInput,
  extra: () => {
    describe("relationship picker (Step 10 bridge)", () => {
      describe("target collection resolution", () => {
        test("renders the missing-target-collection error instead of crashing when the field's target slug isn't registered", async () => {
          await renderRelationship({
            config: sanitizeConfigForClient(defineConfig({ collections: [testCollection] })),
          });

          expect(await screen.findByText(/unknown collection/i)).toBeInTheDocument();
          expect(screen.getByText("documents", { selector: "code" })).toBeInTheDocument();
          expect(screen.queryByRole("button", { name: /select document/i })).not.toBeInTheDocument();
        });
      });

      describe("picker query (Decision 12)", () => {
        test("the picker query is gated by `enabled: open` — it does not fetch until the popover opens", async () => {
          const user = userEvent.setup();
          const { queryClient } = await renderRelationship();
          const searchQueries = () =>
            queryClient.getQueryCache().findAll({ queryKey: ["convexQuery", "vex:search"] });

          expect(searchQueries()).toHaveLength(1);
          expect(searchQueries()[0]?.state.fetchStatus).toBe("idle");
          expect(searchQueries()[0]?.state.dataUpdatedAt).toBe(0);

          await user.click(screen.getByRole("button", { name: /select document/i }));

          await waitFor(() => expect(searchQueries()[0]?.state.status).toBe("success"));
          expect(searchQueries()[0]?.state.dataUpdatedAt).toBeGreaterThan(0);
        });

        test("debounced search (200ms): narrowing to the typed query is deferred, not immediate, then settles on the match", async () => {
          const user = userEvent.setup();
          await renderRelationship();

          await user.click(screen.getByRole("button", { name: /select document/i }));
          expect(await screen.findByText("Alpha")).toBeInTheDocument();
          expect(screen.getByText("Bravo")).toBeInTheDocument();
          expect(screen.getByText("Charlie")).toBeInTheDocument();

          const search = screen.getByPlaceholderText(/search document/i);
          await user.type(search, "Bra");

          // Immediately after typing — before the 200ms debounce has had a
          // chance to fire — the pre-search result set is still on screen.
          // This is the assertion that proves genuine deferral, not just
          // eventual convergence.
          expect(screen.getByText("Alpha")).toBeInTheDocument();
          expect(screen.getByText("Charlie")).toBeInTheDocument();

          await waitFor(() => expect(screen.queryByText("Alpha")).not.toBeInTheDocument(), {
            timeout: 2000,
          });
          expect(screen.getByText("Bravo")).toBeInTheDocument();
          expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
        });

        test("non-searchable branch: when the target collection's useAsTitle is a system field, the picker lists via find() and ignores the search text", async () => {
          const user = userEvent.setup();
          const { queryClient } = await renderRelationship({
            config: sanitizeConfigForClient(
              defineConfig({ collections: [relationshipTargetCollectionByCreationTime] }),
            ),
          });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          await waitFor(() => expect(screen.getAllByRole("button")).toHaveLength(4)); // trigger + 3 rows

          const search = screen.getByPlaceholderText(/search document/i);
          await user.type(search, "zzz-no-match-for-anything");

          expect(screen.getAllByRole("button")).toHaveLength(4); // unaffected by the typed text
          expect(
            queryClient.getQueryCache().findAll({ queryKey: ["convexQuery", "vex:find"] }),
          ).toHaveLength(1); // one stable cache entry — find()'s args never include `query`
        });

        test("renders a loading indicator while the picker query is pending, then the seeded documents once it resolves", async () => {
          const { container } = await renderRelationship();
          const trigger = screen.getByRole("button", { name: /select document/i });

          // `fireEvent.click` (unlike `userEvent.click`) does not await anything
          // beyond synchronous React updates, so the very next synchronous
          // assertion runs before convex-test's promise chain has resolved:
          // `isPending` is still true.
          fireEvent.click(trigger);
          expect(screen.getByText("Loading…")).toBeInTheDocument();
          const spinner = container.querySelector("svg.animate-spin");
          expect(spinner).not.toHaveClass("invisible");

          expect(await screen.findByText("Alpha")).toBeInTheDocument();
          expect(container.querySelector("svg.animate-spin")).toHaveClass("invisible");
        });

        test("no documents match the search text renders 'No documents found' instead of an empty list", async () => {
          const user = userEvent.setup();
          await renderRelationship();

          await user.click(screen.getByRole("button", { name: /select document/i }));
          expect(await screen.findByText("Alpha")).toBeInTheDocument();

          const search = screen.getByPlaceholderText(/search document/i);
          await user.type(search, "no-such-document-exists");

          expect(await screen.findByText("No documents found")).toBeInTheDocument();
          expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        });
      });

      describe("selection state machine", () => {
        test("hasMany: selecting a document adds a chip; selecting it again in the list toggles it off", async () => {
          const user = userEvent.setup();
          await renderRelationship({ seedTitles: ["Alpha", "Bravo"] });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          const row = await screen.findByRole("button", { name: /alpha/i });

          await user.click(row);
          await waitFor(() => expect(screen.getAllByText("Alpha")).toHaveLength(2));

          await user.click(screen.getByRole("button", { name: /alpha/i }));
          await waitFor(() => expect(screen.getAllByText("Alpha")).toHaveLength(1));
        });

        test("hasMany: the chip's own remove (×) button removes the selected document from the value", async () => {
          const user = userEvent.setup();
          const { container } = await renderRelationship({ seedTitles: ["Alpha", "Bravo"] });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          await user.click(await screen.findByRole("button", { name: /alpha/i }));
          await waitFor(() => expect(screen.getAllByText("Alpha")).toHaveLength(2));

          // The chip's × button is icon-only (lucide `X`, `aria-hidden`) with no
          // accessible name of its own, so it's queried by its distinguishing
          // class rather than role/name. Intent, mirroring `handleRemove`'s own
          // guard (`if (readOnly || fieldDef.admin.readOnly) return;`): enabled
          // while the field is editable, disabled only when `readOnly` or
          // `fieldDef.admin.readOnly` is true. The JSX instead reads
          // `disabled={!readOnly || fieldDef.admin.readOnly}` — inverted on the
          // `readOnly` prop — so in this editable render (`readOnly={false}`)
          // the button is actually disabled and the next assertion is expected
          // to FAIL, surfacing the defect per Change B rather than softening it.
          const removeButton = container.querySelector<HTMLButtonElement>(
            "button.hover\\:text-destructive",
          );
          expect(removeButton).not.toBeDisabled();
          await user.click(removeButton!);
          await waitFor(() => expect(screen.getAllByText("Alpha")).toHaveLength(1));
        });

        test("single-select: choosing a document sets the trigger preview and closes the popover", async () => {
          const user = userEvent.setup();
          const singleFieldDef: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            hasMany: false,
          };
          await renderRelationship({ fieldDef: singleFieldDef, seedTitles: ["Alpha", "Bravo"] });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));

          expect(screen.queryByPlaceholderText(/search document/i)).not.toBeInTheDocument();
          expect(await screen.findByRole("button", { name: /alpha/i })).toBeInTheDocument();
        });

        test("single-select: choosing a second document replaces the first rather than adding to it", async () => {
          const user = userEvent.setup();
          const singleFieldDef: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            hasMany: false,
          };
          await renderRelationship({ fieldDef: singleFieldDef, seedTitles: ["Alpha", "Bravo"] });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));
          const trigger = await screen.findByRole("button", { name: /alpha/i });

          await user.click(trigger);
          await user.click(within(popoverContent()).getByRole("button", { name: "Bravo" }));

          expect(await screen.findByRole("button", { name: /bravo/i })).toBeInTheDocument();
          expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        });

        test("single-select: choosing the currently-selected document again clears the value", async () => {
          const user = userEvent.setup();
          const singleFieldDef: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            hasMany: false,
          };
          await renderRelationship({ fieldDef: singleFieldDef, seedTitles: ["Alpha", "Bravo"] });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));
          const trigger = await screen.findByRole("button", { name: /alpha/i });

          await user.click(trigger);
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));

          expect(await screen.findByRole("button", { name: /select document/i })).toBeInTheDocument();
          expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        });

        test("a selected id that no longer resolves (e.g. a deleted document) is silently dropped from the chip list", async () => {
          await renderRelationship({
            seedTitles: ["Ghost", "Alpha"],
            afterSeed: async (ctx, ids) => {
              await ctx.db.delete(ids[0] as Id<"documents">);
            },
            initialValue: (ids) => [ids[0], ids[1]],
          });

          await waitFor(() => expect(screen.getByText("Alpha")).toBeInTheDocument());
          expect(screen.queryByText("Ghost")).not.toBeInTheDocument();
        });
      });

      describe("resolveRelationshipPreview precedence (Decision 11)", () => {
        test("collection-level admin.components.preview overrides the default text preview when the field has none", async () => {
          const user = userEvent.setup();
          const collectionWithPreview = defineCollection({
            slug: "documents",
            labels: { singular: "Document", plural: "Documents" },
            fields: { title: text({ required: true }) },
            admin: { useAsTitle: "title", components: { preview: CollectionLevelPreview } },
          });
          await renderRelationship({
            config: sanitizeConfigForClient(defineConfig({ collections: [collectionWithPreview] })),
            seedTitles: ["Alpha"],
          });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          expect(await screen.findByText("Collection preview: Alpha")).toBeInTheDocument();
          expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        });

        test("field-level admin.components.preview overrides the collection-level preview", async () => {
          const user = userEvent.setup();
          const collectionWithPreview = defineCollection({
            slug: "documents",
            labels: { singular: "Document", plural: "Documents" },
            fields: { title: text({ required: true }) },
            admin: { useAsTitle: "title", components: { preview: CollectionLevelPreview } },
          });
          const fieldDefWithPreview: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            admin: {
              ...relationshipFieldFixture.fieldDef.admin,
              components: { preview: FieldLevelPreview },
            },
          };
          await renderRelationship({
            fieldDef: fieldDefWithPreview,
            config: sanitizeConfigForClient(defineConfig({ collections: [collectionWithPreview] })),
            seedTitles: ["Alpha"],
          });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          expect(await screen.findByText("Field preview: Alpha")).toBeInTheDocument();
          expect(screen.queryByText("Collection preview: Alpha")).not.toBeInTheDocument();
        });
      });
    });
  },
});
```

Verify: `node scripts/record-test-findings.mjs packages/react/src/components/fields/relationship/Input.test.tsx`


### Step 12 — Nested-container factory + composite field fixtures/tests (array, group, blocks)

**[agent]**

Why: `array`/`group`/`blocks` nest arbitrary child field types rather than holding a primitive value — needs a factory that recurses over the now-complete `fieldFixtures` registry instead of re-authoring per-child assertions. Also the last fixture-adding step, so it closes the registry and adds the completeness self-test mirroring `fields/index.test.tsx`'s existing registry-parity pattern. Each container's OWN `runFieldInputContractSuite` call also carries a comprehensive `extra`, derived by reading `FormArray.tsx`/`FormGroup.tsx`/`FormBlocks.tsx` and each field's own `config.ts`/`inputSchema.ts`: item-count boundaries with the real schema messages, index-based naming, drag-reorder wiring, and independent readOnly sources for `array`; collapse/expand, dot-notation nested naming, and per-sub-field error isolation for `group`; the block-type picker, blockName/id generation, the unknown-blockType fallback, min/max block counts, and the nuqs-driven editor modal for `blocks`. None of this duplicates the shared 10-item leaf checklist or `runNestedFieldContainerSuite`'s generic cross-child assertions (empty state, add/remove, seeded round-trip, readOnly cascade) — each `extra` covers only the surface those two leave out.

- [ ] `packages/react/src/testing/nestedFieldContainer.ts` — `runNestedFieldContainerSuite({ container: "array"|"group"|"blocks", Component, childFieldTypes, fixtures? })`: add/remove item, nested value round-trip, `readOnly` cascade to children, delegates per-child-type assertions to `runFieldInputContractSuite`
- [ ] `packages/react/src/components/fields/array/testFixture.ts`, `group/testFixture.ts`, `blocks/testFixture.ts` — each a `FieldFixture` for the container itself, registered into `fieldFixtures`
- [ ] `packages/react/src/components/fields/array/Input.test.tsx`, `group/Input.test.tsx`, `blocks/Input.test.tsx` — `runFieldInputContractSuite` with a comprehensive per-container `extra` (item-count boundaries, unguarded-Add-past-max vs. `blocks`' guarded equivalent, index-based field naming, drag-handle wiring, and independent item-level readOnly for `array`; collapse/expand, sub-field count, dot-notation naming, and per-sub-field error isolation for `group`; the block-type picker, search, blockName/id generation, removal, the unknown-blockType fallback, min/max block counts, and the nuqs-driven editor modal for `blocks`) + `runNestedFieldContainerSuite` over a representative subset of child types (one from each category: simple, choice, temporal, network-via-react-query, nested-of-nested — `relationship`'s Convex live-query category is deliberately excluded from this shared subset; see the rationale comment in each file below)
- [ ] `packages/react/src/testing/fixtures/index.test.tsx` — asserts `Object.keys(fieldFixtures).sort()` equals `Object.keys(ADMIN_FIELDS).sort()`, same shape as `components/fields/index.test.tsx`

#### packages/react/src/testing/nestedFieldContainer.ts

The mount helper wraps `Component` in every provider a nested child might read outside `<AppForm>` — Convex, TanStack Query, a nuqs testing adapter, and a stub `VexConfigContext` + `StorageAdapterContextProvider` — since a nested "upload" child needs them and `blocks` itself reads nuqs for its editor modal. Extra providers are inert for every other child type. Assertions read the live form state via a captured `formRef` rather than any one child type's DOM shape (arbitrary child widgets — text inputs, comboboxes, file dropzones, or another nested container — don't share a common interaction pattern), except for the "Add"/"Remove" controls and the empty-state copy, which are read directly off the constructed `fieldDef` so nothing is hardcoded. Per child type,…

```ts
import { type ComponentType, createElement, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  array,
  blocks,
  defineBlock,
  group,
  text,
  type AdminField,
  type AdminFieldType,
  type ClientVexConfig,
  type MediaCollectionConfig,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { AppForm } from "../components/form/AppForm";
import { fieldToInputComponent } from "../components/fields";
import { StorageAdapterContextProvider, VexConfigContext } from "../context";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { testCollection } from "./harness/accessFixtures";
import { fieldFixtures } from "./fixtures";
import type { FieldFixture } from "./fixtures/types";

export interface NestedFieldContainerOptions {
  container: "array" | "group" | "blocks";
  Component: ComponentType<any>;
  childFieldTypes: AdminFieldType[];
  fixtures?: Partial<Record<AdminFieldType, FieldFixture>>;
}

/** The `form.defaultValues` key every mounted container is registered under. */
const FIELD_NAME = "testField";
/** Sub-field key used inside every synthetic `group`/`blocks` wrapper built around a child fixture. */
const CHILD_KEY = "child";
/** The single block slug used by every synthetic `blocks` wrapper. */
const BLOCK_SLUG = "block";

/**
 * Minimal stub media collection so a nested "upload" child (which reads
 * `VexConfigContext` to resolve its target media collection) can mount
 * without a real backend — mirrors `components/fields/upload/Input.test.tsx`.
 */
function makeStubMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: { alt: text({ required: false }), filename: text({ required: false }) },
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

const stubClientConfig = {
  mediaCollections: [makeStubMediaCollection()],
} as unknown as ClientVexConfig;

/**
 * Builds the `array`/`blocks` field definition wrapping a single child
 * fixture, plus the resolved `labels` used to find its "Add"/empty-state
 * copy. `array`'s child becomes `items`; `blocks`'s child becomes the sole
 * field (keyed `"child"`) of one synthetic block type.
 */
function buildItemContainerFieldDef(props: {
  container: "array" | "blocks";
  childFixture: FieldFixture;
}): { fieldDef: AdminField; labels: { singular: string; plural: string } } {
  if (props.container === "array") {
    const fieldDef = array({ label: "Items", items: props.childFixture.fieldDef });
    return { fieldDef, labels: fieldDef.labels };
  }
  const fieldDef = blocks({
    label: "Blocks",
    blocks: [
      defineBlock({
        slug: BLOCK_SLUG,
        label: "Block",
        fields: { [CHILD_KEY]: props.childFixture.fieldDef },
      }),
    ],
  });
  return { fieldDef, labels: fieldDef.labels };
}

/** Builds the `group` field definition wrapping a single child fixture as its sole sub-field. */
function buildGroupFieldDef(childFixture: FieldFixture): AdminField {
  return group({ label: "Group", fields: { [CHILD_KEY]: childFixture.fieldDef } });
}

/** One item/sub-field carrying the child fixture's `valid` value. */
function buildSeededValue(props: {
  container: NestedFieldContainerOptions["container"];
  childFixture: FieldFixture;
}): unknown {
  switch (props.container) {
    case "array":
      return [props.childFixture.valid];
    case "group":
      return { [CHILD_KEY]: props.childFixture.valid };
    case "blocks":
      return [
        { id: "seed-block", blockType: BLOCK_SLUG, blockName: "Block", [CHILD_KEY]: props.childFixture.valid },
      ];
  }
}

/**
 * The item a fresh "Add" click produces, mirroring `FormArray`'s
 * `getNewItemDefault()` (the item's raw `defaultValue`, verbatim) and
 * `FormBlocks`'s `buildDefaultBlock()` (each sub-field's `defaultValue ?? null`,
 * plus the framework keys).
 */
function buildAddedItemMatcher(props: { container: "array" | "blocks"; childFixture: FieldFixture }): unknown {
  const childDefault = props.childFixture.fieldDef.defaultValue;
  if (props.container === "array") return childDefault;
  return expect.objectContaining({
    blockType: BLOCK_SLUG,
    blockName: "Block",
    [CHILD_KEY]: childDefault ?? null,
  });
}

/**
 * Mounts `Component` inside a real `useForm`/`<AppForm>` pair, wrapped in every
 * provider a nested child field might read outside `<AppForm>`. Returns a
 * `formRef` so assertions can read the live form state without depending on
 * any one child type's DOM shape.
 */
function renderContainer(props: {
  Component: ComponentType<any>;
  fieldDef: AdminField;
  readOnly: boolean;
  initialValue: unknown;
}) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };

  function Harness() {
    const [queryClient] = useState(() => new QueryClient());
    const [convexClient] = useState(() => new ConvexReactClient("https://example.convex.cloud"));
    const form = useForm({ defaultValues: { [FIELD_NAME]: props.initialValue } });
    formRef.current = form as AnyFormApi;

    return createElement(
      ConvexProvider,
      { client: convexClient },
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          NuqsTestingAdapter,
          null,
          createElement(
            VexConfigContext.Provider,
            { value: stubClientConfig },
            createElement(
              StorageAdapterContextProvider,
              { adapterClients: { convex: async () => ({ storageId: "stub-id" }) } },
              createElement(
                AppForm,
                { form },
                createElement(props.Component, {
                  name: FIELD_NAME,
                  fieldDef: props.fieldDef,
                  collection: testCollection,
                  readOnly: props.readOnly,
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }

  const utils = render(createElement(Harness));
  return { ...utils, formRef };
}

/** Call at module top level inside a *.test.tsx file — it calls describe/it itself. */
export function runNestedFieldContainerSuite(options: NestedFieldContainerOptions): void {
  const { container, Component, childFieldTypes, fixtures = fieldFixtures } = options;

  describe(`${container} container (nested fields)`, () => {
    for (const childType of childFieldTypes) {
      const childFixture = fixtures[childType];
      if (!childFixture) {
        throw new Error(
          `runNestedFieldContainerSuite: no fixture registered for child type "${childType}" — pass one via \`fixtures\`.`,
        );
      }

      describe(`nesting a "${childType}" field`, () => {
        const isOrdinaryChild = childType !== "array" && childType !== "group" && childType !== "blocks";
        if (isOrdinaryChild) {
          const ChildComponent = fieldToInputComponent(childType);
          if (!ChildComponent) {
            throw new Error(`runNestedFieldContainerSuite: no input component registered for "${childType}".`);
          }
          // Delegates the leaf field's own label/readOnly/error-timing/value-roundtrip/a11y
          // contract to the shared factory — this suite only adds container-specific behavior.
          runFieldInputContractSuite({ fixture: childFixture, Component: ChildComponent });
        }

        if (container === "group") {
          const fieldDef = buildGroupFieldDef(childFixture);

          it("round-trips a seeded value through the group's sub-field", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({ Component, fieldDef, readOnly: false, initialValue: seeded });
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: seeded });
          });

          it("cascades readOnly to the nested sub-field", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { container: dom } = renderContainer({
              Component,
              fieldDef,
              readOnly: true,
              initialValue: seeded,
            });
            const controls = dom.querySelectorAll("button, input, select, textarea");
            expect(controls.length).toBeGreaterThan(0);
            controls.forEach((el) => expect(el).toBeDisabled());
          });
        } else {
          const { fieldDef, labels } = buildItemContainerFieldDef({ container, childFixture });
          const emptyMessage = container === "array" ? "No items yet." : `No ${labels.plural} yet.`;
          const emptyValue: unknown[] = [];

          it("starts empty and shows the empty-state message", () => {
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: emptyValue,
            });
            expect(screen.getByText(emptyMessage)).toBeInTheDocument();
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: emptyValue });
          });

          it("adds a new item with the child's default value via the Add button", async () => {
            const user = userEvent.setup();
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: emptyValue,
            });

            await user.click(screen.getByRole("button", { name: new RegExp(`Add ${labels.singular}`, "i") }));

            const values = formRef.current?.state.values as Record<string, unknown[]>;
            expect(values[FIELD_NAME]).toHaveLength(1);
            expect(values[FIELD_NAME][0]).toEqual(buildAddedItemMatcher({ container, childFixture }));
          });

          it("removes a seeded item, returning to the empty state", async () => {
            const user = userEvent.setup();
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: seeded,
            });

            const removeButton =
              container === "array"
                ? screen.getByRole("button", { name: "Remove item 1" })
                : screen.getByRole("button", { name: "Remove Block block" });
            await user.click(removeButton);

            expect(await screen.findByText(emptyMessage)).toBeInTheDocument();
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: emptyValue });
          });

          it("round-trips a seeded value into the container's form state", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: seeded,
            });
            expect(screen.queryByText(emptyMessage)).not.toBeInTheDocument();
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: seeded });
          });

          it("cascades readOnly to every nested control", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { container: dom } = renderContainer({
              Component,
              fieldDef,
              readOnly: true,
              initialValue: seeded,
            });
            const controls = dom.querySelectorAll("button, input, select, textarea");
            expect(controls.length).toBeGreaterThan(0);
            controls.forEach((el) => expect(el).toBeDisabled());
          });
        }
      });
    }
  });
}
```

#### packages/react/src/components/fields/array/testFixture.ts

```ts
import { array, text, type ArrayField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `array` field fixture — the container's OWN contract (add/remove, nested
 * value round-trip, and readOnly cascade across every child field type are
 * covered separately by `runNestedFieldContainerSuite`). `items` is a simple
 * `text()` sub-field so this fixture only exercises the array's own behavior.
 *
 * `min: { value: 1 }` makes an empty array fail validation — `array`'s
 * `arrayFieldToInputSchema` REPLACES the `required`-only check with the `min`
 * check whenever both are set (see `packages/core/src/fields/array/inputSchema.ts`),
 * so `required` alone would never surface as `invalid`'s failure reason.
 */
export const arrayFieldFixture: FieldFixture<ArrayField<string>, string[]> = {
  fieldType: "array",
  fieldDef: array({
    label: "Tags",
    items: text({ label: "Tag", required: true }),
    required: true,
    min: { value: 1 },
  }),
  valid: ["First tag", "Second tag"],
  invalid: [],
  empty: [],
};
```

#### packages/react/src/components/fields/group/testFixture.ts

```ts
import { group, text, type GroupField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `group` field fixture — the container's OWN contract. A single simple
 * `text()` sub-field ("title") keeps this fixture's own round-trip generic;
 * nested-child coverage across every field type lives in
 * `runNestedFieldContainerSuite`, not here.
 *
 * `invalid`'s `title: undefined` fails `title`'s own required `text()`
 * schema inside `groupFieldToInputSchema`'s `z.object({...})` — the group
 * itself doesn't need `required: true` for this to be a real validation
 * failure.
 */
export const groupFieldFixture: FieldFixture<GroupField, Record<string, unknown>> = {
  fieldType: "group",
  fieldDef: group({
    label: "Details",
    fields: { title: text({ label: "Title", required: true }) },
  }),
  valid: { title: "Hello" },
  invalid: { title: undefined },
  empty: {},
};
```

#### packages/react/src/components/fields/blocks/testFixture.ts

```ts
import { blocks, defineBlock, text, type BlocksField, type GenericBlock } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

const paragraphBlock = defineBlock({
  slug: "paragraph",
  label: "Paragraph",
  fields: { text: text({ label: "Text", required: true }) },
});

/**
 * `blocks` field fixture — the container's OWN contract. A single
 * `paragraph` block type keeps this fixture's own add/remove/round-trip
 * generic; nested-child coverage across every field type lives in
 * `runNestedFieldContainerSuite`, not here.
 *
 * `min: 1` makes an empty array fail validation via `blocksFieldToInputSchema`'s
 * outer `z.array(itemSchema).min(...)`.
 */
export const blocksFieldFixture: FieldFixture<BlocksField, GenericBlock[]> = {
  fieldType: "blocks",
  fieldDef: blocks({
    label: "Body",
    blocks: [paragraphBlock],
    min: 1,
  }),
  valid: [{ id: "block-1", blockType: "paragraph", blockName: "Paragraph", text: "Hello world" }],
  invalid: [],
  empty: [],
};
```

#### packages/react/src/testing/fixtures/index.ts

Existing file (Step 4 creates it empty; steps 5–11 add `text`, `number`, `checkbox`, `url`, `color`, `select`, `date`, `upload`, `relationship` in parallel) — 2 edits, everything else unchanged. This closes the registry: all 12 `AdminFieldType` keys are now present.

**1 — imports.** Beside the other per-type fixture imports:

```ts
import { arrayFieldFixture } from "../../components/fields/array/testFixture";
import { groupFieldFixture } from "../../components/fields/group/testFixture";
import { blocksFieldFixture } from "../../components/fields/blocks/testFixture";
```

**2 — registry entries.** Replace the `// array: arrayFieldFixture, (step 12)`, `// group: groupFieldFixture, (step 12)`, and `// blocks: blocksFieldFixture, (step 12)` placeholder comments inside `fieldFixtures`:

```ts
  array: arrayFieldFixture,
  group: groupFieldFixture,
  blocks: blocksFieldFixture,
```

#### packages/react/src/testing/fixtures/index.test.tsx

New file. Mirrors `packages/react/src/components/fields/index.test.tsx`'s registry-parity pattern — the `fieldFixtures` registry is only useful to `runVexReactSuite`/`runNestedFieldContainerSuite` if it actually carries one entry per core field type, and nothing else enforces that at runtime.

```tsx
import { describe, it, expect } from "vitest";
import { ADMIN_FIELDS } from "@vexcms/core";
import { fieldFixtures } from "./index";

describe("field fixture registry", () => {
  it("registers a fixture for every core field type", () => {
    expect(Object.keys(fieldFixtures).sort()).toEqual(Object.keys(ADMIN_FIELDS).sort());
  });
});
```

#### packages/react/src/components/fields/array/Input.test.tsx

The container's own `extra` reads `array/config.ts`, `array/inputSchema.ts`, and `FormArray.tsx` directly. Test-design techniques used: **boundary value analysis** on `min`/`max` item counts (at, one-below, one-above, with both default and custom error messages); **equivalence partitioning** for the two independent readOnly sources (the array's own vs. an item's own `admin.readOnly`); an **interaction sequence** (add, add, remove, verify renumbering); and a **state/wiring check** for drag-reorder that stops at the same level of confidence `ui/dnd/DragHandle.test.tsx` already established — that file never simulates an end-to-end `@hello-pangea/dnd` drag (real pointer/keyboard sensors are not reliably driveable in jsdom), it only asserts the real `data-rfd-drag-handle-*` wiring is present versus the inert fallback. This file follows that same precedent rather than inventing a synthetic full-drag simulation.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  array,
  text,
  type ArrayField,
  type ArrayType,
  type CollectionConfig,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../../testing/nestedFieldContainer";
import { arrayFieldFixture } from "./testFixture";
import { ArrayFieldInput } from "./Input";

/**
 * Mounts `ArrayFieldInput` behind a real `useForm` + `<AppForm>`, exposing the
 * array's live value through a probe so shape/order assertions don't need a
 * hand-mocked `FieldApi`. The `onSubmit` validator maps every Zod issue to its
 * own dot/bracket-path form field (`testField`, or `testField[0]` for an item
 * failure) — a flat single-path validator would only ever populate the
 * array's OWN top-level error, never surface a specific item's.
 */
function ArrayHarness(props: {
  fieldDef: ArrayField<ArrayType>;
  collection?: CollectionConfig;
  initialValue: unknown[];
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse((value as Record<string, unknown>).testField);
        if (result.success) return undefined;
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fields[["testField", ...issue.path].join(".")] = issue.message;
        }
        return { fields };
      },
    },
  });
  return (
    <AppForm form={form}>
      <ArrayFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection ?? testCollection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: arrayFieldFixture,
  Component: ArrayFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("array: item-count boundaries, index-based naming, drag-reorder wiring, and independent readOnly sources", () => {
      const boundaryFieldDef = array({
        label: "Scores",
        items: text({ label: "Score", required: true }),
        min: { value: 1 },
        max: { value: 2 },
      });

      it("passes validation at exactly the min item count", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a"]} />,
        );
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(container.querySelector(".text-destructive")?.textContent).toBeFalsy();
      });

      it("fails validation one item below min, with the real schema message", async () => {
        const schema = adminFieldToInputSchema({ field: boundaryFieldDef });
        const result = schema.safeParse([]);
        expect(result.success).toBe(false);
        const message = !result.success ? result.error.issues[0]?.message : undefined;
        expect(message).toBe("This field is too short.");

        const user = userEvent.setup();
        render(<ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText(message!)).toBeInTheDocument();
      });

      it("passes validation at exactly the max item count", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a", "b"]} />,
        );
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(container.querySelector(".text-destructive")?.textContent).toBeFalsy();
      });

      it("fails validation one item above max, with the real schema message, when seeded directly past the limit", async () => {
        const schema = adminFieldToInputSchema({ field: boundaryFieldDef });
        const result = schema.safeParse(["a", "b", "c"]);
        expect(result.success).toBe(false);
        const message = !result.success ? result.error.issues[0]?.message : undefined;
        expect(message).toBe("This field is too long.");

        const user = userEvent.setup();
        render(<ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a", "b", "c"]} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText(message!)).toBeInTheDocument();
      });

      it("disables the Add button once the max item count is reached, for parity with FormBlocks' equivalent `atMax` guard", () => {
        // `FormArray` computes no `atMax` guard at all today — unlike
        // `FormBlocks`, which disables its own Add button and shows a
        // "Maximum reached" message once `items.length >= fieldDef.max`. A
        // reasonable user expects the two sibling containers to behave the
        // same way here; JSDoc is silent on this specifically for `array`.
        // Asserted to that reasonable, consistent expectation — a failure
        // here documents a real, currently-uncaught inconsistency between
        // the two containers, not a test bug (Change B).
        render(<ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a", "b"]} />);
        expect(screen.getByRole("button", { name: `Add ${boundaryFieldDef.labels.singular}` })).toBeDisabled();
      });

      it("uses configured custom min/max error messages verbatim", async () => {
        const customFieldDef = array({
          label: "Scores",
          items: text({ label: "Score", required: true }),
          min: { value: 1, error: "Add at least one score." },
          max: { value: 2, error: "No more than two scores." },
        });
        const user = userEvent.setup();

        const belowMin = render(
          <ArrayHarness fieldDef={customFieldDef} collection={collection} initialValue={[]} />,
        );
        await user.click(within(belowMin.container).getByRole("button", { name: /submit/i }));
        expect(await within(belowMin.container).findByText("Add at least one score.")).toBeInTheDocument();
        belowMin.unmount();

        const aboveMax = render(
          <ArrayHarness fieldDef={customFieldDef} collection={collection} initialValue={["a", "b", "c"]} />,
        );
        await user.click(within(aboveMax.container).getByRole("button", { name: /submit/i }));
        expect(await within(aboveMax.container).findByText("No more than two scores.")).toBeInTheDocument();
      });

      it("names each item's control by array index (`testField[0]`, `testField[1]`)", () => {
        render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={arrayFieldFixture.valid}
          />,
        );
        const inputs = screen.getAllByLabelText("Tag") as HTMLInputElement[];
        expect(inputs.map((el) => el.id)).toEqual(["testField[0]", "testField[1]"]);
        expect(inputs.map((el) => el.value)).toEqual(arrayFieldFixture.valid);
      });

      it("honors the item field's own admin.readOnly independently of the array's readOnly prop — FormArray forwards readOnly straight through without OR-ing the item's own admin flag (unlike FormGroup/FormBlocks)", async () => {
        const readOnlyItemFieldDef = array({
          label: "Scores",
          items: text({ label: "Score", required: true, admin: { readOnly: true } }),
        });
        const user = userEvent.setup();
        render(
          <ArrayHarness
            fieldDef={readOnlyItemFieldDef}
            collection={collection}
            initialValue={["x"]}
            readOnly={false}
          />,
        );
        const input = screen.getByLabelText("Score") as HTMLInputElement;
        // TextFieldInput's own two independent readOnly sources: the PROP
        // sets `disabled` (false here — FormArray forwarded `readOnly={false}`
        // unmodified), the item's own `fieldDef.admin.readOnly` sets the
        // native `readonly` HTML attribute — a real, DOM-visible difference
        // documented in the shared checklist's item 4.
        expect(input).not.toBeDisabled();
        expect(input).toHaveAttribute("readonly");
        await user.type(input, "!");
        expect(input.value).toBe("x");

        // The array's own Add control is unaffected — only the array's OWN
        // readOnly source gates it, not an item's admin.readOnly.
        expect(
          screen.getByRole("button", { name: `Add ${readOnlyItemFieldDef.labels.singular}` }),
        ).not.toBeDisabled();
      });

      it("renumbers each remaining item's remove button after removing an earlier item", async () => {
        const user = userEvent.setup();
        render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={["First tag", "Second tag"]}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Remove item 1" }));
        expect(screen.getByRole("button", { name: "Remove item 1" })).toBeInTheDocument();
        expect(screen.getByLabelText("Tag")).toHaveValue("Second tag");
      });

      it("exposes an active drag handle per item when there is more than one, and degrades every handle to the inert affordance when the array is readOnly", () => {
        // The generic readOnly-cascade check in runNestedFieldContainerSuite
        // only queries "button, input, select, textarea" — DragHandle renders
        // a plain <div>, so it's invisible to that check. This fills the gap.
        const editable = render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={arrayFieldFixture.valid}
          />,
        );
        expect(editable.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(2);
        editable.unmount();

        const readOnly = render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={arrayFieldFixture.valid}
            readOnly
          />,
        );
        expect(readOnly.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(0);
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "array",
  Component: ArrayFieldInput,
  // One child per representative category — simple (text), choice (select),
  // temporal (date), network-via-react-query (upload: its filled state
  // resolves each id through `@tanstack/react-query` + `get()`, per
  // `FilledInput.tsx`) — plus "array" for the array-of-array nested-of-nested
  // case (array items may themselves be arrays — see `array/config.ts`'s
  // "matrix" example).
  //
  // `relationship` is deliberately NOT included, even though it is the most
  // architecturally distinct field type (a live Convex query subscription
  // via `useRelationshipPickerOptions`, not a react-query fetch). Its
  // `RelationshipFieldInput` reads `config.collections.find(...)` from
  // `VexConfigContext` — this shared harness's `stubClientConfig` only sets
  // `mediaCollections`, so mounting it here throws synchronously
  // (`config.collections` is `undefined`). Wiring relationship into this
  // shared nested-container harness (extending `stubClientConfig` and
  // wiring `testing/convex/bridge.ts`'s `createFakeConvexClient`) is real,
  // separate scope, not a per-field-step task — a documented gap, not a
  // silently-dropped category.
  childFieldTypes: ["text", "select", "date", "upload", "array"],
});
```

#### packages/react/src/components/fields/group/Input.test.tsx

The container's own `extra` reads `group/config.ts`, `group/inputSchema.ts`, and `FormGroup.tsx` directly. Test-design techniques used: **equivalence partitioning** on sub-field count (1 vs. several, for the "field"/"fields" label); a **state transition** across collapse→expand (and the reverse); and an **error path** proving `groupFieldToInputSchema`'s outer `z.object({...})` routes each sub-field's own issue to that sub-field's own dot-path form field, not a single blob on the group.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, group, text, type CollectionConfig, type GroupField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../../testing/nestedFieldContainer";
import { groupFieldFixture } from "./testFixture";
import { GroupFieldInput } from "./Input";

/**
 * Mounts `GroupFieldInput` behind a real `useForm` + `<AppForm>`, exposing
 * the nested form value through a probe. The `onSubmit` validator maps every
 * Zod issue to its own dot-path field (`testField.title`, not just
 * `testField`) — mirroring how the real per-collection form-level validator
 * routes nested errors — so each sub-field's own `FormError` receives only
 * its own message.
 */
function GroupHarness(props: {
  fieldDef: GroupField;
  collection?: CollectionConfig;
  initialValue: Record<string, unknown>;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse((value as Record<string, unknown>).testField);
        if (result.success) return undefined;
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fields[["testField", ...issue.path].join(".")] = issue.message;
        }
        return { fields };
      },
    },
  });
  return (
    <AppForm form={form}>
      <GroupFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection ?? testCollection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: groupFieldFixture,
  Component: GroupFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("group: accordion collapse, sub-field count, dot-notation naming, and per-sub-field error isolation", () => {
      it("renders its sub-field open by default when defaultOpen is unset", () => {
        render(
          <GroupHarness fieldDef={groupFieldFixture.fieldDef} collection={collection} initialValue={groupFieldFixture.valid} />,
        );
        expect(screen.getByLabelText("Title")).toBeVisible();
      });

      it("starts collapsed when defaultOpen: false, and expands on clicking the trigger", async () => {
        const collapsedFieldDef = group({
          label: "Details",
          fields: { title: text({ label: "Title", required: true }) },
          defaultOpen: false,
        });
        const user = userEvent.setup();
        render(<GroupHarness fieldDef={collapsedFieldDef} collection={collection} initialValue={{ title: "Hi" }} />);

        expect(screen.getByLabelText("Title")).not.toBeVisible();
        await user.click(screen.getByRole("button", { name: /details/i }));
        expect(screen.getByLabelText("Title")).toBeVisible();
      });

      it("shows the singular/plural sub-field count — '1 field' for one sub-field, 'N fields' for several", () => {
        const oneFieldDef = group({ label: "Solo", fields: { title: text({ label: "Title" }) } });
        const twoFieldDef = group({
          label: "Pair",
          fields: { title: text({ label: "Title" }), subtitle: text({ label: "Subtitle" }) },
        });
        const one = render(<GroupHarness fieldDef={oneFieldDef} collection={collection} initialValue={{}} />);
        expect(one.getByRole("button", { name: /solo/i })).toHaveTextContent("1 field");
        one.unmount();

        const two = render(<GroupHarness fieldDef={twoFieldDef} collection={collection} initialValue={{}} />);
        expect(two.getByRole("button", { name: /pair/i })).toHaveTextContent("2 fields");
      });

      it("uses dot-notation names for each sub-field, matching the group's nested value shape", async () => {
        const pairFieldDef = group({
          label: "Contact",
          fields: { title: text({ label: "Title" }), subtitle: text({ label: "Subtitle" }) },
        });
        const user = userEvent.setup();
        render(<GroupHarness fieldDef={pairFieldDef} collection={collection} initialValue={{}} />);

        expect(screen.getByLabelText("Title")).toHaveAttribute("id", "testField.title");
        expect(screen.getByLabelText("Subtitle")).toHaveAttribute("id", "testField.subtitle");

        await user.type(screen.getByLabelText("Title"), "Hi");
        await user.type(screen.getByLabelText("Subtitle"), "There");

        expect(JSON.parse(screen.getByTestId("value-probe").textContent ?? "{}")).toEqual({
          title: "Hi",
          subtitle: "There",
        });
      });

      it("isolates validation errors per sub-field — an invalid sub-field's error appears only on its own control, never on a valid sibling's", async () => {
        const contactFieldDef = group({
          label: "Contact",
          fields: {
            email: text({ label: "Email", required: true }),
            phone: text({ label: "Phone", required: false }),
          },
        });
        const emailSchema = adminFieldToInputSchema({ field: contactFieldDef.fields.email! });
        const emailError = emailSchema.safeParse(undefined);
        expect(emailError.success).toBe(false);
        const emailMessage = !emailError.success ? emailError.error.issues[0]?.message : undefined;

        const user = userEvent.setup();
        const { container } = render(
          <GroupHarness
            fieldDef={contactFieldDef}
            collection={collection}
            initialValue={{ email: undefined, phone: "555-0100" }}
          />,
        );

        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(await screen.findByText(emailMessage!)).toBeInTheDocument();
        // Only email's own leaf FormError received a message — phone's
        // stays empty, regardless of DOM nesting.
        const errorTexts = Array.from(container.querySelectorAll(".text-destructive"))
          .map((el) => el.textContent)
          .filter(Boolean);
        expect(errorTexts).toEqual([emailMessage]);
      });

      it("preserves a sub-field's value across a collapse→expand cycle", async () => {
        const user = userEvent.setup();
        render(<GroupHarness fieldDef={groupFieldFixture.fieldDef} collection={collection} initialValue={{}} />);
        await user.type(screen.getByLabelText("Title"), "Persisted");
        await user.click(screen.getByRole("button", { name: /details/i }));
        expect(screen.getByLabelText("Title")).not.toBeVisible();
        await user.click(screen.getByRole("button", { name: /details/i }));
        expect(screen.getByLabelText("Title")).toHaveValue("Persisted");
      });

      it("cascades readOnly to a sub-field via its own admin.readOnly, even when the group itself is editable — FormGroup ORs the two sources, unlike FormArray's item pass-through", () => {
        const readOnlySubFieldDef = group({
          label: "Details",
          fields: { title: text({ label: "Title", required: true, admin: { readOnly: true } }) },
        });
        render(
          <GroupHarness
            fieldDef={readOnlySubFieldDef}
            collection={collection}
            initialValue={{ title: "Locked" }}
            readOnly={false}
          />,
        );
        expect(screen.getByLabelText("Title")).toBeDisabled();
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "group",
  Component: GroupFieldInput,
  // One child per representative category — simple (text), choice (select),
  // temporal (date), network-via-react-query (upload) — plus "array" for the
  // group-of-array nested-of-nested case.
  //
  // `relationship` is deliberately excluded — see the rationale comment in
  // `array/Input.test.tsx`: its Convex live-query bridge needs
  // infrastructure (`config.collections`, `testing/convex/bridge.ts`) this
  // shared harness's `stubClientConfig` doesn't provide, and adding it would
  // throw during mount rather than silently under-cover a category.
  childFieldTypes: ["text", "select", "date", "upload", "array"],
});
```

#### packages/react/src/components/fields/blocks/Input.test.tsx

`BlocksFieldInput` reads `useQueryState` (nuqs) directly for its editor modal's open state, which throws without an adapter in the tree — `runFieldInputContractSuite`'s own mount helper only supplies `<AppForm>`, so the container's OWN contract call wraps it in a small test-only component, the same pattern `upload/Input.test.tsx` uses for its own extra provider needs. `runNestedFieldContainerSuite` needs no such wrapper — its `renderContainer` already wraps every mounted `Component` in a nuqs testing adapter.

`FormBlocks.tsx` is the densest codepath in the package — its `extra` was derived by reading it in full, plus `blocks/config.ts`/`blocks/inputSchema.ts`. Test-design techniques used: **boundary value analysis** on `min`/`max` (at, one-below, one-above, plus the `atMax` Add-button guard `FormBlocks` DOES implement, in contrast to `array`'s gap documented above); **state transitions** across the picker (closed→open→selected→confirmed, and closed→open→Escape); an **interaction sequence** for editing a block's `blockName` without toggling its own accordion; and **error paths** for the unregistered-`blockType` fallback and the picker's empty-search state.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  adminFieldToInputSchema,
  blocks,
  defineBlock,
  text,
  type BaseFieldMeta,
  type BlocksField,
  type CollectionConfig,
  type GenericBlock,
  type InputComponentProps,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../../testing/nestedFieldContainer";
import { BlocksFieldInput } from "./Input";
import { blocksFieldFixture } from "./testFixture";

/**
 * Wraps `BlocksFieldInput` with a nuqs testing adapter — the block editor's
 * open/closed state (`useQueryState`) throws without one. Passed as
 * `runFieldInputContractSuite`'s `Component` in place of the bare component.
 */
function TestBlocksFieldInput({
  name,
  fieldDef,
  readOnly,
  collection,
  index,
}: InputComponentProps<BaseFieldMeta, BlocksField> & { field?: unknown }) {
  return (
    <NuqsTestingAdapter>
      <BlocksFieldInput name={name} fieldDef={fieldDef} readOnly={readOnly} collection={collection} index={index} />
    </NuqsTestingAdapter>
  );
}

/**
 * Mounts `TestBlocksFieldInput` behind a real `useForm` + `<AppForm>`,
 * exposing the block array through a probe. The `onSubmit` validator maps
 * every Zod issue to its own dot/bracket-path field, matching `ArrayHarness`/
 * `GroupHarness`'s convention.
 */
function BlocksHarness(props: {
  fieldDef: BlocksField;
  collection?: CollectionConfig;
  initialValue: GenericBlock[];
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse((value as Record<string, unknown>).testField);
        if (result.success) return undefined;
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fields[["testField", ...issue.path].join(".")] = issue.message;
        }
        return { fields };
      },
    },
  });
  return (
    <AppForm form={form}>
      <TestBlocksFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection ?? testCollection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: blocksFieldFixture,
  Component: TestBlocksFieldInput,
  extra: () => {
    // Two block types — the single-block "skip the picker" shortcut in
    // FormBlocks (`fieldDef.blocks.length === 1`) only applies to
    // `blocksFieldFixture`'s own one-block fixture; the picker dialog itself
    // needs a field with more than one registered type to exercise.
    const headingBlock = defineBlock({
      slug: "heading",
      label: "Heading",
      fields: { text: text({ label: "Heading text", required: true }) },
    });
    const paragraphBlock = defineBlock({
      slug: "paragraph",
      label: "Paragraph",
      fields: { text: text({ label: "Body", required: true }) },
    });
    const twoBlockFieldDef = blocks({ label: "Body", blocks: [headingBlock, paragraphBlock] });
    const boundaryFieldDef = blocks({
      label: "Sections",
      labels: { singular: "Section", plural: "Sections" },
      blocks: [headingBlock, paragraphBlock],
      min: 2,
      max: 3,
    });

    describe("blocks: the block-type picker, blockName/id generation, removal, the unknown-blockType fallback, min/max counts, and the nuqs-driven editor modal", () => {
      it("opens the block-type picker dialog when more than one block type is registered, listing every block's label", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));

        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText("Add block")).toBeInTheDocument();
        expect(within(dialog).getByText("Heading")).toBeInTheDocument();
        expect(within(dialog).getByText("Paragraph")).toBeInTheDocument();
        // Each row shows its own field count — both blocks here declare one field.
        expect(dialog.textContent).toContain("heading · 1 field");
        expect(dialog.textContent).toContain("paragraph · 1 field");
      });

      it("filters the picker's block list by label or slug, case-insensitively, and shows 'No blocks found' for no match", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        const dialog = await screen.findByRole("dialog");

        await user.type(within(dialog).getByPlaceholderText("Search blocks…"), "HEAD");
        expect(within(dialog).getByText("Heading")).toBeInTheDocument();
        expect(within(dialog).queryByText("Paragraph")).not.toBeInTheDocument();

        await user.clear(within(dialog).getByPlaceholderText("Search blocks…"));
        await user.type(within(dialog).getByPlaceholderText("Search blocks…"), "zzz-no-match");
        expect(within(dialog).getByText("No blocks found")).toBeInTheDocument();
      });

      it("toggles a row's selection instead of adding immediately, and only reveals the confirm button once at least one block is selected", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        const dialog = await screen.findByRole("dialog");

        expect(within(dialog).queryByRole("button", { name: /^Add \d+ blocks?$/ })).not.toBeInTheDocument();
        await user.click(within(dialog).getByText("Heading"));
        expect(await within(dialog).findByRole("button", { name: "Add 1 block" })).toBeInTheDocument();
        // A row click only toggles selection — nothing was added yet, and the dialog stays open.
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByTestId("value-probe")).toHaveTextContent("[]");
      });

      it("adds every selected block type in the field's OWN registration order, not click order, and closes the picker", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        const dialog = await screen.findByRole("dialog");

        // Click Paragraph (registered second) before Heading (registered first).
        await user.click(within(dialog).getByText("Paragraph"));
        await user.click(within(dialog).getByText("Heading"));
        await user.click(within(dialog).getByRole("button", { name: "Add 2 blocks" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as { blockType: string }[];
        // BlockPickerDialog's handleAddBlocks filters `props.blockDefs` (the
        // field's own registration order) by the selected set — it does not
        // preserve click order.
        expect(values.map((b) => b.blockType)).toEqual(["heading", "paragraph"]);
      });

      it("seeds a new block's blockName from the block definition's label and gives it a fresh, unique id", async () => {
        const user = userEvent.setup();
        // Single registered block type — Add bypasses the picker dialog entirely.
        render(<BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={[]} />);
        const addButton = screen.getByRole("button", { name: `Add ${blocksFieldFixture.fieldDef.labels.singular}` });
        await user.click(addButton);
        await user.click(addButton);

        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
          id: string;
          blockName?: string;
        }[];
        expect(values).toHaveLength(2);
        expect(values[0]?.blockName).toBe("Paragraph");
        expect(values[1]?.blockName).toBe("Paragraph");
        expect(values[0]?.id).toEqual(expect.any(String));
        expect(values[0]?.id).not.toBe(values[1]?.id);
      });

      it("edits a block's blockName in place without toggling the accordion, and leaves that block's own field values untouched", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "block-1", blockType: "paragraph", blockName: "Paragraph", text: "Original body" },
        ];
        const { container } = render(
          <BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={seeded} />,
        );

        const trigger = container.querySelector("[aria-expanded]") as HTMLElement;
        // Starts open (`admin.defaultCollapsed` defaults to `false`) — collapse it first.
        await user.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(screen.getByLabelText("Text")).not.toBeVisible();

        const blockNameInput = screen.getByDisplayValue("Paragraph");
        await user.clear(blockNameInput);
        await user.type(blockNameInput, "Intro");

        // Typing into the blockName input must not have re-expanded the
        // accordion — FormBlocks stops click propagation for exactly this.
        expect(trigger).toHaveAttribute("aria-expanded", "false");

        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
          blockName?: string;
          text?: string;
        }[];
        expect(values[0]?.blockName).toBe("Intro");
        expect(values[0]?.text).toBe("Original body");
      });

      it("removes one block by its own labeled button, leaving a differently-typed sibling block's field values untouched", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
        ];
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} />);

        await user.click(screen.getByRole("button", { name: "Remove Heading block" }));

        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
          blockType: string;
          text?: string;
        }[];
        expect(values).toHaveLength(1);
        expect(values[0]?.blockType).toBe("paragraph");
        expect(values[0]?.text).toBe("Body copy");
      });

      it("renders the unknown-block-type fallback for a seeded item whose blockType isn't registered, and removes it via its own inline button", async () => {
        // The fallback's own remove button carries no `aria-label` (unlike
        // the normal block header's `Remove ${label} block`) — a real,
        // separate accessibility gap this test's own selector has to route
        // around rather than paper over.
        const user = userEvent.setup();
        const seeded = [{ id: "legacy-1", blockType: "legacy-grid" }] as unknown as GenericBlock[];
        const { container } = render(
          <BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={seeded} />,
        );

        expect(screen.getByText(/unknown block type/i)).toBeInTheDocument();
        expect(screen.getByText("legacy-grid")).toBeInTheDocument();

        const fallbackRemoveButton = container.querySelector(".text-destructive button") as HTMLElement;
        await user.click(fallbackRemoveButton);

        expect(
          await screen.findByText(`No ${blocksFieldFixture.fieldDef.labels.plural} yet.`),
        ).toBeInTheDocument();
      });

      it("fails validation below min, with the real schema message, and passes at exactly min", async () => {
        const oneBlock: GenericBlock[] = [{ id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" }];
        const schema = adminFieldToInputSchema({ field: boundaryFieldDef });
        const belowMin = schema.safeParse(oneBlock);
        expect(belowMin.success).toBe(false);
        const message = !belowMin.success ? belowMin.error.issues[0]?.message : undefined;
        expect(message).toBe("At least 2 Sections required.");

        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={oneBlock} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText(message!)).toBeInTheDocument();
      });

      it("passes validation at exactly min", async () => {
        const twoBlocks: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        const user = userEvent.setup();
        const { container } = render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={twoBlocks} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(container.querySelector(".text-destructive")?.textContent).toBeFalsy();
      });

      it("disables the Add button and shows the 'Maximum reached' text at exactly max, but not one below it", () => {
        const twoBlocks: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        const threeBlocks: GenericBlock[] = [
          ...twoBlocks,
          { id: "h2", blockType: "heading", blockName: "Heading", text: "More" },
        ];

        const belowMax = render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={twoBlocks} />);
        expect(belowMax.getByRole("button", { name: "Add Section" })).toBeEnabled();
        expect(belowMax.queryByText(/maximum/i)).not.toBeInTheDocument();
        belowMax.unmount();

        const atMax = render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={threeBlocks} />);
        expect(atMax.getByRole("button", { name: "Add Section" })).toBeDisabled();
        expect(atMax.getByText("Maximum 3 Sections reached")).toBeInTheDocument();
      });

      it("fails validation above max, with the real schema message, when items were seeded past the limit directly", async () => {
        const fourBlocks: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "1" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "2" },
          { id: "h2", blockType: "heading", blockName: "Heading", text: "3" },
          { id: "p2", blockType: "paragraph", blockName: "Paragraph", text: "4" },
        ];
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={fourBlocks} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText("No more than 3 Sections allowed.")).toBeInTheDocument();
      });

      it("closes the picker dialog on Escape without adding any block", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        await screen.findByRole("dialog");

        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByTestId("value-probe")).toHaveTextContent("[]");
      });

      it("exposes an active drag handle per block when there is more than one, and degrades every handle to inert when readOnly", () => {
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        const editable = render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} />);
        expect(editable.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(2);
        editable.unmount();

        const readOnly = render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} readOnly />);
        expect(readOnly.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(0);
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "blocks",
  Component: BlocksFieldInput,
  // One child per representative category — simple (text), choice (select),
  // temporal (date), network-via-react-query (upload) — plus "array", since a
  // block field may itself be an array (`BlockConfigInput.fields` accepts any
  // `AdminField`).
  //
  // `relationship` is deliberately excluded — see the rationale comment in
  // `array/Input.test.tsx`: its Convex live-query bridge needs
  // infrastructure this shared harness's `stubClientConfig` doesn't provide.
  childFieldTypes: ["text", "select", "date", "upload", "array"],
});
```

Verify: `node scripts/record-test-findings.mjs packages/react/src/testing/fixtures/index.test.tsx packages/react/src/components/fields/array/Input.test.tsx packages/react/src/components/fields/group/Input.test.tsx packages/react/src/components/fields/blocks/Input.test.tsx`


### Step 13 — RBAC-state factory

Why: Generalizes the provider-harness pattern from `usePermission.test.tsx`/
`useCanAccessAdminPanel.test.tsx` into a reusable factory usable against any component that reads
`usePermission`, proven this pass at the field-input layer; view-level application
(`CollectionEditView`/`CollectionListView`/`AdminSidebar`) is deferred to the views pass and
explicitly out of scope here.
Verify: `node scripts/record-test-findings.mjs packages/react/src/testing/rbacState.test.ts`

- [ ] `packages/react/src/testing/rbacState.ts` — `runRbacStateSuite({ render, scenarios?, assert })` **[agent]**
- [ ] `packages/react/src/testing/rbacState.test.ts` — self-test + real `TextFieldInput` application **[agent]**

The factory mounts a tiny internal harness component per scenario that calls the *real*
`usePermission` hook against `testCollection` (resource `"posts"`, action `"read"` — the same
action `usePermission.test.tsx`'s constraint fixtures govern, so `testAccess.scoped`'s doc-scoped
role resolves exactly like that file's `constraintIndexOnly` role does), captures the resulting
boolean, and hands it to the caller's `render(permission)`. `renderWithVexProviders` supplies the
scenario's `access`/`auth`; `assert` receives the RTL render result, the scenario, and the same
permission boolean so callers never have to re-derive it. Default scenarios come straight from
`testAccess`/`testUsers`:

| scenario    | `access`               | `user`               | resolved `read` permission |
| ----------- | ----------------------- | --------------------- | --------------------------- |
| `none`      | `testAccess.none`       | `undefined`            | `true` (no config — escape hatch, not fail-closed) |
| `anonymous` | `testAccess.anonymous`  | `undefined`            | `false` (access configured, no user — fails closed) |
| `denied`    | `testAccess.denied`     | `testUsers.denied`     | `false` (role has no grant on `testCollection`) |
| `allowed`   | `testAccess.allowed`    | `testUsers.allowed`    | `true` (role has `"*": true`) |
| `scoped`    | `testAccess.scoped`     | `testUsers.scoped`     | `false` (doc-scoped constraint, quantified with no `data` supplied) |

#### packages/react/src/testing/rbacState.ts

New file — complete.

```ts
import { Fragment, createElement } from "react";
import type { ReactNode } from "react";
import { describe, it } from "vitest";
import type { render } from "@testing-library/react";
import type { VexAccessConfig } from "@vexcms/core";
import { usePermission } from "../hooks/usePermission";
import { renderWithVexProviders, testAccess, testCollection, testUsers } from "./harness/accessFixtures";

export interface RbacScenario {
  name: string;
  access: VexAccessConfig | undefined;
  user: unknown;
}

export interface RbacStateOptions {
  /** Defaults to the `testAccess`/`testUsers`-derived `{none, anonymous, denied, allowed, scoped}`. */
  scenarios?: RbacScenario[];
  render: (permission: boolean) => ReactNode;
  /** Given the rendered result and which scenario produced it, assert the expected behavior. */
  assert: (utils: ReturnType<typeof render>, scenario: RbacScenario, permission: boolean) => void;
}

const defaultScenarios: RbacScenario[] = [
  { name: "none", access: testAccess.none, user: undefined },
  { name: "anonymous", access: testAccess.anonymous, user: undefined },
  { name: "denied", access: testAccess.denied, user: testUsers.denied },
  { name: "allowed", access: testAccess.allowed, user: testUsers.allowed },
  { name: "scoped", access: testAccess.scoped, user: testUsers.scoped },
];

/**
 * Mounted once per scenario inside `renderWithVexProviders`. Reads the real
 * `usePermission` hook against `testCollection`, reports the resolved boolean
 * back to the caller via `onPermission` (React render is synchronous under
 * RTL, so the value is available immediately after `render()` returns), then
 * delegates to the suite caller's own `render`.
 *
 * `as never` on the `usePermission` props mirrors `usePermission.test.tsx` —
 * React tests run against the unaugmented `GeneratedVexTypes` registry, so
 * `resource`/`action` can't narrow against the wide default `TSubjects`.
 */
function RbacHarness(props: { render: (permission: boolean) => ReactNode; onPermission: (permission: boolean) => void }) {
  const permission = usePermission({ resource: testCollection.slug, action: "read" } as never);
  props.onPermission(permission);
  return createElement(Fragment, null, props.render(permission));
}

/** Call at module top level inside a *.test.ts file — it calls describe/it itself. */
export function runRbacStateSuite(options: RbacStateOptions): void {
  const scenarios = options.scenarios ?? defaultScenarios;

  describe("RBAC state", () => {
    for (const scenario of scenarios) {
      it(`resolves the "${scenario.name}" scenario`, () => {
        let permission = false;
        const utils = renderWithVexProviders(
          createElement(RbacHarness, {
            render: options.render,
            onPermission: (value) => {
              permission = value;
            },
          }),
          { access: scenario.access, auth: { user: (scenario.user ?? null) as Record<string, unknown> | null } },
        );
        options.assert(utils, scenario, permission);
      });
    }
  });
}
```

#### packages/react/src/testing/rbacState.test.ts

New file — complete. Two applications: a synthetic permission-gated component (proves the
factory's scenario wiring resolves the table above), then a real `TextFieldInput` whose `readOnly`
prop is derived from the same `usePermission` boolean — the field-input-layer application this
step promises. `CollectionEditView`/`CollectionListView`/`AdminSidebar` wiring a real admin screen
around RBAC state is explicitly deferred to the future views pass and is not attempted here.

```ts
import { createElement } from "react";
import { useForm } from "@tanstack/react-form";
import { describe, expect } from "vitest";
import { runRbacStateSuite } from "./rbacState";
import { testCollection } from "./harness/accessFixtures";
import { AppForm } from "../components/form/AppForm";
import { TextFieldInput } from "../components/fields/text/Input";
import { textFieldFixture } from "../components/fields/text/testFixture";

const expectedPermission: Record<string, boolean> = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: true,
  scoped: false,
};

function PermissionGate(props: { permission: boolean }) {
  return createElement("div", { "data-testid": "gate" }, props.permission ? "granted" : "restricted");
}

describe("runRbacStateSuite — synthetic permission-gated component", () => {
  runRbacStateSuite({
    render: (permission) => createElement(PermissionGate, { permission }),
    assert: (utils, scenario, permission) => {
      expect(permission).toBe(expectedPermission[scenario.name]);
      expect(utils.getByTestId("gate").textContent).toBe(permission ? "granted" : "restricted");
    },
  });
});

/** Mounts `TextFieldInput` behind a real `useForm`/`AppForm` pair, same mounting mechanism as `runFieldInputContractSuite`. */
function TextFieldHarness(props: { readOnly: boolean }) {
  const form = useForm({ defaultValues: { title: textFieldFixture.valid } });
  return createElement(
    AppForm,
    { form },
    createElement(TextFieldInput, {
      name: "title",
      fieldDef: textFieldFixture.fieldDef,
      collection: testCollection,
      readOnly: props.readOnly,
    }),
  );
}

describe("runRbacStateSuite — TextFieldInput readOnly derived from usePermission", () => {
  runRbacStateSuite({
    render: (permission) => createElement(TextFieldHarness, { readOnly: !permission }),
    assert: (utils, scenario, permission) => {
      expect(!permission).toBe(!expectedPermission[scenario.name]);
      const input = utils.getByRole("textbox") as HTMLInputElement;
      expect(input.disabled).toBe(!permission);
    },
  });
});
```

Verify: `node scripts/record-test-findings.mjs packages/react/src/testing/rbacState.test.ts`


### Step 14 — Public aggregator + `./testing` barrel **[agent]**

Why: Everything built in steps 2–13 is internal until this step wires it into the one thing a
consumer actually imports — the low-ceremony entry point the whole spec exists to deliver.

- [ ] `packages/react/src/testing/index.ts` — replaces the step-1 placeholder: exports `runVexReactSuite({ includeCore?, custom?, access? })` (loops `fieldFixtures` unless `includeCore: false`, runs `custom` entries through the same `runFieldInputContractSuite`), `runFieldInputContractSuite`, `runNestedFieldContainerSuite`, `runRbacStateSuite`, `fieldFixtures`, `FieldFixture` type, `installDomPolyfills`, `expectNoA11yViolations`, `renderWithVexProviders`

#### packages/react/src/testing/index.ts

**1 edit — replaces the entire placeholder body.** Step 1's `export {}` is removed in full;
nothing else in the file is kept. Replacement:

```ts
import type { ComponentType } from "react";
import type { AdminFieldType, VexAccessConfig } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import { fieldToInputComponent } from "../components/fields";
import { fieldFixtures } from "./fixtures";
import type { FieldFixture } from "./fixtures/types";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { runNestedFieldContainerSuite } from "./nestedFieldContainer";
import { renderWithVexProviders } from "./harness/accessFixtures";

/**
 * The three field types that nest arbitrary child field types instead of
 * holding a primitive value — the only entries in `fieldFixtures` that also
 * need `runNestedFieldContainerSuite`, not just `runFieldInputContractSuite`.
 */
const CONTAINER_FIELD_TYPES: ReadonlySet<AdminFieldType> = new Set(["array", "group", "blocks"]);

function isContainerFieldType(fieldType: AdminFieldType): fieldType is "array" | "group" | "blocks" {
  return CONTAINER_FIELD_TYPES.has(fieldType);
}

/**
 * A representative subset of `fieldFixtures`' keys — one from each category
 * (simple, choice, temporal, network, nested-of-nested) — used as every
 * container's `childFieldTypes` here. Mirrors the exact subset convention the
 * container fields' own `Input.test.tsx` files use (step 12): re-running all
 * 12 registered types as a nested child on every container would duplicate
 * coverage `runFieldInputContractSuite` already gives each type standalone.
 */
const CONTAINER_CHILD_FIELD_TYPES: AdminFieldType[] = ["text", "select", "date", "upload", "array"];

/**
 * Runs the full `@vexcms/react` test kit — the low-ceremony entry point the
 * `./testing` subpath exists to deliver. Call at module top level inside a
 * `*.test.ts(x)` file; like every other factory in this kit it calls
 * `describe`/`it` itself.
 *
 * @param options.includeCore - When not `false` (the default), runs
 *   `runFieldInputContractSuite` for every entry in `fieldFixtures` against
 *   its registered `fieldToInputComponent`, plus `runNestedFieldContainerSuite`
 *   for the three container types (`array`, `group`, `blocks`) over
 *   `CONTAINER_CHILD_FIELD_TYPES`.
 * @param options.custom - Project-authored fixtures paired with their own
 *   `Component`. Unlike `fieldFixtures`' entries these are never looked up via
 *   `fieldToInputComponent` — a custom field type is never registered in
 *   core's registry — so each entry's own `Component` is used directly. Each
 *   runs through the same `runFieldInputContractSuite`.
 * @param options.access - A real `VexAccessConfig` (typically a project's own
 *   `defineAccess()` result). `CollectionConfig` carries no `access` field of
 *   its own — RBAC is a separate, global matrix keyed by resource slug — so
 *   this cannot be threaded into the field-input loop above; instead it is
 *   proven directly against the real `VexAccessProvider` via
 *   `renderWithVexProviders`, giving a project a falsifiable check that its
 *   own access config resolves outside a hand-typed stub.
 */
export function runVexReactSuite(options?: {
  includeCore?: boolean;
  custom?: Array<FieldFixture & { Component: ComponentType<any> }>;
  access?: VexAccessConfig;
}): void {
  const { includeCore = true, custom = [], access } = options ?? {};

  if (access) {
    describe("runVexReactSuite — access config", () => {
      it("resolves the provided VexAccessConfig inside the real VexAccessProvider", () => {
        const { container, unmount } = renderWithVexProviders(null, { access });
        expect(container).toBeTruthy();
        unmount();
      });
    });
  }

  if (includeCore) {
    for (const fieldType of Object.keys(fieldFixtures) as AdminFieldType[]) {
      const fixture = fieldFixtures[fieldType];
      if (!fixture) continue;
      const Component = fieldToInputComponent(fieldType);
      if (!Component) continue;

      runFieldInputContractSuite({ fixture, Component });

      if (isContainerFieldType(fieldType)) {
        runNestedFieldContainerSuite({
          container: fieldType,
          Component,
          childFieldTypes: CONTAINER_CHILD_FIELD_TYPES,
        });
      }
    }
  }

  for (const { Component, ...fixture } of custom) {
    runFieldInputContractSuite({ fixture, Component });
  }
}

export { runFieldInputContractSuite } from "./fieldInputContract";
export { runNestedFieldContainerSuite } from "./nestedFieldContainer";
export { runRbacStateSuite } from "./rbacState";
export { fieldFixtures } from "./fixtures";
export type { FieldFixture } from "./fixtures/types";
export { installDomPolyfills } from "./setup";
export { expectNoA11yViolations } from "./a11y";
export { renderWithVexProviders, testCollection, testAccess, testUsers } from "./harness/accessFixtures";
```

Verify: `pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react typecheck`


### Step 15 — `apps/test` dogfood wiring **[agent]**

Why: The only falsifiable proof that "usable within the user's project" is true — a real consumer, outside `packages/react`'s own vitest config, importing the published `@vexcms/react/testing` subpath and running the full suite against its own `VexConfig`/`defineAccess`.

- [ ] `apps/test/package.json` — `test`/`coverage` scripts, `vitest`/`jsdom`/`@testing-library/react`/`@testing-library/user-event`/`@testing-library/jest-dom`/`vitest-axe`/`@vexcms/react` (already present) as devDependencies (`catalog:`)
- [ ] `apps/test/vitest.config.ts` — jsdom environment, setup that installs the shared DOM polyfills
- [ ] `apps/test/src/vexcms/admin.test.ts` — imports `runVexReactSuite` and calls it against the app's real `access`, plus one `custom` entry proving a project-authored fixture runs through the same factory

Three things grounded against the real, current repo state before writing this section (not the frozen contract's abstractions):

1. **`access` config exists and is safe to import into a jsdom test.** `apps/test/src/auth/access.ts` calls the real `defineAccess` against this app's actual resources (`footers`, `headers`, `images`, `pages`, `themes`, `articles`, `caseStudies`, `changelog`, `comments`, `nav`, `siteSettings`). Its whole import graph (`~/db/constants`, `~/vexcms/collections`, `~/vexcms/globals`, `./permissions`) is plain config — no `"server only"` directive anywhere in it. The only server-only file in `apps/test/src/vexcms/` is `api.ts` (which wraps `vexServerApi` and is explicitly marked `"server only"`) — that one is correctly out of reach, `access.ts` is not. `db/constants/index.ts`'s `import { type Doc, type Id } from "@convex/_generated/dataModel"` is fully `type`-only (every specifier carries the `type` modifier), so esbuild/vitest elides the whole import at transform time — no live dependency on Convex codegen having run.
2. **`createFieldInput`/`AppFormContext`/`FormLabel`/`FormError` are not part of `@vexcms/react`'s public surface.** They're re-exported from the internal `packages/react/src/components/form/index.ts` barrel, but `packages/react/src/index.ts` (the `"."` entry point) never re-exports that barrel, and this spec's `exports` map only defines `"."`, `"./styles"`, `"./testing"` — no `"./components/form"` subpath, so Node's `exports` field blocks a deep import even if one were attempted. `runFieldInputContractSuite`'s mount (`packages/react/src/testing/fieldInputContract.ts`, built in Step 5) renders `Component` inside a real `<AppForm>` *without* passing an explicit `field` prop, so a `Component` that reads its live value/validation state has to read `AppFormContext` — which only `createFieldInput`-built components can currently do. Making that machinery public is a real, separate capability ("can a project register a wholly custom field-rendering component") that touches `packages/react/src/index.ts` and `components/form/**`, neither of which is in this spec's `touches` list — so it is out of scope here, not silently worked around. The `custom` entry below instead uses the real, already-public `TextFieldInput` (the exact component every core `text` field renders through) paired with a fresh, app-authored `FieldFixture` that core's own `fieldFixtures` registry does not contain. That still proves the thing this step exists to prove: `runVexReactSuite`'s `custom` array drives an app-supplied fixture through the identical `runFieldInputContractSuite` machinery — label association, `readOnly`, `FormError` timing, controlled round-trip, `expectNoA11yViolations` — as every core field type, from outside the package boundary.
3. **`runVexReactSuite`'s `access` option is a standalone smoke check, not a field-rendering context.** Confirmed directly against the Step 14 implementation: `CollectionConfig` has no `access` field (RBAC is a separate, resource-slug-keyed `VexAccessConfig`, never embedded per-collection) and neither `FieldInputContractOptions` nor `NestedFieldContainerOptions` has an access/collection-context slot. `runVexReactSuite`, when given `access`, runs one extra `describe("runVexReactSuite — access config")` assertion via `renderWithVexProviders(null, { access })` + `unmount()`, proving the app's real `VexAccessConfig` resolves inside the real `VexAccessProvider` — it does not change how the core/custom field loop renders. The call below passes this app's real `access` for exactly that check.

#### apps/test/package.json

5 edits. Everything not shown is unchanged.

**1 — `scripts`: test/coverage.** The `"typecheck"` line gains a trailing comma; insert before the existing `"secret:create"` line, matching `packages/react/package.json`'s `vitest run` / `vitest run --coverage` pattern:

```json
"typecheck": "tsc --noEmit",
"test": "vitest run",
"coverage": "vitest run --coverage",
```

**2 — `devDependencies`: testing-library entries.** Between the existing `"@tailwindcss/postcss": "catalog:",` and `"@types/node": "catalog:",` lines:

```json
"@testing-library/jest-dom": "catalog:",
"@testing-library/react": "catalog:",
"@testing-library/user-event": "catalog:",
```

**3 — `devDependencies`: coverage provider.** Between the existing `"@vexcms/cli": "workspace:*",` and `"babel-plugin-react-compiler": "catalog:",` lines. `coverage.enabled: true` in `vitest.config.ts` below needs a provider installed or the new `coverage` script throws immediately — `packages/react/package.json` pairs the same config with the same package:

```json
"@vitest/coverage-v8": "catalog:",
```

**4 — `devDependencies`: jsdom.** Between the existing `"eslint-plugin-react-hooks": "catalog:",` and `"prettier": "catalog:",` lines:

```json
"jsdom": "catalog:",
```

**5 — `devDependencies`: vitest + vitest-axe.** The `"typescript-eslint": "catalog:"` line (currently last) gains a trailing comma and is followed by two new last entries:

```json
"typescript-eslint": "catalog:",
"vitest": "catalog:",
"vitest-axe": "catalog:"
```

`@vexcms/react` already carries `"workspace:*"` in `dependencies` (line 27) — no change needed there; it is what resolves `@vexcms/react/testing` through the real `pnpm` symlink into `node_modules`, exercising the package's actual built `exports` map instead of a source-relative import.

#### apps/test/vitest.config.ts

New file. Same shape as `packages/react/vitest.config.ts` (`globals`, `environment: "jsdom"`, `include`, `passWithNoTests`, `coverage.enabled`), plus the two things this app needs that the package doesn't: a `~` alias (vitest/Vite does not read `tsconfig.json#compilerOptions.paths` on its own — `apps/test/tsconfig.json` maps `"~/*": ["./src/*"]`, and `packages/better-auth/vitest.config.ts` already establishes the `resolve.alias` precedent for this exact problem), and `setupFiles` for the shared DOM polyfills.

`setupFiles` points at the `@vexcms/react/testing` barrel itself, not a `"./testing/setup"` subpath — Step 1 only added a single `"./testing"` entry to `packages/react/package.json#exports`, and `testing/setup.ts` runs `installDomPolyfills()` as an import-time side effect (Step 2), so importing the barrel is sufficient: `testing/index.ts`'s `export { installDomPolyfills } from "./setup"` re-export statement evaluates `./setup` the same way a normal import would, running that side effect once per test file.

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    // testing/setup.ts installs ResizeObserver/scrollIntoView polyfills as an
    // import-time side effect — no "./testing/setup" subpath exists, so the
    // barrel itself is the setup file.
    setupFiles: ["@vexcms/react/testing"],
    coverage: {
      enabled: true,
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

#### apps/test/src/vexcms/admin.test.ts

New file. `apps/test/src/auth/` is not a valid home for this file — `naming-conventions.md`'s `auth-file-roles` rule fixes that directory's filenames to a closed role list (`access`, `client`, `hasPermission`, `options`, `permissions`, `plugins`, `server`, `serverUtils`, `types`, each optionally `.typecheck.ts`) with no `.test.ts` variant, so `access.test.ts` there would violate it. `apps/test/src/vexcms/` has no such rule for its top-level files (only `vexcms/collections/**` and `vexcms/blocks/**` are pattern-scoped) — the same tier `api.ts` already lives at, ungoverned and appropriate for a file that isn't a collection/block/global definition itself.

```ts
import { text, TextFieldInput, type TextField } from "@vexcms/react";
import { runVexReactSuite, type FieldFixture } from "@vexcms/react/testing";
import { access } from "~/auth/access";

/**
 * This app's own `text` field configuration — not one of the fixtures core
 * registers in `fieldFixtures`. Paired with the real, publicly exported
 * `TextFieldInput` (the exact component every core `text` field renders
 * through) to prove `runVexReactSuite`'s `custom` array drives a
 * project-authored fixture through the identical `runFieldInputContractSuite`
 * machinery every core field type runs through — no separate code path for
 * app-supplied fields.
 */
const pageSlugFixture: FieldFixture<TextField, string> = {
  fieldType: "text",
  fieldDef: text({ label: "Page Slug", required: true }),
  valid: "about-us",
  invalid: undefined,
  empty: undefined,
};

runVexReactSuite({
  // Real VexAccessConfig this app ships — resolves through the real
  // VexAccessProvider, not a hand-typed stand-in.
  access,
  custom: [{ ...pageSlugFixture, Component: TextFieldInput }],
});
```

`includeCore` defaults to `true`, so this single call also runs every core field type's fixture (`text`, `number`, `checkbox`, `url`, `color`, `select`, `date`, `upload`, `relationship`, `array`, `group`, `blocks`) through `runFieldInputContractSuite` using `@vexcms/react`'s real, built `dist` output — the same artifact a published consumer would install, not a source-relative import.

This step's Verify uses the findings recorder, not `pnpm --filter test test`: this single call
runs every core field type's full contract suite plus the nested-container suites against the
real built `dist` output, so it is the run most likely to surface a large batch of red
assertions at once. Its pass condition is that the file collected and ran from outside the
package boundary — the assertions it fails are the point, and land in `findings.md`.

Verify: `node scripts/record-test-findings.mjs apps/test/src/vexcms/admin.test.ts`


### Step 16 — Standards doc + naming/hygiene **[agent]**

Why: Per `AGENTS.md`'s knowledge-routing rules, a new testing subsystem needs a standards entry
with `applies_to` globs so `harness context` surfaces it. Two naming rules also need updating:
`react-field-module`'s closed allow-list must admit `testFixture.ts` (or every field folder's
new fixture file is a naming violation), and the new `packages/react/src/testing/` directory
needs a rule of its own since no existing rule scope covers it.

#### .agent/docs/standards/testing/react-test-factories.md

New file.

```markdown
---
applies_to: ["packages/react/src/testing/**", "packages/react/src/components/fields/*/testFixture.ts", "packages/react/src/components/fields/**/Input.test.tsx"]
---
# React Test Factories

- `@vexcms/react/testing` ships plain exported functions whose bodies call `describe`/`it`/
  `expect` themselves (a "shared examples" pattern) — never raw `.test.*` files. A consumer
  writes one real test file and calls `runVexReactSuite(...)` (or a narrower factory) from it.
  `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`,
  `vitest-axe`, `convex-test`, `react`, `react-dom` are **peerDependencies only** on this
  subpath — never bundled, never a plain `dependency` — so the consumer's own copies resolve
  (P-012–P-016; `AP-016` is the dual-module-instance failure this avoids).
- **A field type owns everything about itself, in its own folder.**
  `components/fields/<type>/testFixture.ts` exports that type's `FieldFixture` (and any
  field-specific test helper, e.g. upload's `makeFile()`) beside its own `Input.tsx`/`Cell.tsx`/
  `columnDef.tsx`. Adding a field type means adding files in ONE folder; every other file that
  needs its data imports from there. The only cross-folder touch is one import line + one
  registry entry in `testing/fixtures/index.ts` — never a second copy of the field's own data.
  Fixtures are hand-authored, not generated from Zod schemas: construct inline, same philosophy
  as `docs/standards/testing/field-type-testing.md`'s core fixtures.
- `testing/fixtures/types.ts` owns the shared `FieldFixture` interface; `testing/fixtures/index.ts`
  is a pure aggregator (imports each field folder's `testFixture.ts`, exposes `fieldFixtures`)
  and carries no fixture data of its own. `testing/fixtures/index.test.tsx` asserts its keys
  match `ADMIN_FIELDS` — that parity test is what makes a forgotten registry entry a loud
  failure instead of silently-missing coverage.
- `testing/fieldInputContract.ts`'s `runFieldInputContractSuite` asserts the behavior every
  field input owes regardless of type (label association, `readOnly`, error timing vs
  `submissionAttempts`, value round-trip, zero a11y violations) and takes an `extra` callback
  for the type-specific remainder — that callback lives in the field's own `Input.test.tsx`,
  never in the factory. A field type earns a *new* top-level factory only when its contract
  genuinely differs in kind (async/network-backed, nested children), not merely in value shape.
- `testing/nestedFieldContainer.ts`'s `runNestedFieldContainerSuite` is how `array`/`group`/
  `blocks` get tested against arbitrary child field types — it recurses into
  `runFieldInputContractSuite` per child, pulling from the same `fieldFixtures` registry.
  Never hand-write a child-type-specific assertion inside a container test; add the child's
  `testFixture.ts` and let the registry carry it.
- `testing/rbacState.ts`'s `runRbacStateSuite` renders against the SAME
  `VexAccessProvider`/`VexAuthProvider` pair the app uses and the real `defineAccess`/
  `hasPermission` resolution from core — never a mocked `usePermission` return value. This
  mirrors `hooks/usePermission.test.tsx`'s existing philosophy, generalized into a factory.
- `testing/convex/` is cross-cutting infrastructure, not per-field data — it stays central, and
  ships its OWN minimal Convex schema (never import `packages/core/src/api/test/convex/`, which
  is workspace-private and excluded from core's published build). `createFakeConvexClient`
  adapts a `convex-test` instance to the `{ query(funcName, args) }` shape
  `@convex-dev/react-query`'s `ConvexQueryClient` calls — real query execution, no hand-typed
  response fixtures. A field type that needs it imports it from its own `testFixture.ts`.
- `vitest-axe` runs against every state a factory renders; jsdom-incompatible rules
  (`color-contrast`, `target-size`, `region`) are disabled by default in `testing/a11y.ts` and
  documented there — never silently widen that disabled-rules list without a comment stating
  which real limitation (not a real defect) it's working around.
```

#### .agent/docs/standards/naming-conventions.md

2 edits to the `rules:` YAML block. Everything else in the file is unchanged.

**1 — `react-field-module`: admit `testFixture`.** Replace that rule's `pattern`, `description`,
and `examples` (the `id` and `scope` lines are unchanged) so each field folder may also carry its
own fixture file:

```yaml
    pattern: '^(Input|Cell|EmptyInput|FilledInput|columnDef|preview|index|types|utils|constants|testFixture)\.(tsx|ts)$'
    description: Each react field dir mirrors the core field name and contains Input.tsx, Cell.tsx, columnDef.tsx (+ index.ts barrel), plus testFixture.ts exporting that field type's FieldFixture and any field-specific test helper. A field type owns everything about itself in one folder; testing/fixtures/index.ts only aggregates.
    examples: ["text/Cell.tsx", "upload/FilledInput.tsx", "blocks/columnDef.tsx", "text/testFixture.ts"]
```

**2 — new rule for the testing kit.** Add alongside `non-component-camel`, before the closing
` ``` ` fence. Note its examples deliberately do NOT include a per-type fixture file — that role
belongs to `testFixture.ts` inside each field's own folder, governed by `react-field-module`
above:

```yaml
  - id: react-testing-kit-camel
    pattern: '^[a-z][A-Za-z0-9]*\.(ts|tsx)$|^index\.tsx?$'
    scope: ["packages/react/src/testing/**"]
    description: The exported testing kit (factories, shared harness, the fixture registry/type) is camelCase — it ships as plain functions, not components, even where a file contains JSX. Per-field-type fixture DATA does not live here; it lives in each field's own components/fields/<type>/testFixture.ts.
    examples: ["fieldInputContract.ts", "nestedFieldContainer.ts", "harness/accessFixtures.ts", "fixtures/index.ts"]
    counter_examples: ["FieldInputContract.ts", "fixtures/text.ts (per-type data belongs in the field's own folder)"]
```

Verify: `harness doctor`


## Verification

Run, in order, after every step above lands:

```
pnpm install
pnpm --filter @vexcms/react build
pnpm --filter @vexcms/react typecheck
node scripts/record-test-findings.mjs "packages/react/src/**/*.test.ts?(x)"
pnpm --filter test test
harness doctor
```

Pass conditions — read carefully, they are not "all tests green":

- `build` and `typecheck` must be clean. No exceptions: a type error is this spec's own defect.
- `record-test-findings.mjs` must exit 0, which means **every test file collected and ran**.
  Failing assertions do not fail this command; they are appended to `findings.md`. A non-zero
  exit means a file could not be transformed/imported, a factory threw during collection, or a
  file yielded zero tests — all defects in this spec's own work, fixable within `/implement`'s
  normal 2-attempt protocol.
- `harness doctor` must report no new naming violations and no stale standards docs.

Then read `.agent/docs/specs/2026-09-04-react-test-suite/findings.md` end to end. It is the
deliverable: one row per red assertion, each naming the file, the full test name, and the
failure. Every row is a candidate UI defect in `@vexcms/react` for the follow-up fix pass.
Triage it before starting that pass — a row whose test asserted something the field genuinely
should not do is a test bug and gets corrected here; every other row is a real finding.

Coverage is reported (`coverage.enabled: true`) but not gated this pass. Read the per-file
numbers for `src/components/fields/**` as a self-check on Design Decision 4: a field input
sitting well below its siblings means its `extra` block did not actually exercise the code, and
that field's step should be revisited before the spec is called done.
