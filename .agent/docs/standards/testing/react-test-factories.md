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
</content>
<parameter name="i">Create react-test-factories standards doc per spec