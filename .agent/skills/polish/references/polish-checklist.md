# Polish Checklist

A semantic audit: is the code actually correct and complete? Not a style review.

Every finding is **BLOCKING** (correctness or spec violation — must be fixed or
explicitly waived by the developer) or **WARN** (judgment call — listed, never blocks).
Section headers below carry the default severity; individual findings may be downgraded
with a one-line reason.

## Error handling completeness [BLOCKING]
- Every async operation has a catch/error boundary
- Network errors are handled gracefully (not silently swallowed)
- Invalid input produces a clear user-facing error, not a crash
- Loading and empty states are explicitly handled (not just the happy path)

## Codepath coverage [BLOCKING]
- What happens when a list is empty?
- What happens when a required resource is missing or deleted?
- What happens when the user has no permissions?
- What happens when two users act on the same resource simultaneously?

## Edge cases from the spec [BLOCKING]
- Were all edge cases listed in the spec's "## Edge cases" section actually implemented?
- Are there any `throw new Error("Not implemented")` stubs still in the code?

## Design smells (baseline) [WARN]

A structural-quality floor from Fowler's catalog. Project standards
(`docs/standards/`) always override this baseline — check them first; the baseline only
fills gaps the standards don't cover. Flag, with file:line:

- Mysterious Name — name requires reading the body to understand
- Duplicated Code — same logic in ≥2 places (extract or point at the existing helper)
- Feature Envy — function mostly manipulates another module's data
- Data Clumps — same group of values passed around together (wants a type)
- Primitive Obsession — domain concept passed as bare string/number
- Repeated Switches — same discriminator switched on in ≥2 places
- Shotgun Surgery — one logical change forced edits across many files
- Divergent Change — one file edited for many unrelated reasons
- Speculative Generality — abstraction with a single implementation and no second in sight
- Message Chains — `a.b().c().d()` reaching through interfaces
- Middle Man — module that only delegates
- Refused Bequest — implements an interface but stubs half of it

## Suggested improvements (lightweight only) [WARN]
Small, low-risk improvements that improve UX without architectural changes — suggestions
only, presented as a list, never applied without developer approval. Examples:
- A missing loading indicator on a slow operation
- A keyboard shortcut that would be natural given the UI
- An error message that could be more informative
- A missing confirmation dialog before a destructive action

Never suggest new features, architectural changes, or anything requiring a new spec.
Those go to `tasks.md` inbox if they're worth pursuing.

## Output format (exactly this shape)

    Polish complete for spec: collections-ui

    ## Error Handling
    ✅ FilterPanel — empty state handled
    ✅ Upload failures — toast notification shown
    ⚠️  BulkDeleteButton — no confirmation dialog before deletion of >1 item
        → Suggest: add AlertDialog (shadcn installed) before batch delete

    ## Codepath Coverage
    ✅ Empty collection — renders "No items" state
    ✅ Missing collection — 404 redirect handled in loader
    ⚠️  Concurrent edit — no conflict detection on save
        → Spec did not cover this. Add to tasks.md inbox?

    ## Spec Edge Cases
    ✅ All 3 edge cases from spec implemented

    ## Design Smells
    ⚠️  Data Clumps — (userId, collectionId, itemId) passed together in 4 call sites
        → src/hooks/useCollection.ts:12 — wants a CollectionRef type

    ## Suggestions (your call, no action taken)
    - [ ] Add keyboard shortcut Cmd+K to open filter panel (natural given Command palette)
    - [ ] "No items match your filters" empty state is more specific than "No items"

    0 blocking. 3 warnings. 2 suggestions.
    Add warnings to tasks.md inbox? (yes / no)
