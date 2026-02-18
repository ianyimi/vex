# Improve Skills

Analyze your Claude Code usage and enhance your skills based on patterns in your codebase and standards.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Focus on practical skills** — Create skills that solve real problems you encounter repeatedly
- **Keep skills focused** — One skill per task, not Swiss Army knives

## Process

### Step 1: Discover Skill Opportunities

Check for existing skills in `.claude/skills/` and analyze the codebase for opportunities.

Use AskUserQuestion to understand the user's needs:

```
Let's identify opportunities to improve your Claude Code skills.

What repetitive tasks do you find yourself doing often?

Examples:
- "Creating new API endpoints"
- "Adding new components with consistent structure"
- "Writing tests for specific patterns"
- "Debugging certain types of issues"

(Describe your pain points, or say "analyze my codebase" for suggestions)
```

### Step 2: Analyze for Patterns

If the user says "analyze my codebase" or similar:

1. Read recent git commits to see what types of changes are common
2. Look at file structure for repeated patterns
3. Check `agent-os/standards/` for documented patterns that could become skills
4. Identify boilerplate that appears across files

Present findings:

```
I analyzed your codebase and found these potential skill opportunities:

1. **API Endpoint Creation** — You have 12 similar API files following the same pattern
2. **Component Scaffolding** — Your React components follow a consistent structure with tests
3. **Database Migration** — Migrations follow specific naming and structure conventions

Which would you like to turn into a skill? (1, 2, 3, or describe something else)
```

### Step 3: Design the Skill

For the selected opportunity, gather requirements:

```
Let's design the [skill name] skill.

**What should this skill do?**
- What inputs does it need?
- What files should it create/modify?
- What patterns should it follow?

(Describe the ideal workflow, or say "show me an example")
```

If they want an example, show a sample skill structure based on the pattern.

### Step 4: Check Relevant Standards

Read `agent-os/standards/index.yml` to find standards that apply to this skill.

```
These standards are relevant to this skill:

1. **api/response-format** — API response envelope structure
2. **api/error-handling** — Error codes and exception handling

Should the skill:
1. Reference these standards (@ file paths)
2. Embed the standards content
3. Skip standards integration

(Choose 1, 2, or 3)
```

### Step 5: Create the Skill File

Generate the skill in `.claude/skills/`:

```markdown
# [Skill Name]

[Description of what this skill does]

## When to Use

- [Trigger condition 1]
- [Trigger condition 2]

## Inputs

- **[input1]**: [description]
- **[input2]**: [description]

## Process

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Standards

@agent-os/standards/api/response-format.md
@agent-os/standards/api/error-handling.md

## Examples

[Example usage and output]
```

Present the draft:

```
Here's the skill draft for `.claude/skills/[skill-name].md`:

[Show the content]

Create this skill? (yes / edit: [your changes])
```

### Step 6: Test the Skill

After creating, suggest testing:

```
✓ Skill created: .claude/skills/[skill-name].md

To test it, try:
- Ask Claude to [describe a task that would trigger this skill]
- Check that the output follows your patterns

Would you like to create another skill? (yes / no)
```

## Skill Best Practices

### Keep Skills Focused

**Good:**
- "Create API endpoint" — Does one thing well
- "Add React component with tests" — Clear scope

**Bad:**
- "Create full feature" — Too broad, hard to maintain
- "Do everything for API" — Vague, unpredictable

### Use Standards References

Prefer `@agent-os/standards/...` references over embedding content:
- Standards stay in sync when updated
- Skills remain lightweight
- Single source of truth

### Include Examples

Skills work better with concrete examples:
```markdown
## Example

Input: create-api-endpoint users

Creates:
- src/api/users.ts
- tests/api/users.test.ts
```

### Document Trigger Conditions

Be explicit about when the skill applies:
```markdown
## When to Use

- User asks to "create a new API endpoint"
- User mentions "add endpoint for [resource]"
- User wants to "scaffold API for [feature]"
```

## Skill Organization

Organize skills by domain:

```
.claude/skills/
├── api/
│   ├── create-endpoint.md
│   └── add-middleware.md
├── components/
│   ├── create-component.md
│   └── add-form.md
└── testing/
    └── add-tests.md
```

Or keep them flat if you have few skills:

```
.claude/skills/
├── create-api-endpoint.md
├── create-component.md
└── add-tests.md
```

## Related Commands

- `/discover-standards` - Find patterns that could become skills
- `/inject-standards` - Add standards to skills you're building
