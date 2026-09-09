---
applies_to: ["packages/react/src/testing/**", "packages/react/src/components/fields/*/testFixture.ts", "packages/react/src/components/fields/**/Input.test.tsx"]
---
# React Test Factories

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
- `@vexcms/react/testing` ships plain exported functions whose bodies call `describe`/`it`/
  `expect` themselves (a "shared examples" pattern) — never raw `.test.*` files. A consumer
  writes one real test file and calls `runVexReactSuite(...)` (or a narrower factory) from it.
  `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`,
  `vitest-axe`, `convex-test`, `react`, `react-dom` are **peerDependencies only** on this
  subpath — never bundled, never a plain `dependency` — so the consumer's own copies resolve
  (P-012–P-016; `AP-016` is the dual-module-instance failure this avoids).
- `testing/index.ts`'s `runVexReactSuite` takes a `sections?: VexSuiteSection[]` array
  (`"fields" | "cells" | "columnDefs" | "views" | "shell" | "dataTable" | "modals" | "hooks" |
  "media"`), defaulting to ALL sections — each name dispatches to a real exported suite
  function under `testing/` (never `only`; the section itself is the dispatch granularity,
  the suite's own `only` filter is for the suite's own callers). `includeCore: false` remains
  sugar that suppresses only the field sections (`"fields"`, `"cells"`, `"columnDefs"`).
  Wanting a narrower slice than that (e.g. a fast smoke covering only `"hooks"` and
  `"shell"`) means naming `sections` explicitly instead.
  **Every section-selectable suite MUST be an exported function under
  `packages/react/src/testing/`, with the package's own `*.test.tsx` file as a thin caller —
  never a raw test file.** The package's internal `*.test.tsx` files do not ship in `dist/`;
  only `dist/testing/` does, so a section backed by nothing but an internal test file would be
  accepted by the type system and silently do nothing for a consumer. This is load-bearing,
  not stylistic: running a suite inside the *consumer's* own process, through the published
  `./testing` subpath, is what catches the dual-context/module-resolution failure class
  ADR-009 exists to prevent — measured there at 26 of 27 `apps/www` tests failing the moment
  the test kit's provider and the component's provider resolved to two different bundled
  copies of the same `createContext` call.
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
    and a type opts OUT with `truncates: false`, never the other way around. Pass
    `truncates: false` only for the four types where truncation is meaningless by value shape
    — `date` (fixed format), `number`, `checkbox` (boolean), `color` (`#e8622a`).
  A field type's `Cell.test.tsx` failing any base-contract assertion is a real defect in that
  Cell, not a factory bug. The authoritative record of which types currently fail which
  assertion is `.agent/docs/specs/2026-09-08-react-coverage-expansion/findings.md` (generated
  by `scripts/record-test-findings.mjs`) and the triaged `BUGS-REPORT.md` it feeds — never a
  count restated in prose.
- `testing/columnDefSuite.ts`'s `runColumnDefSuite<TField, TValue>(options: { fixture:
  FieldFixture<TField, TValue> })` is a third per-type factory alongside
  `runFieldInputContractSuite`/`runFieldCellContractSuite`, called once per field type from
  that type's `columnDef.test.ts` (12 callers). It builds the column via
  `getCollectionColumnDefs`, which already switches on `fieldDef.type` internally — so the
  suite takes no per-type builder argument — and asserts `accessorKey`/`id`, header text
  falling back from `label` to the field key, `meta.align` from `admin.cellAlignment`, and
  cell-renderer identity with props forwarded.
- `testing/dataTableSuite.tsx`'s `runDataTableSuite(options?: { only?: Array<"DataTable" |
  "DataTablePagination" | "DataTableBulkActions" | "DeleteManyModal"> })` is the first of the
  single-call-per-section suites: called ONCE, its default `only` covers all four
  `ui/data-table/*` files together — row/header rendering and Load More, pagination wired to
  a real `usePagination`, bulk selection wired to a real `useTableSelection`, and the
  delete-many confirm/cancel flow. It takes no `access`: none of those components read
  `usePermission`, and a parameter nothing consumes is exactly the speculative code
  `code-rules.md` forbids.
- `testing/rbacState.ts`'s `runRbacStateSuite` renders against the SAME
  `VexAccessProvider`/`VexAuthProvider` pair the app uses and the real `defineAccess`/
  `hasPermission` resolution from core — never a mocked `usePermission` return value. This
  mirrors `hooks/usePermission.test.tsx`'s existing philosophy, generalized into a factory.
- `testing/harness/viewHarness.tsx`'s `renderView` mounts a full admin view with every
  provider it reads — `ConvexProvider` + `QueryClientProvider` wired to the convex bridge,
  `NuqsTestingAdapter`, `VexConfigContext`, and the `VexAccess`/`VexAuth` pair — by composing
  `renderWithVexProviders` rather than re-wiring access/auth itself. `testClientConfig` is its
  default stub `ClientVexConfig` (one `posts` collection, one `images` media collection, one
  global) for view tests that don't need a bespoke config. Reach for `renderView` for anything
  that reads Convex-backed data (`CollectionListView`, `AdminSidebar`, …); a test that only
  needs the access/auth pair without Convex keeps calling `renderWithVexProviders` directly —
  `renderView` composes it, it does not replace it.
- `testing/viewSuite.ts` exports `runViewSuite(options?: { only?: Array<"CollectionListView" |
  "CollectionEditView" | "GlobalEditView" | "GlobalsListView" | "DashboardView" |
  "UnauthorizedView" | "MediaCollectionListView" | "MediaCollectionEditView">; access?:
  VexAccessConfig })`, covering all eight admin views on top of `renderView`, and
  `runShellSuite(options?: { only?: Array<"AdminLayout" | "AdminSidebar" | "AdminTopNav">;
  access?: VexAccessConfig })`, covering `AdminLayout`/`AdminSidebar`/`AdminTopNav` —
  framework-component injection, active-route highlighting, and the `usePermission`
  nav-gating call sites. Both default `only` to every member of their category. `access` is
  two-mode, documented in each suite's own JSDoc: the default (no `access` supplied) drives
  the real five-scenario RBAC matrix through `testAccess`/`testUsers`; a caller-supplied
  `access` gets only a renders-without-crashing smoke check, since arbitrary role names and
  resources cannot be assumed to match the default matrix's shape.
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
- `testing/modalSuite.tsx`'s `runModalSuite(options?: { only?: Array<"BaseModal" |
  "CreateDocumentModal" | "CreateMediaModal">; access?: VexAccessConfig })` and
  `testing/mediaSuite.tsx`'s `runMediaSuite(options?: { only?: Array<"FilePreview" |
  "MediaLibaryGrid" | "MediaUploadDropzone">; access?: VexAccessConfig })` follow the same
  `only`-filtered, single-call-per-section shape as `runViewSuite`/`runShellSuite`/
  `runDataTableSuite`, for the last two categories: modals (open/close, escape/backdrop
  dismissal, focus trap, submit wiring, and rapid-resubmit) and media (render states,
  selection, accept filtering, and same-batch multi-file drop behavior — no real upload
  round-trip; `upload/Input.test.tsx` already proves that path). `access` threads to
  `renderWithVexProviders` in both for signature consistency with the other single-call
  suites, even though none of these six components read permissions directly — documented in
  each suite's own JSDoc as reserved/unexercised for that reason, not dead code by oversight.
  Only these two umbrella functions are published per category — a per-component helper
  (`runBaseModalSuite`, `runFilePreviewSuite`, …) may exist as a module-local implementation
  detail, never as an additional export.
- **A section-selectable suite MUST NOT depend on `vi.mock`.** `vi.mock` only intercepts
  inside `packages/react`'s own vitest module graph; from a consumer importing built
  `dist/testing`, the mocked specifiers do not exist and the components render unmocked. That
  is not a soft failure — it produced 39 "Could not find Convex client" / "No QueryClient
  set" errors in `apps/test` the first time `sections: ["modals", "media"]` ran there, i.e. a
  suite that looked green in-package and was broken for every consumer. Inject collaborators
  through real seams instead: the `testing/convex/` bridge (which now dispatches
  `.mutation()` through its own `MUTATION_HANDLERS`, so a component's real write path lands
  in convex-test tables) and public provider props such as
  `StorageAdapterContextProvider`'s `adapterClients`. Assert what the write actually recorded
  (`schema.ts`'s `readTable`) rather than a spy's arguments — the assertion then holds
  identically in both processes.