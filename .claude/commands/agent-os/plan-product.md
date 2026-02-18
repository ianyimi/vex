# Plan Product

Establish foundational product documentation through an interactive conversation. Creates mission, roadmap, and tech stack files in `agent-os/product/`.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Keep it lightweight** — gather enough to create useful docs without over-documenting
- **Ask everything at once** — combine all questions into ONE AskUserQuestion call for efficiency

## Process

### Step 1: Check for Existing Product Docs

Check if `agent-os/product/` exists and contains any of these files:
- `mission.md`
- `roadmap.md`
- `tech-stack.md`

**If any files exist**, use AskUserQuestion:

```
I found existing product documentation:
- mission.md: [exists/missing]
- roadmap.md: [exists/missing]
- tech-stack.md: [exists/missing]

Would you like to:
1. Start fresh (replace all)
2. Update specific files
3. Cancel

(Choose 1, 2, or 3)
```

If option 2, ask which files to update and only gather info for those.
If option 3, stop here.

**If no files exist**, proceed to Step 2.

### Step 2: Gather All Product Information in ONE AskUserQuestion Call

Check if `agent-os/standards/global/tech-stack.md` exists first to determine tech stack question format.

Then use AskUserQuestion with ALL questions in a single call:

```json
{
  "questions": [
    {
      "question": "What problem does this product solve?",
      "header": "Problem",
      "options": [
        {"label": "N/A", "description": "Type your answer in Other"}
      ],
      "multiSelect": false
    },
    {
      "question": "Who is this product for?",
      "header": "Target Users",
      "options": [
        {"label": "N/A", "description": "Type your answer in Other"}
      ],
      "multiSelect": false
    },
    {
      "question": "What makes your solution unique?",
      "header": "Unique Value",
      "options": [
        {"label": "N/A", "description": "Type your answer in Other"}
      ],
      "multiSelect": false
    },
    {
      "question": "What are the must-have features for launch (MVP)?",
      "header": "MVP Features",
      "options": [
        {"label": "N/A", "description": "Type your answer in Other"}
      ],
      "multiSelect": false
    },
    {
      "question": "What features are planned for after launch? (or say 'none yet')",
      "header": "Future Features",
      "options": [
        {"label": "N/A", "description": "Type your answer in Other"}
      ],
      "multiSelect": false
    },
    {
      "question": "[Tech stack question - see below]",
      "header": "Tech Stack",
      "options": "[See tech stack options below]",
      "multiSelect": false
    }
  ]
}
```

**Tech Stack Question (Question 6):**

**If `agent-os/standards/global/tech-stack.md` exists:**
```
"question": "I found a tech stack standard in your standards: [summarize key tech]. Does this project use the same stack?"
"options": [
  {"label": "Same as standard", "description": "[Key technologies from standard]"},
  {"label": "Different", "description": "I'll specify in Other what this project uses"}
]
```

**If no tech-stack standard exists:**
```
"question": "What type of project is this and what technologies does it use?"
"options": [
  {"label": "Web App", "description": "Frontend + Backend (specify tech in Other)"},
  {"label": "CLI Tool", "description": "Command-line application (specify language in Other)"},
  {"label": "Library", "description": "Reusable package (specify language in Other)"},
  {"label": "Dotfiles/System", "description": "Configuration management (specify tools in Other)"}
]
```

**IMPORTANT:** This is ONE AskUserQuestion call with 6 questions. The user answers all at once.

### Step 3: Generate Files

Create the `agent-os/product/` directory if it doesn't exist.

Generate each file based on the information gathered:

#### mission.md

```markdown
# Product Mission

## Problem

[Insert what problem this product solves - from Step 2]

## Target Users

[Insert who this product is for - from Step 2]

## Solution

[Insert what makes the solution unique - from Step 2]
```

#### roadmap.md

```markdown
# Product Roadmap

## Phase 1: MVP

[Insert must-have features for launch - from Step 2]

## Phase 2: Post-Launch

[Insert planned future features - from Step 2, or "To be determined" if they said none yet]
```

#### tech-stack.md

```markdown
# Tech Stack

[Organize the tech stack information into logical sections]

## Frontend

[Frontend technologies, or "N/A" if not applicable]

## Backend

[Backend technologies, or "N/A" if not applicable]

## Database

[Database choice, or "N/A" if not applicable]

## Other

[Other tools, hosting, services - or omit this section if nothing mentioned]
```

### Step 4: Confirm Completion

After creating all files, output to user:

```
Product documentation created:

  agent-os/product/mission.md
  agent-os/product/roadmap.md
  agent-os/product/tech-stack.md

Review these files to ensure they accurately capture your product vision.

Next: Run /init-standards to detect your project's dependencies, fetch library documentation, and generate use-case-driven standards based on your tech stack and product goals.
```

## Tips

- If the user provides very brief answers, that's fine — the docs can be expanded later
- If they want to skip a section, create the file with a placeholder like "To be defined"
- The `/shape-spec` command will read these files when planning features, so having them populated helps with context
