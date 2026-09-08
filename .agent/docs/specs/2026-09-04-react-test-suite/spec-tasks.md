---
status: draft
spec_id: 2026-09-04-react-test-suite
touches:
  - "packages/react/src/testing/**"
  - "packages/react/src/components/fields/*/testFixture.ts"
  - "packages/react/src/components/fields/**/Input.test.tsx"
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

# 2026-09-04-react-test-suite — Tasks

Tier: **low-care override** (developer direction, overrides `manifest.json#workflow.default_tier: high-care`
for this spec only). Every step below is `[agent]` and ships complete, runnable code — no guided
stubs. The developer writes none of this; agents build the factories first, then write every test
that leverages them.

**Every per-field step follows `spec.md`'s `## Test Authoring Protocol`:** read that field's
JSDoc and implementation first, then write 8–20 type-specific tests using equivalence
partitioning, boundary value analysis, state transitions, error paths and interaction sequences.
Tests assert **intended** behavior — a test that fails because the code contradicts its own
JSDoc is the deliverable, not a blocker.

**Pass semantics for steps 5–13 and 15:** `scripts/record-test-findings.mjs` exits **0** when
tests ran (failing assertions are appended to `findings.md`) and **non-zero** only when a file
cannot collect or yields zero tests. Never edit a component or weaken an assertion to reduce
the failure count — see the protocol's failure-triage table.

Scope: the field-input contract factory, the nested-container factory (array/group/blocks), the
RBAC-state factory, the relationship field's convex-test bridge, the shared harness/setup/a11y
plumbing, and `apps/test` dogfooding — proving the whole kit works from outside the package
boundary. Explicitly **not** in this pass: views (`CollectionEditView` etc.), `AdminLayout`/
`AdminSidebar`/`AdminTopNav`, `ui/` primitives, coverage thresholds. Bug fixes the new tests
uncover are a separate follow-up, not part of this spec.

## Step 1 — Package & tooling scaffolding
Why: Every later step needs the `./testing` subpath, its peer/dev dependencies, and a place to
land code, before any factory or fixture exists. Establishes the packaging contract
(peer-only test-runtime deps) up front so nothing downstream accidentally bundles a duplicate
copy of React/Vitest.
Verify: pnpm install && pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react typecheck && node scripts/record-test-findings.mjs packages/react/src/components/RenderBlocks.test.tsx
- [x] `pnpm-workspace.yaml` — add catalog entries: `vitest-axe`, `@testing-library/user-event`, `@testing-library/jest-dom`, `convex-test` (already present for core; confirm react can reference it)
- [x] `packages/react/package.json` — new `exports["./testing"]`; `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`, `convex-test`, `react`, `react-dom` as `peerDependencies` (+ matching `catalog:` devDependencies per P-014)
- [x] `packages/react/tsup.config.ts` — add `src/testing/index.ts` as a second entry point
- [x] `packages/react/src/testing/index.ts` — empty placeholder barrel (`export {}`) so build passes before any real export exists
- [x] `scripts/record-test-findings.mjs` — the failure-triage verify wrapper every per-field step uses (exit 0 on assertion failures + record; non-zero only on collection failure / zero tests). **Already landed and verified working during spec authoring** — all three exit paths proven against real vitest 4.1.10
- [x] `.agent/docs/specs/2026-09-04-react-test-suite/findings.md` — generated findings table scaffold. **Already landed**

## Step 2 — jsdom polyfills + accessibility helper
Why: Every factory in every later step renders components and checks accessibility; this
infrastructure must exist first (build-order rule: test infra before test files). Also
centralizes the `ResizeObserver`/`scrollIntoView` stubs currently copy-pasted in
`ui/multi-select.test.tsx`.
Verify: pnpm --filter @vexcms/react exec vitest run src/testing/a11y.test.ts --coverage.enabled=false
- [x] `packages/react/src/testing/setup.ts` — exported `installDomPolyfills()` (ResizeObserver stub, `scrollIntoView` no-op) for consumers' `test.setupFiles`
- [x] `packages/react/src/testing/a11y.ts` — `expectNoA11yViolations(container, options?)` wrapping `vitest-axe`, with jsdom-incompatible rules (`color-contrast`, others requiring real layout) disabled by default and documented why
- [x] `packages/react/src/testing/a11y.test.ts` — asserts a deliberately-broken markup (unlabeled input) fails and a correct one passes

## Step 3 — Shared RBAC/collection harness fixtures
Why: Both the field-input contract factory (readOnly states) and the RBAC-state factory need a
real `defineAccess`/`defineCollection` pair and fake users to render against — one shared harness
instead of one per field type, generalizing the inline setup already proven in
`hooks/usePermission.test.tsx`.
Verify: pnpm --filter @vexcms/react exec vitest run src/testing/harness/accessFixtures.test.ts --coverage.enabled=false
- [x] `packages/react/src/testing/harness/accessFixtures.ts` — a minimal `defineCollection`, a `defineAccess` matrix covering {no config, anonymous, denied role, allow-all role, doc-scoped-constraint role}, fake user objects, and `renderWithVexProviders(ui, { access?, user? })`
- [x] `packages/react/src/testing/harness/accessFixtures.test.ts` — self-test that each fixture role resolves the expected `usePermission` boolean through the real `VexAccessProvider`/`VexAuthProvider`

## Step 4 — Field fixture contract + registry scaffold
Why: Defines the one shared shape (`FieldFixture`) every per-type fixture and every factory
depends on, and the aggregation point (`fieldFixtures`) that `runVexReactSuite` and the
nested-container factory iterate. Built before any concrete fixture so later steps only add
entries.
Verify: pnpm --filter @vexcms/react typecheck
- [x] `packages/react/src/testing/fixtures/types.ts` — `FieldFixture<TField extends AdminField, TValue>` (`fieldType`, `fieldDef`, `valid`, `invalid`, `empty`)
- [x] `packages/react/src/testing/fixtures/index.ts` — `fieldFixtures: Partial<Record<AdminFieldType, FieldFixture<AdminField, unknown>>>` — a pure aggregator, empty here, filled by steps 5–12 each importing from that field's own `components/fields/<type>/testFixture.ts`

## Step 5 — Field-input contract factory + first fixture (text)
Why: Proves the whole mechanism end-to-end on the simplest field before scaling to the rest —
visible feedback early per build-order rule 2, and the "shared behavior + per-type extension"
contract every other field type slots into.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/text/Input.test.tsx
- [x] `packages/react/src/testing/fieldInputContract.ts` — `runFieldInputContractSuite({ fixture, Component, extra? })`: label association, `readOnly` disables interaction, `FormError` timing vs `submissionAttempts`, controlled value round-trip via `field.handleChange`, `expectNoA11yViolations` per state; `extra` is an optional per-type callback for type-specific assertions
- [x] `packages/react/src/components/fields/text/testFixture.ts` — `textFieldFixture: FieldFixture<TextField, string>`, colocated with `text`'s own `Input.tsx`/`Cell.tsx`
- [x] `packages/react/src/testing/fixtures/index.ts` — one import line + one registry entry (`text: textFieldFixture`)
- [x] `packages/react/src/components/fields/text/Input.test.tsx` — `runFieldInputContractSuite({ fixture: textFieldFixture, Component: TextFieldInput })`

## Step 6 — Simple-value field fixtures + tests (number, checkbox, url, color)
Why: These four share `text`'s contract shape (single primitive value, no async, no children) —
batched because they reuse step 5's factory unmodified, only supplying type-specific fixtures and
`extra` assertions (numeric coercion, checked/unchecked, URL validation, hex/rgb color format).
Each field's `extra` is derived from its own JSDoc/config/inputSchema per the Test Authoring
Protocol, not a shared template: number 11 tests, checkbox 8, url 8, color 9.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/{number,checkbox,url,color}/Input.test.tsx
- [x] `packages/react/src/components/fields/{number,checkbox,url,color}/testFixture.ts` — each a `FieldFixture` colocated with its own field module
- [x] `packages/react/src/testing/fixtures/index.ts` — four import lines + four registry entries
- [x] `packages/react/src/components/fields/number/Input.test.tsx`, `checkbox/Input.test.tsx`, `url/Input.test.tsx`, `color/Input.test.tsx` — each calling `runFieldInputContractSuite` with its fixture + type-specific `extra`

## Step 7 — Choice field fixture + test (select)
Why: `select` is options-driven and has a `hasMany` single/multi branch the flat contract doesn't
cover generically — needs its own `extra` assertions (options render from `fieldDef.options`,
single-select replaces instead of appending).
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/select/Input.test.tsx
- [x] `packages/react/src/components/fields/select/testFixture.ts` — `FieldFixture<SelectField, string[]>` with a multi-option fixture
- [x] `packages/react/src/testing/fixtures/index.ts` — one import line + one registry entry
- [x] `packages/react/src/components/fields/select/Input.test.tsx` — `runFieldInputContractSuite` + `extra` covering hasMany true/false and modal-surface behavior (reusing the scroll-lock assertions already proven in `ui/multi-select.test.tsx`)

## Step 8 — Temporal field fixture + test (date)
Why: `date` carries the date/time-picker's own formatting and optional time-of-day sub-config
(`field-config-conventions.md`'s deep-merge example) — needs dedicated `extra` assertions for
format round-tripping and the time-picker opt-in.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/date/Input.test.tsx
- [x] `packages/react/src/components/fields/date/testFixture.ts` — `FieldFixture<DateField, string>`
- [x] `packages/react/src/testing/fixtures/index.ts` — one import line + one registry entry
- [x] `packages/react/src/components/fields/date/Input.test.tsx` — `runFieldInputContractSuite` + `extra` covering date-only vs date+time config

## Step 9 — Network-backed field fixture + test (upload)
Why: `upload` is async (storage adapter call, dropzone accept/reject) rather than a synchronous
controlled input — reuses the `File`-mocking and `StorageAdapterContext` pattern already proven in
`media/MediaUploadForm.test.tsx` instead of inventing a new one.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/upload/Input.test.tsx
- [x] `packages/react/src/components/fields/upload/testFixture.ts` — `FieldFixture<UploadField, string[]>` (resolved file ids) plus upload's own `makeFile()` helper — everything about `upload`'s tests lives in `upload`'s folder
- [x] `packages/react/src/testing/fixtures/index.ts` — one import line + one registry entry
- [x] `packages/react/src/components/fields/upload/Input.test.tsx` — `runFieldInputContractSuite` + `extra` covering accept/reject and pending-upload state, wrapped in a stub `StorageAdapterContextProvider`

## Step 10 — Relationship field convex-test bridge (spike)
Why: Isolates the highest-risk technical integration — rendering a Convex-query-backed component
in jsdom while its data comes from a real `convex-test` execution, not a hand-typed stub — in its
own throwaway-provable step before the full relationship suite is built on top of it. Must
resolve, with evidence: (a) does `convexTest()` execute correctly from a `jsdom`-environment test
file (core mandates `edge-runtime` for crypto/timer fidelity; this determines whether the bridge
needs a per-file environment override), and (b) can `@vexcms/react`'s test kit reuse core's real
`find`/`search` handlers via a public `@vexcms/core/server` import, or does it need its own
minimal self-contained schema+handler (core's own `src/api/test/convex/` fixture is workspace-private
and cannot be imported from a published `@vexcms/react` subpath).
Verify: pnpm --filter @vexcms/react exec vitest run src/testing/convex/bridge.test.tsx --coverage.enabled=false
- [x] `packages/react/src/testing/convex/schema.ts` — minimal Convex schema (one documents table) sufficient to seed relationship targets
- [x] `packages/react/src/testing/convex/bridge.ts` — `createFakeConvexClient(t)` adapting a `convex-test` instance's `.query()` to the `{ query(funcName, args) }` shape `ConvexQueryClient` calls, with the function-name→reference lookup table
- [x] `packages/react/src/testing/convex/bridge.test.ts` — seeds one document via `convex-test`, renders a `useQuery(convexQuery(...))` consumer through the fake client in jsdom, asserts the real data resolves

## Step 11 — Relationship field fixture + test
Why: Completes the field type list; exercises the debounced search, popover picker, and
selected-doc chip rendering against data computed by the real core query/RBAC logic via the step
10 bridge — "test everything from the core package that it works," not a mocked hook.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/relationship/Input.test.tsx
- [x] `packages/react/src/components/fields/relationship/testFixture.ts` — `FieldFixture<RelationshipField, string[]>` wired to the step 10 bridge's seeded documents
- [x] `packages/react/src/testing/fixtures/index.ts` — one import line + one registry entry
- [x] `packages/react/src/components/fields/relationship/Input.test.tsx` — `runFieldInputContractSuite` + `extra` covering search-debounce, single vs `hasMany`, and the missing-target-collection error path

## Step 12 — Nested-container factory + composite field fixtures/tests (array, group, blocks)
Why: `array`/`group`/`blocks` nest arbitrary child field types rather than holding a primitive
value — needs a factory that recurses over the now-complete `fieldFixtures` registry instead of
re-authoring per-child assertions. Also the last fixture-adding step, so it closes the registry
and adds the completeness self-test mirroring `fields/index.test.tsx`'s existing registry-parity
pattern.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/{array,group,blocks}/Input.test.tsx && pnpm --filter @vexcms/react exec vitest run src/testing/fixtures/index.test.tsx --coverage.enabled=false
- [x] `packages/react/src/testing/nestedFieldContainer.ts` — `runNestedFieldContainerSuite({ container: "array"|"group"|"blocks", Component, childFieldTypes, fixtures? })`: add/remove item, nested value round-trip, `readOnly` cascade to children, delegates per-child-type assertions to `runFieldInputContractSuite`
- [x] `packages/react/src/components/fields/{array,group,blocks}/testFixture.ts` — each a `FieldFixture` for the container itself
- [x] `packages/react/src/testing/fixtures/index.ts` — three import lines + three registry entries (registry now complete: all 12 types)
- [x] `packages/react/src/components/fields/array/Input.test.tsx`, `group/Input.test.tsx`, `blocks/Input.test.tsx` — `runFieldInputContractSuite` for the container's own contract + `runNestedFieldContainerSuite` over a representative subset of child types (one from each category: simple, choice, temporal, network, nested-of-nested)
- [x] `packages/react/src/testing/fixtures/index.test.tsx` — asserts `Object.keys(fieldFixtures).sort()` equals `Object.keys(ADMIN_FIELDS).sort()`, same shape as `components/fields/index.test.tsx`

## Step 13 — RBAC-state factory
Why: Generalizes the provider-harness pattern from `usePermission.test.tsx`/
`useCanAccessAdminPanel.test.tsx` into a reusable factory usable against any component that reads
`usePermission`, proven this pass at the field-input layer; view-level application
(`CollectionEditView` etc.) is deferred to the views pass and explicitly out of scope here.
Verify: node scripts/record-test-findings.mjs packages/react/src/testing/rbacState.test.ts
- [x] `packages/react/src/testing/rbacState.ts` — `runRbacStateSuite({ render, scenarios?, assert })` iterating `{ no config, anonymous, denied role, allow-all role, doc-scoped-constraint role }` through `renderWithVexProviders`
- [x] `packages/react/src/testing/rbacState.test.ts` — self-test with a synthetic permission-gated field wrapper, plus one real application: a field input's `readOnly` derived from `usePermission` across every scenario

## Step 14 — Public aggregator + `./testing` barrel
Why: Everything built in steps 2–13 is internal until this step wires it into the one thing a
consumer actually imports — the low-ceremony entry point the whole spec exists to deliver.
Verify: pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react typecheck
- [x] `packages/react/src/testing/index.ts` — replaces the step-1 placeholder: exports `runVexReactSuite({ includeCore?, custom?, access? })` (loops `fieldFixtures` unless `includeCore: false`, runs `custom` entries through the same `runFieldInputContractSuite`), `runFieldInputContractSuite`, `runNestedFieldContainerSuite`, `runRbacStateSuite`, `fieldFixtures`, `FieldFixture` type, `installDomPolyfills`, `expectNoA11yViolations`, `renderWithVexProviders`

## Step 15 — `apps/test` dogfood wiring
Why: The only falsifiable proof that "usable within the user's project" is true — a real
consumer, outside `packages/react`'s own vitest config, importing the published subpath and
running the full suite against its own `VexConfig`/`defineAccess`.
Verify: node scripts/record-test-findings.mjs apps/test/src/vexcms/admin.test.ts
- [x] `apps/test/package.json` — `test`/`coverage` scripts, `vitest`/`jsdom`/`@testing-library/react`/`@testing-library/user-event`/`@testing-library/jest-dom`/`vitest-axe`/`@vexcms/react` (already present) as devDependencies (`catalog:`)
- [x] `apps/test/vitest.config.ts` — jsdom environment, `setupFiles: ["@vexcms/react/testing/setup"]` (or equivalent import of `installDomPolyfills`)
- [x] `apps/test/src/vexcms/admin.test.ts` (or equivalent path alongside existing `vexcms/` config) — imports `runVexReactSuite` and calls it against the app's real `access`/collections, plus one `custom` entry proving a project-authored fixture runs through the same factory

## Step 16 — Standards doc + naming/hygiene
Why: Per `AGENTS.md`'s knowledge-routing rules, a new testing subsystem needs a standards entry
with `applies_to` globs so `harness context` surfaces it. Two naming rules also need updating:
`react-field-module`'s closed allow-list must admit `testFixture.ts` (or every field folder's new
fixture file is a naming violation), and `packages/react/src/testing/` needs a rule of its own.
Verify: harness doctor
- [x] `.agent/docs/standards/testing/react-test-factories.md` — new standards doc (`applies_to: ["packages/react/src/testing/**", "packages/react/src/components/fields/*/testFixture.ts", "packages/react/src/components/fields/**/Input.test.tsx"]`) documenting the factory contracts, the per-field-folder fixture rule, and the convex bridge
- [x] `.agent/docs/standards/naming-conventions.md` — add `testFixture` to `react-field-module`'s allowed base names; add a new `react-testing-kit-camel` rule scoping `packages/react/src/testing/**`
- [x] Run `harness struct && harness sync` and resolve any resulting drift
