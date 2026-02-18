# Implement Spec

Execute an approved spec plan, implementing each task in sequence.

## Auto Mode Selection

**This command automatically enters Build mode.** If you are currently in plan mode, exit plan mode and switch to build mode before proceeding.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Follow the plan** — Execute tasks as specified, don't improvise unless blocked
- **Report progress** — Keep the user informed as tasks complete
- **Handle blockers** — If a task can't be completed, explain why and ask for guidance

## Prerequisites

This command requires an existing spec with a plan. Check for:
1. Recent specs in `agent-os/specs/`
2. A `plan.md` file within the spec folder

If no spec exists:
```
No spec found. Run /1-shape-spec first to create a plan, then return here to implement it.
```

## Process

### Step 1: Identify the Spec to Implement

Check `agent-os/specs/` for available specs. If multiple exist, use AskUserQuestion:

```
I found these specs:

1. **2026-01-15-1430-user-comment-system** — User commenting feature
2. **2026-01-14-0900-auth-improvements** — Authentication flow updates

Which spec should we implement? (1, 2, or specify path)
```

If only one spec exists, confirm it:

```
Found spec: agent-os/specs/2026-01-15-1430-user-comment-system/

Implement this spec? (yes / or specify different path)
```

### Step 2: Load the Plan

Read the `plan.md` file from the selected spec folder. Parse the tasks and present a summary:

```
Loaded plan for: User Comment System

Tasks to implement:
1. Save Spec Documentation [if not already done]
2. Create comment model and database migration
3. Build comment API endpoints
4. Add comment UI components
5. Write tests for comment functionality

Ready to begin implementation? (yes / review plan first)
```

If they want to review, show the full plan content.

### Step 3: Load Standards Context

Read `standards.md` from the spec folder to understand which standards apply. Keep these in context during implementation.

If `standards.md` doesn't exist, check `agent-os/standards/index.yml` and use AskUserQuestion to confirm relevant standards before proceeding.

### Step 4: Execute Tasks Sequentially

For each task in the plan:

#### 4a. Announce the Task

```
Starting Task 2: Create comment model and database migration

This task involves:
- Creating the Comment model with fields for content, author, timestamps
- Writing the database migration
- Following the migration patterns from our standards
```

#### 4b. Implement the Task

Execute the implementation:
- Write code following the standards
- Create necessary files
- Make required changes

#### 4c. Report Completion

```
✓ Task 2 Complete: Create comment model and database migration

Created:
- src/models/comment.ts
- src/db/migrations/20260115_create_comments.ts

Moving to Task 3...
```

#### 4d. Handle Blockers

If a task can't be completed, stop and use AskUserQuestion:

```
⚠️ Blocked on Task 3: Build comment API endpoints

Issue: The user model doesn't have an `id` field that the comment model references.

Options:
1. Add `id` field to user model first
2. Skip this task and continue
3. Modify the approach (I'll explain alternatives)

How should we proceed?
```

### Step 5: Final Summary

After all tasks complete:

```
✓ Implementation Complete

Spec: User Comment System
Tasks completed: 5/5

Files created:
- src/models/comment.ts
- src/db/migrations/20260115_create_comments.ts
- src/api/comments.ts
- src/components/CommentList.tsx
- src/components/CommentForm.tsx
- tests/comments.test.ts

Files modified:
- src/api/index.ts (added comment routes)
- src/models/index.ts (exported Comment model)

Next steps:
- Run tests to verify implementation
- Review the changes before committing
- Consider running /discover-standards if new patterns emerged
```

## Handling Deviations

Sometimes the plan needs adjustment during implementation. Handle these cases:

### Minor Adjustments

If a small change is needed (different file name, additional import):
- Make the change
- Note it in the completion report
- Don't stop for approval

### Significant Deviations

If a major change is needed (different approach, missing dependency, architectural issue):
- Stop and use AskUserQuestion to explain
- Get approval before proceeding
- Update the plan if needed

### New Tasks Discovered

If implementation reveals additional work needed:

```
During Task 3, I discovered we also need:
- A notification system for new comments
- Rate limiting on the comment API

Options:
1. Add these as new tasks and continue
2. Note them for a future spec
3. Skip for now, handle separately

How should we handle these?
```

## Integration with Standards

During implementation:
- Reference standards when making decisions
- Follow patterns established in standards
- If you notice a new pattern emerging, mention it:

```
Note: I'm using a consistent error handling pattern here that might be worth documenting.
After implementation, consider running /discover-standards on the API code.
```

## Tips

- **Trust the plan** — The shaping phase already made key decisions
- **Stay focused** — Implement what's in the plan, defer new ideas
- **Communicate progress** — Users appreciate knowing where things stand
- **Test as you go** — Run tests after each task if possible
- **Commit checkpoints** — Suggest commits after major milestones
