---
status: draft
spec_id: 2026-09-08-react-coverage-expansion
tier: low-care-override
touches:
  - "packages/react/vitest.config.ts"
  - "packages/react/src/testing/**"
  - "packages/react/src/hooks/*.test.tsx"
  - "packages/react/src/components/fields/*/Cell.test.tsx"
  - "packages/react/src/components/fields/*/columnDef.test.ts"
  - "packages/react/src/components/views/*.test.tsx"
  - "packages/react/src/components/*.test.tsx"
  - "packages/react/src/components/ui/data-table/*.test.tsx"
  - "packages/react/src/components/modals/*.test.tsx"
  - "packages/react/src/components/media/*.test.tsx"
  - "apps/test/vitest.config.ts"
  - "apps/test/src/vexcms/admin.test.ts"
  - "apps/www/vitest.config.ts"
  - "apps/www/src/vexcms/admin.test.ts"
  - ".agent/docs/standards/testing/react-test-factories.md"
  - ".agent/docs/standards/testing/coverage-policy.md"
  - "scripts/record-test-findings.mjs"
---

# React Coverage Expansion — 50% to 80% on First-Party Code

Raise `@vexcms/react` statement coverage from **50.13%** to **80%** by testing the eight
categories the `2026-09-04-react-test-suite` spec never targeted, and expose every new suite
through the published `./testing` barrel so a consumer can run them against its own project.

The 09-04 spec built and fixed the field-input edit-form contract — 12 components,
`testing/fieldInputContract.ts` at 98.7% — and deliberately scoped out everything else. This
spec covers the remainder: list-view cells and column definitions, the eight views, the admin
shell, the data table, modals, media, and the six untested hooks.

## Tier

**Low-care override**, at the developer's explicit request. Every step is `[agent]` and every
code block is complete runnable code, not a guided stub. The project manifest default is
high-care/guided-stubs; this spec overrides it and the override does **not** carry to the next
spec.

## Coverage target — measured, not assumed

| | Statements |
|---|---|
| Total, pre-exclusion | 2679 |
| Vendored, excluded by Step 1 | 790 (21 shadcn/Base UI registry primitives = 205, `ui/datetime/**` = 585) |
| **Denominator** | **1889** |
| Covered today | 1101 = **58.28%** |
| Uncovered, available | 788 |
| **80% gate needs** | **+411**, i.e. 52% of the remaining uncovered first-party code |

`button.tsx` and `input.tsx` stay **in** the denominator despite being registry-sourced: both
carry post-vendor feature commits (`isPending`/icon slots), and the coverage policy Step 1
writes says any hand-modification returns a file to the denominator. They are 5 statements,
both already 100% covered, so honoring the rule costs nothing.

## Test Authoring Protocol — binding on every step

**Every assertion encodes INTENDED behavior and the edge cases a real user hits. Never the
behavior that happens to be implemented.** A test that pins a bug passes forever while the bug
ships. That is the single failure mode this spec exists to prevent, and it overrides any
convenience.

### Deriving intent

In this order, and stop at the first that answers:

1. **The component's or hook's own JSDoc.** If the doc says "null values show an em-dash", that
   is the contract — assert it even when the body has no such guard. `text/Cell.tsx` is the
   worked example: its JSDoc promises an em-dash placeholder and an 80-char cutoff; the body has
   no null guard and cuts at 77.
2. **The type contract in `@vexcms/core`.** `useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>`
   accepts any field key, so every cell type must handle being the title column — regardless of
   whether its component reads `isTitleField` today.
3. **The named function's or prop's plain meaning.** `goToPage(page)` navigates to `page`.
   `loadMore()` reveals the next page. `accept` filters by mime type. A parameter that is
   accepted and ignored is a defect, not a design.
4. **The sibling implementation.** Where three views gate Save on `canEdit` and the fourth does
   not, the three define the intent.

If none of the four answers, the behavior is genuinely unspecified: **ask in the spec's open
questions rather than inventing a contract or pinning the current output.**

### Read the code before writing anything

Per surface, read in this order and take notes as you go. Every conditional, early return,
prop forwarded to a child, and `.map()` over config is a codepath that owes a test. This
mirrors the `2026-09-04-react-test-suite` spec's protocol of the same name — the practice is
established, not new.

| Surface | Read | What it tells you |
|---|---|---|
| **Cells / columnDefs** | `fields/<type>/Cell.tsx` **JSDoc first**, then the body | Stated intent — often a contract the body doesn't honor. `text/Cell.tsx` promises an em-dash and 80 chars; the body has neither |
| | `packages/core/src/fields/<type>/types.ts` | Every prop the cell reads is a codepath. `hasMany`, `labels`, `format` each multiply the matrix |
| | `fields/<type>/columnDef.tsx` | `meta.alignment`, header derivation, and which cell renderer it binds |
| | `CellComponentProps` in core | `value` is documented nullable — so null is a required case, not an edge |
| **Views / shell** | the view's `usePermission` call sites | Each is an RBAC branch owing all five scenarios |
| | `hasPermission.ts` | The real resolution, so expectation matrices are derived not guessed |
| | `useVexConfig` / `VexConfigContext` | What config the view reads; a missing collection or global is an edge case |
| | sibling views | Where three gate a control and one doesn't, the three define intent |
| **Hooks** | the hook's JSDoc, then every `useState`/`useMemo`/`useCallback` | Each state transition and each guard is a test |
| | the props/return types in core | Every field on the return type is observable surface |
| | core's pagination / selection contracts | The intended semantics of `cursor`, `isDone`, `mode` |
| **Modals / media** | the component body's early returns and `accept`/`multiple` config | Absent config is usually the defect, not the contract |
| | the installed library's real behavior — run it | Base UI portal targets, react-dropzone batch rejection. Never assume; several assertions were corrected this way during authoring |

Do not re-test what a shared factory already covers. `runFieldInputContractSuite` owns label
association, description, placeholder, both read-only sources, required-ness, value states,
error timing, change/blur wiring, `defaultValue` seeding and a11y for every field type.
`runFieldCellContractSuite` owns the null placeholder, the `isTitleField` link, truncation and
a11y. A per-type `extra` adds only what is specific to that type.

### Edge cases every suite owes

Not optional, and not "extra" — these are where users actually land:

- **Absent value:** `null`, `undefined`, empty string, empty array, missing key.
- **Boundary:** at, one below, and one above every documented limit (length cutoffs, min/max,
  first and last page, single-item vs many for pluralized labels).
- **Out of range / nonsense input:** page 0, page beyond the last, a negative count, a slug that
  does not exist.
- **Realistic hostile content:** strings far past the truncation cutoff, unicode and emoji,
  values containing markup.
- **Repeat and rapid interaction:** clicking the same control twice, toggling back to the
  original state, submitting twice.
- **Permission transitions:** a control's state under each of the five RBAC scenarios, not just
  the allowed one.
- **Async states:** loading, empty result, error, and success — for anything reading data.

### When implementation diverges from intent

1. Assert the **intended** value. Let the test fail.
2. Record it through `scripts/record-test-findings.mjs` into this spec's `findings.md`.
3. Add it to `BUGS-REPORT.md` (Step 9) with root cause, evidence and a suggested fix.
4. **Do not** edit the component to make it pass — fixes are the follow-up spec's job.
5. **Do not** soften the assertion, skip the test, or wrap it in `it.skip`/`it.todo`.

**PROHIBITED**, and a defect in this spec's own work if found in review:

```ts
// ❌ pins a bug forever — the parameter is ignored, which is the defect
it("resets to page 1", () => { act(() => r.current.goToPage(5)); expect(r.current.page).toBe(1); });

// ❌ asserts the wrong output because that is what the code emits
expect(collection.labels.singular).toBe("Posts"); // defineCollection doesn't singularize

// ❌ documents an absence instead of asserting the contract
it("applies no mime filtering", () => { expect(dropzone.accept).toBeUndefined(); });
```

```ts
// ✅ asserts intent; fails today; recorded as a finding
it("navigates to the requested page", () => {
  act(() => r.current.goToPage(3));
  expect(r.current.page).toBe(3); // FAILS: goToPage ignores its argument — see BUGS-REPORT HOOK-1
});
```

Every intentionally-failing test carries a one-line comment naming its `BUGS-REPORT` ID, so a
reader can tell a discovered defect from a broken test at a glance.

### Consequence for the gate

The red set is therefore **larger than Step 5's 30 Cell failures** — Steps 2, 3, 4, 6 and 7 each
surface their own. This is why Step 8 gates on "the failure set matches the recorded baseline"
rather than a count: the count is an output of implementation, not an input.

## What ships red, and why that is the deliverable

Step 5's shared Cell contract asserts four behaviors every cell owes regardless of field type.
Run against the real components it produces **30 failures across 80 tests** — verified live,
not projected. These are pre-existing product defects the package had no test to catch:

| ID | Defect | Types |
|---|---|---|
| `CELL-3` | Null/undefined value mishandled; `text` and `array` **crash the table render** with an uncaught `TypeError` | 7 of 12 |
| `CELL-1` | `isTitleField` ignored, so the title column is unclickable and the list view offers no route into the document | 10 of 12 |
| `CELL-2` | Unbounded values render with no truncation and no `title` attribute | 6 of 12 |

Per the developer's decision these are **recorded, not fixed** — this is a coverage spec, and
the fixes are a follow-up spec seeded by Step 9's `BUGS-REPORT.md`. Eight further findings
surfaced while writing the suites (four hook quirks, two RBAC asymmetries, a core label bug, a
dropzone gap) are pinned by passing tests and filed as *suspected*, pending an intent ruling.

Consequently **Step 8's gate is a baseline comparison, not "all green"**: the ~918 pre-existing
tests must still pass, and every new-suite failure must appear in the `findings.md` recorded by
`scripts/record-test-findings.mjs`. A failure outside that baseline is a defect in this spec's
own work. Coverage is unaffected by any of it — a failing assertion still renders the
component, so those statements count.

## The rule that makes `sections` real

`runVexReactSuite` gains `sections?: VexSuiteSection[]` so a consumer can run a subset. Any
selectable section **must** be backed by an exported function under
`packages/react/src/testing/`, with the package's own `*.test.tsx` file as a thin caller —
never a raw test file, because internal test files do not ship in `dist/`, and a section backed
only by an internal file is silently a no-op for consumers.

Running these inside the *consumer's* process is what catches the dual-context and
module-resolution failure class that produced 366 red tests in `apps/test` on the last spec,
and that ADR-009 exists to prevent.

| Section | Backing export | Shape |
|---|---|---|
| `fields` | `runFieldInputContractSuite` (exists) | per-type, looped over `fieldFixtures` |
| `cells` | `runFieldCellContractSuite` | per-type, looped |
| `columnDefs` | `runColumnDefSuite` | per-type, looped |
| `views` | `runViewSuite({ only?, access? })` | one call, all 8 views |
| `shell` | `runShellSuite({ only?, access? })` | one call, 3 shell components |
| `dataTable` | `runDataTableSuite({ only? })` | one call, 4 files |
| `modals` | `runModalSuite({ only?, access? })` | one call, 3 modals |
| `media` | `runMediaSuite({ only?, access? })` | one call, 3 files |
| `hooks` | the hook test files from Steps 2-3 | provider-free, called directly |

`only` is a union-typed member array defaulting to all, so a typo is a compile error.
`includeCore: false` remains sugar suppressing the three per-type field sections —
`apps/www` already calls it that way.

## Build order

Policy and tooling first (every later Verify depends on Step 1's `record-test-findings.mjs`
change), then the two provider-free hooks, then the data-backed hook, then views and shell,
then the list view, then modals and media, then the consumer surface, then the gate, then the
defect handoff. Build and test are runnable after every step.

`packages/react/vitest.config.ts` is edited twice by design: Step 1 adds the exclusions and
the `json-summary` reporter, Step 8 adds `coverage.thresholds` **last**. Adding the thresholds
in Step 1 would fail every intermediate step's own Verify, since coverage does not reach 80%
until Step 6 lands.


## Step 1 — Coverage policy: exclusions, thresholds, standards rule

> **This section is longer than `harness implement … next` will print.** The packet
> extractor cuts a section at the first line starting with `## `, and it does not understand
> code fences — this step embeds a markdown deliverable whose own headings trip it
> (`harness/src/commands/implement.ts:150-158`). **Read this step's full section in `spec.md`
> before writing any code.**

**[agent]**
Why: Every later group's Verify measures against this denominator, so it must be defined and
justified first. Excluding vendored code is what makes 80% mean something about our own code
rather than a number dragged by third-party wrappers.

**[agent]**

#### packages/react/vitest.config.ts

Existing file — only the changed lines, as anchored edits.

**1 — import.** Add `coverageConfigDefaults` alongside `defineConfig` (its default `exclude`
array must be spread back in, or setting `coverage.exclude` silently drops vitest's own
defaults — node_modules, `*.test.*`, `*.d.ts`, config files):

```ts
import { coverageConfigDefaults, defineConfig } from "vitest/config";
```

**2 — `coverage` block.** Replace the bare `coverage: { enabled: true }` with the reporter and
exclusion list. `json-summary` writes `coverage/coverage-summary.json`, which later steps and
CI read programmatically (`total.statements.pct`, per-file entries) instead of scraping the
text reporter. Every `ui/*.tsx` entry is a shadcn CLI registry primitive — confirmed against
`packages/react/components.json`'s `registries.@wds` entry
(`https://wds-shadcn-registry.netlify.app/r/{name}.json`) and `git log --follow -p` for each
file, which shows no commit touching its logic since the initial vendor add. None of these 21
files carries an upstream-citing header comment, so the registry declaration plus the commit
history is the provenance evidence, not a comment grep. `ui/datetime/**` cites the URL already
present in that directory's own file headers (`https://github.com/huybuidac/shadcn-datetime-picker`).

`button.tsx` and `input.tsx` are also `@wds`-registry primitives but are deliberately **absent**
from this list: `git log --follow -p` on each shows a post-vendor feature commit
(`isPending`/`iconLeft`/`iconRight` props and a `Loader2` spinner wired to this package's own
`Icon` component) — real local behavior, not a mechanical/formatting touch. Per the exclusion
criterion, that returns both files to the denominator; they're 5 statements combined and
already 100% covered, so keeping them costs nothing and keeps the exclude list honest.

Excluded here: 21 primitive files (205 statements) + `ui/datetime/**` (585 statements) = 790
statements removed from the 2679 pre-exclusion total, leaving the 1889-statement denominator.
`ui/data-table/**`, `ui/dnd/**`, and the hand-written `ThemeProvider.tsx`/`ThemeToggle.tsx`/
`ThemeScript.tsx`/`VexLink.tsx`/`VexImage.tsx`/`multi-select.tsx`/`accordion.tsx` are
deliberately absent too — none of them is a verbatim vendor copy.

```ts
    coverage: {
      enabled: true,
      // `json-summary` feeds the coverage-policy CI gate (reads
      // coverage/coverage-summary.json's `total.statements.pct`); keep
      // alongside the human-readable `text` reporter.
      reporter: ["text", "json-summary"],
      // `exclude` REPLACES vitest's defaults unless they're spread back in
      // (docs.vitest.dev/guide/coverage#coverage-setup) — do not drop this.
      //
      // Per .agent/docs/standards/testing/coverage-policy.md: only files
      // vendored VERBATIM from a named upstream may be listed here. Every
      // entry below cites its upstream. Any local hand-modification to one
      // of these files returns it to the denominator (remove its line).
      // button.tsx and input.tsx are @wds-registry primitives too but are
      // NOT listed — both received local isPending/icon-slot feature
      // commits after vendoring, so they stay in the denominator.
      exclude: [
        ...coverageConfigDefaults.exclude,
        // shadcn CLI registry primitives (components.json → registries.@wds:
        // "https://wds-shadcn-registry.netlify.app/r/{name}.json"), built on
        // @base-ui/react. Untouched since `shadcn add` — verified via
        // `git log --follow -p` per file, no header comment exists for
        // these (unlike datetime/** below).
        "src/components/ui/alert-dialog.tsx", // .../r/alert-dialog.json
        "src/components/ui/badge.tsx", // .../r/badge.json
        "src/components/ui/card.tsx", // .../r/card.json
        "src/components/ui/checkbox.tsx", // .../r/checkbox.json
        "src/components/ui/command.tsx", // .../r/command.json
        "src/components/ui/dialog.tsx", // .../r/dialog.json
        "src/components/ui/dropdown-menu.tsx", // .../r/dropdown-menu.json
        "src/components/ui/input-group.tsx", // .../r/input-group.json
        "src/components/ui/label.tsx", // .../r/label.json
        "src/components/ui/pagination.tsx", // .../r/pagination.json
        "src/components/ui/popover.tsx", // .../r/popover.json
        "src/components/ui/scroll-area.tsx", // .../r/scroll-area.json
        "src/components/ui/select.tsx", // .../r/select.json
        "src/components/ui/separator.tsx", // .../r/separator.json
        "src/components/ui/sheet.tsx", // .../r/sheet.json
        "src/components/ui/sidebar.tsx", // .../r/sidebar.json
        "src/components/ui/skeleton.tsx", // .../r/skeleton.json
        "src/components/ui/table.tsx", // .../r/table.json
        "src/components/ui/tabs.tsx", // .../r/tabs.json
        "src/components/ui/textarea.tsx", // .../r/textarea.json
        "src/components/ui/tooltip.tsx", // .../r/tooltip.json
        // Hand-vendored (not via the shadcn CLI): copied from
        // https://github.com/huybuidac/shadcn-datetime-picker per the
        // header comment in each file under this directory.
        "src/components/ui/datetime/**",
      ],
    },
```

#### .agent/docs/standards/testing/coverage-policy.md

New file — complete content.

```markdown
---
applies_to: ["packages/*/vitest.config.ts"]
---
# Coverage Policy

## The exclusion criterion

`coverage.exclude` in a package's `vitest.config.ts` MAY list a file only when **all three**
hold:

1. **Vendored verbatim.** The file was installed from a named upstream (a shadcn registry
   component, a copy-pasted third-party file, etc.) and its logic is unchanged since install —
   not a fork, not a rewrite, not extended with new props/behavior.
2. **Upstream URL cited.** The `exclude` entry carries a comment with the exact upstream URL
   (a registry endpoint, a GitHub file URL) a reviewer can open to diff against. "It looks like
   shadcn" is not a citation. If the file itself carries no header comment naming its source
   (most shadcn CLI-installed primitives don't), the citation may instead point at the
   project's own registry declaration (e.g. `components.json`'s `registries` map) plus
   `git log --follow -p` confirming no post-install logic commit — that combination is
   accepted evidence of provenance, not just a header grep.
3. **No hand-modification.** The moment anyone edits the file's behavior — adds a prop, changes
   a class, fixes a bug locally instead of upstream — it returns to the coverage denominator on
   that same commit. A vendored file earns untested-by-default status only as long as it stays
   byte-for-byte swappable with its upstream source; once it diverges, its now-local logic is
   this codebase's responsibility to test like anything else. This applies even when the
   diverged file is fully covered already — cheap coverage is not a reason to keep a
   hand-modified file off the denominator.

This is deliberately narrow. It exists to stop `pnpm coverage` from grading this package on
code nobody here wrote or can meaningfully unit-test in isolation (a vendored dropdown's
internal keyboard-nav state machine, a third-party date picker's timezone math) — not to give
any file with an external-sounding origin a free pass.

## Why this exists

`packages/react` ships two kinds of files that pull the statement-coverage percentage down
without anyone here being able to raise it responsibly:

- **shadcn CLI registry primitives** (`src/components/ui/*.tsx`) installed from this repo's
  private registry, declared in `components.json` (`registries.@wds`:
  `https://wds-shadcn-registry.netlify.app/r/{name}.json`) — thin styling wrappers around
  `@base-ui/react` primitives. Testing them re-tests Base UI's own interaction/accessibility
  logic, not anything this package authored.
- **`src/components/ui/datetime/**`**, vendored from
  `https://github.com/huybuidac/shadcn-datetime-picker` (cited in each file's own header
  comment) — a large (585-statement) third-party date/time picker copied in wholesale.

Excluding them is not "coverage theater": it moves the 80% statements gate onto code this team
actually owns and can be asked to test, and it keeps the gate from silently loosening every
time someone vendors another large dependency.

## What is explicitly NOT covered by this exclusion

- `src/components/ui/data-table/**` and `src/components/ui/dnd/**` — in-house code built on top
  of vendored primitives, not vendored themselves.
- `ThemeProvider.tsx`, `ThemeToggle.tsx`, `ThemeScript.tsx`, `VexLink.tsx`, `VexImage.tsx`,
  `multi-select.tsx`, `accordion.tsx` — hand-written from scratch in this repo.
- `button.tsx` and `input.tsx` — both are `@wds`-registry primitives structurally, but each
  received a post-vendor feature commit (`isPending`/icon-slot props, a `Loader2` spinner wired
  to this package's `Icon` component). They stay in the coverage denominator. Any other
  `ui/*.tsx` primitive that receives similar local feature work MUST be removed from
  `coverage.exclude` in the same commit.

## Measured baseline

Before this policy's exclusions, `packages/react` measured **50.13% statements, 2679 total
statements, 917/918 tests passing**. Excluding the 21 verbatim shadcn/Base UI primitive files
(205 statements) and `ui/datetime/**` (585 statements) removes 790 statements nobody here can
meaningfully raise coverage on. The resulting denominator is **1889 statements, 1101 covered —
58.28%**. The package's 80% statements gate is measured against this post-exclusion
denominator; it needs +411 of the 788 statements still uncovered in first-party code, not
+1583 of the unfiltered 2679.

## Adding a new exclusion

1. Confirm the file is untouched since vendoring (`git log --follow -p -- <file>` shows only
   the initial vendor commit, or every subsequent commit is a repo-wide mechanical change —
   formatting, a dependency bump — not new props or logic).
2. Add the file to `coverage.exclude` in the package's `vitest.config.ts`, with a trailing
   comment citing the upstream URL (or the registry-declaration + commit-history evidence
   described above, if the file itself carries no header citation).
3. Update this file's "Measured baseline" section with the new statement counts (`pnpm --filter
   <pkg> exec vitest run --coverage --coverage.reporter=json-summary` then read
   `coverage/coverage-summary.json`'s `total.statements`).

## Removing an exclusion

The moment a listed file is edited for anything beyond a mechanical/formatting change, delete
its line from `coverage.exclude` in the same commit and update the baseline here — regardless
of how well-covered the diverged file already is. Do not wait for a coverage-policy review to
catch it.

## `scripts/record-test-findings.mjs`'s spec default

That script's `FINDINGS_PATH` resolves against `--spec <slug>` / `VEX_FINDINGS_SPEC`,
defaulting to the spec that most recently bumped the default constant
(`DEFAULT_FINDINGS_SPEC` in the script). It refuses to run — non-zero exit, no directory
created — if the resolved spec's directory doesn't already exist under
`.agent/docs/specs/`, so a stale default after a new spec ships fails loudly instead of
silently writing findings into the wrong spec's `findings.md`. When starting a new spec that
uses this script: bump `DEFAULT_FINDINGS_SPEC` to the new slug in the same commit that adds
the new spec's directory, and every bare invocation keeps working; anything targeting a
different spec passes `--spec <slug>` explicitly.
```

#### scripts/record-test-findings.mjs

Existing file — only the changed lines, as anchored edits. This script hardcoded the
`2026-09-04-react-test-suite` spec's `findings.md` path and out-of-scope sentence; every Verify
line in Steps 5, 7 and 8 of THIS spec routes through it, and Step 8's pass condition is a
baseline comparison against this spec's `findings.md`. Left as-is it would silently overwrite
the 09-04 spec's committed, shipped findings file. Parameterized via a `--spec <slug>` flag or
a `VEX_FINDINGS_SPEC` env var, defaulting to this spec's slug so a bare invocation (as already
written into Steps 5/7/8's Verify lines) keeps working unchanged. Output format is untouched —
same header, same `| file | test | failure |` row shape — so Step 8's baseline diff and
Steps 5/7's Verify lines stay byte-compatible.

**1 — doc comment.** Stop naming one spec; document the new flag/env var and default:

```js
#!/usr/bin/env node
/**
 * Runs one or more vitest test files and records the result into the
 * active spec's findings.md, distinguishing the two failure modes the
 * Test Authoring Protocol depends on:
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
 * Findings are written to
 * `.agent/docs/specs/<spec>/findings.md` as a markdown table. Re-running
 * this script for a file replaces that file's previous rows — idempotent.
 * `<spec>` is the spec slug: `--spec <slug>` or the `VEX_FINDINGS_SPEC` env
 * var, defaulting to `2026-09-08-react-coverage-expansion` so a bare
 * invocation still works for this spec's own steps. The resolved spec's
 * directory MUST already exist under `.agent/docs/specs/` — this never
 * creates it, so a stale default after this spec ships fails loudly
 * instead of silently writing into the wrong findings.md.
 *
 * Usage:
 *   node scripts/record-test-findings.mjs [--spec <slug>] <testFile> [testFile...]
 */
```

**2 — spec slug resolution + `FINDINGS_PATH`.** Replace the hardcoded constant with flag/env
resolution, parsed out of `process.argv` before the remaining args become `targets`:

```js
const DEFAULT_FINDINGS_SPEC = "2026-09-08-react-coverage-expansion";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const rawArgs = process.argv.slice(2);
const specFlagIndex = rawArgs.indexOf("--spec");
const FINDINGS_SPEC =
  specFlagIndex === -1
    ? (process.env.VEX_FINDINGS_SPEC ?? DEFAULT_FINDINGS_SPEC)
    : rawArgs[specFlagIndex + 1];
if (specFlagIndex !== -1 && !FINDINGS_SPEC) {
  console.error("usage: node scripts/record-test-findings.mjs [--spec <slug>] <testFile> [testFile...]");
  process.exit(2);
}
const targets =
  specFlagIndex === -1 ? rawArgs : [...rawArgs.slice(0, specFlagIndex), ...rawArgs.slice(specFlagIndex + 2)];
const specDir = path.join(REPO_ROOT, ".agent/docs/specs", FINDINGS_SPEC);
if (!fs.existsSync(specDir)) {
  console.error(
    `spec directory not found: .agent/docs/specs/${FINDINGS_SPEC} — pass --spec <slug> ` +
      "(or set VEX_FINDINGS_SPEC) naming an existing spec; this script never creates the spec directory.",
  );
  process.exit(2);
}
const FINDINGS_PATH = path.join(specDir, "findings.md");
if (targets.length === 0) {
  console.error("usage: node scripts/record-test-findings.mjs [--spec <slug>] <testFile> [testFile...]");
  process.exit(2);
}
```

**3 — out-of-scope sentence in `recordFindings`'s generated preamble.** Derive it from
`FINDINGS_SPEC` instead of the literal string:

```js
          `Fixing these is out of scope for the ${FINDINGS_SPEC} spec.`,
```

#### Post-exclusion baseline (record in the spec's Verification section)

Pre-exclusion: 50.13% statements, 2679 total, 917/918 tests passing. Post-exclusion (21
verbatim `ui/*.tsx` primitives, 205 statements — `button.tsx`/`input.tsx` excluded from the
exclude list because both carry post-vendor feature commits — + `ui/datetime/**`, 585
statements, removed): **1889 statements, 1101 covered, 58.28%.** The 80% gate needs +411 of the
788 statements still uncovered in first-party code.

Verify: pnpm --filter @vexcms/react exec vitest run --coverage 2>&1 | grep -E "^Statements" && test "$(node -e "const s=require('./packages/react/coverage/coverage-summary.json');process.stdout.write(String(s.total.statements.total<2000))")" = true

## Step 2 — Hooks: usePagination, useTableSelection
Why: 92 statements at 0% and the cheapest coverage in the package — both import only React and
core types, so `renderHook` needs no providers at all. Highest value per unit of effort, and
they underpin the data-table work in Step 5.

**[agent]**

`usePagination` and `useTableSelection` are pure state + callbacks with no DOM output, so both
suites are **state-transition testing**: every action is asserted by its effect on `state` (and
`paginationOpts`/`getSelectionCount()`), moving the hook's internal state machine one edge at a
time (`none → page → all/inverse → none` for selection; `page 1 → page 2 → page 1` with cursor
push/pop for pagination). Layered on top is **boundary-value analysis** at the edges of each
transition: page 1 with no previous page, the "no next page yet" start, page 0/negative and
beyond-the-last `goToPage` arguments, a zero/negative/unlisted `setPageSize`, `totalCount: 0`
on a fresh page-1 request, the last selected row being deselected (mode collapsing to `none`),
an empty `selectPage([])`, an already-empty `clearSelection`, and `getSelectionCount()` going
negative in inverse mode when exclusions exceed `totalCount`.

Per this spec's Test Authoring Protocol, every assertion below encodes **intended** behavior,
not whichever output the current implementation happens to produce. Three real defects surfaced
while deriving intent from `usePagination.ts`/`useTableSelection.ts`'s own JSDoc (rule 1),
`usePaginatedQuery.ts`'s real cursor-chaining (rule 4, sibling implementation), and the
function's plain meaning (rule 3):

- **`HOOK-1`** — `goToPage`'s own JSDoc reads "Jump to specific page (1-based)." The body
  validates only `page >= 1` and then unconditionally resets to page 1, discarding the `page`
  argument entirely. `goToPage(3)` does not navigate to page 3. Asserted as intent below; both
  tests fail today and are recorded as `BUGS-REPORT HOOK-1`.
- **`HOOK-2`** — `updateFromResult` receives Convex's `continueCursor` for the page just fetched
  (`@vexcms/core`'s `PaginationResult.continueCursor`: "Cursor to fetch next page") but never
  stores it, deriving only `hasNextPage`. `nextPage` then pushes the *pre-advance* `cursor`
  value onto the stack instead of the cursor the server told it to use next.
  `usePaginatedQuery.ts`'s real `loadMore()` — the sibling hook solving the same cursor-chaining
  problem — does this correctly (`setCursor(result.continueCursor)`), which is the sibling
  evidence for the intended contract here. Asserted as intent below; fails today and is recorded
  as `BUGS-REPORT HOOK-2`.
- **`HOOK-3`** — `toggleRow`'s `onSelectionChange` callback reads `mode` from the outer closure
  captured at the last render, not the mode value being computed in the same update, so the
  callback reports the *pre-toggle* mode. A change callback's plain meaning is to report the
  state after the change it is announcing. Asserted as intent below; fails today and is recorded
  as `BUGS-REPORT HOOK-3`.

A fourth, previously-unrecorded defect surfaced while writing the mandatory "select-all then
deselect-one" edge case: `toggleRow` ignores `mode` entirely when deciding whether to flip to
`"page"` (`else if (mode === "none") setMode("page")`), so calling it while `mode === "all"`
mutates `selectedIds` but leaves `mode` at `"all"` — and `isRowSelected`/`getSelectionCount`
only ever branch on `mode === "all"`, never on `selectedIds`, so the row the user just
"deselected" still reports selected and the count is unaffected. `toggleInverseMode`'s own
JSDoc/behavior ("everything selected except deselected") is the sibling evidence for the
intended contract: deselecting one row out of select-all should exclude just that row. Asserted
as intent below; recorded as `BUGS-REPORT HOOK-5` (pending Step 9 confirming the id).

Neither hook exposes a `pageCount` or `indeterminate` field (`PaginationState`/
`UsePaginationReturn` and `SelectionState`/`UseTableSelectionReturn` have no such members —
Convex cursor pagination has no upfront page count), so `pageCount` coverage is the `totalCount`
passthrough case, and "indeterminate derivation" is tested via a small consumer-side helper
built only from `state.mode`/`state.selectedIds`, exactly as a checkbox component would derive
it.

#### packages/react/src/hooks/usePagination.test.tsx

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePagination } from "./usePagination";

/**
 * `usePagination` is pure state + callbacks with no DOM output, so every
 * assertion here is state-transition testing (each action's effect on
 * `state`/`paginationOpts`) plus boundary-value analysis on the edges of
 * that state machine: page 1 (no previous page), the "no next page yet"
 * start, page 0/negative and beyond-the-last `goToPage` arguments, a
 * zero/negative/unlisted `setPageSize`, and `totalCount: 0` on a fresh
 * page-1 request. `usePagination` does not expose (or compute) a
 * `pageCount` field — `PaginationState` has no such field and neither does
 * `UsePaginationReturn` — because Convex cursor pagination has no upfront
 * total-page count; `totalCount` is a plain passthrough of the
 * caller-supplied prop, which is covered by the "option defaults" and
 * "totalCount: 0" cases below instead.
 *
 * Per this spec's Test Authoring Protocol, assertions encode INTENDED
 * behavior derived from JSDoc, the `@vexcms/core` pagination contract, the
 * sibling `usePaginatedQuery` hook, and each function's plain meaning — not
 * whatever the current implementation happens to do. Two defects fall out
 * of that: `goToPage` ignoring its argument (`BUGS-REPORT HOOK-1`) and
 * `nextPage` not chaining `updateFromResult`'s `continueCursor`
 * (`BUGS-REPORT HOOK-2`). Both are asserted as intent, left failing, and
 * tagged inline — see the spec's Step 9 for the recorded findings.
 */
describe("usePagination", () => {
  it("defaults pageSize to 50, options to [10,25,50,100], and starts on page 1 with no cursor", () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.state).toEqual({
      currentPage: 1,
      pageSize: 50,
      cursorStack: [null],
      cursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      totalCount: undefined,
    });
    expect(result.current.paginationOpts).toEqual({ numItems: 50, cursor: null });
  });

  it("passes through initialPageSize and totalCount unchanged", () => {
    const { result } = renderHook(() => usePagination({ initialPageSize: 25, totalCount: 137 }));

    expect(result.current.state.pageSize).toBe(25);
    expect(result.current.state.totalCount).toBe(137);
    expect(result.current.paginationOpts).toEqual({ numItems: 25, cursor: null });
  });

  it("totalCount: 0 on a fresh page-1 request is a valid, non-error state (empty collection)", () => {
    const { result } = renderHook(() => usePagination({ totalCount: 0 }));

    expect(result.current.state.totalCount).toBe(0);
    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.hasNextPage).toBe(false);
    expect(result.current.paginationOpts).toEqual({ numItems: 50, cursor: null });
  });

  it("previousPage is a no-op on page 1 (hasPreviousPage boundary)", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.cursorStack).toEqual([null]);
  });

  it("nextPage is a no-op before updateFromResult reports a next page", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.hasNextPage).toBe(false);
  });

  it("nextPage advances using the continueCursor from updateFromResult, not the pre-advance cursor", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.updateFromResult({ continueCursor: "cursor-1", isDone: false });
    });
    expect(result.current.state.hasNextPage).toBe(true);

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.state.currentPage).toBe(2);
    expect(result.current.state.hasPreviousPage).toBe(true);
    // Intent (@vexcms/core's PaginationResult.continueCursor: "Cursor to
    // fetch next page", and usePaginatedQuery.ts's real loadMore(), which
    // does `setCursor(result.continueCursor)`): the cursor for the page
    // just entered is the continueCursor the server just returned, not the
    // pre-advance cursor. usePagination never stores continueCursor at all.
    // FAILS: nextPage does not chain continueCursor — see BUGS-REPORT HOOK-2
    expect(result.current.state.cursor).toBe("cursor-1");
  });

  it("previousPage pops the cursor stack and returns to page 1", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.updateFromResult({ continueCursor: "cursor-1", isDone: false });
    });
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.state.currentPage).toBe(2);

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.hasPreviousPage).toBe(false);
    expect(result.current.state.cursorStack).toEqual([null]);
  });

  it("goToPage(0) and goToPage(-1) are no-ops (lower boundary)", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.updateFromResult({ continueCursor: "cursor-1", isDone: false });
    });
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.state.currentPage).toBe(2);

    act(() => {
      result.current.goToPage(0);
    });
    act(() => {
      result.current.goToPage(-1);
    });

    expect(result.current.state.currentPage).toBe(2);
  });

  it("goToPage(n) navigates to the requested page", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.updateFromResult({ continueCursor: "cursor-1", isDone: false });
    });
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.state.currentPage).toBe(2);

    // Intent (goToPage's own JSDoc: "Jump to specific page (1-based)", and
    // its plain meaning per the Protocol's rule 3): goToPage(n) navigates to
    // page n. The implementation validates only `page >= 1` and then always
    // resets to page 1, discarding the argument — a defect, not a design.
    act(() => {
      result.current.goToPage(3);
    });

    // FAILS: goToPage ignores its argument — see BUGS-REPORT HOOK-1
    expect(result.current.state.currentPage).toBe(3);
  });

  it("goToPage(n) navigates to a page beyond the last known page (no upfront page count to clamp against)", () => {
    // Convex cursor pagination has no upfront page-count, so goToPage has no
    // basis to clamp — its plain meaning still applies to an out-of-range
    // request, the same way scrolling past the last page of a normal
    // paginated UI just renders an empty page rather than erroring.
    const { result } = renderHook(() => usePagination({ totalCount: 10, initialPageSize: 5 }));

    act(() => {
      result.current.goToPage(99);
    });

    // FAILS: goToPage ignores its argument — see BUGS-REPORT HOOK-1
    expect(result.current.state.currentPage).toBe(99);
  });

  it("setPageSize rejects a size outside pageSizeOptions", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageSize(999);
    });

    expect(result.current.state.pageSize).toBe(50);
  });

  it("setPageSize rejects 0 and negative sizes (not in pageSizeOptions)", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageSize(0);
    });
    expect(result.current.state.pageSize).toBe(50);

    act(() => {
      result.current.setPageSize(-10);
    });
    expect(result.current.state.pageSize).toBe(50);
  });

  it("setPageSize(valid) updates pageSize and resets to page 1", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.updateFromResult({ continueCursor: "cursor-1", isDone: false });
    });
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.state.currentPage).toBe(2);

    act(() => {
      result.current.setPageSize(10);
    });

    expect(result.current.state.pageSize).toBe(10);
    expect(result.current.state.currentPage).toBe(1);
    expect(result.current.state.cursorStack).toEqual([null]);
    expect(result.current.state.hasNextPage).toBe(false);
    expect(result.current.paginationOpts).toEqual({ numItems: 10, cursor: null });
  });

  it("honors a custom pageSizeOptions list, rejecting the removed default of 50", () => {
    const { result } = renderHook(() => usePagination({ pageSizeOptions: [5, 20] }));

    act(() => {
      result.current.setPageSize(50);
    });
    expect(result.current.state.pageSize).toBe(50); // unchanged: initialPageSize default, rejected update

    act(() => {
      result.current.setPageSize(20);
    });
    expect(result.current.state.pageSize).toBe(20);
  });
});
```

#### packages/react/src/hooks/useTableSelection.test.tsx

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTableSelection } from "./useTableSelection";

/**
 * `useTableSelection` is pure state + callbacks, so these are state-transition
 * tests over its four-mode machine (`none` → `page` → `all`/`inverse` →
 * `none`), with boundary-value cases at the edges of each transition: the
 * last row deselected (mode collapses to `none`), an empty `selectPage`, an
 * already-empty `clearSelection`, toggling the same row twice, an id absent
 * from the current page, the select-all-then-deselect-one indeterminate
 * transition, `getSelectionCount` with `totalCount` absent (defaults to 0)
 * versus present, and inverse mode's count going negative when
 * `selectedIds.size` exceeds `totalCount`. `UseTableSelectionReturn` has no
 * `indeterminate` field, so "indeterminate derivation" is tested as a
 * consumer would derive it — from `state.mode` and `state.selectedIds`
 * alone — via a small local helper below, not a hook-exposed property.
 *
 * Per this spec's Test Authoring Protocol, assertions encode INTENDED
 * behavior — a change callback reports the state after the change it
 * announces, and "select all except one" means that one row reports
 * unselected — not whatever the current implementation happens to do. Two
 * defects fall out of that: `toggleRow`'s `onSelectionChange` reporting a
 * stale pre-toggle `mode` (`BUGS-REPORT HOOK-3`), and `toggleRow` called
 * while `mode === "all"` silently failing to exclude the row
 * (`BUGS-REPORT HOOK-5`). Both are asserted as intent, left failing, and
 * tagged inline.
 */
function deriveIndeterminate(state: { mode: string; selectedIds: Set<string> }, pageIds: string[]): boolean {
  if (state.mode === "all" || state.mode === "none") return false;
  if (state.mode === "page") {
    return state.selectedIds.size > 0 && state.selectedIds.size < pageIds.length;
  }
  // inverse: partial unless every id has been excluded (selectedIds empty means all selected)
  return state.selectedIds.size > 0;
}

describe("useTableSelection", () => {
  it("starts with an empty selection and mode 'none'", () => {
    const { result } = renderHook(() => useTableSelection());

    expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
    expect(result.current.getSelectionCount()).toBe(0);
    expect(result.current.isRowSelected("row-1")).toBe(false);
  });

  it("toggleRow selects a single row and switches mode 'none' -> 'page'", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleRow("row-1");
    });

    expect(result.current.state.selectedIds).toEqual(new Set(["row-1"]));
    expect(result.current.state.mode).toBe("page");
    expect(result.current.isRowSelected("row-1")).toBe(true);
    expect(result.current.isRowSelected("row-2")).toBe(false);
    expect(result.current.getSelectionCount()).toBe(1);
  });

  it("toggleRow deselects a selected row and collapses mode back to 'none' when empty (boundary: last row)", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleRow("row-1");
    });
    act(() => {
      result.current.toggleRow("row-1");
    });

    expect(result.current.state.selectedIds).toEqual(new Set());
    expect(result.current.state.mode).toBe("none");
    expect(result.current.getSelectionCount()).toBe(0);
  });

  it("toggling a row twice returns to the original selection state, other rows unaffected", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.selectPage(["a", "b"]);
    });
    act(() => {
      result.current.toggleRow("a");
    });
    act(() => {
      result.current.toggleRow("a");
    });

    expect(result.current.state.selectedIds).toEqual(new Set(["a", "b"]));
    expect(result.current.state.mode).toBe("page");
  });

  it("toggling an id absent from the current page selects it without error (hook has no page awareness)", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleRow("row-not-on-any-rendered-page");
    });

    expect(result.current.isRowSelected("row-not-on-any-rendered-page")).toBe(true);
    expect(result.current.getSelectionCount()).toBe(1);
  });

  it("toggleRow's onSelectionChange reports the post-change mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() => useTableSelection({ onSelectionChange }));

    act(() => {
      result.current.toggleRow("row-1");
    });

    // Intent: a change callback reports the state AFTER the change it is
    // announcing. Selecting the first row moves mode "none" -> "page", so
    // the callback should report "page" — not the pre-toggle "none" that
    // the implementation's outer closure still holds when it fires.
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    // FAILS: toggleRow's onSelectionChange reports stale closure-captured mode — see BUGS-REPORT HOOK-3
    expect(onSelectionChange).toHaveBeenCalledWith({ selectedIds: new Set(["row-1"]), mode: "page" });
    expect(result.current.state.mode).toBe("page");

    act(() => {
      result.current.toggleRow("row-1");
    });

    // Deselecting the last row moves mode "page" -> "none"; the callback
    // should report "none".
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    // FAILS: toggleRow's onSelectionChange reports stale closure-captured mode — see BUGS-REPORT HOOK-3
    expect(onSelectionChange).toHaveBeenLastCalledWith({ selectedIds: new Set(), mode: "none" });
    expect(result.current.state.mode).toBe("none");
  });

  it("selectPage replaces the selection with exactly the given ids and sets mode 'page'", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() => useTableSelection({ onSelectionChange }));

    act(() => {
      result.current.selectPage(["a", "b", "c"]);
    });

    expect(result.current.state.selectedIds).toEqual(new Set(["a", "b", "c"]));
    expect(result.current.state.mode).toBe("page");
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      selectedIds: new Set(["a", "b", "c"]),
      mode: "page",
    });
  });

  it("selectPage([]) (empty page) selects nothing and sets mode 'none' (boundary)", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.selectPage([]);
    });

    expect(result.current.state.selectedIds).toEqual(new Set());
    expect(result.current.state.mode).toBe("none");
  });

  it("clearSelection resets ids and mode regardless of prior state", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.selectPage(["a", "b"]);
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
  });

  it("clearSelection on an already-empty selection is idempotent (boundary)", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
    expect(result.current.getSelectionCount()).toBe(0);
  });

  it("toggleSelectAll enters 'all' mode, marks every row selected, and honors totalCount for the count", () => {
    const { result } = renderHook(() => useTableSelection({ totalCount: 500 }));

    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.state.mode).toBe("all");
    expect(result.current.state.selectedIds).toEqual(new Set());
    expect(result.current.isRowSelected("any-row-not-individually-tracked")).toBe(true);
    expect(result.current.getSelectionCount()).toBe(500);
  });

  it("getSelectionCount defaults totalCount to 0 in 'all' mode when totalCount is absent", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.getSelectionCount()).toBe(0);
  });

  it("toggleSelectAll a second time (while already 'all') clears the selection back to 'none'", () => {
    const { result } = renderHook(() => useTableSelection({ totalCount: 500 }));

    act(() => {
      result.current.toggleSelectAll();
    });
    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
  });

  it("select-all then deselect-one produces an indeterminate exclusion, not a no-op", () => {
    const { result } = renderHook(() => useTableSelection({ totalCount: 5 }));

    act(() => {
      result.current.toggleSelectAll();
    });
    expect(result.current.isRowSelected("row-1")).toBe(true);

    // Intent (sibling: toggleInverseMode's own "everything selected except
    // deselected" semantics): deselecting one row out of select-all should
    // exclude just that row, both from isRowSelected and from the count.
    act(() => {
      result.current.toggleRow("row-1");
    });

    // FAILS: toggleRow in "all" mode does not exclude the row — see BUGS-REPORT HOOK-5
    expect(result.current.isRowSelected("row-1")).toBe(false);
    // FAILS: toggleRow in "all" mode does not exclude the row — see BUGS-REPORT HOOK-5
    expect(result.current.getSelectionCount()).toBe(4);
  });

  it("toggleInverseMode enters 'inverse' with every row selected until explicitly excluded", () => {
    const { result } = renderHook(() => useTableSelection({ totalCount: 10 }));

    act(() => {
      result.current.toggleInverseMode();
    });

    expect(result.current.state.mode).toBe("inverse");
    expect(result.current.isRowSelected("row-1")).toBe(true);
    expect(result.current.getSelectionCount()).toBe(10);

    // toggling a row in inverse mode ADDS it to selectedIds, which here means
    // "excluded from the selection" — the inverse of the normal semantics.
    act(() => {
      result.current.toggleRow("row-1");
    });

    expect(result.current.state.mode).toBe("inverse"); // unchanged: mode !== "none"
    expect(result.current.isRowSelected("row-1")).toBe(false);
    expect(result.current.isRowSelected("row-2")).toBe(true);
    expect(result.current.getSelectionCount()).toBe(9);
  });

  it("getSelectionCount can go negative in inverse mode when exclusions exceed totalCount (boundary)", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleInverseMode();
    });
    act(() => {
      result.current.toggleRow("row-1");
    });
    act(() => {
      result.current.toggleRow("row-2");
    });

    // totalCount is absent (defaults to 0) and two rows are excluded: 0 - 2.
    expect(result.current.getSelectionCount()).toBe(-2);
  });

  it("toggleInverseMode a second time (while already 'inverse') clears back to 'none'", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleInverseMode();
    });
    act(() => {
      result.current.toggleInverseMode();
    });

    expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
  });

  it("selection survives a page change: useTableSelection has no dependency on any pagination hook", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleRow("row-on-page-1");
    });
    expect(result.current.isRowSelected("row-on-page-1")).toBe(true);

    // Simulate the table advancing to a new page: nothing about page
    // navigation calls into this hook, so re-rendering it with the same
    // props (as a consumer would on every render) leaves selection intact.
    act(() => {
      // no-op action standing in for "the page changed elsewhere"
    });

    expect(result.current.isRowSelected("row-on-page-1")).toBe(true);
    expect(result.current.state.selectedIds).toEqual(new Set(["row-on-page-1"]));
  });

  it("selection survives a pageSize change: same no-dependency guarantee", () => {
    const { result } = renderHook(() => useTableSelection());

    act(() => {
      result.current.toggleRow("row-x");
    });

    // Simulate a consumer's usePagination().setPageSize() elsewhere: this
    // hook takes no pagination props at all, so nothing here reacts.
    act(() => {
      // no-op action standing in for "pageSize changed elsewhere"
    });

    expect(result.current.isRowSelected("row-x")).toBe(true);
    expect(result.current.getSelectionCount()).toBe(1);
  });

  it("derives indeterminate (partial-page-selection) state from mode and selectedIds, consumer-side", () => {
    const { result } = renderHook(() => useTableSelection());
    const pageIds = ["a", "b", "c"];

    expect(deriveIndeterminate(result.current.state, pageIds)).toBe(false); // none selected

    act(() => {
      result.current.toggleRow("a");
    });
    expect(deriveIndeterminate(result.current.state, pageIds)).toBe(true); // 1 of 3

    act(() => {
      result.current.selectPage(pageIds);
    });
    expect(deriveIndeterminate(result.current.state, pageIds)).toBe(false); // mode "page" but full page selected (1 === 1 boundary: not < length)
    expect(result.current.state.selectedIds.size).toBe(3);
    // deriveIndeterminate only checks `mode === "page"`, so a fully-selected
    // page (size === pageIds.length) also reports false — matching how a
    // checkbox's `checked` (not `indeterminate`) state would take over.

    act(() => {
      result.current.toggleSelectAll();
    });
    expect(deriveIndeterminate(result.current.state, pageIds)).toBe(false); // "all" mode is never indeterminate
  });
});
```

Verify: node scripts/record-test-findings.mjs packages/react/src/hooks/usePagination.test.tsx packages/react/src/hooks/useTableSelection.test.tsx

## Step 3 — Hooks: usePaginatedQuery via the convex bridge

Why: 37 statements at 0% and the only hook needing real data. Driving it through the existing `createFakeConvexClient` keeps the testing standards' "real query execution, no hand-typed response fixtures" rule intact, and the same handler serves Step 4's full-mount view tests.

**A correction to the frozen contract's literal signature, verified by reading the real code, not assumed:** the contract's placeholder key `"vex:findPaginated"` does not exist at runtime. `packages/core/src/api/convex.ts` defines `vexConvexApi.findPaginated: anyApi.vex.find as FunctionReference<…>` — it is `anyApi.vex.find`, the exact same underlying reference as `vexConvexApi.find`. `getFunctionName()` derives a Convex function name purely from the `anyApi` property path (`node_modules/convex/dist/cjs/server/api.js`'s `createApi`: `path + ":" + exportName`), so `getFunctionName(vexConvexApi.findPaginated)` is `"vex:find"` — byte-identical to `getFunctionName(vexConvexApi.find)`, and identical to the key `relationship/Input.test.tsx:198` already asserts against.

**Two real defects, both verified by running the hook, not by reading — and both asserted against their intended behavior, letting the test fail, per this spec's Test Authoring Protocol.**

`HOOK-4`: `usePaginatedQuery`'s `loadMore()` does not reveal a freshly-fetched server page on the same call that fetches it. `endIndex = (clientPageIndex + 1) * (clientPageSize ?? query.paginationOpts.numItems)` and `clientPageIndex` only increments in `loadMore`'s ELSE branch (`needsServerFetch` false) — the branch that fires when the accumulator already covers the visible window. So with `clientPageSize` unset, one `loadMore()` fetches the next page into the internal accumulator (advancing the cursor) but the exposed `results` window doesn't grow until a SECOND `loadMore()` call reveals it. `loadMore`'s own plain meaning (Protocol rule 3) is that one call reveals one more page — `usePaginatedQuery.test.tsx` asserts exactly that idealized one-call-per-page model rather than the real off-by-one-reveal trace, and lets the assertions fail.

`HOOK-6` (newly surfaced while revising this step): `isDone`'s own JSDoc says "Whether all documents have been loaded. When `true`, Load More button should be hidden." — a plain contract (Protocol rule 1). The real hook's `result` memo falls back to a `{ page: [], continueCursor: "", isDone: true }` placeholder whenever `useQuery`'s `data` is `undefined`, and the accumulate effect always runs on mount, so `isDone` reads `true` for one full render before the first page has even resolved — and, worse, forever after a query error, since a rejected query's `data` never becomes defined and nothing ever corrects it. Both cases are the same root cause: `isDone: true` is indistinguishable from "no more documents" when the real state is "nothing has loaded yet" or "the fetch failed." `usePaginatedQuery.test.tsx` asserts the documented `isDone` contract (`false` in both cases) and lets both assertions fail.

#### packages/react/src/testing/convex/bridge.ts

Three edits, all additive — `QUERY_HANDLERS`'s `"vex:find"` entry is extended, not replaced with a new key; `createFakeConvexClient`'s signature is untouched.

**1 — imports.** Beside the existing `find`/`get`/`search` import, add a type-only import for the pagination types (re-exported from `@vexcms/core`'s root barrel via `export * from "./api/types"`, not from `@vexcms/core/server`):

```ts
import type { PaginationOptions, PaginationResult } from "@vexcms/core";
```

**2 — `"vex:find"` entry.** Replace the existing single-line entry inside `QUERY_HANDLERS`:

```ts
  "vex:find": async (ctx, args) => {
    const paginationOpts = args.paginationOpts as PaginationOptions | undefined;
    return paginationOpts
      ? find({ ctx, collection: "documents", paginationOpts })
      : find({ ctx, collection: "documents" });
  },
```

(`find`'s two server overloads — `packages/core/src/api/find/server.ts:130-154` — resolve on whether `paginationOpts` is present in the call; branching explicitly, rather than a conditional spread, is what lets each branch pick its own overload. No `config`/`access` is passed, matching every other entry in this table — RBAC bypassed, this bridge is a data-shape kit, not an RBAC one.)

**3 — `findPaginatedQuery` reference export.** After the existing `documentsListQuery` export, mirroring how it's built (`anyApi.<module>.<export>` cast to the exact `FunctionReference` shape) but pointed at `anyApi.vex.find` — the same underlying reference `vexConvexApi.findPaginated` casts, so `getFunctionName(findPaginatedQuery)` matches the `"vex:find"` key extended above:

```ts

/**
 * `vexConvexApi.findPaginated`'s function reference, typed for direct
 * `convexQuery()` call sites against this test kit's `documents` table.
 * Built from `anyApi.vex.find` — the exact same underlying reference
 * `vexConvexApi.findPaginated` casts in `packages/core/src/api/convex.ts`,
 * since one registered Convex `find` query serves both the array and
 * paginated shapes (overloaded server-side on `paginationOpts`). Its
 * `getFunctionName()` output is therefore `"vex:find"`, identical to
 * `vexConvexApi.find`'s — see the `"vex:find"` entry above, which now
 * forwards `paginationOpts` when present.
 */
export const findPaginatedQuery = anyApi.vex.find as FunctionReference<
  "query",
  "public",
  { paginationOpts: PaginationOptions },
  PaginationResult<TestDoc<"documents">>
>;
```

#### packages/react/src/testing/convex/schema.ts

Two edits, both additive.

**1 — import.** Beside the existing `convex/values` import, add:

```ts
import type { TestConvex } from "convex-test";
```

**2 — `seedDocuments` helper.** After the existing `testModules` export, at the end of the file:

```ts

/**
 * Seeds `count` documents titled `"Doc 0"`, `"Doc 1"`, … into `t`'s
 * `documents` table, returning their real generated ids in insertion order.
 * Used by `usePaginatedQuery.test.tsx` (Step 3) to page through a
 * predictable, ordered document set — convex-test's default index preserves
 * this insertion order, so tests can assert exact page contents by title.
 *
 * @param t - The `convexTest()` instance to seed.
 * @param count - Number of documents to insert.
 * @returns The seeded documents' ids, in insertion order.
 */
export async function seedDocuments(
  t: TestConvex<typeof schema>,
  count: number,
): Promise<string[]> {
  const ids: string[] = [];
  await t.run(async (ctx) => {
    for (let i = 0; i < count; i++) {
      ids.push(await ctx.db.insert("documents", { title: `Doc ${i}` }));
    }
  });
  return ids;
}
```

#### packages/react/src/hooks/usePaginatedQuery.test.tsx

Wires `createFakeConvexClient` through a real `ConvexQueryClient` + `QueryClient` — the same pattern `bridge.test.tsx` and `relationship/Input.test.tsx` use, adapted to `renderHook` (the pattern already proven for hooks needing a `QueryClientProvider` in `useVexMutation.test.tsx`/`useVexRevalidate.test.tsx`). `paginationOpts.cursor: null` is required explicitly — `PaginationOptions.cursor` is a non-optional `Cursor | null`, exactly as the real `CollectionListView.tsx` call site already supplies it.

Every async-state edge case the Protocol requires for a data-reading hook is covered: loading (pending, not-yet-done), empty result, a single page that's done immediately, a query error that doesn't crash, `loadMore()` after `isDone`, and two rapid `loadMore()` calls before the first settles. Two intended-behavior assertions are red — `HOOK-4` (traced above) and `HOOK-6` (newly surfaced while revising this suite against the Protocol) — each carrying its `BUGS-REPORT` comment.

```tsx
import "@testing-library/jest-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { createFakeConvexClient } from "../testing/convex/bridge";
import schema, { seedDocuments, testModules } from "../testing/convex/schema";
import { usePaginatedQuery } from "./usePaginatedQuery";

/**
 * Wires a fresh `convex-test` instance through the real `ConvexQueryClient` +
 * `QueryClient` pair — byte-for-byte the same wiring `bridge.test.tsx` and
 * `relationship/Input.test.tsx` use — so `usePaginatedQuery`'s
 * `convexQuery(vexConvexApi.findPaginated, …)` call resolves real
 * `PaginationResult` data from the seeded `documents` table.
 *
 * @param t - The `convexTest()` instance the hook's queries run against.
 * @returns The `QueryClient` connected to the fake Convex client, and the
 *   underlying fake client itself so a caller can `vi.spyOn` its `query`
 *   method to count real fetches.
 */
function buildQueryClient(t: Parameters<typeof createFakeConvexClient>[0]): {
  queryClient: QueryClient;
  fakeClient: ConvexReactClient;
} {
  const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);
  return { queryClient, fakeClient };
}

/**
 * `renderHook`'s wrapper option, bound to one `QueryClient`.
 *
 * @param queryClient - The `QueryClient` every rendered hook instance shares.
 * @returns A provider component usable as `renderHook`'s `wrapper`.
 */
function makeWrapper(queryClient: QueryClient) {
  return function Wrapper(props: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
  };
}

describe("usePaginatedQuery", () => {
  it("loads the first server page on mount", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const { queryClient } = buildQueryClient(t);

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results.map((doc) => doc.title)).toEqual(["Doc 0", "Doc 1"]);
    expect(result.current.isDone).toBe(false);
  });

  it("reveals the next page after a single loadMore call", async () => {
    // Intent per `loadMore`'s own plain meaning (Protocol rule 3): one call
    // reveals one more page. The real implementation's `clientPageIndex`
    // (which gates the visible window) only advances once the internal
    // accumulator already covers it — so the FIRST `loadMore()` call fetches
    // page 2 into the accumulator but the visible `results` window doesn't
    // grow until a SECOND call. Traced by running this hook against the
    // real bridge, not assumed.
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const { queryClient } = buildQueryClient(t);

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.isPending).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isPending).toBe(false));

    // FAILS: loadMore's first call only fetches the next page into the
    // internal accumulator without exposing it — see BUGS-REPORT HOOK-4.
    expect(result.current.results.map((doc) => doc.title)).toEqual([
      "Doc 0",
      "Doc 1",
      "Doc 2",
      "Doc 3",
    ]);
    expect(result.current.isDone).toBe(false);
  });

  it("flips isDone after the intended number of loadMore calls", async () => {
    // 5 docs at numItems=2 span 3 server pages (2, 2, 1). Intent: the first
    // page loads on mount, and each of the two remaining pages is revealed
    // by exactly one `loadMore()` call — 2 calls total to exhaust the
    // collection. The real off-by-one-reveal (HOOK-4) needs 4 calls instead;
    // asserting the intended 2-call model here fails against that trace.
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const { queryClient } = buildQueryClient(t);

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.isPending).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isPending).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isPending).toBe(false));

    // FAILS: two calls land on 4 of 5 docs with isDone still false under the
    // real off-by-one reveal — see BUGS-REPORT HOOK-4.
    expect(result.current.results.map((doc) => doc.title)).toEqual([
      "Doc 0",
      "Doc 1",
      "Doc 2",
      "Doc 3",
      "Doc 4",
    ]);
    expect(result.current.isDone).toBe(true);
  });

  it("returns an empty, done page when the collection has no documents", async () => {
    const t = convexTest(schema, testModules);
    const { queryClient } = buildQueryClient(t);

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results).toEqual([]);
    expect(result.current.isDone).toBe(true);
  });

  it("reports a pending, not-yet-done state before the first page resolves", async () => {
    // `isDone`'s own JSDoc: "Whether all documents have been loaded. When
    // true, Load More button should be hidden." Before the first fetch
    // settles, no document has loaded, so intent is `isDone: false`. The
    // real hook's `result` memo falls back to a `{ isDone: true }` empty
    // placeholder whenever `data` is `undefined` — including the very first,
    // still-pending render — so the mount-time accumulate effect sets
    // `isDone` true a full render before any data has arrived.
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const { queryClient } = buildQueryClient(t);

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.results).toEqual([]);
    // FAILS: isDone reads true before the first page has even resolved —
    // see BUGS-REPORT HOOK-6.
    expect(result.current.isDone).toBe(false);

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("returns a done page immediately when every document fits on a single page", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 3);
    const { queryClient } = buildQueryClient(t);

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 5, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results.map((doc) => doc.title)).toEqual(["Doc 0", "Doc 1", "Doc 2"]);
    expect(result.current.isDone).toBe(true);
  });

  it("surfaces a query failure without crashing the render", async () => {
    // The hook's `UsePaginatedQueryReturn` exposes no `error`/`isError`
    // field, so the strongest available intent check is `isDone`'s own
    // contract again: a failed fetch has not loaded "all documents", so
    // `isDone` should not read true. Rendering itself must not throw either
    // way — `useQuery` here has no `throwOnError`, so a rejected fetch is
    // expected to resolve to a quiet, safe state, not an exception.
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const fakeClient = createFakeConvexClient(t) as ConvexReactClient & {
      query: (...args: unknown[]) => Promise<unknown>;
    };
    const erroringClient = {
      ...fakeClient,
      query: async () => {
        throw new Error("simulated query failure");
      },
    } as unknown as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(erroringClient);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
    });
    convexQueryClient.connect(queryClient);

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results).toEqual([]);
    // FAILS: the same empty-placeholder fallback that causes the pending
    // state above also fires here, and never gets corrected because a
    // rejected query never produces `data` — `isDone` reads true forever,
    // indistinguishable from a genuinely empty collection. See BUGS-REPORT
    // HOOK-6.
    expect(result.current.isDone).toBe(false);
  });

  it("loadMore is a safe no-op once every document has been loaded", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 3);
    const { queryClient, fakeClient } = buildQueryClient(t);
    const querySpy = vi.spyOn(
      fakeClient as unknown as { query: (...args: unknown[]) => Promise<unknown> },
      "query",
    );

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 5, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isDone).toBe(true);
    const callCountAtDone = querySpy.mock.calls.length;
    const resultsAtDone = result.current.results.map((doc) => doc.title);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.results.map((doc) => doc.title)).toEqual(resultsAtDone);
    expect(result.current.isDone).toBe(true);
    expect(querySpy.mock.calls.length).toBe(callCountAtDone);
  });

  it("loadMore called twice rapidly, before the first resolves, does not duplicate the fetch", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 6);
    const { queryClient, fakeClient } = buildQueryClient(t);
    const querySpy = vi.spyOn(
      fakeClient as unknown as { query: (...args: unknown[]) => Promise<unknown> },
      "query",
    );

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const callCountAtMount = querySpy.mock.calls.length;

    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(querySpy.mock.calls.length - callCountAtMount).toBe(1);
  });

  it("resets to a fresh first page when the consumer remounts with a different page size", async () => {
    // `usePaginatedQuery`'s own JSDoc says it "Mimics Convex's
    // usePaginatedQuery API for consistency". Real Convex's own
    // `usePaginatedQuery` (node_modules/convex/dist/esm/react/use_paginated_query.js)
    // resets its internal pagination state only when the query reference or
    // its non-pagination *args* change (`getFunctionName`/`JSON.stringify`
    // comparison) — `initialNumItems` is deliberately excluded from that
    // comparison, so changing it in place never resets an already-mounted
    // instance. Convex's own docs are explicit about the consequence
    // (docs.convex.dev/api/modules/react): "If you need to reset pagination
    // to use a different `initialNumItems`, you'd typically change a query
    // argument… or use a React key to unmount/remount the component." This
    // hook keeps its cursor/accumulator in local `useState` with the same
    // no-reset-on-page-size-change shape, so a remount is the documented,
    // intended way to change page size — not a workaround for a missing
    // reset effect. Proven here by unmounting an instance that has already
    // paged past the first server page, then mounting a second instance
    // (same convex-test data, same QueryClient) with a different `numItems`
    // and asserting it starts over from `cursor: null` rather than
    // continuing where the first instance left off.
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const { queryClient } = buildQueryClient(t);

    const first = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );
    await waitFor(() => expect(first.result.current.isPending).toBe(false));
    act(() => first.result.current.loadMore());
    await waitFor(() => expect(first.result.current.isPending).toBe(false));
    act(() => first.result.current.loadMore());
    await waitFor(() =>
      expect(first.result.current.results.map((doc) => doc.title)).toEqual([
        "Doc 0",
        "Doc 1",
        "Doc 2",
        "Doc 3",
      ]),
    );
    first.unmount();

    const second = renderHook(
      () =>
        usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 3, cursor: null } },
        }),
      { wrapper: makeWrapper(queryClient) },
    );
    await waitFor(() => expect(second.result.current.isPending).toBe(false));
    expect(second.result.current.results.map((doc) => doc.title)).toEqual([
      "Doc 0",
      "Doc 1",
      "Doc 2",
    ]);
    expect(second.result.current.isDone).toBe(false);
  });
});
```

Verify: node scripts/record-test-findings.mjs packages/react/src/hooks/usePaginatedQuery.test.tsx

## Step 4 — Views + admin shell (full-mount, RBAC-gated)

**[agent]**
Why: 149 statements at 0%, and the 14 `usePermission` gating sites across five views and
`AdminSidebar` are exactly what the 09-04 spec deferred — where a wrong permission answer is
user-visible. `runRbacStateSuite` already exists for this. Full-mount also exercises the
list-view stack transitively, which is where ADR-009-class composition defects appear.

**Design note (mid-step correction from the running session, applies package-wide to Steps
4-7):** the views/shell suite is NOT a pool of loose `*.test.tsx` files — its describe/it
bodies live in one exported, `describe`-calling factory pair,
`packages/react/src/testing/viewSuite.ts`'s `runViewSuite`/`runShellSuite`, matching
`react-test-factories.md`'s existing rule ("`@vexcms/react/testing` ships plain exported
functions whose bodies call `describe`/`it`/`expect` themselves … never raw `.test.*`
files"). Each of this step's 11 `*.test.tsx` files is a one-line caller filtered to itself via
`only`, so running the whole `src/components/views` directory executes each view's assertions
exactly once, and Step 7's `sections: ["views"]`/`["shell"]` dispatch calls the same two
functions bare (no `only`) to run all eight/three in one pass.

Every view/shell member takes an optional `access?: VexAccessConfig`. Omitted (the default
used by all 11 files below), the suite drives the real 5-scenario RBAC matrix through the
shared `testAccess`/`testUsers` fixtures. Supplied (Step 7's own `sections` dispatch, or a
downstream consumer's own config), the suite cannot assume the caller's role names or granted
resources, so it downgrades to one non-crashing mount per member — the same smoke-check
semantics `runVexReactSuite`'s own `access` option already uses. `AdminLayout`/`AdminTopNav`
have no RBAC surface of their own (neither calls `usePermission`/`hasPermission`); their
`access` param only proves a caller's config does not crash the mount.

#### packages/react/src/testing/setup.ts

**2 edits.** Everything else in the file is unchanged.

**1 — beside the existing `ResizeObserverStub` class.** Adds an inert `MediaQueryList` stub —
jsdom implements no CSS media-query engine at all, and both `use-mobile.ts`'s `useIsMobile`
(read by `SidebarProvider`, needed by `AppSidebar`/`AdminLayout`) and `ThemeProvider`'s
system-theme resolution call `window.matchMedia` unconditionally on mount — confirmed by
running `AppSidebar` under `SidebarProvider` without this stub: `TypeError: window.matchMedia
is not a function` thrown from `use-mobile.ts:17`, before any of this suite's own assertions
run.

```ts
/**
 * Inert `MediaQueryList`: never matches, never fires a change event. Good enough for
 * every current caller (`use-mobile.ts`'s viewport query, `ThemeProvider`'s
 * `prefers-color-scheme` query) — both only need `.matches` and
 * `add/removeEventListener` to exist, never a real match or a live update.
 */
class MediaQueryListStub {
  matches = false;
  media = "";
  addEventListener() {}
  removeEventListener() {}
}
```

**2 — inside `installDomPolyfills()`, alongside the other `??=` installs.** The function's own
doc comment gains one sentence naming the new gap; add this line after the existing
`Element.prototype.getAnimations ??= () => [];`:

```ts
  // jsdom has no CSS media-query engine at all.
  globalThis.matchMedia ??= ((query: string) => {
    const stub = new MediaQueryListStub();
    stub.media = query;
    return stub as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
```

#### packages/react/src/testing/harness/viewHarness.tsx

```tsx
import { createElement, type ReactNode } from "react";
import type { RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  defineGlobal,
  text,
  type ClientVexConfig,
  type MediaCollectionConfig,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { VexConfigContext } from "../../context/VexConfigContext";
import { createFakeConvexClient, type ConvexTestInstance } from "../convex/bridge";
import { renderWithVexProviders, testCollection } from "./accessFixtures";

/**
 * Hand-built the same way `fieldInputContract.ts`'s and `nestedFieldContainer.ts`'s own
 * stub media collections are: a media collection is never produced by a public builder
 * function (in production it is derived from a regular collection's storage config by
 * `validateAndMergeStorageConfig`, which needs a real registered storage adapter this test
 * kit does not stand up), so the shape is authored directly.
 */
const testMediaCollection = {
  slug: "images",
  fields: { alt: text({ required: false }) },
  labels: { singular: "Image", plural: "Images" },
  admin: {
    useAsTitle: "_id",
    components: {},
    table: { defaultPageSize: 10, serverPageSize: 100 },
  },
  meta: { storageAdapter: "convex" },
} as unknown as MediaCollectionConfig;

/**
 * A global carries none of a media collection's storage complexity, so — unlike
 * `testMediaCollection` above — there is no reason not to use the real `defineGlobal()`.
 */
const testGlobal = defineGlobal({
  slug: "settings",
  label: "Settings",
  fields: { siteName: text({ required: false }) },
});

/** Default stub client config: one `posts` collection, one `images` media collection, one global. */
export const testClientConfig: ClientVexConfig = {
  basePath: "/admin",
  admin: { sidebar: { side: "left", collapsible: "offcanvas" } },
  collections: [testCollection],
  mediaCollections: [testMediaCollection],
  globals: [testGlobal],
  schema: { outputPath: "/convex/vex.schema.ts" },
  types: { outputPath: "/src/vex.types.ts" },
  // `ClientVexConfig` is `defineConfig()`'s sanitized (function-stripped) output shape, built
  // directly here rather than round-tripped through `sanitizeConfigForClient(defineConfig())`
  // — `defineConfig()` derives `mediaCollections` from a real registered storage adapter via
  // `validateAndMergeStorageConfig`, which is real backend wiring this test kit does not stand
  // up. Mirrors the established `stubClientConfig` cast in `fieldInputContract.ts`/
  // `nestedFieldContainer.ts`.
} as unknown as ClientVexConfig;

/** Options for {@link renderView} and {@link wrapWithViewProviders}. */
export interface ViewHarnessOptions {
  /** convex-test instance whose seeded data the view reads. */
  convex: ConvexTestInstance;
  /** Client config the view resolves collections/globals from. */
  config?: ClientVexConfig;
  /** RBAC matrix to render against. Omit to leave RBAC unconfigured (every check passes). */
  access?: VexAccessConfig;
  /** The caller to render against. Defaults to `{ user: null }`. */
  auth?: VexApiAuth;
}

/**
 * Wraps `ui` in every provider a view reads OTHER than access/auth: a Convex client backed
 * by `options.convex` via the convex-test bridge, a `QueryClient` wired to that same client
 * (`usePaginatedQuery`/`useQuery` read through this), `NuqsTestingAdapter` (the create-document
 * and media-upload modals read URL state), and `VexConfigContext` (views resolve their live
 * collection/global config from context, falling back to their RSC-serialized prop).
 *
 * Split out from {@link renderView} so `runRbacStateSuite`'s `render` callback — which must
 * return a `ReactNode`, not call `render()` itself — can wrap a view in exactly these
 * providers while `runRbacStateSuite`'s own `renderWithVexProviders` call supplies the
 * per-scenario access/auth pair around it.
 *
 * @param ui - The view tree to wrap.
 * @param options - The convex-test instance and optional config override.
 * @returns `ui` wrapped in the Convex/QueryClient/nuqs/VexConfigContext provider stack.
 */
export function wrapWithViewProviders(
  ui: ReactNode,
  options: Pick<ViewHarnessOptions, "convex" | "config">,
): ReactNode {
  const fakeClient = createFakeConvexClient(options.convex) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  return createElement(
    ConvexProvider,
    { client: fakeClient },
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        NuqsTestingAdapter,
        null,
        createElement(VexConfigContext.Provider, { value: options.config ?? testClientConfig }, ui),
      ),
    ),
  );
}

/**
 * Mounts a view with every provider it reads: ConvexProvider + QueryClientProvider
 * (wired to the convex bridge), NuqsTestingAdapter, VexConfigContext, and the
 * VexAccess/VexAuth pair. Composes `renderWithVexProviders`; does not duplicate it.
 *
 * @param ui - The view tree to render.
 * @param options - Convex-test instance, plus optional config/access/auth overrides.
 * @returns The `@testing-library/react` render result.
 */
export function renderView(ui: ReactNode, options: ViewHarnessOptions): RenderResult {
  return renderWithVexProviders(wrapWithViewProviders(ui, options), {
    access: options.access,
    auth: options.auth,
  });
}
```

#### packages/react/src/testing/viewSuite.ts

```ts
import { createElement } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { convexTest } from "convex-test";
import {
  select,
  type PaginationResult,
  type VexAccessConfig,
  type VexDocument,
  type VexMediaDocument,
} from "@vexcms/core";
import schema, { testModules, type TestDoc } from "./convex/schema";
import type { ConvexTestInstance } from "./convex/bridge";
import { renderWithVexProviders, testCollection } from "./harness/accessFixtures";
import { renderView, testClientConfig, wrapWithViewProviders } from "./harness/viewHarness";
import { runRbacStateSuite } from "./rbacState";
import { ThemeProvider } from "../components/ui/ThemeProvider";
import { SidebarProvider } from "../components/ui/sidebar";
import {
  FrameworkComponentsContext,
  useFrameworkComponents,
  type FrameworkComponents,
  type VexLinkProps,
} from "../hooks/useFrameworkComponents";
import { AdminLayout } from "../components/AdminLayout";
import { AppSidebar } from "../components/AdminSidebar";
import AdminTopNav from "../components/AdminTopNav";
import {
  CollectionListView,
  CollectionEditView,
  GlobalEditView,
  GlobalsListView,
  DashboardView,
  UnauthorizedView,
  MediaCollectionListView,
  MediaCollectionEditView,
} from "../components/views";

/**
 * One entry per `runRbacStateSuite` default scenario name, resolved for a given
 * resource/action/scope combination. Three distinct matrices cover every
 * `usePermission`/`hasPermission` call site this suite exercises — see the derivation
 * comment above each constant.
 */
type RbacMatrix = Record<"none" | "anonymous" | "denied" | "allowed" | "scoped", boolean>;

/**
 * `testAccess`'s shared matrix (`harness/accessFixtures.ts`) grants role "allowed" a
 * resource-level wildcard (`{ posts: { "*": true } }`) and role "scoped" only a `read`
 * constraint on `posts` — nothing for `create`/`update`/`delete`. Verified directly against
 * `packages/core/src/access/hasPermission.ts`: an undeclared action on a DECLARED resource
 * falls through `resolveActionCheck` to `defaultPermissionMode` (`false`, P-007), independent
 * of `scope`. Applies to every `create`/`update`/`delete` check against `testCollection`
 * ("posts") — identical to `runRbacStateSuite`'s own default probe (`action: "read"`, scope
 * "all"), because `scoped`'s `read` constraint with no `data` and scope "all" also resolves
 * to `false` (`resolveConstrainedCheck`).
 */
const MATRIX_POSTS: RbacMatrix = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: true,
  scoped: false,
};

/**
 * Same "posts" resource, but for a `read` + `scope: "any"` check (the sidebar/dashboard's
 * nav-gating shape). `scoped`'s `read` key IS a constraint, and `resolveConstrainedCheck`
 * answers an "any document" quantified question with no `data` as `true` for scope "any" —
 * the opposite of scope "all" above. Verified against `hasPermission.ts`'s
 * `resolveConstrainedCheck`.
 */
const MATRIX_POSTS_READ_ANY: RbacMatrix = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: true,
  scoped: true,
};

/**
 * `testAccess`'s roles declare permissions ONLY under the `posts` key — "images" and
 * "settings" (this suite's media collection and global) are undeclared resources for every
 * role. `hasPermission` resolves an undeclared resource via the ROLE-level wildcard
 * (`role["*"]`), not the per-resource one, and no role in `testAccess` sets one — so
 * `denied`/`allowed`/`scoped` all fall through to `defaultPermissionMode` (`false`),
 * regardless of action or scope. Verified against `hasPermission.ts` lines 108-127.
 */
const MATRIX_UNDECLARED: RbacMatrix = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: false,
  scoped: false,
};

/** Wraps a seeded document array as the `PaginationResult` `usePaginatedQuery` expects. */
function toPage<TDoc extends VexDocument = VexDocument>(docs: TestDoc<"documents">[]): PaginationResult<TDoc> {
  // convex-test's schema-derived doc type has no index signature; `VexDocument` requires one,
  // and `VexMediaDocument` (the media list view's TDoc) requires media-specific fields none of
  // this suite's seeded rows carry (they only exercise the "no src" fallback rendering path).
  return { page: docs as unknown as TDoc[], continueCursor: "", isDone: true };
}

/** Inserts one "documents" row per title and returns the seeded rows, in insertion order. */
async function seedDocuments(t: ConvexTestInstance, titles: string[]): Promise<TestDoc<"documents">[]> {
  return t.run(async (ctx) => {
    const ids = await Promise.all(titles.map((title) => ctx.db.insert("documents", { title })));
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs.filter((doc): doc is TestDoc<"documents"> => doc !== null);
  });
}


/**
 * Full-mount `CollectionListView` — the SSR-preview stack transitively rendered here is
 * `DataTable` + `CreateDocumentModal` + `RevalidateButton`, exactly what an admin visits.
 *
 * `canDelete`'s only possible consumer is `DataTable`'s bulk-delete confirmation, but
 * `DataTable.tsx`'s bulk-actions bar (the only UI that ever calls `setDeleteModalOpen(true)`)
 * is commented out — `DataTableBulkActions` is exported but never rendered there. There is
 * therefore no `canDelete`-gated control in the DOM to assert a disabled state against;
 * asserting one would fabricate a query against markup that isn't rendered (RBAC-2 in
 * BUGS-REPORT.md). What IS checkable, and asserted below in a dedicated test, is the actual
 * safe consequence: no destructive control is reachable at all, gated or not — that test also
 * records the wiring requirement for whoever restores the bar. `canCreate` (the "+ New"
 * button) and `RevalidateButton` (the same "posts" resource, `update` action) ARE both
 * directly observable and are what the RBAC suite below gates on.
 */
function describeCollectionListView(options: { access?: VexAccessConfig }): void {
  describe("CollectionListView", () => {
    const t = convexTest(schema, testModules);
    let docs: TestDoc<"documents">[] = [];

    beforeAll(async () => {
      docs = await seedDocuments(t, ["First", "Second", "Third"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders rows from seeded data", () => {
      const utils = renderView(
        createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
        { convex: t },
      );
      expect(utils.getByText("3 documents")).toBeInTheDocument();
      expect(utils.getAllByRole("row")).toHaveLength(4); // 1 header row + 3 data rows
    });

    it("renders the empty state with zero documents", () => {
      const utils = renderView(
        createElement(CollectionListView, { collection: testCollection, initialData: toPage([]) }),
        { convex: t },
      );
      expect(utils.getByText("0 documents")).toBeInTheDocument();
      expect(utils.getAllByRole("row")).toHaveLength(1); // header row only
    });

    it("has no reachable destructive control while bulk-delete UI remains unwired", () => {
      const utils = renderView(
        createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
        { convex: t },
      );
      // `canDelete` (asserted nowhere in this suite — see doc comment above) has no live
      // consumer: `DataTable.tsx`'s bulk-actions bar, the only UI that ever calls
      // `setDeleteModalOpen(true)`, is commented out. WIRING FINDING for whoever restores
      // `DataTableBulkActions`: once it renders again, this suite needs a real
      // `canDelete`-gated assertion here (mirroring the "+ New" button's `aria-disabled`
      // check below), not this absence check.
      expect(utils.queryByRole("button", { name: /delete/i })).toBeNull();
    });

    it("renders without crashing when useAsTitle points at a non-text field", () => {
      // `useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>` (core/collections/types.ts:170)
      // accepts ANY field key, including a select/date/number column, not just a text one.
      // `getCollectionColumnDefs` (components/fields/index.tsx:220) marks whichever field's
      // key equals `useAsTitle` as `isTitleField` regardless of its type — the same shared
      // logic that makes Step 5's CELL-1 (9 of 12 Cell components silently ignore
      // `isTitleField`) reachable in the first place. This proves the full-mount list view
      // survives a non-text title column; whether that column ends up clickable is Step 5's
      // own contract, not asserted here.
      const priorityTitleCollection = {
        ...testCollection,
        fields: {
          ...testCollection.fields,
          priority: select({
            label: "Priority",
            options: [
              { label: "Low", value: "low" },
              { label: "High", value: "high" },
            ],
          }),
        },
        admin: { ...testCollection.admin, useAsTitle: "priority" },
        // `useAsTitle` is typed against `testCollection`'s own generated field-key union
        // ("status"), which doesn't include this test-local "priority" key — a real
        // collection's own `TFieldSlug` would. Cast at this boundary rather than widen the
        // shared fixture's type.
      } as unknown as typeof testCollection;
      const utils = renderView(
        createElement(CollectionListView, { collection: priorityTitleCollection, initialData: toPage(docs) }),
        { convex: t },
      );
      expect(utils.getAllByRole("row")).toHaveLength(4); // 1 header row + 3 data rows
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_POSTS[scenario.name as keyof RbacMatrix];
        const newLink = utils.container.querySelector('a[href="/admin/posts?createNew=true"]');
        expect(newLink).not.toBeNull();
        if (expected) {
          expect(newLink).not.toHaveAttribute("aria-disabled");
        } else {
          expect(newLink).toHaveAttribute("aria-disabled", "true");
        }
        const revalidateButton = utils.getByRole("button", { name: "Revalidate all" });
        if (expected) {
          expect(revalidateButton).not.toBeDisabled();
        } else {
          expect(revalidateButton).toBeDisabled();
        }
      },
    });
  });
}

/**
 * Full-mount `CollectionEditView`. `canEdit` gates the field input's `disabled` state
 * directly (`readOnly={!canEdit || field.admin.readOnly}` — text/Cell's own `disabled` prop);
 * it does NOT independently gate Save/Cancel, whose `disabled={!canEdit || isDefaultValue}`
 * is dominated by `isDefaultValue`, which is always `true` on first mount (the form has not
 * yet diverged from its own loaded defaults) regardless of `canEdit` — asserted explicitly
 * below rather than silently assumed.
 */
function describeCollectionEditView(options: { access?: VexAccessConfig }): void {
  describe("CollectionEditView", () => {
    const t = convexTest(schema, testModules);
    let doc: TestDoc<"documents">;

    beforeAll(async () => {
      [doc] = await seedDocuments(t, ["Existing Post"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(CollectionEditView, {
            collection: testCollection,
            documentId: doc._id,
            initialData: doc,
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("shows the not-found message when the document does not resolve", () => {
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection,
          documentId: doc._id,
          initialData: null,
        }),
        { convex: t },
      );
      expect(utils.getByText("Document not found.")).toBeInTheDocument();
    });

    it("renders an optional field that is entirely absent from the seeded document", () => {
      // `status` is `text({ index: "by_status" })` — `required: false` (text/config.ts:58) —
      // and `seedDocuments` only ever inserts `title` (the convex-test schema's one real
      // column), so `doc.status` is `undefined`, a genuinely MISSING key, not an empty
      // string. Proves the form mounts on the field's own default value instead of crashing
      // on the missing key.
      const utils = renderView(
        createElement(CollectionEditView, { collection: testCollection, documentId: doc._id, initialData: doc }),
        { convex: t },
      );
      const statusInput = utils.container.querySelector("#status") as HTMLInputElement;
      expect(statusInput).not.toBeNull();
      expect(statusInput.value).toBe("");
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(CollectionEditView, {
            collection: testCollection,
            documentId: doc._id,
            initialData: doc,
          }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_POSTS[scenario.name as keyof RbacMatrix];
        const statusInput = utils.container.querySelector("#status");
        expect(statusInput).not.toBeNull();
        if (expected) {
          expect(statusInput).not.toBeDisabled();
        } else {
          expect(statusInput).toBeDisabled();
        }
        const revalidateButton = utils.getByRole("button", { name: "Revalidate" });
        if (expected) {
          expect(revalidateButton).not.toBeDisabled();
        } else {
          expect(revalidateButton).toBeDisabled();
        }
        // isDefaultValue dominance (see doc comment above): Save/Cancel start disabled on
        // every scenario, including "allowed" — this is NOT canEdit's doing.
        expect(utils.getByRole("button", { name: "Save" })).toBeDisabled();
        expect(utils.getByRole("button", { name: "Cancel" })).toBeDisabled();
      },
    });
  });
}


/**
 * Full-mount `GlobalEditView`. `global` is always a resolved config object (never falsy in
 * practice), so its "not found" branch is unreachable from this suite — a global's OWN
 * document is optional-by-design (a global can be edited before it is ever saved), which is
 * exactly the state exercised here: no seeded convex-test data, no `initialData`.
 * `vexConvexApi.globals.get` resolves to function name `"vex/globals:get"`, which has no
 * `QUERY_HANDLERS` entry — the live background query errors harmlessly (TanStack Query
 * stores it as `isError`, it never throws into render), which is why no data ever needing
 * that handler is asserted here. `canEdit` checks the "settings" global, an UNDECLARED
 * resource in `testAccess` — see `MATRIX_UNDECLARED`'s derivation comment.
 */
function describeGlobalEditView(options: { access?: VexAccessConfig }): void {
  describe("GlobalEditView", () => {
    const t = convexTest(schema, testModules);

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(createElement(GlobalEditView, { global: testClientConfig.globals[0] }), {
          convex: t,
          access: options.access,
          auth: { user: null },
        });
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders the default field values when no document has ever been saved", () => {
      const utils = renderView(createElement(GlobalEditView, { global: testClientConfig.globals[0] }), { convex: t });
      const heading = utils.getByRole("heading", { level: 1 });
      expect(heading.textContent).toBe("Edit Global - Settings");
      expect(utils.container.querySelector("#siteName")).not.toBeNull();
    });

    runRbacStateSuite({
      render: () => wrapWithViewProviders(createElement(GlobalEditView, { global: testClientConfig.globals[0] }), { convex: t }),
      assert: (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
        const siteNameInput = utils.container.querySelector("#siteName");
        expect(siteNameInput).not.toBeNull();
        if (expected) {
          expect(siteNameInput).not.toBeDisabled();
        } else {
          expect(siteNameInput).toBeDisabled();
        }
        // isDefaultValue dominance, same as CollectionEditView: Save/Cancel start disabled
        // regardless of canEdit.
        expect(utils.getByRole("button", { name: "Save" })).toBeDisabled();
        expect(utils.getByRole("button", { name: "Cancel" })).toBeDisabled();
      },
    });
  });
}

/**
 * `GlobalsListView` reads only its `config` prop — no context, no `usePermission`, no
 * gating of its own (the sidebar and dashboard already filter which globals a caller ever
 * sees a link to). A plain render proves the card grid and its link targets.
 */
function describeGlobalsListView(_options: { access?: VexAccessConfig }): void {
  describe("GlobalsListView", () => {
    it("renders one card per configured global, linking to its edit route", () => {
      const utils = renderWithVexProviders(createElement(GlobalsListView, { config: testClientConfig }));
      expect(utils.getByText("Settings")).toBeInTheDocument();
      expect(utils.getByText("Edit Global")).toBeInTheDocument();
      const link = utils.container.querySelector('a[href="/admin/globals/settings"]');
      expect(link).not.toBeNull();
    });
  });
}

/**
 * `DashboardView` filters each section via `hasPermission` DIRECTLY (not `usePermission`),
 * reading `useVexAccess`/`useVexAuth` from context — the same providers
 * `renderWithVexProviders` supplies, so the real resolution path is exercised. The
 * "collections" filter is `read`+`scope:"any"` on "posts" (`MATRIX_POSTS_READ_ANY`); the
 * "media"/"globals" filters use the same shape against the undeclared "images"/"settings"
 * resources (`MATRIX_UNDECLARED`). Each section's heading and its cards live inside the SAME
 * `<Activity mode="hidden">`, which sets `style="display:none"` directly on that child
 * (verified empirically) rather than removing it from the DOM — so the heading is always
 * present and `toBeVisible()`/`not.toBeVisible()` is the correct assertion, not
 * `queryByText`.
 */
function describeDashboardView(options: { access?: VexAccessConfig }): void {
  describe("DashboardView", () => {
    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderWithVexProviders(
          createElement(DashboardView, { config: testClientConfig }),
          { access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      render: () => createElement(DashboardView, { config: testClientConfig }),
      assert: (utils, scenario) => {
        const name = scenario.name as keyof RbacMatrix;
        // `getByText`, not `getByRole`: the heading is always present in the DOM — only its
        // ancestor `Activity`'s `display:none` toggles — but a hidden element's ACCESSIBLE
        // NAME computes to "" (verified empirically), so `getByRole("heading", { name, hidden:
        // true })` still fails to match even with `hidden: true` bypassing the role-inclusion
        // filter. Plain text content is unaffected by that computation.
        const collectionsHeading = utils.getByText("Collections");
        const mediaHeading = utils.getByText("Media");
        const globalsHeading = utils.getByText("Globals");
        if (MATRIX_POSTS_READ_ANY[name]) {
          expect(collectionsHeading).toBeVisible();
        } else {
          expect(collectionsHeading).not.toBeVisible();
        }
        if (MATRIX_UNDECLARED[name]) {
          expect(mediaHeading).toBeVisible();
          expect(globalsHeading).toBeVisible();
        } else {
          expect(mediaHeading).not.toBeVisible();
          expect(globalsHeading).not.toBeVisible();
        }
      },
    });
  });
}

/**
 * `UnauthorizedView` reads no context and calls no permission hook — it is the destination a
 * failed `usePermission`/access check redirects to, not a component that performs one. A
 * plain render covers the default copy, the override props, and the optional action slot.
 */
function describeUnauthorizedView(_options: { access?: VexAccessConfig }): void {
  describe("UnauthorizedView", () => {
    it("renders the default title and description with no children", () => {
      const utils = renderWithVexProviders(createElement(UnauthorizedView, null));
      expect(utils.getByText("Access denied")).toBeInTheDocument();
      expect(
        utils.getByText("You do not have permission to access the admin panel."),
      ).toBeInTheDocument();
    });

    it("renders overridden title/description and an action slot", () => {
      const utils = renderWithVexProviders(
        createElement(
          UnauthorizedView,
          { title: "Nope", description: "Ask an admin." },
          createElement("a", { href: "/" }, "Return to site"),
        ),
      );
      expect(utils.getByText("Nope")).toBeInTheDocument();
      expect(utils.getByText("Ask an admin.")).toBeInTheDocument();
      expect(utils.getByText("Return to site")).toBeInTheDocument();
    });
  });
}


/**
 * Full-mount `MediaCollectionListView` against `testClientConfig`'s `images` media
 * collection. Seeded rows carry no `src`, so the preview column takes the "no src" fallback
 * branch (a 📄 placeholder tile) rather than mounting `FilePreview` — `FilePreview` itself
 * requires a real `mimeType`, which this suite's convex-test schema (one `documents` table,
 * `title` only) does not carry.
 *
 * Unlike `CollectionListView`'s "+ New" button (`disabled={!canCreate}`), the "+ Upload"
 * button here carries no `disabled` prop at all — this component never calls `usePermission`
 * for the create action (RBAC-2 in BUGS-REPORT.md). The RBAC suite below asserts the
 * INTENDED contract — Upload gated on create permission, the same as `CollectionListView`'s
 * New button — and fails on every scenario where that gate is missing; see the `assert`
 * callback. `canDelete` has the same dead-code gap as `CollectionListView`'s own (`DataTable`'s
 * bulk-delete bar is commented out); see the dedicated "no reachable destructive control"
 * test below rather than a fabricated `canDelete`-gated assertion here.
 */
function describeMediaCollectionListView(options: { access?: VexAccessConfig }): void {
  describe("MediaCollectionListView", () => {
    const t = convexTest(schema, testModules);
    let docs: TestDoc<"documents">[] = [];

    beforeAll(async () => {
      docs = await seedDocuments(t, ["photo-one", "photo-two"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(MediaCollectionListView, {
            collection: testClientConfig.mediaCollections[0],
            initialData: toPage<VexMediaDocument>(docs),
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders rows from seeded data", () => {
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0],
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t },
      );
      expect(utils.getByText("2 items")).toBeInTheDocument();
      expect(utils.getAllByRole("row")).toHaveLength(3); // 1 header row + 2 data rows
    });

    it("renders the empty state with zero items", () => {
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0],
          initialData: toPage<VexMediaDocument>([]),
        }),
        { convex: t },
      );
      expect(utils.getByText(/No images yet/)).toBeInTheDocument();
      expect(utils.getByText("Upload one.")).toBeInTheDocument();
      expect(utils.queryAllByRole("row")).toHaveLength(0);
    });

    it("has no reachable destructive control while bulk-delete UI remains unwired", () => {
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0],
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t },
      );
      // Same dead-code gap as CollectionListView's own canDelete: `DataTable.tsx`'s
      // bulk-actions bar is commented out, so there is nothing in the DOM to gate. WIRING
      // FINDING for whoever restores it: this suite then needs a real canDelete-gated
      // assertion here.
      expect(utils.queryByRole("button", { name: /delete/i })).toBeNull();
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(MediaCollectionListView, {
            collection: testClientConfig.mediaCollections[0],
            initialData: toPage<VexMediaDocument>(docs),
          }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
        expect(utils.getByText("2 items")).toBeInTheDocument();
        const uploadLink = utils.container.querySelector('a[href="/admin/images?upload=true"]');
        expect(uploadLink).not.toBeNull();
        if (expected) {
          expect(uploadLink).not.toHaveAttribute("aria-disabled");
        } else {
          // FAILS: MediaCollectionListView never calls usePermission for the create action —
          // the Upload button carries no disabled prop at all, unlike CollectionListView's
          // "+ New" button (disabled={!canCreate}) — see BUGS-REPORT RBAC-2
          expect(uploadLink).toHaveAttribute("aria-disabled", "true");
        }
      },
    });
  });
}

/**
 * Full-mount `MediaCollectionEditView` against the `images` media collection. `canEdit`
 * gates the `alt` field's `disabled` state (same mechanism as `CollectionEditView`), but —
 * UNLIKE `CollectionEditView`/`GlobalEditView` — Save/Cancel's `disabled={isDefaultValue}`
 * (MediaCollectionEditView.tsx:139,147) never references `canEdit`, unlike its siblings'
 * `disabled={!canEdit || isDefaultValue}` (RBAC-1 in BUGS-REPORT.md). The RBAC suite below
 * asserts the INTENDED contract — Save/Cancel gate on `canEdit`, matching the sibling views
 * — and fails where it doesn't hold. On first mount `isDefaultValue` is always `true`
 * regardless of `canEdit`, which would make any assertion here pass vacuously, so the
 * `assert` callback forces the form dirty first via `fireEvent.change` directly on the
 * `#alt` DOM node — verified to fire even through a `disabled` attribute, the same bypass an
 * attacker's devtools console or a scripted client has available, exactly why a client-only
 * `disabled` is not a security boundary. **Not currently exploitable through the rendered
 * UI**: the `alt` field itself is `readOnly`/`disabled` whenever `canEdit` is false
 * (`readOnly={field.admin.readOnly || !canEdit}`, line 172), so a real user cannot diverge
 * the form through normal interaction — this is a defense-in-depth gap, not a live
 * privilege-escalation path; server-side enforcement is the actual gate.
 */
function describeMediaCollectionEditView(options: { access?: VexAccessConfig }): void {
  describe("MediaCollectionEditView", () => {
    const t = convexTest(schema, testModules);
    let doc: TestDoc<"documents">;

    beforeAll(async () => {
      [doc] = await seedDocuments(t, ["existing-photo"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(MediaCollectionEditView, {
            collection: testClientConfig.mediaCollections[0],
            documentId: doc._id,
            // convex-test's seeded doc has no VexMediaDocument fields (mimeType/src/filename);
            // the view only reads `_id` (admin.useAsTitle) and `alt` (its one field) from it.
            initialData: doc as unknown as VexMediaDocument,
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(MediaCollectionEditView, {
            collection: testClientConfig.mediaCollections[0],
            documentId: doc._id,
            // convex-test's seeded doc has no VexMediaDocument fields (mimeType/src/filename); the view
          // only reads `_id` (admin.useAsTitle) and `alt` (its one field) from it.
          initialData: doc as unknown as VexMediaDocument,
          }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
        const altInput = utils.container.querySelector("#alt") as HTMLInputElement;
        expect(altInput).not.toBeNull();
        if (expected) {
          expect(altInput).not.toBeDisabled();
        } else {
          expect(altInput).toBeDisabled();
        }
        // Save/Cancel start disabled on every scenario regardless of canEdit (isDefaultValue
        // dominance, same quirk as CollectionEditView/GlobalEditView) — that alone can't
        // distinguish this view's gate from the sibling views' intended
        // `!canEdit || isDefaultValue` gate. Force the form dirty first (see doc comment
        // above for why `fireEvent.change` on a disabled input is the right tool here).
        fireEvent.change(altInput, { target: { value: "changed" } });
        const saveButton = utils.getByRole("button", { name: "Save" });
        const cancelButton = utils.getByRole("button", { name: "Cancel" });
        if (expected) {
          expect(saveButton).not.toBeDisabled();
          expect(cancelButton).not.toBeDisabled();
        } else {
          // FAILS: MediaCollectionEditView's Save/Cancel disabled={isDefaultValue} never
          // checks canEdit, unlike CollectionEditView/GlobalEditView's
          // `!canEdit || isDefaultValue` — see BUGS-REPORT RBAC-1
          expect(saveButton).toBeDisabled();
          expect(cancelButton).toBeDisabled();
        }
      },
    });
  });
}


/**
 * Standalone `AppSidebar` (not wrapped in `AdminLayout`, which provides its own
 * `VexAuthProvider` that would shadow `renderWithVexProviders`'s per-scenario `auth` — see
 * `AdminLayout`'s own doc comment below). Needs `ThemeProvider` (for `ThemeToggle`) and
 * `SidebarProvider` (documented on `AppSidebar` itself) but no Convex/QueryClient/nuqs — it
 * calls neither `useQuery` nor `useQueryState`. All three nav sections' `usePermission`
 * calls use `read`+`scope:"any"`: "posts" (`MATRIX_POSTS_READ_ANY`), "settings"/"images"
 * (`MATRIX_UNDECLARED` — undeclared resources, same derivation as `GlobalEditView`).
 */
function describeAdminSidebar(options: { access?: VexAccessConfig }): void {
  describe("AdminSidebar", () => {
    function mount() {
      return createElement(
        ThemeProvider,
        null,
        createElement(SidebarProvider, null, createElement(AppSidebar, { config: testClientConfig })),
      );
    }

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderWithVexProviders(mount(), {
          access: options.access,
          auth: { user: null },
        });
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      render: () => mount(),
      assert: (utils, scenario) => {
        const name = scenario.name as keyof RbacMatrix;
        const postsLink = utils.container.querySelector('a[href="/admin/posts"]');
        const settingsLink = utils.container.querySelector('a[href="/admin/globals/settings"]');
        const imagesLink = utils.container.querySelector('a[href="/admin/images"]');
        // Unlike `DashboardView`'s heading (always rendered, only its visibility toggles),
        // `AppSidebar` maps the FILTERED array directly — with exactly one collection/global/
        // media collection in `testClientConfig`, a denied permission means that array is
        // empty and the corresponding nav link does not exist in the DOM at all, not merely
        // hidden.
        if (MATRIX_POSTS_READ_ANY[name]) {
          expect(postsLink).not.toBeNull();
          expect(postsLink).toBeVisible();
        } else {
          expect(postsLink).toBeNull();
        }
        if (MATRIX_UNDECLARED[name]) {
          expect(settingsLink).not.toBeNull();
          expect(settingsLink).toBeVisible();
          expect(imagesLink).not.toBeNull();
          expect(imagesLink).toBeVisible();
        } else {
          expect(settingsLink).toBeNull();
          expect(imagesLink).toBeNull();
        }
        if (!MATRIX_POSTS_READ_ANY[name] && !MATRIX_UNDECLARED[name]) {
          // "anonymous"/"denied" deny every one of testClientConfig's three nav categories
          // simultaneously — the sidebar's own nav list renders with ZERO items rather than
          // crashing on an empty filtered array or leaving a stale/placeholder entry behind.
          expect(utils.container.querySelectorAll('[data-slot="sidebar-menu-button"]')).toHaveLength(0);
        }
      },
    });
  });
}

/**
 * Full `AdminLayout` shell: framework Link/Image injection and active-route highlighting.
 * `AdminLayout` calls no `usePermission`/`hasPermission` itself, but it renders `AppSidebar`
 * internally, whose nav entries ARE permission-filtered — so the active-route assertion below
 * (which asserts the "posts" sidebar entry exists AND is marked active) is only valid against
 * the DEFAULT `testAccess`-driven visibility, not an arbitrary caller-supplied config that may
 * deny "posts" outright. `AdminLayout` also provides its OWN internal
 * `VexConfigContext.Provider`/`VexAuthProvider`/`FrameworkComponentsContext.Provider` (see its
 * render implementation), so an outer `auth` value never reaches its children either — a real
 * per-scenario RBAC-gating test belongs on `AppSidebar` directly (above), which has no such
 * internal provider to shadow it. Same two-mode split as every other member: default drives
 * the real assertions below; a caller-supplied `access` downgrades to a non-crashing mount.
 */
function describeAdminLayout(options: { access?: VexAccessConfig }): void {
  describe("AdminLayout", () => {
    const t = convexTest(schema, testModules);

    function StubLink({ href, children, ...rest }: VexLinkProps) {
      return createElement("a", { "data-stub-link": "true", href, ...rest }, children);
    }
    function StubImage(props: { src: string; alt: string }) {
      return createElement("img", { "data-stub-image": "true", ...props });
    }
    function ImageProbe() {
      const { Image } = useFrameworkComponents();
      return createElement(
        "span",
        { "data-testid": "image-probe" },
        Image === StubImage ? "stub" : "native",
      );
    }

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(AdminLayout, {
            config: testClientConfig,
            pathname: "/admin/posts",
            activeSlug: "posts",
            children: createElement("div", null, "content"),
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("injects the framework Link/Image overrides into the tree it wraps", () => {
      const utils = renderView(
        createElement(
          AdminLayout,
          {
            config: testClientConfig,
            pathname: "/admin/posts",
            activeSlug: "posts",
            components: { Link: StubLink, Image: StubImage },
            children: createElement(ImageProbe),
          },
        ),
        { convex: t },
      );
      const stubLinks = utils.container.querySelectorAll('[data-stub-link="true"]');
      expect(stubLinks.length).toBeGreaterThan(0);
      expect(utils.getByTestId("image-probe").textContent).toBe("stub");
    });

    it("marks the active collection's nav entry and leaves the others inactive", () => {
      const utils = renderView(
        createElement(AdminLayout, {
          config: testClientConfig,
          pathname: "/admin/posts",
          activeSlug: "posts",
          children: createElement("div", null, "content"),
        }),
        { convex: t },
      );
      // Scoped to `[data-slot="sidebar-menu-button"]`: AdminTopNav's breadcrumb ALSO renders
      // an `<a href="/admin/posts">` (unrelated to `isActive`), so an unscoped href selector
      // is ambiguous the moment the sidebar entry itself is ever absent.
      const postsLink = utils.container.querySelector(
        'a[data-slot="sidebar-menu-button"][href="/admin/posts"]',
      );
      const imagesLink = utils.container.querySelector(
        'a[data-slot="sidebar-menu-button"][href="/admin/images"]',
      );
      expect(postsLink).toHaveAttribute("data-active");
      expect(imagesLink).not.toHaveAttribute("data-active");
    });
  });
}

/**
 * Standalone `AdminTopNav`: breadcrumb rendering, the "skip" sentinel on globals routes, and
 * framework Link injection. No RBAC surface of its own (no `usePermission`/`hasPermission`
 * call), so `options.access` is threaded through for a non-crashing smoke check only.
 */
function describeAdminTopNav(options: { access?: VexAccessConfig }): void {
  describe("AdminTopNav", () => {
    const t = convexTest(schema, testModules);

    it("renders the breadcrumb trail for an active collection route", () => {
      const utils = renderView(
        createElement(AdminTopNav, {
          config: testClientConfig,
          pathname: "/admin/posts",
          activeSlug: "posts",
          children: null,
        }),
        { convex: t, access: options.access },
      );
      expect(utils.getByText("Home")).toBeInTheDocument();
      expect(utils.getByText("Postses")).toBeInTheDocument();
      expect(utils.container.querySelector('a[href="/admin"]')).not.toBeNull();
      expect(utils.container.querySelector('a[href="/admin/posts"]')).not.toBeNull();
    });

    it('resolves a globals route through the "skip" sentinel with no document fetch', () => {
      const utils = renderView(
        createElement(AdminTopNav, {
          config: testClientConfig,
          pathname: "/admin/globals/settings",
          activeSlug: "globals",
          activeDocID: "settings",
          children: null,
        }),
        { convex: t, access: options.access },
      );
      expect(utils.getByText("Home")).toBeInTheDocument();
      expect(utils.getByText("Globals")).toBeInTheDocument();
      expect(utils.getByText("Settings")).toBeInTheDocument();
      expect(utils.container.querySelector('a[href="/admin/globals/settings"]')).not.toBeNull();
    });

    it("renders only the Home crumb for an unknown collection slug", () => {
      const utils = renderView(
        createElement(AdminTopNav, {
          config: testClientConfig,
          pathname: "/admin/does-not-exist",
          activeSlug: "does-not-exist",
          children: null,
        }),
        { convex: t, access: options.access },
      );
      // `activeCollection` resolves to `undefined` (not in `config.collections` or
      // `config.mediaCollections`) and `isGlobals` is false, so neither crumb-building
      // branch fires (AdminTopNav.tsx:77,90) — the breadcrumb degrades to just "Home" rather
      // than crashing or showing a stale/wrong label.
      expect(utils.getByText("Home")).toBeInTheDocument();
      expect(utils.container.querySelectorAll("a")).toHaveLength(1);
    });

    it("injects the framework Link override into every breadcrumb", () => {
      function StubLink({ href, children, ...rest }: VexLinkProps) {
        return createElement("a", { "data-stub-link": "true", href, ...rest }, children);
      }
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          { value: { Link: StubLink } as FrameworkComponents },
          createElement(AdminTopNav, {
            config: testClientConfig,
            pathname: "/admin/posts",
            activeSlug: "posts",
            children: null,
          }),
        ),
        { convex: t },
      );
      expect(utils.container.querySelectorAll('[data-stub-link="true"]').length).toBeGreaterThan(0);
    });
  });
}


/** A view this suite covers, named as a caller would reference the component. */
export type ViewSuiteMember =
  | "CollectionListView"
  | "CollectionEditView"
  | "GlobalEditView"
  | "GlobalsListView"
  | "DashboardView"
  | "UnauthorizedView"
  | "MediaCollectionListView"
  | "MediaCollectionEditView";

const ALL_VIEW_MEMBERS: ViewSuiteMember[] = [
  "CollectionListView",
  "CollectionEditView",
  "GlobalEditView",
  "GlobalsListView",
  "DashboardView",
  "UnauthorizedView",
  "MediaCollectionListView",
  "MediaCollectionEditView",
];

/** Options for {@link runViewSuite}. */
export interface ViewSuiteOptions {
  /** Views to run. Defaults to all eight. */
  only?: ViewSuiteMember[];
  /**
   * A real `VexAccessConfig` to render every selected view against. Omit to drive the full
   * 5-scenario RBAC gating matrix through the shared `testAccess`/`testUsers` fixtures
   * (`runRbacStateSuite`'s default scenarios). When supplied, this suite cannot assume the
   * caller's role names or granted resources, so it downgrades to a single non-crashing mount
   * per view under the supplied config — the same smoke-check semantics
   * `runVexReactSuite`'s own `access` option already uses.
   */
  access?: VexAccessConfig;
}

/**
 * Runs the full views section: all eight admin views, full-mount against seeded
 * convex-test data. Call at module top level inside a `*.test.ts(x)` file — it calls
 * `describe`/`it` itself.
 *
 * @param options - Which views to run and an optional caller-supplied access config.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runViewSuite(options?: ViewSuiteOptions): void {
  const only = options?.only ?? ALL_VIEW_MEMBERS;
  const access = options?.access;
  if (only.includes("CollectionListView")) describeCollectionListView({ access });
  if (only.includes("CollectionEditView")) describeCollectionEditView({ access });
  if (only.includes("GlobalEditView")) describeGlobalEditView({ access });
  if (only.includes("GlobalsListView")) describeGlobalsListView({ access });
  if (only.includes("DashboardView")) describeDashboardView({ access });
  if (only.includes("UnauthorizedView")) describeUnauthorizedView({ access });
  if (only.includes("MediaCollectionListView")) describeMediaCollectionListView({ access });
  if (only.includes("MediaCollectionEditView")) describeMediaCollectionEditView({ access });
}

/** A shell component this suite covers, named as a caller would reference the component. */
export type ShellSuiteMember = "AdminLayout" | "AdminSidebar" | "AdminTopNav";

const ALL_SHELL_MEMBERS: ShellSuiteMember[] = ["AdminLayout", "AdminSidebar", "AdminTopNav"];

/** Options for {@link runShellSuite}. */
export interface ShellSuiteOptions {
  /** Shell components to run. Defaults to all three. */
  only?: ShellSuiteMember[];
  /**
   * A real `VexAccessConfig` to render every selected component against. Same two-mode split
   * as {@link ViewSuiteOptions.access}: omitted drives `AdminSidebar`'s full 5-scenario RBAC
   * matrix; supplied downgrades it to a non-crashing smoke mount. `AdminLayout`/`AdminTopNav`
   * have no RBAC surface of their own (see their own doc comments) and only use this to prove
   * a caller's config does not crash the mount.
   */
  access?: VexAccessConfig;
}

/**
 * Runs the full shell section: `AdminLayout`, `AdminSidebar`, `AdminTopNav`. Call at module
 * top level inside a `*.test.ts(x)` file — it calls `describe`/`it` itself.
 *
 * @param options - Which shell components to run and an optional caller-supplied access config.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runShellSuite(options?: ShellSuiteOptions): void {
  const only = options?.only ?? ALL_SHELL_MEMBERS;
  const access = options?.access;
  if (only.includes("AdminLayout")) describeAdminLayout({ access });
  if (only.includes("AdminSidebar")) describeAdminSidebar({ access });
  if (only.includes("AdminTopNav")) describeAdminTopNav({ access });
}
```

#### packages/react/src/components/views/CollectionListView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["CollectionListView"] });
```

#### packages/react/src/components/views/CollectionEditView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["CollectionEditView"] });
```

#### packages/react/src/components/views/GlobalEditView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["GlobalEditView"] });
```

#### packages/react/src/components/views/GlobalsListView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["GlobalsListView"] });
```

#### packages/react/src/components/views/DashboardView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["DashboardView"] });
```

#### packages/react/src/components/views/UnauthorizedView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["UnauthorizedView"] });
```

#### packages/react/src/components/views/MediaCollectionListView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["MediaCollectionListView"] });
```

#### packages/react/src/components/views/MediaCollectionEditView.test.tsx

```tsx
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["MediaCollectionEditView"] });
```

#### packages/react/src/components/AdminSidebar.test.tsx

```tsx
import { runShellSuite } from "../testing/viewSuite";

runShellSuite({ only: ["AdminSidebar"] });
```

#### packages/react/src/components/AdminLayout.test.tsx

```tsx
import { runShellSuite } from "../testing/viewSuite";

runShellSuite({ only: ["AdminLayout"] });
```

#### packages/react/src/components/AdminTopNav.test.tsx

```tsx
import { runShellSuite } from "../testing/viewSuite";

runShellSuite({ only: ["AdminTopNav"] });
```

Verify: node scripts/record-test-findings.mjs packages/react/src/components/views/{CollectionListView,CollectionEditView,GlobalEditView,GlobalsListView,DashboardView,UnauthorizedView,MediaCollectionListView,MediaCollectionEditView}.test.tsx packages/react/src/components/{AdminLayout,AdminSidebar,AdminTopNav}.test.tsx

## Step 5 — List view: Cell contract factory + per-type cells + columnDefs + data table

**[agent]**
Why: 166 statements at 0% across 26 files. A registry-driven Cell factory mirrors
`runFieldInputContractSuite` exactly, so all 12 types share the null-placeholder and a11y
assertions while each keeps its own rendering in `extra`. The data table is the component the
cells render inside, so it belongs in the same group.


**Corrections to the frozen contract, verified by direct read of every `Cell.tsx` and
`columnDef.tsx` (all findings below were empirically reproduced with real `vitest` runs,
not inferred):**

- **CELL-1 is 10 types, not 9.** `color/Cell.tsx` never reads `props.isTitleField` at all —
  its JSDoc `@example` mentioning `isTitleField={false}` was miscounted as a real branch in
  the original audit. Only `text` and `url` genuinely honor the prop. Failing:
  `number`, `checkbox`, `date`, `select`, `upload`, `relationship`, `array`, `group`,
  `blocks`, `color`.
- **CELL-2's "currently passing" set is `{text, url}` only, not `{text, url, upload,
  group}`.** `upload/Cell.tsx`'s filename truncation is CSS `text-ellipsis` — the full
  filename stays in `textContent` and there is no `title` attribute. `group/Cell.tsx`
  never sets a `title` attribute at all; its `"{ N keys }"` summary is a fixed-format
  string that never needs cutting. Both fail an assertion of "value cut + full value on a
  `title` attribute". Failing (6): `relationship`, `select`, `array`, `blocks`, `upload`,
  `group`. Passing (2): `text`, `url`. Opted out via `truncates: false` (4): `date`,
  `number`, `checkbox`, `color`.
- **New: CELL-3, null/undefined placeholder handling — 7 of 12 types fail, 2 are
  CRITICAL.** `text/Cell.tsx:31` and `array/Cell.tsx:24` call `.length` directly on
  `props.value` with zero guard — an uncaught `TypeError` that takes out the entire table
  render, not one cell, reachable through any optional `text()`/`array()` field on a
  document written before that field existed. `url`, `color`, `date` return `null` for a
  falsy value (renders nothing, not "—"); `number` and `select` render an empty node.
  Passing (5, all with an explicit null/undefined guard): `checkbox`, `group`, `blocks`,
  `upload`, `relationship` — `checkbox/Cell.tsx`'s is the simplest and is this step's
  reference implementation for the base contract's em-dash assertion (`text/Cell.tsx`
  remains the reference for `isTitleField` linking and truncation only — its own JSDoc
  claims null-handling it doesn't have).
- `text/Cell.tsx`'s JSDoc says "80 characters"; the code truncates at 77. The tested
  threshold is 77 (what the code does); the doc/code divergence is noted here for Step 9,
  not silently fixed.
- `array()`'s config default (`packages/core/src/fields/array/config.ts`) always supplies
  `labels: { singular: "Item", plural: "Items" }`, so `ArrayFieldCell`'s bare
  `"item"/"items"` fallback (reached only when `fieldDef.labels` is falsy) is unreachable
  through the public builder — `array/Cell.test.tsx`'s own-rendering assertions test the
  real default wording, not that unreachable fallback.
- `getCollectionColumnDefs`'s `meta` is untyped against `@tanstack/react-table`'s
  `ColumnMeta` (an intentionally empty, consumer-augmented interface this package never
  augments) — every columnDef test reads it back through a local `CellColumnMeta` type
  rather than the library's own.
- The Verify command below lists all 12 `Cell.test.tsx` paths explicitly rather than
  spec-tasks.md's `"…/fields/*/Cell.test.tsx"` glob: `packages/react/src/components/fields/`
  also holds `index.test.tsx` (registry-parity test) and `index.tsx`, and this shell's glob
  expansion includes both as spurious `*` matches (`fields/index.test.tsx/Cell.test.tsx`),
  which `record-test-findings.mjs` correctly rejects as "not found" — reproduced directly.
  An acceptance criterion that has never been run is a guess (AP-012); this one was run.

#### packages/react/src/testing/fieldCellContract.ts

```ts
import { createElement, type ComponentType } from "react";
import { cleanup, render, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import { afterEach, describe, expect, it } from "vitest";
import type { AdminField, CellComponentProps, CollectionConfig, TDocument } from "@vexcms/core";

import { expectNoA11yViolations } from "./a11y";
import { testCollection } from "./harness/accessFixtures";
import type { FieldFixture } from "./fixtures/types";

/** Options for {@link runFieldCellContractSuite}. */
export interface FieldCellContractOptions<
  TField extends AdminField = AdminField,
  TValue = unknown,
> {
  /** The field type's fixture — supplies `fieldDef` and a representative `valid` value. */
  fixture: FieldFixture<TField, TValue>;
  /** The field's registered Cell component, e.g. `TextFieldCell`. */
  Component: ComponentType<CellComponentProps<TField, TDocument>>;
  /** Parent collection config forwarded to every render. Defaults to `testCollection` ("posts"). */
  collection?: CollectionConfig;
  /**
   * Truncation threshold. Defaults to 77 — `text/Cell.tsx`'s own cutoff — and the
   * assertion runs by DEFAULT. Pass `false` ONLY for the four types where truncation
   * is meaningless: `date` (fixed format), `number`, `checkbox` (boolean), and `color`
   * (`#e8622a`).
   */
  truncates?: number | false;
  /** Type-specific rendering assertions, appended inside the same `describe` block. */
  extra?: (options: FieldCellContractOptions<TField, TValue>) => void;
}

/** The `fieldKey` every base-contract render registers its value under. */
const FIELD_KEY = "field";

/** The document `_id` used when rendering with `isTitleField: true`. */
const TITLE_ROW_ID = "doc_title_1";

/** Default truncation threshold — `text/Cell.tsx`'s own cutoff (its JSDoc says "80"; the code says 77 — a doc/code divergence noted in this step's own notes, not corrected here). */
const DEFAULT_TRUNCATE_THRESHOLD = 77;

/**
 * Minimal test double for TanStack Table's `Row`. Every Cell this factory exercises
 * reads only two members: `.original` (`RelationshipFieldCell` keys off it directly,
 * bypassing `props.value` entirely) and `.getValue` (every `columnDef`'s own `cell`
 * closure calls it) — every other `Row` method is unused at this boundary, so this is
 * not a fake instance of the library type, only a stand-in for the slice actually read.
 *
 * @param props - Row construction props.
 * @param props.fieldKey - Key the value is stored under on `row.original`.
 * @param props.value - The value to store at `original[fieldKey]`.
 * @param props.id - `_id` for the row's `original`. Defaults to a fixed stub id.
 * @returns A `Row` stand-in carrying `.original` and `.getValue`.
 */
export function makeCellRow<TData extends TDocument>(props: {
  fieldKey: string;
  value: unknown;
  id?: string;
}): Row<TData> {
  const original = { _id: props.id ?? "doc_1", [props.fieldKey]: props.value } as unknown as TData;
  // Test-only stand-in for a `@tanstack/react-table` `Row` — see the JSDoc above for
  // why only `.original`/`.getValue` are populated.
  return {
    original,
    getValue: (key: string) => (original as Record<string, unknown>)[key],
  } as unknown as Row<TData>;
}

/**
 * Derives a value that exceeds `threshold` from a fixture's `valid` value, generically
 * across value shapes: a string is repeated until long enough to slice; an array is
 * duplicated until its serialized length exceeds the threshold (so a renderer that
 * concatenates item text — chips, badges, counts — has enough material to overflow
 * regardless of per-item formatting); a plain object gains synthetic keys the same way.
 * Anything else is returned unchanged — no currently-registered field type reaches
 * that branch.
 *
 * @param valid - A representative valid value, from the field's own fixture.
 * @param threshold - The truncation threshold under test.
 * @returns A same-shaped value whose serialized form exceeds `threshold`.
 */
function buildOverLengthValue(valid: unknown, threshold: number): unknown {
  const target = threshold + 25;
  if (typeof valid === "string") {
    const unit = valid.length > 0 ? valid : "x";
    return unit.repeat(Math.ceil(target / unit.length));
  }
  if (Array.isArray(valid)) {
    const out: unknown[] = [];
    while (JSON.stringify(out).length <= target && out.length < 500) {
      out.push(...valid);
    }
    return out.length > 0 ? out : valid;
  }
  if (valid !== null && typeof valid === "object") {
    const out: Record<string, unknown> = { ...(valid as Record<string, unknown>) };
    let i = 0;
    while (JSON.stringify(out).length <= target && i < 200) {
      out[`extra_${i}`] = "x".repeat(20);
      i += 1;
    }
    return out;
  }
  return valid;
}

/**
 * Runs the shared Cell contract every field type's data-table cell owes, regardless of
 * type. Mirrors `runFieldInputContractSuite`'s shape: base assertions here, everything
 * type-specific in `extra`.
 *
 * Base assertions:
 * 1. Renders the em-dash placeholder for a `null`/`undefined` value. Reference:
 *    `checkbox/Cell.tsx` — `if (props.value === undefined || props.value === null)
 *    return <span>—</span>;` — the simplest of the five Cells that actually implement
 *    this (checkbox, group, blocks, upload, relationship). The other seven either
 *    crash with no guard at all (`text`, `array` — real, critical-severity defects: an
 *    uncaught render error takes out the whole table, not one cell) or silently render
 *    nothing / an empty node instead of "—" (`url`, `color`, `date`, `number`,
 *    `select`) — this assertion is written to surface those, not written assuming they
 *    pass.
 * 2. When `isTitleField` is `true`, wraps the rendered value in a link to
 *    `${addLeadingSlash(config.basePath)}/${collection.slug}/${row.original._id}`.
 *    Reference: `text/Cell.tsx:27-34`. `useVexConfig()` falls back to
 *    `defineConfig()`'s default `basePath: "/admin"` with no provider mounted, so the
 *    expected href is computed the same way here, with no `VexConfigContext.Provider`
 *    needed.
 * 3. Unless `truncates: false`, a value past the threshold is cut and the full value
 *    appears on a `title` attribute. Reference: `text/Cell.tsx`'s own
 *    `value.length > 77 ? slice(0, 77) + "..." : value` plus `title={props.value}`.
 * 4. Zero accessibility violations on the type's own `valid` value.
 *
 * @param options - The field's fixture, component, and contract options.
 */
export function runFieldCellContractSuite<TField extends AdminField, TValue>(
  options: FieldCellContractOptions<TField, TValue>,
): void {
  const { fixture, Component, extra } = options;
  const collection = options.collection ?? testCollection;
  const truncates = options.truncates ?? DEFAULT_TRUNCATE_THRESHOLD;

  function renderCell(props: { value: unknown; isTitleField?: boolean; id?: string }): RenderResult {
    // A `QueryClient` whose default `queryFn` never resolves — the same pattern
    // `upload/Input.test.tsx` uses for `UploadFieldCell`'s real `useQuery(get(...))`
    // call: a deterministic pending state, no real network call, no "No queryFn was
    // passed" console noise. Harmless for the other 11 types, which never call
    // `useQuery`.
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
    });
    const row = makeCellRow<TDocument>({ fieldKey: FIELD_KEY, value: props.value, id: props.id });
    const cellProps: CellComponentProps<TField, TDocument> = {
      // Boundary cast: this factory intentionally stays generic over `unknown` so
      // every type shares one render path, including deliberately invalid inputs
      // (null, undefined, over-length values) the real `TField["defaultValue"]` would
      // reject — that's the whole point of the base contract's assertions.
      value: props.value as TField["defaultValue"],
      row,
      fieldDef: fixture.fieldDef,
      fieldKey: FIELD_KEY,
      isTitleField: props.isTitleField ?? false,
      collection,
    };
    return render(
      createElement(QueryClientProvider, { client: queryClient }, createElement(Component, cellProps)),
    );
  }

  describe(`${fixture.fieldType} Cell — shared contract`, () => {
    afterEach(() => cleanup());

    // Asserts the INTENDED contract — text/Cell.tsx's own JSDoc promises an em-dash
    // placeholder. Fails for 7 of 12 types; text and array CRASH on `.length` of null,
    // taking out the whole table render — see BUGS-REPORT CELL-3.
    it.each([
      ["null", null],
      ["undefined", undefined],
    ])("renders the em-dash placeholder for a %s value", (_label, value) => {
      const { container } = renderCell({ value });
      expect(container).toHaveTextContent("—");
    });

    // Asserts the INTENDED contract: `useAsTitle` accepts any field key, so every type
    // must handle being the title column. Fails for 10 of 12 — see BUGS-REPORT CELL-1.
    it("wraps the value in an edit link to the document when isTitleField is true", () => {
      const { container } = renderCell({ value: fixture.valid, isTitleField: true, id: TITLE_ROW_ID });
      const link = container.querySelector("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe(`/admin/${collection.slug}/${TITLE_ROW_ID}`);
    });

    if (truncates !== false) {
      const threshold = truncates;
      // Asserts the INTENDED contract. Fails for 6 of 12 — upload uses CSS-only
      // ellipsis and group sets no title attribute at all — see BUGS-REPORT CELL-2.
      it(`truncates a value past ${threshold} characters and keeps the full value on a title attribute`, () => {
        const longValue = buildOverLengthValue(fixture.valid, threshold);
        const { container } = renderCell({ value: longValue });
        const titled = container.querySelector("[title]");
        expect(titled).not.toBeNull();
        expect(titled?.getAttribute("title")?.length ?? 0).toBeGreaterThan(threshold);
      });
    }

    it("has zero accessibility violations", async () => {
      const { container } = renderCell({ value: fixture.valid });
      await expectNoA11yViolations(container);
    });

    extra?.(options);
  });
}
```

#### packages/react/src/testing/columnDefSuite.ts

```ts
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import type { CellContext, ColumnDefResolved } from "@tanstack/react-table";
import { defineCollection, type AdminField, type CellComponentProps, type TDocument } from "@vexcms/core";

import { fieldToCellComponent, getCollectionColumnDefs } from "../components/fields";
import { makeCellRow } from "./fieldCellContract";
import type { FieldFixture } from "./fixtures/types";

/**
 * `ColumnDef.meta` is TanStack Table's declaration-merge extension point — an empty
 * interface by design until a consumer augments it. This package doesn't, so the
 * shape every `columnDef.tsx` actually assigns (`label`, `align`, `isTitleField`) is
 * read back through this local type rather than the library's own (empty) one.
 */
interface CellColumnMeta {
  label: string;
  align: string;
  isTitleField: boolean;
}

/** The single field key every collection this suite builds registers its field under. */
const FIELD_KEY = "field";

/** Options for {@link runColumnDefSuite}. */
export interface ColumnDefSuiteOptions<TField extends AdminField = AdminField, TValue = unknown> {
  /** The field type's fixture — supplies `fieldDef`, `fieldType`, and a representative `valid` value. */
  fixture: FieldFixture<TField, TValue>;
}

/**
 * Builds a one-field collection wrapping `fieldDef` under {@link FIELD_KEY} — the same
 * shape `getCollectionColumnDefs` consumes in production — with `admin.useAsTitle`
 * optionally pointed at that field.
 *
 * @param props - Collection-building props.
 * @param props.fieldType - The field type, kept in the slug only so parallel suites never collide.
 * @param props.fieldDef - The field definition to register.
 * @param props.asTitle - Whether `admin.useAsTitle` should point at the registered field.
 * @returns A `CollectionConfig` with exactly one field.
 */
function buildTestCollection(props: { fieldType: string; fieldDef: AdminField; asTitle: boolean }) {
  return defineCollection({
    slug: `columndef_${props.fieldType}`,
    fields: { [FIELD_KEY]: props.fieldDef },
    ...(props.asTitle ? { admin: { useAsTitle: FIELD_KEY } } : {}),
  });
}

/**
 * Runs the shared `xxxFieldToColumnDef` contract every field type owes, driven through
 * the real `getCollectionColumnDefs` dispatcher rather than importing each type's own
 * builder directly: `id`/`accessorKey` set to the field key, `header` from the field's
 * label (falling back to the field key), `meta.align` from `fieldDef.admin.cellAlignment`,
 * `meta.isTitleField` following `collection.admin.useAsTitle`, and the `cell` closure
 * rendering the field's registered Cell component (`fieldToCellComponent`) with the
 * row's resolved value and forwarded props.
 *
 * @param options - The field type's fixture.
 */
export function runColumnDefSuite<TField extends AdminField, TValue>(
  options: ColumnDefSuiteOptions<TField, TValue>,
): void {
  const { fixture } = options;

  describe(`${fixture.fieldType}FieldToColumnDef (via getCollectionColumnDefs)`, () => {
    it("sets id and accessorKey to the field key", () => {
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: fixture.fieldDef,
        asTitle: false,
      });
      const [column] = getCollectionColumnDefs({ collection });
      const resolved = column as ColumnDefResolved<TDocument, TValue>;
      expect(resolved.id).toBe(FIELD_KEY);
      expect(resolved.accessorKey).toBe(FIELD_KEY);
    });

    it("uses the field's label as the header, falling back to the field key when unset", () => {
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: fixture.fieldDef,
        asTitle: false,
      });
      const [labeled] = getCollectionColumnDefs({ collection });
      // Most fixtures set a real `label`; a fixture that legitimately doesn't (e.g.
      // `relationshipFieldFixture`) already exercises the fallback here — this
      // assertion holds either way instead of assuming every fixture has a label.
      expect((labeled as ColumnDefResolved<TDocument, TValue>).header).toBe(
        fixture.fieldDef.label || FIELD_KEY,
      );

      const unlabeledCollection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: { ...fixture.fieldDef, label: "" },
        asTitle: false,
      });
      const [unlabeled] = getCollectionColumnDefs({ collection: unlabeledCollection });
      expect((unlabeled as ColumnDefResolved<TDocument, TValue>).header).toBe(FIELD_KEY);
    });

    it("reads meta.align from fieldDef.admin.cellAlignment and meta.isTitleField from collection.admin.useAsTitle", () => {
      const rightAligned = {
        ...fixture.fieldDef,
        admin: { ...fixture.fieldDef.admin, cellAlignment: "right" as const },
      };
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: rightAligned,
        asTitle: true,
      });
      const [column] = getCollectionColumnDefs({ collection });
      const meta = column.meta as CellColumnMeta; // see CellColumnMeta above
      expect(meta.align).toBe("right");
      expect(meta.isTitleField).toBe(true);
    });

    it("renders the registered Cell component with the row's resolved value and forwarded props", () => {
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: fixture.fieldDef,
        asTitle: true,
      });
      const [column] = getCollectionColumnDefs({ collection });
      const row = makeCellRow<TDocument>({ fieldKey: FIELD_KEY, value: fixture.valid });
      const context = { row } as unknown as CellContext<TDocument, TValue>;
      // `cell` is a closure over `xxxFieldToColumnDef`'s own props, never a registered
      // component reference — invoking it directly with a minimal `CellContext`
      // stand-in is the only way to assert both renderer identity and the exact props
      // it forwards without mounting a full table.
      const cellRenderer = column.cell as (
        ctx: CellContext<TDocument, TValue>,
      ) => ReactElement<CellComponentProps<TField, TDocument>>;
      const element = cellRenderer(context);
      expect(element.type).toBe(fieldToCellComponent(fixture.fieldType));
      expect(element.props).toMatchObject({
        value: fixture.valid,
        fieldKey: FIELD_KEY,
        isTitleField: true,
      });
    });
  });
}
```

#### packages/react/src/testing/dataTableSuite.tsx

```tsx
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import type { VexDocument } from "@vexcms/core";

import { DataTable } from "../components/ui/data-table/DataTable";
import { DataTablePagination } from "../components/ui/data-table/DataTablePagination";
import { DataTableBulkActions } from "../components/ui/data-table/DataTableBulkActions";
import { BulkDeleteModal } from "../components/ui/data-table/DeleteManyModal";
import { usePagination, useTableSelection } from "../hooks";

/** One member per `ui/data-table` file this suite covers. */
export type DataTableSuiteMember =
  | "DataTable"
  | "DataTablePagination"
  | "DataTableBulkActions"
  | "DeleteManyModal";

/** Options for {@link runDataTableSuite}. */
export interface DataTableSuiteOptions {
  /** Which members to run. Defaults to all four. */
  only?: DataTableSuiteMember[];
}

/** A minimal document shape every fixture row in this suite satisfies. */
interface Row extends VexDocument {
  title: string;
}

/** Three rows, three distinct titles — enough to exercise selection and rendering without noise. */
const ROWS: Row[] = [
  { _id: "doc_1", _creationTime: 1, title: "First post" },
  { _id: "doc_2", _creationTime: 2, title: "Second post" },
  { _id: "doc_3", _creationTime: 3, title: "Third post" },
];

/** The single-column `ColumnDef` every `DataTable` render in this suite uses. */
const COLUMNS: ColumnDef<Row>[] = [{ accessorKey: "title", header: "Title" }];

/**
 * Runs the shared contract for `ui/data-table`'s four components: `DataTable`'s row/
 * header rendering, Load-More wiring, and row-selection checkbox column;
 * `DataTablePagination`'s page controls wired to a real `usePagination`;
 * `DataTableBulkActions`'s selection summary wired to a real `useTableSelection`; and
 * `DeleteManyModal`'s (`BulkDeleteModal`) confirm/cancel wiring.
 *
 * @param options - Which members to run; defaults to all four.
 */
export function runDataTableSuite(options?: DataTableSuiteOptions): void {
  const only = options?.only ?? [
    "DataTable",
    "DataTablePagination",
    "DataTableBulkActions",
    "DeleteManyModal",
  ];

  afterEach(() => cleanup());

  if (only.includes("DataTable")) {
    describe("DataTable", () => {
      it("renders the header label and every row's cell", () => {
        render(<DataTable data={ROWS} columns={COLUMNS} />);
        expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
        for (const row of ROWS) {
          expect(screen.getByRole("cell", { name: row.title })).toBeInTheDocument();
        }
      });

      it("hides Load More when isDone, shows it and forwards clicks to onLoadMore otherwise", async () => {
        const user = userEvent.setup();
        const onLoadMore = vi.fn();
        const { rerender } = render(
          <DataTable data={ROWS} columns={COLUMNS} isDone={false} onLoadMore={onLoadMore} />,
        );
        await user.click(screen.getByRole("button", { name: "Load More" }));
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender(<DataTable data={ROWS} columns={COLUMNS} isDone />);
        expect(screen.queryByRole("button", { name: "Load More" })).not.toBeInTheDocument();
      });

      it("shows the all-loaded message using totalCount when given, else data.length", () => {
        const { rerender } = render(
          <DataTable data={ROWS} columns={COLUMNS} isDone totalCount={42} entityName="posts" />,
        );
        expect(screen.getByText(/All 42 posts loaded/)).toBeInTheDocument();

        rerender(<DataTable data={ROWS} columns={COLUMNS} isDone entityName="posts" />);
        expect(screen.getByText(`All ${ROWS.length} posts loaded`)).toBeInTheDocument();
      });

      it("adds a checkbox column only when enableRowSelection is true, and toggling one checks it", async () => {
        const user = userEvent.setup();
        const { rerender, container } = render(<DataTable data={ROWS} columns={COLUMNS} />);
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);

        rerender(<DataTable data={ROWS} columns={COLUMNS} enableRowSelection />);
        // Header "select all" + one per row.
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes).toHaveLength(ROWS.length + 1);
        // Base UI's visible `role="checkbox"` span handles clicks via a `PointerEvent`
        // jsdom doesn't implement — same gap `checkbox/Input.test.tsx` documents. Drive
        // the interaction through the hidden native `<input type="checkbox">` instead,
        // which the visible span's own `aria-checked` state does reflect.
        const hiddenInputs = container.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        expect(hiddenInputs).toHaveLength(ROWS.length + 1);
        expect(checkboxes[1]).not.toBeChecked();
        await user.click(hiddenInputs[1]!);
        expect(checkboxes[1]).toBeChecked();
      });

      // `DataTable`'s own bulk-delete trigger is unreachable through its rendered UI —
      // `DataTableBulkActions` is only ever imported by this file in a commented-out
      // block (DataTable.tsx:227-233, matching its own `@see` JSDoc: "not yet wired
      // into this component's own selection UI"), and nothing else ever calls
      // `setDeleteModalOpen(true)`. `handleBulkDelete`'s logic and `BulkDeleteModal`'s
      // own confirm/cancel wiring are each covered directly by their own describe
      // blocks below instead of through this unreachable path.
    });
  }

  if (only.includes("DataTablePagination")) {
    describe("DataTablePagination", () => {
      it("renders a page link per page and marks the current page active", () => {
        const { result } = renderHook(() => usePagination({ initialPageSize: 10 }));
        render(<DataTablePagination pagination={result.current} totalCount={30} />);
        for (const page of [1, 2, 3]) {
          expect(screen.getByRole("button", { name: String(page) })).toBeInTheDocument();
        }
        expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
      });

      it("calls goToPage when a page number is clicked", async () => {
        const user = userEvent.setup();
        const { result } = renderHook(() => usePagination({ initialPageSize: 10 }));
        const goToPageSpy = vi.spyOn(result.current, "goToPage");
        render(<DataTablePagination pagination={result.current} totalCount={30} />);
        await user.click(screen.getByRole("button", { name: "2" }));
        expect(goToPageSpy).toHaveBeenCalledWith(2);
      });

      it("marks Previous aria-disabled on the first page and enables it after advancing", async () => {
        const user = userEvent.setup();
        const { result } = renderHook(() => usePagination({ initialPageSize: 10 }));
        const { rerender } = render(<DataTablePagination pagination={result.current} totalCount={30} />);
        expect(screen.getByText("Previous").closest("a")).toHaveAttribute("aria-disabled", "true");

        act(() => {
          result.current.updateFromResult({ continueCursor: "cursor_1", isDone: false });
        });
        rerender(<DataTablePagination pagination={result.current} totalCount={30} />);
        await user.click(screen.getByText("Next").closest("a")!);
        rerender(<DataTablePagination pagination={result.current} totalCount={30} />);
        expect(screen.getByText("Previous").closest("a")).toHaveAttribute("aria-disabled", "false");
      });

      it("shows an ellipsis once there are more pages than maxPageNumbers", () => {
        const { result } = renderHook(() => usePagination({ initialPageSize: 10 }));
        render(
          <DataTablePagination pagination={result.current} totalCount={200} maxPageNumbers={5} />,
        );
        expect(screen.getAllByText("More pages").length).toBeGreaterThan(0);
      });
    });
  }

  if (only.includes("DataTableBulkActions")) {
    describe("DataTableBulkActions", () => {
      /**
       * Runs a real `useTableSelection` through zero or more mutating `steps`, each in
       * its own `act()` — `toggleRow`/`toggleInverseMode` close over `mode` from the
       * render that created them, so two calls batched into one `act()` would both see
       * the pre-update `mode` and only the last write would win — then renders
       * `DataTableBulkActions` against the resulting state.
       *
       * @param steps - Mutating calls against the live selection, applied in order.
       * @returns The final selection state, an `onDelete` spy, and `rerender` for
       *   re-rendering after further state changes.
       */
      function renderWithSelection(
        ...steps: Array<(selection: ReturnType<typeof useTableSelection>) => void>
      ) {
        const hook = renderHook(() => useTableSelection({ totalCount: ROWS.length }));
        for (const step of steps) {
          act(() => step(hook.result.current));
        }
        const onDelete = vi.fn();
        const view = render(
          <DataTableBulkActions selection={hook.result.current} onDelete={onDelete} />,
        );
        return { hook, onDelete, rerender: view.rerender };
      }

      it("renders nothing when no rows are selected", () => {
        renderWithSelection();
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("pluralizes the selection count and shows the (all in table) qualifier in all mode", () => {
        renderWithSelection((selection) => selection.toggleSelectAll());
        expect(screen.getByText(`${ROWS.length} items selected`)).toBeInTheDocument();
        expect(screen.getByText("(all in table)")).toBeInTheDocument();
      });

      it("shows the (inverse mode) qualifier for exactly one excluded item", () => {
        renderWithSelection(
          (selection) => selection.toggleInverseMode(),
          (selection) => selection.toggleRow("doc_1"),
        );
        expect(screen.getByText("(inverse mode)")).toBeInTheDocument();
      });

      it("calls onDelete when Delete is clicked and clearSelection when Clear is clicked", async () => {
        const user = userEvent.setup();
        const { hook, onDelete, rerender } = renderWithSelection((s) => s.selectPage(["doc_1"]));
        await user.click(screen.getByRole("button", { name: /Delete/ }));
        expect(onDelete).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", { name: /Clear/ }));
        // `clearSelection` updated the hook's OWN state, not the already-rendered
        // component's props — re-render with the fresh `hook.result.current` to see it.
        rerender(<DataTableBulkActions selection={hook.result.current} onDelete={onDelete} />);
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("disables both buttons while isDeleting is true", () => {
        const { result } = renderHook(() => useTableSelection({ totalCount: ROWS.length }));
        act(() => result.current.selectPage(["doc_1"]));
        render(<DataTableBulkActions selection={result.current} onDelete={vi.fn()} isDeleting />);
        expect(screen.getByRole("button", { name: /Delete/ })).toBeDisabled();
        expect(screen.getByRole("button", { name: /Clear/ })).toBeDisabled();
      });
    });
  }

  if (only.includes("DeleteManyModal")) {
    describe("DeleteManyModal (BulkDeleteModal)", () => {
      function renderModal(props: Partial<Parameters<typeof BulkDeleteModal>[0]> = {}) {
        const onOpenChange = vi.fn();
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        render(
          <BulkDeleteModal
            open
            onOpenChange={onOpenChange}
            selectedCount={3}
            onConfirm={onConfirm}
            entityName="posts"
            {...props}
          />,
        );
        return { onOpenChange, onConfirm };
      }

      it("titles and describes the confirmation with the selected count and entity name", () => {
        renderModal();
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(screen.getByText("Delete 3 posts?")).toBeInTheDocument();
        expect(screen.getByText(/permanently delete/)).toBeInTheDocument();
      });

      it("singularizes entityName in the title when selectedCount is 1", () => {
        renderModal({ selectedCount: 1 });
        expect(screen.getByText("Delete 1 post?")).toBeInTheDocument();
      });

      it("calls onConfirm when the destructive action is clicked", async () => {
        const user = userEvent.setup();
        const { onConfirm } = renderModal();
        await user.click(screen.getByRole("button", { name: "Delete" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });

      it("calls onOpenChange(false) when Cancel is clicked, without calling onConfirm", async () => {
        const user = userEvent.setup();
        const { onOpenChange, onConfirm } = renderModal();
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        // Base UI's `Dialog.Close` calls `onOpenChange(false, eventDetails)` — only the
        // first argument is this component's own contract.
        expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
        expect(onConfirm).not.toHaveBeenCalled();
      });

      it("disables both actions and relabels the destructive action while isDeleting", () => {
        renderModal({ isDeleting: true });
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
      });
    });
  }
}
```

#### packages/react/src/components/fields/text/Cell.test.tsx

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { TextFieldCell } from "./Cell";
import { textFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: textFieldFixture,
  Component: TextFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("text: non-title rendering", () => {
      it("renders the plain value with no link when isTitleField is false", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <TextFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container.querySelector("a")).toBeNull();
        expect(container).toHaveTextContent(options.fixture.valid);
      });
    });
  },
});
```

#### packages/react/src/components/fields/url/Cell.test.tsx

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { UrlFieldCell } from "./Cell";
import { urlFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: urlFieldFixture,
  Component: UrlFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("url: own rendering", () => {
      it("links to the raw URL value itself when isTitleField is false", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <UrlFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container.querySelector("a")?.getAttribute("href")).toBe(options.fixture.valid);
      });

      // `!props.value` also swallows an empty string, not just null/undefined — the
      // base contract's null/undefined assertion doesn't exercise this case.
      it("renders nothing for an empty string, same as for null/undefined", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        const { container } = render(
          <UrlFieldCell
            value=""
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toBeEmptyDOMElement();
      });
    });
  },
});
```

#### packages/react/src/components/fields/select/Cell.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { SelectFieldCell } from "./Cell";
import { selectFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: selectFieldFixture,
  Component: SelectFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("select: own rendering", () => {
      it("renders a Badge per selected option, using each option's label", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          <SelectFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("Published")).toBeInTheDocument();
      });

      it("omits a stored value that is no longer one of fieldDef.options", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: ["retired"] });
        const { container } = render(
          <SelectFieldCell
            value={["retired"]}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container.textContent).toBe("");
      });
    });
  },
});
```

#### packages/react/src/components/fields/checkbox/Cell.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { CheckboxFieldCell } from "./Cell";
import { checkboxFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: checkboxFieldFixture,
  Component: CheckboxFieldCell,
  // A boolean has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("checkbox: own rendering", () => {
      it.each([
        [true, "Yes"],
        [false, "No"],
      ])("renders %s as %s", (value, expected) => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        render(
          <CheckboxFieldCell
            value={value}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/upload/Cell.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { TDocument, VexMediaDocument } from "@vexcms/core";
import { get } from "@vexcms/core/client";
import type { GenericId } from "convex/values";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { UploadFieldCell } from "./Cell";
import { uploadFieldFixture } from "./testFixture";

/** Minimal media document `FilePreview`/`UploadFieldCell` read. */
function makeMediaDoc(overrides: Partial<VexMediaDocument> = {}): VexMediaDocument {
  return {
    _id: "images_1",
    _creationTime: 1,
    alt: "",
    filename: "cover-photo.png",
    mimeType: "image/png",
    size: 1024,
    storageId: "storage_1",
    deleted: false,
    src: "https://example.com/cover-photo.png",
    ...overrides,
  };
}

runFieldCellContractSuite({
  fixture: uploadFieldFixture,
  Component: UploadFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("upload: own rendering", () => {
      it('shows "Loading..." before the referenced media document resolves', () => {
        const queryClient = new QueryClient({
          defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
        });
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          <QueryClientProvider client={queryClient}>
            <UploadFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />
          </QueryClientProvider>,
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });

      it("shows the resolved filename and a +N badge once the media document is cached", () => {
        const mediaDoc = makeMediaDoc();
        const queryClient = new QueryClient();
        queryClient.setQueryData(
          get({ id: mediaDoc._id as GenericId<"images">, collection: "images" }).queryKey,
          mediaDoc,
        );
        const value = ["images_1", "images_2"];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        render(
          <QueryClientProvider client={queryClient}>
            <UploadFieldCell
              value={value}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />
          </QueryClientProvider>,
        );
        expect(screen.getByText(mediaDoc.filename)).toBeInTheDocument();
        expect(screen.getByText("+1")).toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/group/Cell.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { GroupFieldCell } from "./Cell";
import { groupFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: groupFieldFixture,
  Component: GroupFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("group: own rendering", () => {
      it.each([
        [{ title: "Hello" }, "{ 1 key }"],
        [{ title: "Hello", body: "World" }, "{ 2 keys }"],
      ])("renders a key-count summary for %j", (value, expected) => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        render(
          <GroupFieldCell
            value={value}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/number/Cell.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { NumberFieldCell } from "./Cell";
import { numberFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: numberFieldFixture,
  Component: NumberFieldCell,
  // A number has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("number: own rendering", () => {
      it("renders the raw numeric value", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          <NumberFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(String(options.fixture.valid))).toBeInTheDocument();
      });

      // `0` is falsy but NOT null/undefined — the base contract's placeholder
      // assertion only exercises null/undefined, and `NumberFieldCell` has no `!value`
      // guard at all, so this is a distinct, real boundary: a genuine zero quantity
      // renders as "0", not as the em-dash placeholder.
      it("renders 0 as the text \"0\", not the em-dash placeholder", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: 0 });
        const { container } = render(
          <NumberFieldCell
            value={0}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent("0");
        expect(container).not.toHaveTextContent("—");
      });
    });
  },
});
```

#### packages/react/src/components/fields/relationship/Cell.test.tsx

```tsx
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClientVexConfig, TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { RelationshipFieldCell } from "./Cell";
import { relationshipFieldFixture, relationshipTargetCollection } from "./testFixture";

/**
 * Minimal client config carrying the relationship's target collection — only
 * `collections` is read on this path (`config.collections.find(...)` inside
 * `RelationshipFieldCell`). Mirrors the stub-config pattern `fieldInputContract.ts`
 * and `upload/Input.test.tsx` both use at this same library boundary.
 */
const stubClientConfig = {
  collections: [relationshipTargetCollection],
  basePath: "/admin",
} as unknown as ClientVexConfig;

function withConfig(node: ReactNode) {
  return <VexConfigContext.Provider value={stubClientConfig}>{node}</VexConfigContext.Provider>;
}

runFieldCellContractSuite({
  fixture: relationshipFieldFixture,
  Component: RelationshipFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("relationship: own rendering", () => {
      it("renders '1 item' for a single unpopulated raw id", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          withConfig(
            <RelationshipFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });

      it("renders the resolved preview's title for a single populated document", () => {
        const populated = [{ _id: "doc_a", title: "Hello Relation" }];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: populated });
        render(
          withConfig(
            <RelationshipFieldCell
              value={populated}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("Hello Relation")).toBeInTheDocument();
      });

      it("renders '{count} {plural}' for more than one populated document, using the target collection's plural label", () => {
        const populated = [
          { _id: "doc_a", title: "First" },
          { _id: "doc_b", title: "Second" },
        ];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: populated });
        render(
          withConfig(
            <RelationshipFieldCell
              value={populated}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(
          screen.getByText(`2 ${relationshipTargetCollection.labels.plural}`),
        ).toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/color/Cell.test.tsx

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { ColorFieldCell } from "./Cell";
import { colorFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: colorFieldFixture,
  Component: ColorFieldCell,
  // A colour swatch has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("color: own rendering", () => {
      it("renders a swatch with the value as its background color, plus the raw value as text", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <ColorFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        const swatch = container.querySelector<HTMLElement>('[aria-hidden="true"]');
        expect(swatch?.style.backgroundColor).toBe("rgb(232, 98, 42)"); // #e8622a
        expect(container).toHaveTextContent(options.fixture.valid);
      });

      // `!props.value` also swallows an empty string, not just null/undefined — the
      // base contract's null/undefined assertion doesn't exercise this case.
      it("renders nothing for an empty string, same as for null/undefined", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        const { container } = render(
          <ColorFieldCell
            value=""
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toBeEmptyDOMElement();
      });
    });
  },
});
```

#### packages/react/src/components/fields/date/Cell.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { DateFieldCell } from "./Cell";
import { dateFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: dateFieldFixture,
  Component: DateFieldCell,
  // A fixed-format date string has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    it("renders a Unix-ms timestamp as Date.prototype.toDateString()", () => {
      // The fixture's own `valid` is an ISO string (form-input shape); the Cell's
      // real contract is a Unix-ms timestamp per its own docstring — this is what a
      // seeded document actually stores.
      const timestamp = Date.UTC(2025, 5, 15, 10, 30);
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: timestamp });
      render(
        <DateFieldCell
          value={timestamp}
          row={row}
          fieldDef={options.fixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />,
      );
      expect(screen.getByText(new Date(timestamp).toDateString())).toBeInTheDocument();
    });

    // `!props.value` treats epoch 0 (1970-01-01, a legitimate date) the same as an
    // absent value — a real boundary defect distinct from the base contract's
    // null/undefined assertion, which never passes a truthy-but-falsy timestamp.
    it("renders nothing for a timestamp of 0, even though it is a valid date", () => {
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: 0 });
      const { container } = render(
        <DateFieldCell
          value={0}
          row={row}
          fieldDef={options.fixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  },
});
```

#### packages/react/src/components/fields/blocks/Cell.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { BlocksFieldCell } from "./Cell";
import { blocksFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: blocksFieldFixture,
  Component: BlocksFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("blocks: own rendering", () => {
      it("renders the singular label for exactly one block", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          <BlocksFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(`1 ${options.fixture.fieldDef.labels.singular}`)).toBeInTheDocument();
      });

      it("renders the plural label for more than one block", () => {
        const twoBlocks = [...options.fixture.valid, ...options.fixture.valid];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: twoBlocks });
        render(
          <BlocksFieldCell
            value={twoBlocks}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(`2 ${options.fixture.fieldDef.labels.plural}`)).toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/array/Cell.test.tsx

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { ArrayFieldCell } from "./Cell";
import { arrayFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: arrayFieldFixture,
  Component: ArrayFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("array: own rendering", () => {
      it("renders the item count with fieldDef.labels.singular and a descriptive title", () => {
        // `array()` defaults `labels` to `{ singular: "Item", plural: "Items" }`
        // (`packages/core/src/fields/array/config.ts`) whenever the caller doesn't
        // override it, as `arrayFieldFixture` doesn't — so the bare "item"/"items"
        // fallback in `ArrayFieldCell` (reached only when `fieldDef.labels` is
        // falsy) is unreachable through the public `array()` builder.
        const single = [options.fixture.valid[0]!];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: single });
        const { container } = render(
          <ArrayFieldCell
            value={single}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent(`1 ${options.fixture.fieldDef.labels!.singular}`);
        expect(container.firstElementChild?.getAttribute("title")).toBe(
          `${options.fixture.fieldDef.type} - ${options.fixture.fieldDef.label}`,
        );
      });

      it("uses fieldDef.labels.plural for more than one entry", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <ArrayFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent(
          `${options.fixture.valid.length} ${options.fixture.fieldDef.labels!.plural}`,
        );
      });
    });
  },
});
```

#### packages/react/src/components/fields/text/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { textFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: textFieldFixture });
```

#### packages/react/src/components/fields/url/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { urlFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: urlFieldFixture });
```

#### packages/react/src/components/fields/select/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { selectFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: selectFieldFixture });
```

#### packages/react/src/components/fields/checkbox/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { checkboxFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: checkboxFieldFixture });
```

#### packages/react/src/components/fields/upload/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { uploadFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: uploadFieldFixture });
```

#### packages/react/src/components/fields/group/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { groupFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: groupFieldFixture });
```

#### packages/react/src/components/fields/number/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { numberFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: numberFieldFixture });
```

#### packages/react/src/components/fields/relationship/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { relationshipFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: relationshipFieldFixture });
```

#### packages/react/src/components/fields/color/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { colorFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: colorFieldFixture });
```

#### packages/react/src/components/fields/date/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { dateFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: dateFieldFixture });
```

#### packages/react/src/components/fields/blocks/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { blocksFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: blocksFieldFixture });
```

#### packages/react/src/components/fields/array/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { arrayFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: arrayFieldFixture });
```

#### packages/react/src/components/ui/data-table/DataTable.test.tsx

```tsx
import { runDataTableSuite } from "../../../testing/dataTableSuite";

runDataTableSuite({ only: ["DataTable"] });
```

#### packages/react/src/components/ui/data-table/DataTablePagination.test.tsx

```tsx
import { runDataTableSuite } from "../../../testing/dataTableSuite";

runDataTableSuite({ only: ["DataTablePagination"] });
```

#### packages/react/src/components/ui/data-table/DataTableBulkActions.test.tsx

```tsx
import { runDataTableSuite } from "../../../testing/dataTableSuite";

runDataTableSuite({ only: ["DataTableBulkActions"] });
```

#### packages/react/src/components/ui/data-table/DeleteManyModal.test.tsx

```tsx
import { runDataTableSuite } from "../../../testing/dataTableSuite";

runDataTableSuite({ only: ["DeleteManyModal"] });
```

> `scripts/record-test-findings.mjs` needs no edit here — **Step 1** already parameterized its
> spec slug (`--spec <slug>` / `VEX_FINDINGS_SPEC`, defaulting to this spec), so the bare
> invocation in the Verify below writes to this spec's `findings.md`. Do not re-edit the script.

Verify: `node scripts/record-test-findings.mjs packages/react/src/components/fields/text/Cell.test.tsx packages/react/src/components/fields/url/Cell.test.tsx packages/react/src/components/fields/select/Cell.test.tsx packages/react/src/components/fields/checkbox/Cell.test.tsx packages/react/src/components/fields/upload/Cell.test.tsx packages/react/src/components/fields/group/Cell.test.tsx packages/react/src/components/fields/number/Cell.test.tsx packages/react/src/components/fields/relationship/Cell.test.tsx packages/react/src/components/fields/color/Cell.test.tsx packages/react/src/components/fields/date/Cell.test.tsx packages/react/src/components/fields/blocks/Cell.test.tsx packages/react/src/components/fields/array/Cell.test.tsx && pnpm --filter @vexcms/react exec vitest run src/components/ui/data-table --coverage.enabled=false` —
measured: the first command exits 0 with "80 tests, 30 failed — recorded to findings.md"
(30 base-contract failures: 14 CELL-3, 10 CELL-1, 6 CELL-2 — a failing assertion is a
recorded finding, not a script failure, per `record-test-findings.mjs`'s own protocol); the
second exits 0 with all 18 data-table tests passing. `columnDef.test.ts` (48 tests, all
green — routed through `getCollectionColumnDefs`, no known defects at that layer) runs as
part of the package's plain `vitest run`, not through the findings recorder, since none of
its assertions are expected to fail.

## Step 6 — Modals + media
Why: The last two first-party gaps — modals 19 statements at 5%, media 148 at 40%. Media stays
short of a real upload round-trip: `upload/Input.test.tsx` already proves that path, so these
tests cover render states, selection and accept filtering only.

**[agent]**

**Cross-step note:** per the harness-wide `only`-filter normalization, `runModalSuite` and
`runMediaSuite` are the two exported entry points this step publishes from `testing/`. Each of
the six colocated `*.test.tsx` files below is a thin caller that scopes the shared suite to
itself via `only: ["<Name>"]` — this is what keeps `pnpm --filter @vexcms/react exec vitest run
src/components/modals src/components/media` finding real, non-duplicated tests while Step 7's
`sections: ["modals" | "media"]` dispatch calls the same two functions with no `only` (running
every member). `access?: VexAccessConfig` is threaded to `renderWithVexProviders` in every
render call in both suites for signature consistency with the other section suites — none of
these six components read `usePermission` themselves, so it is documented as reserved rather
than silently dropped.

**Per the Test Authoring Protocol, two as-built behaviors from the prior draft are corrected
here rather than pinned:**

- **`CORE-LABEL-1`.** The prior draft asserted `screen.findByText("Create Posts")` with a
  comment explaining `defineCollection` title-cases the slug without singularizing. That pins a
  real defect. Per Protocol rule 3 (plain meaning) — and `defineCollection`'s own JSDoc example
  at `collections/config.ts:60`, which documents `singular: "Post"` for slug `"posts"` — the
  intended value is `"Post"`. The test now asserts `"Create Post"` and fails, with the failure
  comment naming `BUGS-REPORT CORE-LABEL-1`. **This is cross-package**: the defect is in
  `@vexcms/core`'s `defineCollection` (`toTitleCase` with no singularization step), not in
  `@vexcms/react`. Flag as cross-package in Step 9, and note the fix is a breaking change for
  any consumer already relying on the current (wrong) title-cased-only output for every
  collection whose slug isn't already singular.
- **`MEDIA-1`.** The prior draft asserted `MediaUploadDropzone` applies no mime filtering
  (`input?.getAttribute("accept")).toBeNull()`) and separately asserted that a simultaneous
  two-file drop is rejected in its entirety, framing both as neutral facts about the current
  implementation. Per Protocol rules 3–4: `fields/upload/EmptyInput.tsx`'s sibling drop handler
  *does* filter by `fieldDef.accept` via `fileMatchesAccept`, so a media dropzone honoring
  accepted types is the established codebase intent, not an unfilled feature. The suite now
  asserts a disallowed mime type (`malware.exe`, `application/x-msdownload`) is rejected — this
  fails today, since `useDropzone` configures no `accept` at all. Separately, the "whole batch
  rejected" behavior was re-examined against the Protocol: `EmptyInput.tsx`'s own single-select
  drop handler truncates to `files.slice(0, 1)` rather than rejecting the drop outright when the
  field doesn't allow multiple files — that sibling defines the intent for "single file only" in
  this codebase. The suite now asserts that dropping two files keeps and uploads the *first* one,
  which also fails today (react-dropzone's `multiple: false` with no `maxFiles` rejects the
  entire batch — confirmed by reading `react-dropzone@15.0.0`'s own source, not just its public
  docs, which describe the opposite of what the code does). Both flipped assertions carry a
  `BUGS-REPORT MEDIA-1` failure comment; this is one finding with two symptoms, as already
  scoped in the Step 9 draft.

**Two further defects surfaced *while writing to the Protocol's mandatory edge cases*** (not
present in the prior draft at all — the as-built version never had a test that could see them):

- **`MEDIA-2`.** `FilePreview.tsx` computes `const alt = mediaDoc.alt ?? mediaDoc.filename;`.
  `??` only falls back on `null`/`undefined`, but `VexMediaDocument.alt` is a required `string` —
  a real media item with no user-provided alt text has `alt: ""`, not `undefined`, so the
  fallback never fires and every such image renders `alt=""`. The suite's "falls back to
  filename as alt text when alt is empty" test (present in the prior draft, but never actually
  run against the real component) asserts the intended fallback and now carries a
  `BUGS-REPORT MEDIA-2` failure comment.
- **`MODAL-1`.** Added while writing the Protocol's mandatory "submitting twice rapidly" case:
  `CreateDocumentModal`'s submit button is disabled only via `useVexMutation`'s `isPending`,
  which doesn't flip until *after* TanStack Form's own async field-validation await boundary
  inside `form.handleSubmit()`. Two back-to-back clicks with no await between them (a genuine
  fast double-click) both land before the button disables, so `create` fires twice. Verified
  empirically against the real component with two different mock shapes (a static `isPending`
  and a stateful one that flips synchronously on `mutateAsync` invocation) — both reproduce the
  double call identically, ruling out a mocking artifact. The new test asserts
  `createDocumentMock` is called exactly once and fails, carrying `BUGS-REPORT MODAL-1`.

**One apparent defect was investigated and ruled out as a test-timing artifact, not a product
bug**, so no `BUGS-REPORT` entry was added for it: Base UI's `Dialog` traps focus via
`@floating-ui/react`'s `FloatingFocusManager`, whose guard-element redirect is deferred through
`enqueueFocus`'s `requestAnimationFrame` call, not committed synchronously. A raw
`expect(...).toBe(true)` immediately after `user.tab()` observes the *pre-redirect* frame and
intermittently fails; wrapping the per-tab assertion in `waitFor` (which polls until the
rAF-deferred correction lands — well within human reaction time in a real browser) makes every
focus-trap assertion pass reliably. All three "traps focus" tests below use this pattern.
Likewise, `MediaUploadDropzone`'s drag-active test now awaits react-dropzone's own
`Promise.resolve(...).then(...)`-deferred dispatch inside `onDragEnterCb`, and
`MediaUploadDropzone`'s `renderDropzone` helper now wraps its tree in a real `QueryClientProvider`
(mirroring `media/MediaUploadForm.test.tsx`'s existing pattern) since the component calls the
real, unmocked `useQueryClient`/`useMutation` — without it every dropzone test throws "No
QueryClient set" before reaching any assertion. Neither fix touches component source.

**Mandatory edge cases added, per the Protocol's seven categories:**

- **Absent value:** `FilePreview` with an unknown/absent mime type (empty string) — falls back
  to the generic file icon, same as any other unrecognized type.
- **Boundary:** `MediaLibaryGrid` with exactly one item (distinct from zero and "many"); a
  pathologically long filename, asserting the full name still reaches the DOM as text even
  though it is CSS-truncated visually; a zero-byte dropped file (no minimum size is configured
  anywhere in the upload pipeline, verified by reading the component and grepping core for any
  size floor, so accepting it is not a pinned bug — nothing defines a contrary intent).
- **Out of range / nonsense input:** a file far larger than any realistic size limit, dropped on
  `MediaUploadDropzone` — no `maxSize` is configured on `useDropzone` and no size ceiling exists
  anywhere in `@vexcms/core` either, so the test documents the current accept-everything behavior
  explicitly as an absence of any contract to violate (Protocol's fallback: don't invent one),
  rather than asserting it is correct or incorrect.
- **Realistic hostile content:** a filename containing unicode/emoji and one containing markup
  characters, both on `MediaLibaryGrid` (rendered as literal text with no injected `<img>`, since
  React never parses text-node content as markup) and on `MediaUploadDropzone` (preserved
  verbatim through to `createMediaDocument`'s `filename`/`alt` args, since nothing sanitizes
  filenames anywhere in the upload path).
- **Repeat and rapid interaction:** opening the same `<Modal>` twice (close via Escape, then
  re-drive the url param back to `true` and confirm the dialog remounts cleanly with a working
  focus trap, not a stale instance); dismissing `CreateDocumentModal` via Escape while its create
  mutation is still in flight (confirms nothing gates dismissal on pending state, consistently
  across both concrete modals, and that the mutation still settles without throwing after the
  dialog is gone); submitting `CreateDocumentModal`'s form twice in rapid succession (surfaces
  `MODAL-1` above).
- **Async states:** `MediaLibaryGrid` empty/one-item/many-item find results, already covered
  above alongside the pre-existing loading-state test.
- Also added per the "where users actually land" framing even though not literally one line-item
  above: dropping zero files onto `MediaUploadDropzone` (no crash, no upload attempted) and
  dragging a non-file item over it (e.g. dragged text — confirmed via `react-dropzone`'s own
  `isEvtWithFiles` check that this never engages the drag-active state at all, so asserting it
  stays idle is grounded in the library's real behavior, not a guess).

Everything below was run against the real components (`pnpm --filter @vexcms/react exec vitest
run src/components/modals src/components/media --coverage.enabled=false`): 46 tests, 40 passing,
6 failing — exactly `CORE-LABEL-1`, `MEDIA-1` (×2), `MEDIA-2`, and `MODAL-1` (×1), nothing else.

`MediaLibaryGrid` keeps the source file's existing filename typo — a rename is tracked
separately and is out of scope here.

#### packages/react/src/testing/modalSuite.tsx

New file. Exports `runModalSuite`, the shared contract for `BaseModal`'s generic `<Modal>`
wrapper and the two concrete modals built on it: open/close driven by the `nuqs` url param,
Escape dismissal, backdrop-click dismissal, focus trapping (all three render through Base UI's
`Dialog`, which portals into `document.body` — constraint 8, queried via
`document.body.querySelector('[data-slot="dialog-overlay"]')` and `screen.findByRole("dialog")`,
never the RTL `container`), reopening after a close, dismissal during a pending submit, rapid
double-submit, and each concrete modal's own submit wiring.

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import type { MediaCollectionConfig, VexAccessConfig } from "@vexcms/core";

import { renderWithVexProviders, testCollection } from "./harness/accessFixtures";
import { Modal } from "../components/modals/BaseModal";
import { CreateDocumentModal } from "../components/modals/CreateDocumentModal";
import { CreateMediaModal } from "../components/modals/CreateMediaModal";
import { MODALS } from "../components/modals/constants";
import { DialogContent, DialogHeader } from "../components/ui";
import type * as HooksModule from "../hooks";
import type * as MediaModule from "../components/media";

/** Member names {@link runModalSuite}'s `only` option accepts. */
export type ModalSuiteMember = "BaseModal" | "CreateDocumentModal" | "CreateMediaModal";

/** Options for {@link runModalSuite}. */
export interface RunModalSuiteOptions {
  /** Restrict the run to these members. Defaults to all three. */
  only?: ModalSuiteMember[];
  /**
   * RBAC matrix threaded to `renderWithVexProviders` for every render below,
   * for signature consistency with the other section suites. Currently
   * unexercised: none of `Modal`/`CreateDocumentModal`/`CreateMediaModal`
   * read `usePermission` themselves — the collection list view that opens
   * them is where `canCreate` gating happens (covered by `runViewSuite`).
   */
  access?: VexAccessConfig;
}

const { createDocumentMock } = vi.hoisted(() => ({ createDocumentMock: vi.fn() }));

// `CreateDocumentModal` calls `useVexMutation`'s `create` operation directly.
// Mocking it here keeps every submit-wiring assertion free of a real Convex
// round trip, mirroring `upload/Input.test.tsx`'s established mocking shape.
// `isPending` is fixed `false` (not wired to `createDocumentMock`'s own
// pending state): `Button`'s `disabled={isPending}` therefore never engages
// in this harness, which is exactly what exposes MODAL-1 below — see that
// test's comment.
vi.mock("../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof HooksModule>();
  return {
    ...actual,
    useVexMutation: () => ({ mutateAsync: createDocumentMock, isPending: false }),
  };
});

// `CreateMediaModal` only wires `MediaUploadDropzone`'s props through to a
// url-close callback — the dropzone's OWN drag/drop/upload behavior is
// `runMediaSuite`'s job, not this suite's. Stubbing it to a single button
// isolates exactly the wiring this suite owns: which collection slug and
// adapter name it's given, and that completion closes the modal.
vi.mock("../components/media", async (importOriginal) => {
  const actual = await importOriginal<typeof MediaModule>();
  return {
    ...actual,
    MediaUploadDropzone: (props: {
      targetCollection: string;
      adapterName: string;
      onUploadComplete: (mediaId: string) => void;
    }) => (
      <button type="button" onClick={() => props.onUploadComplete("media_stub_id")}>
        {`Simulate upload complete for ${props.targetCollection} via ${props.adapterName}`}
      </button>
    ),
  };
});

/**
 * Minimal `MediaCollectionConfig` fixture — mirrors the inline mock already
 * proven in `media/MediaUploadForm.test.tsx` and `fields/upload/Input.test.tsx`.
 * Only the fields `CreateMediaModal` itself reads: `slug`, `labels.singular`,
 * `meta.storageAdapter`.
 *
 * @param overrides — Shallow overrides merged over the defaults.
 * @returns A `MediaCollectionConfig` usable as `CreateMediaModal`'s `collection` prop.
 */
function makeMockMediaCollection(overrides: Partial<MediaCollectionConfig> = {}): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
    ...overrides,
  } as unknown as MediaCollectionConfig;
}

function describeBaseModal(access: VexAccessConfig | undefined) {
  describe("Modal (BaseModal)", () => {
    function buildModalTree(options: {
      searchParams?: string;
      onUrlUpdate?: (event: UrlUpdateEvent) => void;
    }) {
      return (
        <NuqsTestingAdapter searchParams={options.searchParams} onUrlUpdate={options.onUrlUpdate}>
          <button type="button">Outside trigger</button>
          <Modal urlParam="testModal">
            <DialogContent>
              <DialogHeader>Test modal</DialogHeader>
              <button type="button">First</button>
              <button type="button">Second</button>
            </DialogContent>
          </Modal>
        </NuqsTestingAdapter>
      );
    }

    function renderModal(
      options: { searchParams?: string; onUrlUpdate?: (event: UrlUpdateEvent) => void } = {},
    ) {
      return renderWithVexProviders(buildModalTree(options), { access });
    }

    it("stays closed when the url param is absent", () => {
      renderModal();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it('opens when the url param is "true"', async () => {
      renderModal({ searchParams: "?testModal=true" });
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("clears the url param and closes on Escape", async () => {
      const onUrlUpdate = vi.fn();
      const user = userEvent.setup();
      renderModal({ searchParams: "?testModal=true", onUrlUpdate });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      const lastUpdate = onUrlUpdate.mock.calls.at(-1)?.[0] as UrlUpdateEvent;
      expect(lastUpdate.searchParams.has("testModal")).toBe(false);
    });

    it("clears the url param and closes on a backdrop click", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: "?testModal=true" });
      await screen.findByRole("dialog");
      const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
      if (!overlay) throw new Error("dialog overlay not found in document.body");

      await user.click(overlay);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("traps focus: repeated Tab presses never move focus outside the dialog content", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: "?testModal=true" });
      const dialog = await screen.findByRole("dialog");

      for (let i = 0; i < 8; i += 1) {
        await user.tab();
        // The floating-focus-manager's guard-element redirect is deferred to
        // a `requestAnimationFrame` (see `enqueueFocus`), so the corrected
        // focus target isn't necessarily committed the instant `tab()`
        // resolves — `waitFor` polls until it lands, matching what a real
        // browser settles on well within human reaction time.
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      }
    });

    it("reopens cleanly the second time: closing via Escape and re-driving the url param back to true re-mounts the dialog with a fresh, un-trapped-by-the-old-instance focus trap", async () => {
      const user = userEvent.setup();
      const { rerender } = renderModal({ searchParams: "?testModal=true" });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      rerender(buildModalTree({ searchParams: "?testModal=true" }));

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();
      // Focus trapping still works on the second mount, not just the first.
      await user.tab();
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });
  });
}

function describeCreateDocumentModal(access: VexAccessConfig | undefined) {
  describe("CreateDocumentModal", () => {
    beforeEach(() => {
      createDocumentMock.mockReset();
    });

    function renderModal(
      options: { searchParams?: string; onUrlUpdate?: (event: UrlUpdateEvent) => void } = {},
    ) {
      return renderWithVexProviders(
        <NuqsTestingAdapter searchParams={options.searchParams} onUrlUpdate={options.onUrlUpdate}>
          <CreateDocumentModal collection={testCollection} />
        </NuqsTestingAdapter>,
        { access },
      );
    }

    it(`renders nothing when ?${MODALS.createDocument.urlParam} is absent`, () => {
      renderModal();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens a create form with a control per collection field", async () => {
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      // `testCollection`'s slug is "posts". `defineCollection`'s slug-derived
      // default (`collections/config.ts`) is supposed to compute a genuinely
      // SINGULAR label for `labels.singular` — its own JSDoc example
      // documents `"posts"` -> `singular: "Post"`. Asserting that intended
      // value, not the title-cased-only value the code actually produces.
      expect(
        await screen.findByText("Create Post"), // FAILS: defineCollection's labels.singular title-cases the slug without singularizing — see BUGS-REPORT CORE-LABEL-1
      ).toBeInTheDocument();
      expect(document.body.querySelector("#status")).not.toBeNull();
      expect(screen.getByRole("button", { name: MODALS.createDocument.label })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("submits the typed field values through useVexMutation's create operation and closes", async () => {
      createDocumentMock.mockResolvedValue("doc_1");
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");

      const statusInput = document.body.querySelector("#status") as HTMLInputElement;
      await user.type(statusInput, "published");
      await user.click(screen.getByRole("button", { name: MODALS.createDocument.label }));

      await waitFor(() =>
        expect(createDocumentMock).toHaveBeenCalledWith({
          collection: "posts",
          data: { status: "published" },
        }),
      );
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("Cancel closes without submitting", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(createDocumentMock).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes on Escape without submitting", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      expect(createDocumentMock).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes on a backdrop click", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");
      const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
      if (!overlay) throw new Error("dialog overlay not found in document.body");

      await user.click(overlay);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("traps focus inside the dialog content", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      const dialog = await screen.findByRole("dialog");

      for (let i = 0; i < 8; i += 1) {
        await user.tab();
        // See BaseModal's "traps focus" test for why this is `waitFor`, not
        // a synchronous `expect`.
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      }
    });

    it("closes on Escape while the create mutation is still in flight, and the mutation still settles without throwing once the dialog is gone", async () => {
      // ES2022 lib target (packages/tsconfig/react-library.json) has no
      // Promise.withResolvers, so this stays executor-form.
      let resolve!: (value: string) => void;
      const promise = new Promise<string>((res) => {
        resolve = res;
      });
      createDocumentMock.mockReturnValue(promise);
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");
      const statusInput = document.body.querySelector("#status") as HTMLInputElement;
      await user.type(statusInput, "published");
      await user.click(screen.getByRole("button", { name: MODALS.createDocument.label }));
      await waitFor(() => expect(createDocumentMock).toHaveBeenCalled());

      // Nothing gates Escape/backdrop dismissal on the mutation's pending
      // state — consistently true of BOTH concrete modals in this suite —
      // so Escape closes immediately rather than being blocked mid-submit.
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      resolve("doc_1");
      await expect(promise).resolves.toBe("doc_1");
    });

    it("submitting the form twice in rapid succession creates the document only once", async () => {
      createDocumentMock.mockResolvedValue("doc_1");
      renderModal({ searchParams: `?${MODALS.createDocument.urlParam}=true` });
      await screen.findByRole("dialog");
      const statusInput = document.body.querySelector("#status") as HTMLInputElement;
      fireEvent.change(statusInput, { target: { value: "published" } });
      const submitButton = screen.getByRole("button", { name: MODALS.createDocument.label });

      // Two clicks with no await between them, simulating a rapid
      // double-click before React has re-rendered the button as disabled.
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => expect(createDocumentMock).toHaveBeenCalled());
      await new Promise((resolveTimer) => setTimeout(resolveTimer, 20));
      expect(createDocumentMock).toHaveBeenCalledTimes(1); // FAILS: rapid double-click submits before the mutation's isPending disables the button, creating the document twice — see BUGS-REPORT MODAL-1
    });
  });
}

function describeCreateMediaModal(access: VexAccessConfig | undefined) {
  describe("CreateMediaModal", () => {
    function renderModal(
      options: {
        searchParams?: string;
        onUrlUpdate?: (event: UrlUpdateEvent) => void;
        collection?: MediaCollectionConfig;
      } = {},
    ) {
      return renderWithVexProviders(
        <NuqsTestingAdapter searchParams={options.searchParams} onUrlUpdate={options.onUrlUpdate}>
          <CreateMediaModal collection={options.collection ?? makeMockMediaCollection()} />
        </NuqsTestingAdapter>,
        { access },
      );
    }

    it(`renders nothing when ?${MODALS.uploadMedia.urlParam} is absent`, () => {
      renderModal();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens with the dropzone wired to the collection slug and its resolved storage adapter", async () => {
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      expect(await screen.findByText("Upload Image")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Simulate upload complete for images via convex" }),
      ).toBeInTheDocument();
    });

    it('falls back to the "convex" adapter when meta.storageAdapter is unset', async () => {
      const collectionWithoutAdapter = makeMockMediaCollection({ meta: {} });
      renderModal({
        searchParams: `?${MODALS.uploadMedia.urlParam}=true`,
        collection: collectionWithoutAdapter,
      });
      expect(
        await screen.findByRole("button", { name: "Simulate upload complete for images via convex" }),
      ).toBeInTheDocument();
    });

    it("closes the modal when the dropzone reports an upload complete", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.click(
        screen.getByRole("button", { name: "Simulate upload complete for images via convex" }),
      );

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it('the footer "Done" button closes without requiring an upload', async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.click(screen.getByRole("button", { name: "Done" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes on Escape", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes on a backdrop click", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      await screen.findByRole("dialog");
      const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
      if (!overlay) throw new Error("dialog overlay not found in document.body");

      await user.click(overlay);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("traps focus inside the dialog content", async () => {
      const user = userEvent.setup();
      renderModal({ searchParams: `?${MODALS.uploadMedia.urlParam}=true` });
      const dialog = await screen.findByRole("dialog");

      for (let i = 0; i < 8; i += 1) {
        await user.tab();
        // See BaseModal's "traps focus" test for why this is `waitFor`, not
        // a synchronous `expect`.
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      }
    });
  });
}

/**
 * Runs the shared modal contract — open/close driven by the `nuqs` url
 * param, Escape dismissal, backdrop-click dismissal, and focus trapping —
 * against `BaseModal`'s generic `<Modal>` wrapper plus the two concrete
 * modals built on it, and each concrete modal's own submit wiring.
 *
 * Call once at the top level of a `*.test.tsx` file; it calls
 * `describe`/`it` itself.
 *
 * @param props - Options for the run.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runModalSuite(props: RunModalSuiteOptions = {}): void {
  const members: ModalSuiteMember[] =
    props.only ?? ["BaseModal", "CreateDocumentModal", "CreateMediaModal"];
  if (members.includes("BaseModal")) describeBaseModal(props.access);
  if (members.includes("CreateDocumentModal")) describeCreateDocumentModal(props.access);
  if (members.includes("CreateMediaModal")) describeCreateMediaModal(props.access);
}
```

#### packages/react/src/testing/mediaSuite.tsx

New file. Exports `runMediaSuite`, covering `FilePreview`'s per-mime rendering branches
(including an unknown/absent mime type and a broken/404 `src`), `MediaLibraryGrid`'s
loading/empty/one-item/many-item states and single-/multi-select (including a pathologically
long filename and unicode/emoji/markup filenames), and `MediaUploadDropzone`'s accept behavior,
drag-active visual state, non-file-drag handling, zero-file drops, zero-byte and
far-oversized files, and multi-file drop handling. No real upload round-trip anywhere in this
file — `upload/Input.test.tsx` already proves that path.

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MediaCollectionConfig, VexAccessConfig, VexMediaDocument } from "@vexcms/core";
import type * as ReactQueryModule from "@tanstack/react-query";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as HooksModule from "../hooks";

import { renderWithVexProviders } from "./harness/accessFixtures";
import { FilePreview } from "../components/media/FilePreview";
import { MediaLibraryGrid } from "../components/media/MediaLibaryGrid";
import { MediaUploadDropzone } from "../components/media/MediaUploadDropzone";
import { StorageAdapterContextProvider } from "../context";
import { makeFile } from "../components/fields/upload/testFixture";

/** Member names {@link runMediaSuite}'s `only` option accepts (`MediaLibaryGrid` keeps the source file's existing typo — a rename is tracked separately). */
export type MediaSuiteMember = "FilePreview" | "MediaLibaryGrid" | "MediaUploadDropzone";

/** Options for {@link runMediaSuite}. */
export interface RunMediaSuiteOptions {
  /** Restrict the run to these members. Defaults to all three. */
  only?: MediaSuiteMember[];
  /**
   * RBAC matrix threaded to `renderWithVexProviders` for every render below,
   * for signature consistency with the other section suites. Currently
   * unexercised: none of `FilePreview`/`MediaLibraryGrid`/`MediaUploadDropzone`
   * read `usePermission` themselves.
   */
  access?: VexAccessConfig;
}

const { queryImpl, generateUploadUrlMock, createMediaDocMock, adapterUploadFileMock } = vi.hoisted(
  () => ({
    queryImpl: vi.fn(),
    generateUploadUrlMock: vi.fn(),
    createMediaDocMock: vi.fn(),
    adapterUploadFileMock: vi.fn(),
  }),
);

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactQueryModule>();
  return {
    ...actual,
    // Only `MediaLibraryGrid`'s two `useQuery` calls need controlling — this
    // stub reads `queryKey[1]`, the convex function-name string
    // `convexQuery()` embeds (`@convex-dev/react-query`'s own key shape:
    // `["convexQuery", functionName, args]`), to pick a fixture per test
    // without standing up a `convex-test` instance for data whose shape
    // (filename/mimeType/size) the shared test schema doesn't model. Cast at
    // this library boundary rather than reproducing react-query's generics.
    useQuery: ((options: { queryKey: readonly unknown[] }) =>
      queryImpl(options)) as unknown as typeof ReactQueryModule.useQuery,
  };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return { ...actual, useConvexMutation: () => generateUploadUrlMock };
});

// `MediaUploadDropzone` calls `useVexMutation`'s `create` operation to write
// the media document once the adapter upload resolves.
vi.mock("../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof HooksModule>();
  return {
    ...actual,
    useVexMutation: () => ({ mutateAsync: createMediaDocMock, isPending: false }),
  };
});

let mediaDocCounter = 0;

/**
 * Builds a `VexMediaDocument` fixture. Only the fields each component
 * actually reads (`mimeType`, `src`, `alt`, `filename`, `size`) vary per
 * test; `_id`/`_creationTime`/`storageId`/`deleted` are stubbed Convex
 * system/adapter fields no branch under test inspects.
 *
 * @param overrides — Shallow overrides merged over the defaults.
 * @returns A `VexMediaDocument` usable as `FilePreview`'s/`MediaLibraryGrid`'s fixture data.
 */
function makeMediaDoc(overrides: Partial<VexMediaDocument> = {}): VexMediaDocument {
  mediaDocCounter += 1;
  return {
    _id: `media_${mediaDocCounter}`,
    _creationTime: 0,
    alt: "",
    filename: `file-${mediaDocCounter}`,
    mimeType: "application/octet-stream",
    size: 1024,
    storageId: `storage_${mediaDocCounter}`,
    deleted: false,
    src: `https://example.com/file-${mediaDocCounter}`,
    ...overrides,
  };
}

/**
 * Minimal `MediaCollectionConfig` fixture — mirrors the inline mock already
 * proven in `media/MediaUploadForm.test.tsx`.
 *
 * @returns A `MediaCollectionConfig` usable as `MediaLibraryGrid`'s `targetCollectionConfig` prop.
 */
function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

/**
 * Configures the mocked `useQuery` to answer `MediaLibraryGrid`'s `find` and
 * (optional) `search` queries with fixed data — called once per test, after
 * `queryImpl.mockReset()` in that block's `beforeEach`.
 *
 * @param results — Fixture data/pending state per query.
 * @param results.find — Response for `vexConvexApi.find` (the default, non-search path).
 * @param results.search — Response for `vexConvexApi.search`. Defaults to an empty, settled result.
 */
function setQueryResults(results: {
  find: { data: VexMediaDocument[]; isPending: boolean };
  search?: { data: VexMediaDocument[]; isPending: boolean };
}) {
  queryImpl.mockImplementation((options: { queryKey: readonly unknown[] }) => {
    const functionName = options.queryKey[1];
    if (functionName === "vex:find") return results.find;
    if (functionName === "vex:search") return results.search ?? { data: [], isPending: false };
    throw new Error(`mediaSuite query stub: unexpected query function "${String(functionName)}"`);
  });
}

function describeFilePreview() {
  describe("FilePreview", () => {
    it("renders a loading spinner icon when isPending is true, before any mime branch is reached", () => {
      const { container } = renderWithVexProviders(
        <FilePreview mediaDoc={makeMediaDoc({ mimeType: "image/png" })} isPending />,
      );
      expect(container.querySelector(".lucide-loader")).not.toBeNull();
      expect(container.querySelector("img")).toBeNull();
    });

    it("renders an <img> for a raster image mime type, using alt when present", () => {
      const mediaDoc = makeMediaDoc({
        mimeType: "image/jpeg",
        src: "https://example.com/photo.jpg",
        alt: "A mountain photo",
      });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("https://example.com/photo.jpg");
      expect(img?.getAttribute("alt")).toBe("A mountain photo");
    });

    it("falls back to filename as alt text when alt is empty", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/png", alt: "", filename: "cover.png" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      // `FilePreview.tsx` computes `alt = mediaDoc.alt ?? mediaDoc.filename`,
      // which only falls back on `null`/`undefined` — but `VexMediaDocument.alt`
      // is a required string, so a real "no alt text" media item always has
      // `alt: ""`, not `undefined`, and the fallback never actually fires.
      expect(container.querySelector("img")?.getAttribute("alt")).toBe("cover.png"); // FAILS: `??` doesn't fall back on empty string, so real media with no user-provided alt text always renders alt="" — see BUGS-REPORT MEDIA-2
    });

    it("swaps the <img> for the inline fallback SVG markup when the image fails to load (broken/404 src)", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/png", size: 2048, src: "https://example.com/404.png" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();

      fireEvent.error(img as HTMLImageElement);

      expect(container.querySelector("img")).toBeNull();
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      // `IconWrapper`'s inline fallback markup sizes the replacement icon
      // from `mediaDoc.size * 0.3` — 2048 * 0.3 is exact in floating point.
      expect(svg?.getAttribute("width")).toBe("614.4");
    });

    it("shows a plain <img> (object-contain) for image/svg+xml, never the raster <img> path", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/svg+xml", src: "https://example.com/logo.svg" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img).toHaveClass("object-contain");
    });

    it("shows the file icon (no <img>) for an svg with no src yet", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/svg+xml", src: "" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("shows the video icon for a video mime type", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "video/mp4" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector(".lucide-video")).not.toBeNull();
      expect(container.querySelector("img")).toBeNull();
    });

    it("shows the waveform icon for an audio mime type", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "audio/mpeg" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector(".lucide-audio-waveform")).not.toBeNull();
    });

    it("falls back to the generic file icon for an unrecognised/document mime type", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "application/pdf" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("falls back to the generic file icon for an image mime type with no src yet, even before any load error", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "image/png", src: "" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("falls back to the generic file icon for an unknown/absent mime type (empty string)", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector(".lucide-file")).not.toBeNull();
    });

    it("applies a fixed pixel size and custom radius when size is provided", () => {
      const mediaDoc = makeMediaDoc({ mimeType: "application/pdf" });
      const { container } = renderWithVexProviders(<FilePreview mediaDoc={mediaDoc} size={48} radius={8} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.style.width).toBe("48px");
      expect(wrapper.style.height).toBe("48px");
      expect(wrapper.style.borderRadius).toBe("8px");
    });
  });
}

function describeMediaLibraryGrid(access: VexAccessConfig | undefined) {
  describe("MediaLibaryGrid (MediaLibraryGrid)", () => {
    beforeEach(() => {
      queryImpl.mockReset();
    });

    const targetCollectionConfig = makeMockMediaCollection();

    it("shows the loading copy while the initial find query is pending", () => {
      setQueryResults({ find: { data: [], isPending: true } });
      renderWithVexProviders(
        <MediaLibraryGrid targetCollectionConfig={targetCollectionConfig} multi={false} onSelect={() => {}} />,
        { access },
      );
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows the empty-state copy once the find query resolves with no items", () => {
      setQueryResults({ find: { data: [], isPending: false } });
      renderWithVexProviders(
        <MediaLibraryGrid targetCollectionConfig={targetCollectionConfig} multi={false} onSelect={() => {}} />,
        { access },
      );
      expect(screen.getByText("No media files yet")).toBeInTheDocument();
    });

    it("renders exactly one tile when the find query resolves with a single item", () => {
      const items = [makeMediaDoc({ _id: "media_solo", filename: "solo.png", mimeType: "image/png", size: 512 })];
      setQueryResults({ find: { data: items, isPending: false } });
      const { container } = renderWithVexProviders(
        <MediaLibraryGrid targetCollectionConfig={targetCollectionConfig} multi={false} onSelect={() => {}} />,
        { access },
      );
      expect(screen.getByText("solo.png")).toBeInTheDocument();
      expect(screen.queryByText("No media files yet")).not.toBeInTheDocument();
      // Scoped to the results grid, not the whole container — the search
      // bar's own "Type" filter button is also a `<button>`.
      expect(container.querySelector(".grid")?.querySelectorAll("button")).toHaveLength(1);
    });

    it("renders one tile per item with its filename and formatted mime/size metadata", () => {
      const items = [
        makeMediaDoc({ _id: "media_1", filename: "cover.png", mimeType: "image/png", size: 1536 }),
        makeMediaDoc({ _id: "media_2", filename: "manual.pdf", mimeType: "application/pdf", size: 2_500_000 }),
      ];
      setQueryResults({ find: { data: items, isPending: false } });
      renderWithVexProviders(
        <MediaLibraryGrid targetCollectionConfig={targetCollectionConfig} multi={false} onSelect={() => {}} />,
        { access },
      );
      expect(screen.getByText("cover.png")).toBeInTheDocument();
      expect(screen.getByText("PNG · 1.5 KB")).toBeInTheDocument();
      expect(screen.getByText("manual.pdf")).toBeInTheDocument();
      expect(screen.getByText("PDF · 2.4 MB")).toBeInTheDocument();
    });

    it("renders a pathologically long filename in full (as text content), even though it is CSS-truncated visually", () => {
      const longFilename = `${"a".repeat(40)}-${"b".repeat(40)}-${"c".repeat(40)}.png`;
      const items = [makeMediaDoc({ _id: "media_long", filename: longFilename })];
      setQueryResults({ find: { data: items, isPending: false } });
      renderWithVexProviders(
        <MediaLibraryGrid targetCollectionConfig={targetCollectionConfig} multi={false} onSelect={() => {}} />,
        { access },
      );
      expect(screen.getByText(longFilename)).toBeInTheDocument();
    });

    it("renders a filename containing unicode/emoji and one containing markup characters as plain text, with no injection", () => {
      const unicodeName = "日本語 café résumé 📸.png";
      const markupName = "<img src=x onerror=alert(1)>.png";
      const items = [
        makeMediaDoc({ _id: "media_unicode", filename: unicodeName }),
        makeMediaDoc({ _id: "media_markup", filename: markupName }),
      ];
      setQueryResults({ find: { data: items, isPending: false } });
      const { container } = renderWithVexProviders(
        <MediaLibraryGrid targetCollectionConfig={targetCollectionConfig} multi={false} onSelect={() => {}} />,
        { access },
      );
      expect(screen.getByText(unicodeName)).toBeInTheDocument();
      expect(screen.getByText(markupName)).toBeInTheDocument();
      // React text nodes are never parsed as markup — no extra <img> got
      // injected into the DOM from the markup-bearing filename.
      expect(container.querySelectorAll("img")).toHaveLength(0);
    });

    it("single-select mode replaces the selection with the clicked item's id", () => {
      const items = [
        makeMediaDoc({ _id: "media_1", filename: "a.png" }),
        makeMediaDoc({ _id: "media_2", filename: "b.png" }),
      ];
      setQueryResults({ find: { data: items, isPending: false } });
      const onSelect = vi.fn();
      renderWithVexProviders(
        <MediaLibraryGrid
          targetCollectionConfig={targetCollectionConfig}
          multi={false}
          onSelect={onSelect}
          selectedIds={["media_1"]}
        />,
        { access },
      );

      fireEvent.click(screen.getByText("b.png").closest("button") as HTMLButtonElement);

      expect(onSelect).toHaveBeenCalledWith(["media_2"]);
    });

    it("multi-select mode toggles a new item into the existing selection", () => {
      const items = [
        makeMediaDoc({ _id: "media_1", filename: "a.png" }),
        makeMediaDoc({ _id: "media_2", filename: "b.png" }),
      ];
      setQueryResults({ find: { data: items, isPending: false } });
      const onSelect = vi.fn();
      renderWithVexProviders(
        <MediaLibraryGrid
          targetCollectionConfig={targetCollectionConfig}
          multi
          onSelect={onSelect}
          selectedIds={["media_1"]}
        />,
        { access },
      );

      fireEvent.click(screen.getByText("b.png").closest("button") as HTMLButtonElement);

      expect(onSelect).toHaveBeenCalledWith(["media_1", "media_2"]);
    });

    it("multi-select mode toggles an already-selected item back out", () => {
      const items = [
        makeMediaDoc({ _id: "media_1", filename: "a.png" }),
        makeMediaDoc({ _id: "media_2", filename: "b.png" }),
      ];
      setQueryResults({ find: { data: items, isPending: false } });
      const onSelect = vi.fn();
      renderWithVexProviders(
        <MediaLibraryGrid
          targetCollectionConfig={targetCollectionConfig}
          multi
          onSelect={onSelect}
          selectedIds={["media_1", "media_2"]}
        />,
        { access },
      );

      fireEvent.click(screen.getByText("a.png").closest("button") as HTMLButtonElement);

      expect(onSelect).toHaveBeenCalledWith(["media_2"]);
    });
  });
}

function describeMediaUploadDropzone(access: VexAccessConfig | undefined) {
  describe("MediaUploadDropzone", () => {
    beforeEach(() => {
      generateUploadUrlMock.mockReset();
      createMediaDocMock.mockReset();
      adapterUploadFileMock.mockReset();
    });

    function renderDropzone(onUploadComplete: (mediaId: string) => void = vi.fn()) {
      // `MediaUploadDropzone` calls the REAL `useQueryClient`/`useMutation`
      // (only `useConvexMutation`/`useVexMutation` are mocked above), so it
      // needs a real `QueryClientProvider` ancestor — mirrors the minimal
      // working setup in `media/MediaUploadForm.test.tsx`.
      const queryClient = new QueryClient();
      return renderWithVexProviders(
        <QueryClientProvider client={queryClient}>
          <StorageAdapterContextProvider adapterClients={{ convex: adapterUploadFileMock }}>
            <MediaUploadDropzone
              targetCollection="images"
              adapterName="convex"
              onUploadComplete={onUploadComplete}
            />
          </StorageAdapterContextProvider>
        </QueryClientProvider>,
        { access },
      );
    }

    it("renders the idle copy", () => {
      renderDropzone();
      expect(screen.getByText("📁 Drop file here or click to upload")).toBeInTheDocument();
    });

    it("shows the drag-active copy on dragenter and reverts on dragleave", async () => {
      const { container } = renderDropzone();
      const root = container.querySelector('[role="presentation"]') as HTMLElement;

      fireEvent.dragEnter(root, { dataTransfer: { files: [], types: ["Files"] } });
      // react-dropzone's `onDragEnterCb` resolves the dragged files via a
      // `Promise.resolve(...).then(...)` before dispatching `isDragActive`,
      // so the state flip lands a microtask after `fireEvent` returns.
      await waitFor(() => expect(screen.getByText("Drop the file here...")).toBeInTheDocument());

      fireEvent.dragLeave(root, { dataTransfer: { files: [], types: ["Files"] } });
      expect(screen.getByText("📁 Drop file here or click to upload")).toBeInTheDocument();
    });

    it("does not enter the drag-active visual state when the dragged item is not a file (e.g. dragged text)", () => {
      const { container } = renderDropzone();
      const root = container.querySelector('[role="presentation"]') as HTMLElement;

      fireEvent.dragEnter(root, { dataTransfer: { files: [], types: ["text/plain"] } });

      expect(screen.queryByText("Drop the file here...")).not.toBeInTheDocument();
      expect(screen.getByText("📁 Drop file here or click to upload")).toBeInTheDocument();
    });

    it("does nothing, and does not crash, when zero files are dropped", async () => {
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;

      fireEvent.drop(root, { dataTransfer: { files: [], types: ["Files"] } });

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(generateUploadUrlMock).not.toHaveBeenCalled();
      expect(onUploadComplete).not.toHaveBeenCalled();
    });

    it("uploads a legitimate image file", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("cover.png", "image/png");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1"));
      expect(createMediaDocMock).toHaveBeenCalledWith({
        adapter: "convex",
        collectionSlug: "images",
        storageId: "storage_1",
        filename: "cover.png",
        mimeType: "image/png",
        size: file.size,
        alt: "cover.png",
      });
    });

    it("uploads a legitimate document file (application/pdf)", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("manual.pdf", "application/pdf");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1"));
      expect(createMediaDocMock).toHaveBeenCalledWith({
        adapter: "convex",
        collectionSlug: "images",
        storageId: "storage_1",
        filename: "manual.pdf",
        mimeType: "application/pdf",
        size: file.size,
        alt: "manual.pdf",
      });
    });

    it("uploads a legitimate video file (video/mp4)", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("clip.mp4", "video/mp4");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1"));
      expect(createMediaDocMock).toHaveBeenCalledWith({
        adapter: "convex",
        collectionSlug: "images",
        storageId: "storage_1",
        filename: "clip.mp4",
        mimeType: "video/mp4",
        size: file.size,
        alt: "clip.mp4",
      });
    });

    it("uploads a zero-byte file (no minimum size is configured anywhere in the upload pipeline)", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = new File([], "empty.png", { type: "image/png" });
      expect(file.size).toBe(0);

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1"));
      expect(createMediaDocMock).toHaveBeenCalledWith(
        expect.objectContaining({ filename: "empty.png", size: 0 }),
      );
    });

    it("attempts to upload a file far larger than any typical size limit, since none is configured anywhere in the upload pipeline (no maxSize on useDropzone, no size cap in core)", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("huge.bin", "application/octet-stream");
      // Fakes a 5GB file without allocating real memory — only `.size` is
      // ever read by this component.
      Object.defineProperty(file, "size", { value: 5_000_000_000 });

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1"));
      expect(createMediaDocMock).toHaveBeenCalledWith(
        expect.objectContaining({ filename: "huge.bin", size: 5_000_000_000 }),
      );
    });

    it("uploads a file whose name contains unicode/emoji, preserving it verbatim", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("日本語 café 🎉.png", "image/png");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1"));
      expect(createMediaDocMock).toHaveBeenCalledWith(
        expect.objectContaining({ filename: "日本語 café 🎉.png", alt: "日本語 café 🎉.png" }),
      );
    });

    it("uploads a file whose name contains markup characters, preserving it verbatim with no sanitization", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("<img src=x onerror=alert(1)>.png", "image/png");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1"));
      expect(createMediaDocMock).toHaveBeenCalledWith(
        expect.objectContaining({ filename: "<img src=x onerror=alert(1)>.png" }),
      );
    });

    it("rejects a disallowed mime type instead of uploading it, honoring the target collection's accepted media types", async () => {
      // Configured to resolve cleanly: the point of this test is the
      // MISSING mime filter, not an unrelated unhandled-rejection failure
      // if the current (unfiltered) code path runs to completion.
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const file = makeFile("malware.exe", "application/x-msdownload");

      fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

      // No positive event to await on the rejection path — flush a tick
      // before asserting the negative.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(generateUploadUrlMock).not.toHaveBeenCalled(); // FAILS: MediaUploadDropzone configures no accept filter — see BUGS-REPORT MEDIA-1
      expect(createMediaDocMock).not.toHaveBeenCalled();
      expect(onUploadComplete).not.toHaveBeenCalled();
    });

    it("keeps the first dropped file and uploads it when multiple files are dropped at once, instead of rejecting the whole batch", async () => {
      generateUploadUrlMock.mockResolvedValue({ url: "https://example.com/upload" });
      adapterUploadFileMock.mockResolvedValue({ storageId: "storage_1" });
      createMediaDocMock.mockResolvedValue("media_1");
      const onUploadComplete = vi.fn();
      const { container } = renderDropzone(onUploadComplete);
      const root = container.querySelector('[role="presentation"]') as HTMLElement;
      const fileA = makeFile("a.png", "image/png");
      const fileB = makeFile("b.pdf", "application/pdf");

      fireEvent.drop(root, { dataTransfer: { files: [fileA, fileB], types: ["Files"] } });

      // `fields/upload/EmptyInput.tsx`'s own single-select drop handler
      // truncates to `files.slice(0, 1)` rather than rejecting the whole
      // drop — that sibling is the established intent for "single file
      // only" in this codebase, so the first file should upload here too.
      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith("media_1")); // FAILS: react-dropzone's multiple:false with no maxFiles rejects the entire batch instead of keeping the first file — see BUGS-REPORT MEDIA-1
      expect(createMediaDocMock).toHaveBeenCalledWith(expect.objectContaining({ filename: "a.png" }));
    });
  });
}

/**
 * Runs the media contract: `FilePreview`'s per-mime rendering branches,
 * `MediaLibraryGrid`'s loading/empty/populated states plus single-/
 * multi-select, and `MediaUploadDropzone`'s accept behavior, drag-active
 * visual state, and multi-file drop handling. No real upload round-trip —
 * `upload/Input.test.tsx` already proves that path.
 *
 * Call once at the top level of a `*.test.tsx` file; it calls
 * `describe`/`it` itself.
 *
 * @param props - Options for the run.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runMediaSuite(props: RunMediaSuiteOptions = {}): void {
  const members: MediaSuiteMember[] =
    props.only ?? ["FilePreview", "MediaLibaryGrid", "MediaUploadDropzone"];
  if (members.includes("FilePreview")) describeFilePreview();
  if (members.includes("MediaLibaryGrid")) describeMediaLibraryGrid(props.access);
  if (members.includes("MediaUploadDropzone")) describeMediaUploadDropzone(props.access);
}
```

#### packages/react/src/components/modals/BaseModal.test.tsx

New file. Thin caller scoping `runModalSuite` to `BaseModal`.

```tsx
import { runModalSuite } from "../../testing/modalSuite";

runModalSuite({ only: ["BaseModal"] });
```

#### packages/react/src/components/modals/CreateDocumentModal.test.tsx

New file. Thin caller scoping `runModalSuite` to `CreateDocumentModal`.

```tsx
import { runModalSuite } from "../../testing/modalSuite";

runModalSuite({ only: ["CreateDocumentModal"] });
```

#### packages/react/src/components/modals/CreateMediaModal.test.tsx

New file. Thin caller scoping `runModalSuite` to `CreateMediaModal`.

```tsx
import { runModalSuite } from "../../testing/modalSuite";

runModalSuite({ only: ["CreateMediaModal"] });
```

#### packages/react/src/components/media/FilePreview.test.tsx

New file. Thin caller scoping `runMediaSuite` to `FilePreview`.

```tsx
import { runMediaSuite } from "../../testing/mediaSuite";

runMediaSuite({ only: ["FilePreview"] });
```

#### packages/react/src/components/media/MediaLibaryGrid.test.tsx

New file. Thin caller scoping `runMediaSuite` to `MediaLibaryGrid`. Filename keeps the
source file's existing `Libary` typo — a rename is tracked separately and is out of scope here.

```tsx
import { runMediaSuite } from "../../testing/mediaSuite";

runMediaSuite({ only: ["MediaLibaryGrid"] });
```

#### packages/react/src/components/media/MediaUploadDropzone.test.tsx

New file. Thin caller scoping `runMediaSuite` to `MediaUploadDropzone`.

```tsx
import { runMediaSuite } from "../../testing/mediaSuite";

runMediaSuite({ only: ["MediaUploadDropzone"] });
```

Verify: node scripts/record-test-findings.mjs packages/react/src/components/modals/{BaseModal,CreateDocumentModal,CreateMediaModal}.test.tsx packages/react/src/components/media/{FilePreview,MediaLibaryGrid,MediaUploadDropzone}.test.tsx

## Step 7 — Consumer surface: `sections` selector and measured floors

**[agent]**

Why: The suites above are internal until `runVexReactSuite` exposes them, and consuming them
through the published subpath is the only place dual-context/packaging defects (ADR-009) show
up. Floors are written from measured numbers, never guessed (AP-012).


Every `VexSuiteSection` except `"hooks"` dispatches to real, exported code — no accepted-but-
inert enum values in the published API. `"fields"`, `"cells"` and `"columnDefs"` are driven by
the same `fieldFixtures` registry `includeCore` already iterates, dispatching once per
registered field type via `runFieldInputContractSuite`, `runFieldCellContractSuite` (Step 5)
and `runColumnDefSuite` (Step 5, new — this step's own generic per-type columnDef assertion,
extracted so both `index.ts` and Step 5's 12 `columnDef.test.ts` files call the same function
instead of duplicating it). `"shell"`, `"views"`, `"dataTable"`, `"modals"` and `"media"` each
dispatch exactly once — no per-type loop — to a single exported suite covering their whole
category: `runShellSuite`/`runViewSuite` (Step 4, `testing/viewSuite.ts`), `runDataTableSuite`
(Step 5, `testing/dataTableSuite.ts`), `runModalSuite` (Step 6, `testing/modalSuite.ts`) and
`runMediaSuite` (Step 6, `testing/mediaSuite.ts`). Running these inside the *consumer's*
process — not just inside `packages/react`'s own suite — is what actually catches the
dual-context/module-resolution class of bug ADR-009 exists to prevent; a no-op section would
accept the value without providing that protection. `"hooks"` remains a valid, accepted value
with no dispatch wired in this edit — that mapping is handled separately, outside this step's
file list, over Step 2/3's already-landed, provider-free hook tests.

#### packages/react/src/testing/index.ts

Six anchored edits. `fieldToCellComponent` already exists in `../components/fields`; the five
new suite functions this step imports are Step 4/5/6's own new exports — read their own step
sections for what each covers internally. This step only imports and dispatches to them.

**1 — imports.** Replace the existing import block (everything up to and including the
`renderWithVexProviders` import) with:

```ts
import type { ComponentType } from "react";
import type { AdminFieldType, CellComponentProps, CollectionConfig, TDocument, VexAccessConfig } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import { fieldToCellComponent, fieldToInputComponent } from "../components/fields";
import { fieldFixtures } from "./fixtures";
import type { FieldFixture } from "./fixtures/types";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { runFieldCellContractSuite } from "./fieldCellContract";
import { runColumnDefSuite } from "./fieldColumnDefContract";
import { runNestedFieldContainerSuite } from "./nestedFieldContainer";
import { renderWithVexProviders } from "./harness/accessFixtures";
import { runShellSuite, runViewSuite } from "./viewSuite";
import { runDataTableSuite } from "./dataTableSuite";
import { runModalSuite } from "./modalSuite";
import { runMediaSuite } from "./mediaSuite";
```

**2 — no-truncation field types.** Insert immediately after the existing
`CONTAINER_CHILD_FIELD_TYPES` constant (right before the `FieldInputComponent` type's doc
comment):

```ts
/**
 * The four field types whose Cell contract opts out of `runFieldCellContractSuite`'s
 * default truncation assertion — a fixed-format date, a number, a boolean checkbox and a
 * `#rrggbb` color swatch never render an unbounded string. Mirrors each type's own
 * `Cell.test.tsx` call (Step 5).
 */
const NO_TRUNCATION_FIELD_TYPES: ReadonlySet<AdminFieldType> = new Set([
  "date",
  "number",
  "checkbox",
  "color",
]);
```

**3 — cell component type alias.** Insert immediately after the existing `FieldInputComponent`
type alias:

```ts
/**
 * The cell component shape every real field cell satisfies — the `cells` loop's
 * counterpart to `FieldInputComponent` above.
 */
type FieldCellComponent<TField> = ComponentType<CellComponentProps<TField, TDocument>>;
```

**4 — `VexSuiteSection` type.** Insert immediately before `runVexReactSuite`'s doc comment:

```ts
/**
 * The named groups `runVexReactSuite`'s `sections` option selects between. Each name
 * mirrors one of `2026-09-08-react-coverage-expansion`'s task groups.
 *
 * `"fields"`, `"cells"` and `"columnDefs"` are driven by the same `fieldFixtures` registry
 * `includeCore` already iterates, dispatching once per registered field type via
 * `runFieldInputContractSuite`, `runFieldCellContractSuite` and `runColumnDefSuite`
 * respectively.
 *
 * `"shell"`, `"views"`, `"dataTable"`, `"modals"` and `"media"` each dispatch exactly once —
 * no per-type loop — to a single exported suite covering their whole category: `runShellSuite`
 * (`AdminLayout`/`AdminSidebar`/`AdminTopNav`), `runViewSuite` (all 8 admin views),
 * `runDataTableSuite` (the 4 `ui/data-table` files), `runModalSuite` (the 3 modals) and
 * `runMediaSuite` (`FilePreview`/`MediaLibaryGrid`/`MediaUploadDropzone`). `access` threads
 * through to every one of these that accepts it, so a consumer's own `VexAccessConfig` drives
 * the real RBAC-gated render paths inside its own build, not just the `shell` check below.
 * Running these against a consumer's own `@vexcms/react` build (not just inside this package's
 * own suite) is what actually catches ADR-009's dual-context/module-resolution failure class.
 *
 * `"hooks"` is a valid, accepted value. Wiring it to a dispatch is out of this edit's scope.
 */
export type VexSuiteSection =
  | "fields"
  | "cells"
  | "columnDefs"
  | "views"
  | "shell"
  | "dataTable"
  | "modals"
  | "hooks"
  | "media";

const ALL_SECTIONS: readonly VexSuiteSection[] = [
  "fields",
  "cells",
  "columnDefs",
  "views",
  "shell",
  "dataTable",
  "modals",
  "hooks",
  "media",
];
```

**5 — `runVexReactSuite`'s doc comment and signature.** Replace the existing doc comment and
function signature (through the opening `{`) with:

```ts
/**
 * Runs the full `@vexcms/react` test kit — the low-ceremony entry point the
 * `./testing` subpath exists to deliver. Call at module top level inside a
 * `*.test.ts(x)` file; like every other factory in this kit it calls
 * `describe`/`it` itself.
 *
 * @param options.includeCore - Sugar that suppresses the three `fieldFixtures`-registry-driven
 *   sections (`fields`, `cells`, `columnDefs`) in one flag, independent of `sections`. When
 *   `false`, none of those three loops run even if `sections` names them — the two options
 *   combine with AND, never OR. Defaults to `true`. Does not affect `custom` (below) or any of
 *   `shell`/`views`/`dataTable`/`modals`/`media`, none of which read the `fieldFixtures`
 *   registry.
 * @param options.sections - Which named groups to run; defaults to every `VexSuiteSection`.
 *   Narrows `includeCore`'s three fixture-driven loops individually (e.g. `sections: ["cells"]`
 *   runs only the cell contract, not the input or column-def ones) and independently gates each
 *   of the five single-call suites. See {@link VexSuiteSection} for what each name dispatches.
 * @param options.custom - Project-authored fixtures paired with their own
 *   `Component`. Unlike `fieldFixtures`' entries these are never looked up via
 *   `fieldToInputComponent` — a custom field type is never registered in
 *   core's registry — so each entry's own `Component` is used directly. Each
 *   runs through the same `runFieldInputContractSuite`. Always runs, regardless of
 *   `includeCore` or `sections`: a project's own field type has no `fieldFixtures` registry
 *   entry for either option to gate on.
 * @param options.access - A real `VexAccessConfig` (typically a project's own
 *   `defineAccess()` result). `CollectionConfig` carries no `access` field of
 *   its own — RBAC is a separate, global matrix keyed by resource slug — so
 *   this cannot be threaded into the field-input loop above; instead it is
 *   proven directly against the real `VexAccessProvider` via
 *   `renderWithVexProviders`, giving a project a falsifiable check that its
 *   own access config resolves outside a hand-typed stub. Also forwarded to
 *   `runShellSuite`, `runViewSuite`, `runModalSuite` and `runMediaSuite` — each accepts
 *   `access` optionally and falls back to its own default RBAC fixtures when omitted.
 */
export function runVexReactSuite(options?: {
  includeCore?: boolean;
  sections?: VexSuiteSection[];
  custom?: Array<FieldFixture & { Component: FieldInputComponent<FieldFixture["fieldDef"]> }>;
  access?: VexAccessConfig;
}): void {
```

**6 — function body.** Replace the entire existing body (from `const { includeCore = true, ... }`
through the final `}` that closes the function) with:

```ts
  const { includeCore = true, sections = ALL_SECTIONS, custom = [], access } = options ?? {};
  const runsCore = (section: VexSuiteSection): boolean => includeCore && sections.includes(section);

  if (sections.includes("shell")) {
    if (access) {
      describe("runVexReactSuite — access config", () => {
        it("resolves the provided VexAccessConfig inside the real VexAccessProvider", () => {
          const { container, unmount } = renderWithVexProviders(null, { access });
          expect(container).toBeTruthy();
          unmount();
        });
      });
    }
    runShellSuite({ access });
  }

  if (sections.includes("views")) {
    runViewSuite({ access });
  }

  if (sections.includes("dataTable")) {
    runDataTableSuite();
  }

  if (sections.includes("modals")) {
    runModalSuite({ access });
  }

  if (sections.includes("media")) {
    runMediaSuite({ access });
  }

  if (runsCore("fields")) {
    for (const fieldType of Object.keys(fieldFixtures) as AdminFieldType[]) {
      const fixture = fieldFixtures[fieldType];
      if (!fixture) continue;
      const InputComponent = fieldToInputComponent(fieldType);
      if (!InputComponent) continue;
      // Boundary cast: `fieldToInputComponent` returns
      // `ComponentType<InputComponentProps<BaseFieldMeta, AdminField>>`, whose
      // `collection` prop is `CollectionConfig | GlobalConfig`. Comparing
      // `ComponentType`s checks `defaultProps` covariantly, which rejects that
      // wider union against `FieldInputComponent`'s narrower `CollectionConfig`-only
      // prop — the same boundary `nestedFieldContainer.ts` documents and casts.
      const Component = InputComponent as unknown as FieldInputComponent<typeof fixture.fieldDef>;

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

  if (runsCore("cells")) {
    for (const fieldType of Object.keys(fieldFixtures) as AdminFieldType[]) {
      const fixture = fieldFixtures[fieldType];
      if (!fixture) continue;
      const CellComponent = fieldToCellComponent(fieldType);
      if (!CellComponent) continue;
      // Boundary cast: mirrors the `fields` loop's cast above — `fieldToCellComponent`
      // returns `ComponentType<CellComponentProps<AdminField>>`, widened relative to the
      // fixture's own narrower `fieldDef` type.
      const Component = CellComponent as unknown as FieldCellComponent<typeof fixture.fieldDef>;

      runFieldCellContractSuite({
        fixture,
        Component,
        truncates: NO_TRUNCATION_FIELD_TYPES.has(fieldType) ? false : undefined,
      });
    }
  }

  if (runsCore("columnDefs")) {
    for (const fieldType of Object.keys(fieldFixtures) as AdminFieldType[]) {
      const fixture = fieldFixtures[fieldType];
      if (!fixture) continue;
      runColumnDefSuite({ fixture });
    }
  }

  for (const { Component, ...fixture } of custom) {
    runFieldInputContractSuite({ fixture, Component });
  }
}
```

Every other line in the file (`CONTAINER_FIELD_TYPES`, `isContainerFieldType`,
`CONTAINER_CHILD_FIELD_TYPES`, the `FieldInputComponent` type, and the re-exports block at the
bottom) is unchanged.

#### packages/react/src/testing/index.test.ts

New file. Tests dispatch, not the sub-suites' own behavior (that's each factory's own test
file) — mocks all eight dispatch targets and counts calls, keyed by section name so one
table-driven block exercises every section instead of duplicating the same assertion eight
times. Calls `runVexReactSuite` inside `describe()`/`describe.each()` callbacks, never inside
`it()` — `runVexReactSuite` calls `describe`/`it` itself, which is only legal during
collection, not while another test is running.

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("./fieldInputContract", () => ({ runFieldInputContractSuite: vi.fn() }));
vi.mock("./nestedFieldContainer", () => ({ runNestedFieldContainerSuite: vi.fn() }));
vi.mock("./fieldCellContract", () => ({ runFieldCellContractSuite: vi.fn() }));
vi.mock("./fieldColumnDefContract", () => ({ runColumnDefSuite: vi.fn() }));
vi.mock("./viewSuite", () => ({ runViewSuite: vi.fn(), runShellSuite: vi.fn() }));
vi.mock("./dataTableSuite", () => ({ runDataTableSuite: vi.fn() }));
vi.mock("./modalSuite", () => ({ runModalSuite: vi.fn() }));
vi.mock("./mediaSuite", () => ({ runMediaSuite: vi.fn() }));

import { fieldFixtures } from "./fixtures";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { runFieldCellContractSuite } from "./fieldCellContract";
import { runColumnDefSuite } from "./fieldColumnDefContract";
import { runShellSuite, runViewSuite } from "./viewSuite";
import { runDataTableSuite } from "./dataTableSuite";
import { runModalSuite } from "./modalSuite";
import { runMediaSuite } from "./mediaSuite";
import { runVexReactSuite } from "./index";

const FIELD_TYPE_COUNT = Object.keys(fieldFixtures).length;

/** Every mocked dispatch target, keyed by the `VexSuiteSection` name that triggers it. */
const DISPATCH_MOCKS = {
  fields: vi.mocked(runFieldInputContractSuite),
  cells: vi.mocked(runFieldCellContractSuite),
  columnDefs: vi.mocked(runColumnDefSuite),
  shell: vi.mocked(runShellSuite),
  views: vi.mocked(runViewSuite),
  dataTable: vi.mocked(runDataTableSuite),
  modals: vi.mocked(runModalSuite),
  media: vi.mocked(runMediaSuite),
} as const;

type DispatchSection = keyof typeof DISPATCH_MOCKS;
const DISPATCH_SECTIONS = Object.keys(DISPATCH_MOCKS) as DispatchSection[];

/** `fields`/`cells`/`columnDefs` dispatch once per registered field type; the other five dispatch once, total, per call. */
const PER_TYPE_SECTIONS = new Set<DispatchSection>(["fields", "cells", "columnDefs"]);

function expectedCallCount(section: DispatchSection): number {
  return PER_TYPE_SECTIONS.has(section) ? FIELD_TYPE_COUNT : 1;
}

function callCounts(): Record<DispatchSection, number> {
  return Object.fromEntries(
    DISPATCH_SECTIONS.map((section) => [section, DISPATCH_MOCKS[section].mock.calls.length]),
  ) as Record<DispatchSection, number>;
}

describe("runVexReactSuite — sections dispatch — default (no options)", () => {
  vi.clearAllMocks();
  runVexReactSuite();
  const counts = callCounts();

  it.each(DISPATCH_SECTIONS)("dispatches %s the expected number of times", (section) => {
    expect(counts[section]).toBe(expectedCallCount(section));
  });
});

describe.each(DISPATCH_SECTIONS)('runVexReactSuite — sections dispatch — sections: ["%s"]', (onlySection) => {
  vi.clearAllMocks();
  runVexReactSuite({ sections: [onlySection] });
  const counts = callCounts();

  it(`dispatches only ${onlySection}`, () => {
    for (const section of DISPATCH_SECTIONS) {
      expect(counts[section]).toBe(section === onlySection ? expectedCallCount(section) : 0);
    }
  });
});

describe('runVexReactSuite — sections dispatch — sections: ["hooks"]', () => {
  vi.clearAllMocks();
  runVexReactSuite({ sections: ["hooks"] });
  const counts = callCounts();

  it("dispatches nothing — hooks has no wired dispatch in this file", () => {
    for (const section of DISPATCH_SECTIONS) {
      expect(counts[section]).toBe(0);
    }
  });
});

describe("runVexReactSuite — sections dispatch — includeCore: false", () => {
  vi.clearAllMocks();
  runVexReactSuite({ includeCore: false, sections: ["fields", "cells", "columnDefs"] });
  const coreCounts = {
    fields: DISPATCH_MOCKS.fields.mock.calls.length,
    cells: DISPATCH_MOCKS.cells.mock.calls.length,
    columnDefs: DISPATCH_MOCKS.columnDefs.mock.calls.length,
  };

  const textFixture = fieldFixtures.text;
  if (!textFixture) throw new Error("expected a `text` entry in fieldFixtures");
  vi.clearAllMocks();
  runVexReactSuite({ includeCore: false, custom: [{ ...textFixture, Component: () => null }] });
  const customCallCount = DISPATCH_MOCKS.fields.mock.calls.length;

  it("suppresses fields, cells and columnDefs even when `sections` names all three", () => {
    expect(coreCounts).toEqual({ fields: 0, cells: 0, columnDefs: 0 });
  });

  it("does not suppress `custom`", () => {
    expect(customCallCount).toBe(1);
  });
});
```

#### apps/test/src/vexcms/admin.test.ts

Dogfood host: names the full `VexSuiteSection` set explicitly (rather than relying on the
implicit default) so a future default change can never silently narrow this app's coverage.
Replace the `runVexReactSuite({ ... })` call at the bottom with:

```ts
runVexReactSuite({
  // Dogfood host: the full `VexSuiteSection` set, run against the real built
  // `@vexcms/react` output — this is where ADR-009-class dual-context defects in the
  // field/cell/columnDef contracts and the shell/view/data-table/modal/media suites would
  // surface. apps/www names a narrower, faster subset instead (see its own admin.test.ts).
  sections: [
    "fields",
    "cells",
    "columnDefs",
    "views",
    "shell",
    "dataTable",
    "modals",
    "hooks",
    "media",
  ],
  // Real VexAccessConfig this app ships — resolves through the real
  // VexAccessProvider, not a hand-typed stand-in.
  access,
  custom: [{ ...pageSlugFixture, Component: TextFieldInput }],
});
```

The `pageSlugFixture` const and the two imports above it are unchanged.

#### apps/www/src/vexcms/admin.test.ts

Replace `includeCore: false` with the explicit fast subset `sections: ["shell"]` — `custom`
always runs regardless of `sections` (Step 7's edit 6 above), so this keeps proving the
project's own field type wires through the real machinery, plus this app's own real
`VexAccessConfig` through `runShellSuite`, while skipping the ~600 core field-fixture tests
and the views/dataTable/modals/media suites (all already exercised against the real build from
`apps/test`). Replace the file's trailing doc comment and `runVexReactSuite({ ... })` call
with:

```ts
/**
 * Smoke test proving the shared test kit is wired up and runnable from this
 * app via `@vexcms/next/testing` (the Next-flavored re-export of
 * `@vexcms/react/testing`) — not a full contract run. `sections: ["shell"]`
 * runs only the access-config check plus `runShellSuite`, skipping
 * `fields`/`cells`/`columnDefs`'s ~600 core-field-type tests and the
 * views/dataTable/modals/media suites: all of those already run against the
 * real built `@vexcms/react` output from `apps/test`, see
 * `apps/test/src/vexcms/admin.test.ts` — re-running them here would only
 * duplicate that coverage on every `www` test run. `custom` (below) always
 * runs regardless of `sections`.
 *
 * `metaTitleFixture` is this app's own `text` field configuration — not one
 * of the fixtures core registers in `fieldFixtures` — paired with the real,
 * publicly exported `TextFieldInput` to prove `custom` drives a
 * project-authored fixture through the same `runFieldInputContractSuite`
 * machinery every core field type runs through.
 */
const metaTitleFixture: FieldFixture<TextField, string> = {
  fieldType: "text",
  fieldDef: text({ label: "Meta Title", required: true }),
  valid: "About VexCMS",
  invalid: undefined,
  empty: undefined,
}

runVexReactSuite({
  sections: ["shell"],
  // Real VexAccessConfig this app ships — resolves through the real
  // VexAccessProvider, not a hand-typed stand-in.
  access,
  custom: [{ ...metaTitleFixture, Component: TextFieldInput }],
})
```

The imports above are unchanged.

#### apps/test/vitest.config.ts

AP-012: the four threshold numbers below are measured, not guessed. Before writing this file,
run:

```sh
pnpm --filter test exec vitest run --coverage
```

then open `apps/test/coverage/coverage-summary.json` and read `.total.statements.pct`,
`.total.branches.pct`, `.total.functions.pct` and `.total.lines.pct`. Round each **down** to
the nearest whole number (protects the gate from sub-percent jitter between runs) and paste
those four integers in place of the four `<...>` placeholders below — this file is not
complete until every placeholder is replaced with a real measured number; a config carrying a
literal `<...>` token fails `vitest run --coverage` immediately (an invalid `thresholds` value),
which is the intended forcing function, not a bug.

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    setupFiles: ["./src/testing/setup.ts"],
    coverage: {
      enabled: true,
      reporter: ["default", "json-summary"],
      // Measured via `pnpm --filter test exec vitest run --coverage`, read from
      // `coverage/coverage-summary.json#total`, each rounded down to a whole number. A
      // regression below this floor fails the build — remeasure and raise it deliberately
      // when this app's own tested surface grows, never lower it to silence a real drop.
      thresholds: {
        statements: <MEASURED_STATEMENTS_PCT>,
        branches: <MEASURED_BRANCHES_PCT>,
        functions: <MEASURED_FUNCTIONS_PCT>,
        lines: <MEASURED_LINES_PCT>,
      },
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

#### apps/www/vitest.config.ts

Same measure-then-set instruction, against this app's own suite:

```sh
pnpm --filter www exec vitest run --coverage
```

Read `apps/www/coverage/coverage-summary.json`'s `.total.{statements,branches,functions,lines}.pct`,
round each down, and replace the four placeholders below.

```ts
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    setupFiles: ["@vexcms/react/testing"],
    coverage: {
      enabled: true,
      reporter: ["default", "json-summary"],
      // Measured via `pnpm --filter www exec vitest run --coverage`, read from
      // `coverage/coverage-summary.json#total`, each rounded down to a whole number.
      thresholds: {
        statements: <MEASURED_STATEMENTS_PCT>,
        branches: <MEASURED_BRANCHES_PCT>,
        functions: <MEASURED_FUNCTIONS_PCT>,
        lines: <MEASURED_LINES_PCT>,
      },
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
```

Verify: pnpm --filter @vexcms/react build && node scripts/record-test-findings.mjs apps/test/src/vexcms/admin.test.ts && node scripts/record-test-findings.mjs apps/www/src/vexcms/admin.test.ts

## Step 8 — Gate the 80% target and record the policy

**[agent]**
Why: Turns the target into an enforced floor rather than a one-off measurement, and captures
the conventions the new factories introduce so the next field type follows them.


- [ ] `packages/react/vitest.config.ts` — `coverage.thresholds.statements: 80` (plus
      branches/functions/lines at their measured values) so a regression fails the build
- [ ] `.agent/docs/standards/testing/react-test-factories.md` — document
      `runFieldCellContractSuite`, `runColumnDefSuite`, `runDataTableSuite`, the
      `renderView` view harness, `runViewSuite`/`runShellSuite`, `runModalSuite`/
      `runMediaSuite`, and the `sections` selector alongside the existing factories, plus
      the intent-over-as-built rule (below) as a standing practice that outlives this spec
- [ ] Run `harness struct && harness sync`; confirm `harness doctor` is clean, the ~918
      pre-existing tests still pass, and every new-suite failure — from Step 5's Cell
      contract, but also Step 2/3's hooks, Step 4's RBAC-gated views, and Step 6's modals
      and media — matches the baseline recorded in `findings.md`; any failure outside that
      baseline is a defect in this spec's own work
- [ ] Confirm `coverage.thresholds` is asserted programmatically against
      `coverage-summary.json` (the `node -e` check below), not eyeballed from the terminal
      table — a cached `FULL TURBO` banner is not evidence the check ran
- [ ] Review every test file touched by Steps 2–7 against the three PROHIBITED patterns in
      the Test Authoring Protocol (below) before accepting the gate as passed — a GREEN test
      that pins as-built behavior is a defect in this spec's own work, exactly as much as an
      unexplained red one

#### packages/react/vitest.config.ts

One edit. Everything not shown — `test.globals`/`environment`/`include`/`setupFiles`/
`passWithNoTests`, and the `coverage.exclude`/`coverage.reporter` Step 1 already added — is
unchanged.

**1 — `coverage.thresholds`, as a sibling of the `enabled`/`exclude`/`reporter` keys already
inside `coverage` (Step 1).** `statements: 80` is the interview-decided target and is fixed.
`branches`/`functions`/`lines` are NOT: they can only be known by running the full suite this
spec adds, so — per AP-012 ("never write an acceptance criterion — or a config value — that
cannot be measured, invent the invariant that actually holds") — this step's own execution
MUST run coverage first and paste the measured numbers, never guess them:

```
pnpm --filter @vexcms/react exec vitest run --coverage
node -e "const s=require('./packages/react/coverage/coverage-summary.json');console.log(Math.floor(s.total.branches.pct),Math.floor(s.total.functions.pct),Math.floor(s.total.lines.pct))"
```

Take the floor (never round up — a threshold that reads slightly high than the real number
fails the very next run on a zero-line-of-code drift) of each printed number and replace the
three placeholders below before this step is considered done. Do not commit the placeholders
as shown:

```ts
    coverage: {
      // ...enabled/exclude/reporter unchanged from Step 1...
      thresholds: {
        statements: 80,
        // PLACEHOLDER — replace with Math.floor(total.branches.pct) from a real
        // `vitest run --coverage` after Steps 2-7 are implemented. Do not guess.
        branches: 80,
        // PLACEHOLDER — replace with Math.floor(total.functions.pct).
        functions: 80,
        // PLACEHOLDER — replace with Math.floor(total.lines.pct).
        lines: 80,
      },
    },
```

With `coverage.thresholds` set, `vitest run --coverage` itself now exits non-zero on any
future regression below these floors — the `node -e` check in this step's `Verify:` is a
second, independent assertion of the `statements` floor specifically (so CI fails loudly with
a readable message rather than vitest's own less quotable non-zero exit), not a duplicate of
the same mechanism.

#### .agent/docs/standards/testing/react-test-factories.md

Eight edits, each a new bullet inserted beside the existing factory list. Nothing else in the
file changes. The four new-suite bullets (columnDefSuite, dataTableSuite, viewSuite/
shellSuite, modalSuite/mediaSuite) are authored against the frozen dispatch table Steps
4/5/6/7 agreed directly over `hub` while mid-flight — if a landed export's shape differs,
correct the bullet against the file, not from memory.

**1 — immediately after the file's opening heading (`# React Test Factories`), before the
existing first bullet.** This is a standing project practice, not a fact about the testing
kit's shape like the other seven bullets — it governs how every bullet below (and every
future one) is written, so it goes first:

```markdown
- **Every assertion in this package's factories and per-type tests encodes INTENDED
  behavior, never behavior that merely happens to be implemented.** This is not a
  suggestion: `.agent/docs/specs/2026-09-08-react-coverage-expansion/spec.md`'s
  `## Test Authoring Protocol` is the binding definition — derive intent from the
  component's own JSDoc, the `@vexcms/core` type contract, the named function's or prop's
  plain meaning, or a sibling implementation, in that order, and stop at the first that
  answers. If a component's behavior disagrees with its own intent, the test asserts the
  intent and is allowed to fail; a discovered failure is recorded (`findings.md` /
  `BUGS-REPORT.md`), never silenced by asserting whatever the code currently does. This
  outlives the 2026-09-08 spec: every factory and per-type test added to this package after
  that spec closes follows the same rule.
```

**2 — after the `peerDependencies`-only bullet** (the one ending "…the dual-module-instance
failure this avoids)."), document the `sections` selector and the rule this spec makes
universal:

```markdown
- `testing/index.ts`'s `runVexReactSuite` takes a `sections?: VexSuiteSection[]` array
  (`"fields" | "cells" | "columnDefs" | "views" | "shell" | "dataTable" | "modals" | "hooks" |
  "media"`), defaulting to ALL sections — each name dispatches to a real exported suite
  function under `testing/` (never `only`; the section itself is the dispatch granularity,
  the suite's own `only` filter is for the suite's own callers). `includeCore: false` remains
  sugar that suppresses only the field sections (`"fields"`, `"cells"`, `"columnDefs"`) —
  unchanged so `apps/www`'s existing call keeps working. Wanting a narrower slice than that
  (e.g. a fast smoke covering only `"hooks"` and `"shell"`) means naming `sections` explicitly
  instead.
  **Every section-selectable suite MUST be an exported function under
  `packages/react/src/testing/`, with the package's own `*.test.tsx` file as a thin caller —
  never a raw test file.** The package's internal `*.test.tsx` files do not ship in `dist/`;
  only `dist/testing/` does, so a section backed by nothing but an internal test file would be
  accepted by the type system and silently do nothing for a consumer. This is load-bearing,
  not stylistic: running a suite inside the *consumer's* own process, through the published
  `./testing` subpath, is what catches the dual-context/module-resolution failure class
  ADR-009 exists to prevent — measured there at 26 of 27 `apps/www` tests failing the moment
  the test kit's provider and the component's provider resolved to two different bundled
  copies of the same `createContext` call. A no-op section provides none of that protection
  while looking, from a consumer's config, exactly like one that does.
```

**3 — after the `testing/nestedFieldContainer.ts` bullet** (ending "…let the registry carry
it."), document the Cell contract:

```markdown
- `testing/fieldCellContract.ts`'s `runFieldCellContractSuite` is `runFieldInputContractSuite`'s
  counterpart for the list-view Cell renderer: every type shares the null/undefined
  placeholder, the `isTitleField` edit-link wrap, truncation with a `title` attribute carrying
  the untruncated value, and `expectNoA11yViolations`; per-type rendering is the caller's
  `extra`, exactly as with the input contract. Both base assertions are deliberately
  non-negotiable, not opt-in:
  - `isTitleField` is asserted for EVERY type because `useAsTitle?: CoreAdminField |
    NoInfer<TFieldSlug>` (`packages/core/src/collections/types.ts`) accepts any field key with
    no narrowing to text-ish types — a `date` or `select` field can legitimately be the title
    column, so the base contract has to cover it universally rather than per-type.
  - Truncation defaults ON: `truncates` defaults to `77` (`text/Cell.tsx`'s existing cutoff)
    and a type opts OUT with `truncates: false`, never the other way around. Defaulting to
    "runs" rather than "skipped" is what makes a newly added field type declare its stance
    consciously instead of silently inheriting no truncation coverage. Pass `truncates: false`
    only for the four types where truncation is meaningless by value shape — `date` (fixed
    format), `number`, `checkbox` (boolean), `color` (`#e8622a`) — every other type keeps the
    default.
  A field type's `Cell.test.tsx` failing any base-contract assertion — the two above, or the
  null/undefined placeholder — is a real defect in that Cell, not a factory bug. The
  authoritative record of which types currently fail which assertion is
  `.agent/docs/specs/2026-09-08-react-coverage-expansion/findings.md` (generated by
  `scripts/record-test-findings.mjs`) and the triaged `BUGS-REPORT.md` it feeds — never a
  count restated in prose, which drifts as Step 5's factory gets written against all 12
  types.
```

**4 — immediately after the `fieldCellContract.ts` bullet just added (edit 3)**, document the
two other Step 5 exports — one per-type, one single-call:

```markdown
- `testing/columnDefSuite.ts`'s `runColumnDefSuite<TField, TValue>(options: { fixture:
  FieldFixture<TField, TValue> })` is a third per-type factory alongside
  `runFieldInputContractSuite`/`runFieldCellContractSuite`, called once per field type from
  that type's `columnDef.test.ts` (12 callers). It builds the column via
  `getCollectionColumnDefs`, which already switches on `fieldDef.type` internally — so the
  suite takes no per-type builder argument — and asserts `accessorKey`/`id`, header text
  falling back from `label` to the field key, `meta.alignment` from `admin.cellAlignment`, and
  cell-renderer identity with props forwarded.
- `testing/dataTableSuite.ts`'s `runDataTableSuite(options?: { only?: Array<"DataTable" |
  "DataTablePagination" | "DataTableBulkActions" | "DeleteManyModal"> })` is the first of this
  spec's single-call-per-section suites: called ONCE, its default `only` covers all four
  `ui/data-table/*` files together — sorting and pagination wired to `usePagination`, bulk
  selection wired to `useTableSelection`, and the delete-many confirm/cancel flow. It takes no
  `access`: neither the four data-table components nor any of the 12 `columnDef.tsx` files
  read `usePermission`/`VexAccessProvider`, and a parameter nothing consumes is exactly the
  speculative code `code-rules.md` forbids.
```

**5 — after the `testing/rbacState.ts` bullet** (ending "…generalized into a factory."),
document the view harness:

```markdown
- `testing/harness/viewHarness.tsx`'s `renderView` mounts a full admin view with every
  provider it reads — `ConvexProvider` + `QueryClientProvider` wired to the convex bridge,
  `NuqsTestingAdapter`, `VexConfigContext`, and the `VexAccess`/`VexAuth` pair — by composing
  `renderWithVexProviders` rather than re-wiring access/auth itself. `testClientConfig` is its
  default stub `ClientVexConfig` (one `posts` collection, one `images` media collection, one
  global) for view tests that don't need a bespoke config. Reach for `renderView` for anything
  that reads Convex-backed data (`CollectionListView`, `AdminSidebar`, …); a test that only
  needs the access/auth pair without Convex keeps calling `renderWithVexProviders` directly —
  `renderView` composes it, it does not replace it.
```

**6 — immediately after the `viewHarness.tsx` bullet just added (edit 5)**, document the two
Step 4 single-call-per-section suites built on it:

```markdown
- `testing/viewSuite.ts` exports `runViewSuite(options?: { only?: Array<"CollectionListView" |
  "CollectionEditView" | "GlobalEditView" | "GlobalsListView" | "DashboardView" |
  "UnauthorizedView" | "MediaCollectionListView" | "MediaCollectionEditView">; access?:
  VexAccessConfig })`, covering all eight admin views on top of `renderView`, and
  `runShellSuite(options?: { only?: Array<"AdminLayout" | "AdminSidebar" | "AdminTopNav">;
  access?: VexAccessConfig })`, covering `AdminLayout`/`AdminSidebar`/`AdminTopNav` —
  framework-component injection, active-route highlighting, and the three `usePermission`
  nav-gating call sites. Both default `only` to every member of their category; a caller
  narrows to specific views/components by naming them. `access` is two-mode, documented in
  each suite's own JSDoc: the default (no `access` supplied) drives the real five-scenario
  RBAC matrix through `testAccess`/`testUsers`; a caller-supplied `access` gets only a
  renders-without-crashing smoke check, since arbitrary role names and resources cannot be
  assumed to match the default matrix's shape.
```

**7 — after the `testing/convex/` bullet** (ending "…imports it from its own
`testFixture.ts`."), document the last two Step 6 suites:

```markdown
- `testing/modalSuite.ts`'s `runModalSuite(options?: { only?: Array<"BaseModal" |
  "CreateDocumentModal" | "CreateMediaModal">; access?: VexAccessConfig })` and
  `testing/mediaSuite.ts`'s `runMediaSuite(options?: { only?: Array<"FilePreview" |
  "MediaLibaryGrid" | "MediaUploadDropzone">; access?: VexAccessConfig })` follow the same
  `only`-filtered, single-call-per-section shape as `runViewSuite`/`runShellSuite`/
  `runDataTableSuite` above, for the last two categories: modals (open/close, escape/backdrop
  dismissal, focus trap, submit wiring, and rapid-resubmit) and media (render states,
  selection, accept filtering, and same-batch multi-file drop behavior — no real upload
  round-trip; `upload/Input.test.tsx` already proves that path). `access` threads to
  `renderWithVexProviders` in both for signature consistency with the other single-call
  suites, even though none of these six components read permissions directly — documented in
  each suite's own JSDoc as reserved/unexercised for that reason, not dead code by oversight.
  Only these two umbrella functions are published per category — a per-component helper
  (`runBaseModalSuite`, `runFilePreviewSuite`, …) may exist as a module-local implementation
  detail, never as an additional export. Every extra export on a library heading to alpha
  release is a compatibility obligation the `only` filter already makes unnecessary: it gives
  a caller component-level granularity without a component-level export.
```

#### Pass condition

This spec closes with a suite that is **not** all-green, and "all tests green" is explicitly
the wrong bar. The gate is a **baseline comparison against `findings.md`**, the same
mechanism the `2026-09-04-react-test-suite` spec used — never a failure count hand-copied
into prose, which goes stale the moment a Cell's assertion set changes. The red set is **not
confined to Step 5's Cell contract**: Steps 2, 3, 4, and 6 each contribute their own
intent-asserting failures (the `HOOK-*`, `RBAC-*`, `CORE-LABEL-1`, `MEDIA-1`, and `MODAL-1`
findings Step 9's `BUGS-REPORT.md` triages), because the Test Authoring Protocol binds every
step, not only the Cell contract's four base assertions.

- The ~918 tests that existed before this spec still pass — a regression in any of them is a
  defect in this spec's own work, full stop.
- Every new-suite failure — from `runFieldCellContractSuite`, the hook test files, the
  RBAC-gated view tests, the modal/media suites, or anywhere else this spec adds coverage —
  MUST appear in the set `node scripts/record-test-findings.mjs <pattern>` records to
  `.agent/docs/specs/2026-09-08-react-coverage-expansion/findings.md`. That file, not a count
  in this document, is authoritative: Step 5 discovers the Cell defect surface by running the
  factory against all 12 field types, Steps 2/3 discover the hook defects by asserting each
  hook's own documented contract, Step 4 discovers the RBAC gaps by asserting the same
  gating pattern across sibling views, and Step 6 discovers the modal/media defects the same
  way — Step 9's `BUGS-REPORT.md` is the triaged write-up of whatever `findings.md` recorded
  across all of them, and this step does not restate their count.
- A failure NOT present in `findings.md` blocks this step: it is a defect in this spec's own
  work, not a recorded product defect. A `findings.md` failure that starts passing is also
  worth surfacing rather than silently accepted — it means a defect got fixed and the
  follow-up fix spec's scope shrank. **It must be traceable to a diff in the component or
  hook source (`packages/react/src/**`, or `packages/core` for `CORE-LABEL-1`), never to a
  diff in only the test file's expected value.** A shrinking failure count with no matching
  source change is not progress — it means an assertion was softened, which the next bullet
  makes explicit is itself a defect.
- Coverage is unaffected either way: a failing assertion still runs after the component
  renders, so those statements are still counted by istanbul/v8. The 80% gate stands
  independently of the size or shape of the recorded failure set.

**Anti-regression clause — a GREEN test can be as much a defect as an unexplained red one.**
This spec's binding Test Authoring Protocol makes pinning a bug forever with a passing
assertion the single failure mode the whole spec exists to prevent. A reviewer accepting this
gate MUST read every test file Steps 2–7 touched against the three PROHIBITED patterns the
Protocol names, as the review checklist:

1. **Asserting the wrong output because that's what the code emits** — e.g. `expect(r.current
   .page).toBe(1)` after calling `goToPage(5)`, or `expect(collection.labels.singular).toBe(
   "Posts")` where the intended value is `"Post"`. If the assertion's expected value is
   *derived from running the component*, rather than from its JSDoc, its type contract, its
   name's plain meaning, or a sibling implementation, it is pinning, not testing.
2. **Documenting an absence instead of asserting the contract** — e.g. `it("applies no mime
   filtering", () => expect(dropzone.accept).toBeUndefined())`. A test whose name describes
   what the code *doesn't* do, asserting that non-behavior as correct, is the same defect
   wearing a different shape.
3. **A test that only passes because a bug is present** — any assertion that would need to
   change if the underlying defect were fixed is, by definition, testing the defect instead
   of the intent. If flipping the component's behavior toward its documented/typed/named
   contract would break the test, the test is wrong today, not the future fix.

If any test in Steps 2–7 matches one of these three patterns, it is a defect in this spec's
own work — fix the assertion to encode intent (letting it go red and recording the finding),
not the component. **A shrinking failure count between two runs of this gate, with no
corresponding source diff outside a test file, means someone softened an assertion — treat it
as a review failure, not a sign of progress.**

Verify: node scripts/record-test-findings.mjs "packages/react/src/**/*.test.ts?(x)" && node -e "const s=require('./packages/react/coverage/coverage-summary.json');if(s.total.statements.pct<80)throw new Error('statements '+s.total.statements.pct+'% < 80%')" && harness doctor

## Step 9 — File the recorded defects for the follow-up fix spec

**[agent]**
Why: The base-contract failures Step 5's Cell suite surfaces are this spec's second output,
and they are only useful if they arrive triaged. Without this the next agent inherits a red
suite and no explanation.


- [ ] `.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md` — triaged from
  `findings.md`, in the shape the `2026-09-04-react-test-suite` spec's report used: root
  cause, affected files, severity, suggested direction, and a reference implementation for
  each — checked per-behavior, not assumed from one "reference" file (see `DOC-1`)
- [ ] Group the causes explicitly: `CELL-3` — 7 Cells mishandle null/undefined (2 of those
  crash the table render, ranked above the other two); `CELL-1` — 10 Cells ignore
  `isTitleField`; `CELL-2` — 6 Cells render unbounded values with no truncation or `title`
  attribute
- [ ] Note that `useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>`
  (`packages/core/src/collections/types.ts:170`) is what makes `CELL-1` reachable
- [ ] State that the authoritative failure baseline is `findings.md` (written by
  `scripts/record-test-findings.mjs` once every step's suite runs), not a number fixed in
  this document — the exact count moves as each factory is written. This now covers every
  defect in the report, not only the `CELL-*` set: per the binding Test Authoring Protocol,
  every finding below — `CELL-*`, `HOOK-*`, `RBAC-*`, `CORE-LABEL-1`, `MEDIA-1` — has its own
  asserted-red test. None are pinned by a passing test; there is no longer a "Suspected"
  tier.
- [ ] Rank `HOOK-1` through `HOOK-6`, `RBAC-1`, `RBAC-2`'s `canCreate` gap, `CORE-LABEL-1`,
  `MEDIA-1`, and `MODAL-1` into the same severity-ranked body as the `CELL-*`/`DOC-1`
  findings by real user impact — not into a separate low-visibility section. Cite the exact
  `it(...)` name(s) and test file for each, so the fix spec goes straight to the failing
  assertion. Keep `CORE-LABEL-1` flagged cross-package (`@vexcms/core`, not React) with its
  breaking-change blast radius prominent — its fix spec scope is not confined to
  `packages/react`. Keep `RBAC-1` precisely scoped as defense-in-depth, not a live exploit.
  File `RBAC-2`'s `canDelete` half separately as a **non-defect** forward-looking note:
  there is no reachable destructive control to gate today, so nothing can be asserted red
  against it.

#### .agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md

````markdown
# `@vexcms/react` Cell Coverage — Bug Report

> **Purpose.** Triaged output of the `2026-09-08-react-coverage-expansion` spec. Written to
> be fed straight into a fix spec, the same way `.agent/docs/specs/2026-09-04-react-test-suite/
> BUGS-REPORT.md` was for the field-input suite.
>
> **Every finding below is backed by a failing (red) assertion, not a passing one.** This
> spec's binding Test Authoring Protocol ("assert intended behavior, never observed
> behavior" — the same standing rule the `2026-09-04-react-test-suite` spec established in
> its own `## Test Authoring Protocol`: "the point of this spec is not to add tests that
> pass — it is to write tests that state what each field is *supposed* to do and let the
> failures show where it does not") required every step to assert intent and let the
> assertion fail, rather than pin whatever the code currently does. An earlier draft of this
> report filed eight of these findings as "Suspected — pinned by a passing test, intent
> unconfirmed"; under the corrected Protocol nothing is pinned, so that tier is gone and
> every one of those eight is promoted into the ranked body below as a confirmed,
> test-backed defect. Three of them — `HOOK-5`, `HOOK-6`, and `MODAL-1` — were found *only*
> because the Protocol forced an intent assertion (or, for `MODAL-1`, the Protocol's
> mandatory "submit twice rapidly" edge case) where the original plan would have pinned
> current behavior or skipped the interaction sequence entirely; none of the three was in
> this spec's original eight-finding estimate. That is the concrete payoff of asserting
> intent instead of observed output, and it is why this report no longer has a "pinned,
> unconfirmed" tier at all.
>
> **Read `CELL-3` → `HOOK-5` → `HOOK-6` → `MODAL-1` → `CELL-1` → `HOOK-1` → `MEDIA-1` →
> `RBAC-1` → `RBAC-2` → `HOOK-2` → `CELL-2` → `DOC-1` → `CORE-LABEL-1` → `HOOK-3`,** in that
> order — `CELL-3`'s crash variant is the most severe finding in this report, followed by
> three destructive/data-integrity risks (`HOOK-5`, `HOOK-6`, `MODAL-1`) that rank alongside
> it. All four `CELL-*`/`DOC-1` causes were found by a full-file read of every
> `packages/react/src/components/fields/*/Cell.tsx` against the shared base contract in
> `packages/react/src/testing/fieldCellContract.ts` (four assertions: null placeholder,
> `isTitleField` link-wrap, truncation, `expectNoA11yViolations`) — not inferred from a name.
> This report went through corrections during authoring: an initial pass under-counted
> `CELL-1` by one (`color`'s `isTitleField` line is a JSDoc `@example`, not a real branch —
> corrected to 10 of 12), a second full-file read surfaced `CELL-3` and shrank `CELL-2`'s
> passing set from 3 to 2, `HOOK-4` was added after Step 3 traced it by running the real
> hook, `HOOK-5`/`HOOK-6` were added during this revision once Steps 2 and 3 flipped their
> pinned tests to intent assertions and a sixth/fifth defect fell out of each file's own red
> run, and `MODAL-1` was found while Step 6 wrote the Protocol's mandatory rapid-resubmit
> test for `CreateDocumentModal`. **`text/Cell.tsx` was originally treated as this report's
> single reference implementation. That assumption was wrong on two of its three documented
> behaviors — see `DOC-1`. Do not adopt it as a template without checking each behavior it
> claims.**

### Failure baseline

This report intentionally states **no fixed failure count**. The underlying test files
across Steps 2–6 were flipped from pinned-passing to intent-asserting during this revision,
so a number written here would already be wrong by the time the full suite runs. Instead:

- The authoritative failure set is whatever `scripts/record-test-findings.mjs` writes into
  this spec's `findings.md` once every step's test files exist and run — the `Cell.test.tsx`
  files (Step 5), the hook test files (Steps 2–3), the RBAC-gated view tests (Step 4), and
  the modal/media tests (Step 6).
- Every one of the defects below carries a code comment in its test file naming the defect
  id it proves (`// FAILS: ... — see BUGS-REPORT <ID>`), so a reader can tell a discovered
  defect from a broken test at a glance.
- **A future run compares against that `findings.md` baseline, not against a count in this
  document, to distinguish a NEW regression from a known defect.** A `findings.md` failure
  that starts passing without a matching source diff outside a test file is not progress —
  see Step 8's anti-regression clause.
- There is no longer an excluded, pinned-but-not-asserted set. Every finding in this report
  — `CELL-*`, `HOOK-*`, `RBAC-*`, `CORE-LABEL-1`, `MEDIA-1`, `MODAL-1` — is in the red
  baseline.

The three `CELL-*` groups do not overlap on the same assertion for the same type — a type can
appear in more than one group (e.g. `array` is in both `CELL-3`'s crash variant and `CELL-2`),
but each group counts a distinct base-contract assertion.

### Severity key

- **P0** — crashes the render, or a silent destructive/data-integrity risk: an action a user
  believes they did NOT take (or a state a user believes is safe) executes anyway.
- **P1** — silent data/validation correctness, or a control a user cannot operate.
- **P3** — inconsistency, dead code, a documentation mismatch, or a decision to make.

---

### P0 — Critical

#### CELL-3 — 7 of 12 Cells mishandle a null/undefined value; 2 of those crash the table render

**The most severe finding in this report.** The base contract's first assertion is the
simplest one — render the em-dash placeholder for a `null`/`undefined` value — and 7 of 12
types fail it, in two variants of very different severity.

**Variant A — uncaught `TypeError`, crashes the render (rank above `CELL-1` and `CELL-2`).**
`text/Cell.tsx` and `array/Cell.tsx` both call `.length` directly on `props.value` with no
guard:

```tsx
// packages/react/src/components/fields/text/Cell.tsx:31 (also line 38, the non-title branch)
{props.value.length > 77 ? `${props.value.slice(0, 77)}...` : props.value}
```

```tsx
// packages/react/src/components/fields/array/Cell.tsx:24
const itemCount = props.value.length;
```

`CellComponentProps.value` is documented by these very components' own JSDoc as "may be null
or undefined." That's not a hypothetical: any optional `text()`/`array()` field, or any
document written before the field existed, reaches this code path with `value === undefined`.
`props.value.length` on `undefined` throws — and a throw inside one cell renderer takes down
the **entire table's render**, not just that column. This is reachable in normal use, not an
edge case that needs contrived input.

**Variant B — renders nothing instead of the em-dash placeholder.** Less severe (no crash),
still a defect: the user sees a blank cell with no indication whether that's the real value
or a rendering failure.

| Field | Cause |
|---|---|
| `date` | `if (!props.value) { return null; }` (`date/Cell.tsx:24`) |
| `url` | `if (!props.value) return null;` (`url/Cell.tsx:27`) |
| `color` | `if (!props.value) return null;` (`color/Cell.tsx:22`) |
| `number` | `return <span>{props.value}</span>;` (`number/Cell.tsx:22`) — renders an empty `<span>` for `undefined`, no placeholder |
| `select` | `const value = props.value ?? [];` (`select/Cell.tsx:24`) — renders an empty `<div>`, no placeholder |

**Correct today (5 of 12) — use one of these as the fix reference, NOT `text/Cell.tsx`:**
`checkbox`, `group`, `blocks`, `upload`, `relationship`. All five guard explicitly and return
`<span className="text-muted-foreground">—</span>` (or the type's own em-dash variant) before
touching the value. Example (`checkbox/Cell.tsx:23`):

```tsx
if (props.value === undefined || props.value === null) return <span>—</span>;
```

**Files:** `packages/react/src/components/fields/{text,array,date,url,color,number,
select}/Cell.tsx`.

**Confirmed by:** every `Cell.test.tsx` for the 7 affected types (Step 5), each asserting the
em-dash placeholder for a `null`/`undefined` `value` prop per `FieldCellContractOptions`'s
base contract. The two Variant A tests (`text`, `array`) throw during render rather than
failing an `expect`; `runFieldCellContractSuite` wraps that render in a try/catch specifically
so the throw is recorded as a failing assertion instead of aborting the whole test file.

**Direction.** Variant A first — it's a crash, not a UX gap. Add the same guard `checkbox`/
`group`/`blocks`/`upload`/`relationship` already use, before any property access on `value`.
Variant B needs the same guard shape but returning the placeholder instead of `null`/empty
markup. Because `text/Cell.tsx` is itself Variant A, it cannot be the copy-paste source for
this fix — copy the guard pattern from `checkbox/Cell.tsx` or `group/Cell.tsx` instead, then
layer each type's own null-safe formatting after the guard.

#### HOOK-5 — `useTableSelection.toggleRow` is a silent no-op when deselecting a row out of "select all"

**Destructive-action risk, not a cosmetic hook quirk.** `isRowSelected(id)` branches only on
`mode === "all"` and never consults `selectedIds`, and `getSelectionCount()` reads the same
way — so calling `toggleRow(id)` while `mode === "all"` mutates `selectedIds` underneath but
every consumer-facing read still reports the row as selected and the count unchanged. "Select
all, then untick one" is the single most common bulk-edit gesture in a data table; a consumer
that wires this hook's `isRowSelected`/`getSelectionCount()` straight into a bulk-delete
confirmation would delete a row the user explicitly excluded, with no visible sign anything
was wrong.

**File:** `packages/react/src/hooks/useTableSelection.ts`.

**Confirmed by:** `useTableSelection.test.tsx` →
`it("select-all then deselect-one produces an indeterminate exclusion, not a no-op")` — added
during this revision by re-deriving intent from `toggleInverseMode`'s own "everything selected
except deselected" semantics (source of intent #4 in the Protocol: the sibling
implementation). `// FAILS: toggleRow in "all" mode does not exclude the row — see
BUGS-REPORT HOOK-5`.

**Direction.** `mode === "all"` needs its own exclusion-set semantics (an "all except these
ids" representation) rather than treating `selectedIds` as an inclusion set unconditionally.
`isRowSelected`/`getSelectionCount()` need to read that exclusion set when `mode === "all"`,
not just check the mode string. Do not ship a bulk-action UI that trusts this hook's current
`isRowSelected` while `mode === "all"`.

#### HOOK-6 — `usePaginatedQuery.isDone` reads `true` before the first page loads and forever after a query error

**Masks failed and pending loads as "fully loaded," with no retry affordance.** The `result`
memo falls back to a placeholder with `isDone: true` whenever the underlying `useQuery`'s
`data` is `undefined` — which is true both while the first page is still loading and after
the query rejects — and the mount-time accumulate effect commits that placeholder into state.
`isDone`'s own JSDoc states "whether all documents have been loaded"; a consumer gating a
"Load more" button or an empty-state message on `isDone` shows "nothing more to load" during
a transient loading state and permanently after any network error, with no way to distinguish
either from a genuinely complete, empty collection.

**File:** `packages/react/src/hooks/usePaginatedQuery.ts`.

**Confirmed by:** `usePaginatedQuery.test.tsx` (Step 3) →
`it("reports a pending, not-yet-done state before the first page resolves")` (asserts
`isDone === false` immediately after render, before the query settles — fails, reads `true`)
and `it("surfaces a query failure without crashing the render")` (mounts against a client
whose `.query` always rejects; asserts `isDone === false` after settling — fails, reads
`true`; `results` correctly stays `[]`, which is why only the `isDone` half of that test is
red). Both carry `// FAILS: ... — see BUGS-REPORT HOOK-6`.

**Direction.** The `data === undefined` fallback needs to distinguish "loading" and "errored"
from "the query returned an empty, complete page" — likely by threading `useQuery`'s own
`isLoading`/`isError` (or equivalent Convex-React status) into the memo instead of inferring
state from `data`'s absence alone, and defaulting the placeholder's `isDone` to `false` rather
than `true`.

#### MODAL-1 — `CreateDocumentModal` can create the same document twice on a rapid double-click

**Silent duplicate write, same class of risk as `HOOK-5`/`HOOK-6`.** The submit button is
disabled only via `useVexMutation`'s `isPending`, which does not flip to `true` until
*after* TanStack Form's async field validation completes — an `await` boundary between the
click and the disable taking effect. Two back-to-back clicks with no gap between them (a
fast real-world double-click, not a contrived timing) both land before the button disables,
so the `create` mutation fires twice and the document is created twice. Verified
empirically against the real component with both a static and a realistic stateful
`isPending` mock — both reproduce identically, ruling out a mock artifact.

**File:** `packages/react/src/components/modals/CreateDocumentModal.tsx`.

**Confirmed by:** `CreateDocumentModal.test.tsx` (via `testing/modalSuite.tsx`),
`describe("CreateDocumentModal")` →
`it("submitting the form twice in rapid succession creates the document only once")` —
asserts the create-document mock is called exactly once after two rapid submits. `// FAILS:
rapid double-click submits before the mutation's isPending disables the button, creating the
document twice — see BUGS-REPORT MODAL-1`.

**Direction.** Disable the submit control synchronously on the first click (e.g. local
`isSubmitting` state set before awaiting validation, or gating on TanStack Form's own
in-flight submission state) rather than relying solely on the mutation's `isPending`, which
only becomes true after the async validation `await` boundary has already let a second click
through.

---

### P1 — Correctness

#### CELL-1 — 10 of 12 Cells ignore `isTitleField`, so the title column is unclickable

**10 rows.** The base contract's second assertion: when `isTitleField` is `true`, the
rendered value is wrapped in a link to
`${basePath}/${collection.slug}/${row.original._id}` — the only way a list-view row reaches
its document. Only `text/Cell.tsx` and `url/Cell.tsx` implement this correctly (`if
(props.isTitleField) { return <VexLink href={...}>...`); the other 10 types never read
`props.isTitleField` at all. (`color/Cell.tsx`'s JSDoc `@example` shows an `isTitleField`
prop being passed, which reads as a real branch on a `grep`-level pass — the component body
never checks it.)

**Why this is reachable:** `AdminCollectionConfigInput.useAsTitle` is typed
`CoreAdminField | NoInfer<TFieldSlug>` (`packages/core/src/collections/types.ts:170`) — it
accepts **any** field slug on the collection, not just `text`/`url`. A collection can
legally set `useAsTitle: "publishedAt"` (a `date` field) or `useAsTitle: "priority"` (a
`select` field), and nothing in `@vexcms/core` rejects it. When that happens the list view's
title column renders a plain, unlinked value with **no route into the document** — the user
has to fall back to some other navigation path, if one even exists.

| Field | Cause |
|---|---|
| `number` | `Cell.tsx` returns a bare `<span>{props.value}</span>`; no `isTitleField` read, no `VexLink` import |
| `checkbox` | Returns `<span>{props.value ? "Yes" : "No"}</span>` unconditionally |
| `date` | Returns `<span>{date.toDateString()}</span>` unconditionally |
| `select` | Renders a `<div>` of `Badge`s; no `isTitleField` branch |
| `upload` | Renders a thumbnail + filename `<span>`; no `isTitleField` branch |
| `relationship` | All 4 return paths (unmounted placeholder, empty, unpopulated count, populated preview/count) skip `isTitleField` |
| `array` | Renders `<span title={...}>{count} {label}</span>`; the `title` attribute is set from `fieldDef.type`/`fieldDef.label`, not a link |
| `group` | Renders a `{ N keys }` summary `<span>`; no `isTitleField` branch |
| `blocks` | Renders an `{N} {label}` summary `<span>`; no `isTitleField` branch |
| `color` | Returns `null` for an empty value, else a swatch `<span>`; the JSDoc `@example` passes `isTitleField={false}` but the component body never reads `props.isTitleField` |

**Files:** `packages/react/src/components/fields/{number,checkbox,date,select,upload,
relationship,array,group,blocks,color}/Cell.tsx`.

**Confirmed by:** each affected type's `Cell.test.tsx` (Step 5), asserting the `VexLink`
wrap per `FieldCellContractOptions`'s base contract when `isTitleField` is `true`.

**Direction.** Reference implementation is `packages/react/src/components/fields/text/
Cell.tsx`'s `isTitleField` branch specifically (this one behavior is correct there — see
`DOC-1` for what isn't): read `basePath` from `useVexConfig()` via
`addLeadingSlash(config.basePath)`, and when `props.isTitleField` is true wrap the existing
rendered content in
`<VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>`. Every
one of the 10 types keeps its own value formatting inside the link — this is purely a wrap,
not a rewrite of what each Cell renders. `url/Cell.tsx` is the second reference: it shows the
pattern for a type whose non-title render is itself already a link (to the URL value), i.e.
the `href` branches on `isTitleField` rather than the whole return branching. **Fix `CELL-3`
first** — several of these types will otherwise crash before the `isTitleField` fix can even
be exercised on a null value.

#### HOOK-1 — `usePagination.goToPage(page)` ignores its argument

Beyond the `page < 1` guard, `goToPage` always resets to page 1 regardless of what was
requested — `goToPage(5)` navigates to page 1, not page 5.

```ts
// packages/react/src/hooks/usePagination.ts:121-129
const goToPage = useCallback((page: number) => {
  if (page < 1) return;
  // Reset cursor stack and start from page 1
  // Note: Direct page jump requires fetching from start
  // For now, this is a simple implementation that resets
  setCursorStack([null]);
  setCurrentPage(1);
  setHasNextPage(false);
}, []);
```

`page` is read only by the guard on line 122; nothing downstream uses its value. A
paginated list view cannot jump to an arbitrary page — every call to `goToPage` behaves like
`goToPage(1)`.

**File:** `packages/react/src/hooks/usePagination.ts`.

**Confirmed by:** `usePagination.test.tsx` →
`it("goToPage(n) navigates to the requested page")` and
`it("goToPage(n) navigates to a page beyond the last known page (no upfront page count to
clamp against)")` — both assert `r.current.page` equals the requested page, not `1`. Both
carry `// FAILS: goToPage ignores its argument — see BUGS-REPORT HOOK-1`.

**Direction.** This looks like a plain bug, not a design tradeoff — confirm there's no
Convex-pagination reason arbitrary-page jumps are unsupported (cursor-based pagination
generally can't jump without refetching from the start, which may be why it was stubbed this
way), then either implement a real jump (refetch from `null` and step forward `page - 1`
times) or rename/redocument it as `resetToFirstPage` if arbitrary jumps are intentionally
out of scope.

#### MEDIA-1 — `MediaUploadDropzone` configures no `accept` filter, and drops all but the first file of a same-batch multi-file drop

`useDropzone` is configured with only two options:

```ts
// packages/react/src/components/media/MediaUploadDropzone.tsx:108-111
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  multiple: false,
});
```

No `accept` option — the standalone dropzone accepts any mime type, regardless of the target
media collection's configured type restrictions. The field-level upload flow (`fields/upload/
Input.tsx`) does filter by `accept`, so this is an **inconsistency between two entry points
to the same operation**, not a missing feature in isolation: a media collection's type
restrictions are enforced on one upload path and silently ignored on the other. A user can
drop an arbitrary file — including an executable — onto this dropzone and have it uploaded.

**Verified adjacent behavior, now resolved as intent, not left open:** with `multiple: false`
and no `maxFiles` set, react-dropzone rejects the **entire batch** when two or more files are
dropped simultaneously, rather than accepting the first and ignoring the rest. The intended
behavior is "keep the first file and upload it" — the established codebase pattern:
`fields/upload/EmptyInput.tsx`'s `handleDrop` truncates a multi-file drop to `files.slice(0,
1)` for single-select fields rather than rejecting the whole drop. `MediaUploadDropzone`
should follow the same pattern, not react-dropzone's default all-or-nothing rejection.

**Files:** `packages/react/src/components/media/MediaUploadDropzone.tsx`.

**Confirmed by:** `MediaUploadDropzone.test.tsx` (Step 6) →
`it("rejects a disallowed mime type instead of uploading it, honoring the target
collection's accepted media types")` (drops a `.exe`; asserts the upload mocks are never
called — fails, no `accept` filter exists to reject it) and
`it("keeps the first dropped file and uploads it when multiple files are dropped at once,
instead of rejecting the whole batch")` (drops 2 files; asserts the first uploads — fails,
`multiple: false` with no `maxFiles` rejects the entire batch, verified against
`react-dropzone`'s own source). Both carry `// FAILS: ... — see BUGS-REPORT MEDIA-1`.

**Direction.** Read `accept` from the target media collection's config (matching the
field-level path) and pass it into `useDropzone`. Add `maxFiles: 1` alongside `multiple:
false` — or otherwise change the reject-everything behavior — so a same-batch multi-file
drop keeps the first file instead of uploading nothing, matching `EmptyInput.tsx`'s
established `slice(0, 1)` pattern.

#### RBAC-1 — `MediaCollectionEditView` doesn't gate Save/Cancel on `canEdit`, unlike its siblings

**Defense-in-depth gap — state this precisely, it is not a privilege-escalation
vulnerability.** `CollectionEditView.tsx:113,121` disables Save/Cancel with
`disabled={!canEdit || isDefaultValue}`; `MediaCollectionEditView.tsx:139,147` disables the
same buttons with `disabled={isDefaultValue}` only — `canEdit` is dropped. Server-side
enforcement (Convex mutation permission checks) is the real gate regardless of what this
button does; this is a client-state inconsistency, not a reachable escalation.

**Why it's still worth fixing.** `MediaCollectionEditView.tsx:172` still applies
`readOnly={field.admin.readOnly || !canEdit}` on the underlying fields, so under real form
interaction a user without update permission can't dirty a field the normal way, and Save
stays disabled via the `isDefaultValue` path instead of a direct `canEdit` check. But that
protection depends on the `readOnly` cascade holding for every field on the form, not on
Save's own `disabled` expression — any future field type that ignores its `readOnly` prop
(already a known class of defect in this codebase, per `CELL-*`'s general pattern of
fields not honoring their own config) would silently expose an ungated Save with no client
check positioned to catch it.

**File:** `packages/react/src/components/views/MediaCollectionEditView.tsx`.

**Confirmed by:** `MediaCollectionEditView.test.tsx` (Step 4), inside the existing
`describe("MediaCollectionEditView")`'s `runRbacStateSuite` call. The test forces
`isDefaultValue: false` (via a `fireEvent.change` on the `#alt` field, which jsdom fires even
though the control is `disabled` for a non-`canEdit` user) so the `isDefaultValue` fallback
path can't mask the missing `canEdit` check, then asserts Save/Cancel stay disabled whenever
`canEdit` is `false`. Failing: the RBAC-state matrix's `it('resolves the "anonymous"'
scenario)`, `'"denied"'`, `'"allowed"'`, and `'"scoped"'` sub-`it`s — only the `"none"`
scenario passes. `// FAILS: ... — see BUGS-REPORT RBAC-1` on each.

**Direction.** Align with `CollectionEditView.tsx:113,121` — add `!canEdit` to both buttons'
`disabled` expression. Small, low-risk fix.

#### RBAC-2 — `MediaCollectionListView` has no `canCreate` check gating its Upload button

`MediaCollectionListView` calls no `usePermission("canCreate", ...)` check at all, and its
Upload button carries no `disabled`/`aria-disabled` prop regardless of the current user's
create permission — unlike `CollectionListView`, whose analogous create action is gated.

**File:** `packages/react/src/components/views/MediaCollectionListView.tsx`.

**Confirmed by:** `MediaCollectionListView.test.tsx` (Step 4) → the RBAC-state matrix's
`it('resolves the "anonymous"'/`'"denied"'`/`'"allowed"'`/`'"scoped"'` sub-`it`s, asserting
the Upload link carries `aria-disabled` when `canCreate` is `false`. `// FAILS:
MediaCollectionListView's Upload button ignores canCreate — see BUGS-REPORT RBAC-2` on each.

**Direction.** Add a `usePermission("canCreate", ...)` check and wire
`aria-disabled={!canCreate}` (or the disabled-link pattern `CollectionListView` already
uses) onto the Upload button, matching the sibling view's existing pattern.

**Separately — `canDelete`, not a defect today.** `CollectionListView`/
`MediaCollectionListView` also both call `usePermission` for `canDelete`, but it gates
nothing: `DataTable.tsx`'s bulk-delete trigger UI is commented out, so there is no control
for `canDelete` to disable, and nothing can be asserted red against a control that doesn't
exist. This half is filed as a forward-looking note, not a defect: `CollectionListView.test.tsx`/
`MediaCollectionListView.test.tsx` both carry
`it("has no reachable destructive control while bulk-delete UI remains unwired")` — a
**passing** test asserting `queryByRole("button", { name: /delete/i })` is `null` today, plus
a code comment recording that when the commented-out bulk-delete UI (`DataTableBulkActions`,
exported but never rendered in `DataTable.tsx`) is restored, it ships ungated unless someone
explicitly wires `disabled={!canDelete}` on it in the same change.

**Files:** `packages/react/src/components/views/{CollectionListView,
MediaCollectionListView}.tsx`, `packages/react/src/components/ui/data-table/DataTable.tsx`.

#### HOOK-2 — `usePagination.nextPage` pushes the pre-advance cursor, not `updateFromResult`'s `continueCursor`

`updateFromResult` receives Convex's `continueCursor` for the page just fetched but never
stores it — it only derives `hasNextPage`:

```ts
// packages/react/src/hooks/usePagination.ts:98-103
const updateFromResult = useCallback(
  (result: { continueCursor: string | null; isDone: boolean }) => {
    setHasNextPage(!result.isDone);
  },
  [],
);
```

`nextPage` then pushes the *current* `cursor` (the one already used to fetch the page just
shown) onto the stack, not the discarded `continueCursor`:

```ts
// packages/react/src/hooks/usePagination.ts:105-111
const nextPage = useCallback(() => {
  if (!hasNextPage) return;
  // Push current cursor to stack before advancing
  setCursorStack((prev) => [...prev, cursor]);
  setCurrentPage((p) => p + 1);
}, [hasNextPage, cursor]);
```

Intent is resolved (was an open question in an earlier draft; Convex's cursor-pagination
contract chains on `continueCursor` — each page's query must use the *previous* page's
`continueCursor`, not re-use its own start cursor): deep paging past page 2 currently
re-fetches the wrong (repeated) page.

**File:** `packages/react/src/hooks/usePagination.ts`.

**Confirmed by:** `usePagination.test.tsx` →
`it("nextPage advances using the continueCursor from updateFromResult, not the pre-advance
cursor")` — asserts `cursorStack` and `cursor` reflect the stored `continueCursor` after
`nextPage`, not the pre-advance value. `// FAILS: nextPage does not chain continueCursor —
see BUGS-REPORT HOOK-2`.

**Direction.** `updateFromResult` needs to store `continueCursor` in state; `nextPage` needs
to push that stored value instead of the current `cursor`.

---

### P3 — Inconsistency

#### CELL-2 — 6 of 12 Cells render unbounded values with no truncation or `title` attribute

**6 rows.** The base contract's third assertion (threshold 77, matching `text/Cell.tsx`'s
actual cutoff — see `DOC-1` for its JSDoc claiming 80) requires: a value longer than the
threshold is cut for display, and the **full** value is available on a `title` attribute so a
user can still read it (via native tooltip) without opening the document. Only `text` and
`url` implement this correctly. `relationship`, `select`, `array`, `blocks`, `upload`, and
`group` render user-controlled or unbounded text with neither.

| Field | Cause |
|---|---|
| `relationship` | `DefaultRelationshipPreview` (`preview.tsx:32-36`) renders `String(doc[useAsTitle] ?? doc._id)` in a plain `<span>` — no length check, no `title` |
| `select` | Renders one `Badge` per matched option label with no cap on combined width and no `title` on the container or any badge |
| `array` | Has a `title` attribute, but it carries `${fieldDef.type} - ${fieldDef.label}` (static config), never the value — the contract's "full value on `title`" requirement is unmet regardless of value length |
| `blocks` | No `title` attribute at all; the `{N} {label}` summary has no cap |
| `upload` | Filename is CSS-truncated (`overflow-hidden text-ellipsis whitespace-nowrap`) — the full name stays in `textContent` for a sighted mouse user hovering the ellipsis, but there is no `title` attribute, so it's unreachable via tooltip or by any non-visual access path |
| `group` | Renders a fixed `"{ N keys }"` summary with no `title` attribute at all |

**Files:** `packages/react/src/components/fields/{relationship,select,array,blocks,upload,
group}/Cell.tsx`, `packages/react/src/components/fields/relationship/preview.tsx`.

**Confirmed by:** each affected type's `Cell.test.tsx` (Step 5), asserting the `title`
attribute carries the full value and the rendered text is cut past the threshold, per
`FieldCellContractOptions`'s base contract.

**Direction.** Reference implementation is `text/Cell.tsx`'s pattern:
`<span title={fullValue}>{fullValue.length > 77 ? `${fullValue.slice(0, 77)}...` :
fullValue}</span>` — this specific behavior (the slicing itself) is correct there once
`CELL-3`'s guard is added in front of it. Each of the 6 types needs its own definition of
"the value" to slice — `relationship`'s resolved label string, `select`'s joined option
labels, `array`'s and `blocks`'s summary text, `upload`'s filename, `group`'s key-count
summary (or a serialized preview of the object, if that's judged more useful) — this is a
per-type `extra` fix, not a shared helper change.

#### DOC-1 — `text/Cell.tsx`'s JSDoc promises behavior the component doesn't have

Filed separately from `CELL-3` because it's a documentation defect, not (only) a behavior
one — and because `text/Cell.tsx` was this report's original reference implementation, so
its doc's accuracy matters more than a typical file's.

```tsx
// packages/react/src/components/fields/text/Cell.tsx:8-9
 * Renders the string value of a text field. Null/undefined values show an
 * em-dash placeholder. Values longer than 80 characters are truncated with
```

Two claims, both wrong:
1. **"Null/undefined values show an em-dash placeholder"** — no such guard exists;
   `text/Cell.tsx` is one of `CELL-3`'s two crashing types (`.value.length` at line 31/38 with
   no null check).
2. **"Values longer than 80 characters are truncated"** — the code cuts at **77**
   (`props.value.length > 77`, lines 31 and 38). The Cell contract's `truncates` default and
   Step 5's test assertions deliberately use **77**, matching the code, not the doc.

Of the file's three documented behaviors, only the `isTitleField` link-wrap is both
documented and implemented correctly.

**File:** `packages/react/src/components/fields/text/Cell.tsx`.

**Direction.** Fix the JSDoc alongside `CELL-3`'s guard fix for this file — the null-guard
change touches the exact lines the doc's first false claim is about, so there's no reason to
defer the doc correction to a separate change.

#### CORE-LABEL-1 — `defineCollection` title-cases the slug without singularizing, so `labels.singular` is wrong

**Cross-package — this is `@vexcms/core`, not React. The follow-up fix spec's scope is not
confined to `packages/react` for this one finding.** For slug `"posts"`, `defineCollection`
computes `labels.singular: "Posts"`, not `"Post"`. Verified against the source:
`packages/core/src/collections/config.ts:191-195` derives both labels from the raw slug —

```ts
// packages/core/src/collections/config.ts:191-195
labels: {
  singular: toTitleCase(input.slug),
  plural: plural(toTitleCase(input.slug)),
  ...input.labels,
},
```

`toTitleCase` (`packages/core/src/utils.ts:56`) only capitalizes words — it never
singularizes — so `toTitleCase("posts")` is `"Posts"`, and `plural("Posts")` compounds it to
`"Postses"`-shaped output for irregular slugs, not just a missing singular. The collection
config's own JSDoc example (`packages/core/src/collections/config.ts:60`) documents the
*intended* output as `singular: "Post"` — the code doesn't match its own doc's example.

This is user-visible everywhere the admin renders a singular label: "Create Posts", "Delete
Posts", a document header reading "Posts" instead of "Post" for any collection whose slug
isn't already singular.

**File:** `packages/core/src/collections/config.ts`.

**Confirmed by:** `packages/react/src/components/modals/CreateDocumentModal.test.tsx`
(via `testing/modalSuite.tsx`), `describe("CreateDocumentModal")` →
`it("opens a create form with a control per collection field")`, which now asserts
`screen.findByText("Create Post")` (the intended singular) instead of the as-built
`"Create Posts"`. `// FAILS: defineCollection's labels.singular title-cases the slug without
singularizing — see BUGS-REPORT CORE-LABEL-1`.

**Direction.** *Not confirmed as a drop-in fix* — has real blast radius. Correcting the
derivation (e.g. running a singularization step before `toTitleCase`, or reversing the
order — singularize the raw slug, then title-case) changes every default label in every
consumer's admin UI that doesn't explicitly set `labels.singular`/`labels.plural`. That's a
breaking change for anyone relying on today's output, so the fix spec should consider an
explicit `labels` opt-out/opt-in path rather than a silent behavior change, and treat this as
a `@vexcms/core` change with a `packages/react` blast radius, not a React-only fix like every
other defect in this report.

#### HOOK-3 — `useTableSelection.toggleRow`'s `onSelectionChange` reports a stale `mode`

`onSelectionChange` fires from inside the `setSelectedIds` functional updater, but the
`mode` value it reports is the outer closure's `mode` — captured at the last render via
`useCallback`'s `[mode, onSelectionChange]` dependency array — not the value `setMode` was
just called with earlier in the same invocation:

```ts
// packages/react/src/hooks/useTableSelection.ts:71-93
const toggleRow = useCallback(
  (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // If no items selected after toggle, reset mode to "none"
      if (next.size === 0) {
        setMode("none");
      } else if (mode === "none") {
        setMode("page");
      }
      onSelectionChange?.({ selectedIds: next, mode });   // <- stale `mode`
      return next;
    });
  },
  [mode, onSelectionChange],
);
```

`setMode` calls are async React state updates; the local `mode` variable never reflects them
within the same call. Ranked P3 rather than P1 because no existing consumer in this codebase
currently reads `mode` from this callback — it's a real bug with no live blast radius yet,
not a currently-observable one.

**File:** `packages/react/src/hooks/useTableSelection.ts`.

**Confirmed by:** `useTableSelection.test.tsx` →
`it("toggleRow's onSelectionChange reports the post-change mode")` — asserts the first call
reports `mode: "page"` (the value `state.mode` settles to), not the stale `"none"`. Intent
resolved explicitly: a change callback reports post-change state, matching how every other
`on*Change` callback in this codebase behaves. `// FAILS: toggleRow's onSelectionChange
reports stale closure-captured mode — see BUGS-REPORT HOOK-3`.

**Direction.** Compute the next mode into a local
`const nextMode = next.size === 0 ? "none" : mode === "none" ? "page" : mode;` and pass
`nextMode` to both `setMode` and `onSelectionChange` instead of relying on the closure.

#### HOOK-4 — `usePaginatedQuery.loadMore()` fetches page N but only reveals it on the (N+1)th call

Verified by running the real hook (Step 3), not by reading. `clientPageIndex` only increments
once the accumulator already covers the currently visible window, so calling `loadMore()`
once fetches the next page's data but does not display it — the page becomes visible on the
*second* call. Traced call counts: reaching page 2 of results takes 2 `loadMore()` calls;
reaching the last page of a 4-page set takes 4 calls, not 3. Ranked below `HOOK-1`/`MEDIA-1`
here: it's a real usability defect (an infinite-scroll list or "Load more" button that
appears to do nothing on the first press), but it degrades gracefully — a second press
recovers — rather than blocking an action outright.

**File:** `packages/react/src/hooks/usePaginatedQuery.ts`.

**Confirmed by:** `usePaginatedQuery.test.tsx` →
`it("reveals the next page after a single loadMore call")` (asserts one `loadMore()` call
reveals page 2 — fails, still shows page 1) and
`it("flips isDone after the intended number of loadMore calls")` (asserts 2 `loadMore()`
calls exhaust a 5-doc/`numItems=2` collection — fails, needs 4 calls). Both carry
`// FAILS: ... — see BUGS-REPORT HOOK-4`.

**Direction.** Trace where `clientPageIndex` advances relative to where the accumulator is
read for the visible slice; the fix is most likely reordering those two, not changing the
fetch logic itself.

---

### Architectural notes for the fix spec

Not defects — recorded so a fix spec (or any future work) doesn't assume something about the
server surface that isn't true.

- **`vexConvexApi.findPaginated` and `vexConvexApi.find` are the same server function, not
  two.** `packages/core/src/api/convex.ts` defines `vexConvexApi.findPaginated` as
  `anyApi.vex.find` — the identical reference `vexConvexApi.find` uses. Convex's
  `getFunctionName()` returns `"vex:find"` for both, so they are indistinguishable at the
  react-query cache-key level except by their args (`paginationOpts` present or not). This
  invalidated an earlier plan (this spec's original Step 3 instructions) to add a distinct
  `"vex:findPaginated"` bridge-handler key — that key would have been unreachable dead code,
  since no call ever produces that function name. Traced through Convex's own
  `getFunctionName`, not assumed from the export name.

---

### Not defects — types correctly exempt from truncation

`date`, `number`, `checkbox`, and `color` are passed `truncates: false` in their
`Cell.test.tsx` (per `FieldCellContractOptions.truncates`'s documented default) and
**correctly** skip the truncation assertion. Recorded so nobody "fixes" a Cell that has
nothing to fix:

| Field | Why truncation is meaningless here |
|---|---|
| `date` | Fixed-format output (`Date.toDateString()`) — bounded length by construction |
| `number` | A JS number's string form has no unbounded-length failure mode in practice |
| `checkbox` | Only ever renders `"Yes"`, `"No"`, or the em-dash placeholder |
| `color` | Fixed-format output (`#e8622a` or a `var(--token)` reference) — already short |

None of these four are part of `CELL-2`. Their truncation exemption says nothing about their
`CELL-1`/`CELL-3` status: **`color` is exempt from truncation but is part of both `CELL-1`
(10) and `CELL-3` (its null-return variant)**, and `date`/`number`/`checkbox` are each in
`CELL-1` too. All three properties (title-link, null-placeholder, truncation) are independent
per type — cross-reference each type against every `CELL-*` section rather than assuming one
clean/dirty status per type.

---

### Open questions for the fix spec

1. **Should `CELL-1`'s fix also constrain `useAsTitle` at the type level** (reject
   non-text/url/date-safe field kinds), or is "any field type can be a title, so every Cell
   must handle `isTitleField`" the intended contract? The fix direction above assumes the
   latter (fix all 10 Cells) since `packages/core/src/collections/types.ts:170` places no
   runtime or type-level restriction on which field slugs `useAsTitle` accepts.
2. **Does `array`'s stray `title` attribute (config text, not the value) count as a partial
   implementation worth preserving alongside the value-truncation fix, or should it be
   replaced outright?** Flagged in `CELL-2`'s table; the fix spec should decide rather than
   silently drop existing behavior.
3. **What is "the value" to truncate for `group`?** A `{ N keys }` summary has no natural
   long-form text to slice unless the fix spec decides to render a serialized object preview
   instead (which would itself need a truncation strategy). Needs a design answer, not a
   mechanical port of `text/Cell.tsx`'s pattern.

---

### Reproducing any of this

```bash
# Whole Cell suite once Step 5 lands, findings recorded — this is the authoritative baseline
node scripts/record-test-findings.mjs "packages/react/src/components/fields/*/Cell.test.tsx"

# One Cell type in isolation
pnpm --filter @vexcms/react exec vitest run src/components/fields/text/Cell.test.tsx --coverage.enabled=false

# The hooks carrying HOOK-1/HOOK-2/HOOK-3/HOOK-5 (usePagination, useTableSelection) and
# HOOK-4/HOOK-6 (usePaginatedQuery)
pnpm --filter @vexcms/react exec vitest run src/hooks/usePagination.test.tsx src/hooks/useTableSelection.test.tsx src/hooks/usePaginatedQuery.test.tsx --coverage.enabled=false

# RBAC-1/RBAC-2 (view-level RBAC gating)
pnpm --filter @vexcms/react exec vitest run src/components/views/MediaCollectionEditView.test.tsx src/components/views/MediaCollectionListView.test.tsx src/components/views/CollectionListView.test.tsx --coverage.enabled=false

# CORE-LABEL-1 (through the modal that surfaces the collection label) and MODAL-1
pnpm --filter @vexcms/react exec vitest run src/components/modals/CreateDocumentModal.test.tsx --coverage.enabled=false

# MEDIA-1
pnpm --filter @vexcms/react exec vitest run src/components/media/MediaUploadDropzone.test.tsx --coverage.enabled=false
```
````

Verify: test -f .agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md && grep -qE "isTitleField|truncat" .agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md
