# Build Order — the Six Rules

Order task groups so the developer can build, run, and test after EVERY step.

1. **Environment first.** Step 1 is config, package scaffolding, tooling. After it,
   `build` and `test` both run clean (even with zero tests).
2. **Visual feedback early.** Stubs before internals — the developer sees something in the
   browser/terminal by step 2 at the latest. An entry point with a hardcoded return beats
   five perfect internal modules nobody can run.
3. **LSP-clean at every step.** If file A imports from file B, B's step comes before A's.
   Mutually-importing files share a step with a note to create them together.
4. **Test infrastructure before test files.** Runner config and shared utilities land before
   any `.test.*` file that needs them.
5. **Tests colocated.** `foo.test.ts` ships in the same step as `foo.ts`. Never a "Tests"
   phase at the end.
6. **Dependencies before dependents.** Utilities before orchestration; leaves before roots.

Self-check before presenting: for each step ask "can the developer run build + test right
now and see progress?" If any answer is no, split or reorder.
