# Polish Checklist

A semantic audit: is the code actually correct and complete? Not a style review.

## Error handling completeness
- Every async operation has a catch/error boundary
- Network errors are handled gracefully (not silently swallowed)
- Invalid input produces a clear user-facing error, not a crash
- Loading and empty states are explicitly handled (not just the happy path)

## Codepath coverage
- What happens when a list is empty?
- What happens when a required resource is missing or deleted?
- What happens when the user has no permissions?
- What happens when two users act on the same resource simultaneously?

## Edge cases from the spec
- Were all edge cases listed in the spec's "## Edge cases" section actually implemented?
- Are there any `throw new Error("Not implemented")` stubs still in the code?

## Suggested improvements (lightweight only)
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

    ## Suggestions (your call, no action taken)
    - [ ] Add keyboard shortcut Cmd+K to open filter panel (natural given Command palette)
    - [ ] "No items match your filters" empty state is more specific than "No items"

    2 warnings. 2 suggestions. No blocking issues.
    Add warnings to tasks.md inbox? (yes / no)
