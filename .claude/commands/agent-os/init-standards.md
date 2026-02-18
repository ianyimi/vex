# Initialize Standards

Set up project standards and library documentation for any project type. This command:
1. Detects project dependencies and type from package manager files
2. Lets you select important libraries to fetch documentation for
3. Checks and refreshes library standards from official docs (checking llms.txt first)
4. Identifies use-case-driven standards topics based on project context
5. Researches and generates project-specific standards files
6. Copies library standards into the project and updates the index

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Prefer llms.txt** — Always check for llms.txt files first as the source of truth
- **Save to base install** — Refreshed library standards are saved to `~/agent-os/library-standards/` for reuse across projects
- **Generic** — Works with any language, framework, or project type

## Process

### Step 1: Detect Project Context

#### 1a. Read product docs (if available)

Read `agent-os/product/` files if they exist:
- `mission.md` — project purpose and target users
- `roadmap.md` — MVP features and future plans
- `tech-stack.md` — chosen technologies

These provide context for use-case standards generation in later steps.

#### 1b. Detect dependencies

Check for package manager files in order:
- `package.json` (Node.js/JavaScript)
- `Gemfile` (Ruby)
- `requirements.txt` or `pyproject.toml` (Python)
- `go.mod` (Go)
- `Cargo.toml` (Rust)
- `composer.json` (PHP)

Read all production dependencies (skip dev dependencies).

#### 1c. Scan usage frequency

For each dependency, count mentions in code files:
- Import/require statements
- Direct package references
- Configuration files

Sort dependencies by usage count (highest to lowest).

#### 1d. Determine project type

Classify using these signals:

**Web Application** (frontend + backend)
- Has web framework dependencies (React, Next.js, Vue, Angular, Svelte, etc.)
- Contains UI components
- Folders: `frontend/`, `backend/`, `global/`, `testing/`

**Backend API**
- Has backend framework only (Express, Fastify, NestJS, Django, Rails, etc.)
- No frontend UI
- Folders: `api/`, `database/`, `global/`, `testing/`

**CLI Tool**
- Command-line application, no web dependencies
- Folders: `cli/`, `commands/`, `global/`, `testing/`

**Library/Package**
- Reusable code package, no application entry point
- Folders: `api/`, `implementation/`, `global/`, `testing/`

**Dotfiles/System Configuration**
- Shell configs, dotfiles, Chezmoi or similar
- Folders: `shell/`, `configs/`, `global/`, `tools/`

**Mobile Application**
- React Native, Flutter, Swift, Kotlin
- Folders: `mobile/`, `backend/`, `global/`, `testing/`

**Monorepo/Multi-project**
- Multiple project types
- Folders: `frontend/`, `backend/`, `shared/`, `global/`, `testing/`

### Step 2: Present Libraries & Get User Selection

Use AskUserQuestion with multiSelect to present all dependencies at once:

**Question text:**
```
I found [N] dependencies in your project, sorted by usage frequency:

**Heavy Usage (100+ references):**
- react (872 refs) — UI library for building user interfaces
- next (445 refs) — React framework for production applications

**Moderate Usage (20-100 references):**
- convex (87 refs) — Backend database and API platform
- tailwindcss (34 refs) — Utility-first CSS framework

**Light Usage (<20 references):**
- dotenv (5 refs) — Environment variable loader
...

Which libraries are most important for working on this project?

If any descriptions are wrong, type "fix: [library] - [correct description]" in the Other option.
Otherwise, select the libraries to fetch documentation for (recommended: top 5-10).
```

**Options:**
- multiSelect: true
- One option per library: label = `library-name (N refs)`, description = auto-generated one-sentence description
- Cap at top 20 libraries
- If user typed corrections in "Other", update descriptions and ask again

### Step 3: Check Existing Library Standards

For each selected library:
- Check `~/agent-os/library-standards/[library]/version.yml`
- Compare major version from package manager against `current_major` in version.yml
- Classify each as:
  - **up-to-date** — major version matches, standards exist
  - **outdated** — project has newer major version than standards
  - **new** — no existing standards at all

### Step 4: Fetch/Refresh Library Standards

For each library that is **new** or **outdated**:

**Default behavior:** Automatically fetch/refresh.
**With `--confirm` flag:** Use AskUserQuestion for confirmation before refreshing.
**With `--no-refresh` flag:** Skip refresh, use existing standards even if outdated.

#### 4a. Check for llms.txt (Priority 1)

Try these URLs in order using WebFetch:
1. `https://[docs-domain]/llms.txt`
2. `https://[docs-domain]/llms-full.txt`
3. `https://[docs-domain]/.well-known/llms.txt`

If found:
- Parse for best practices sections
- Extract links to important guides
- Note llms.txt URL for saving

#### 4b. Fallback to web search

If no llms.txt is available:
- Search: `[library] best practices v[version]`
- WebFetch top 2-3 results

#### 4c. Extract and structure content

From gathered docs, extract:
- Best practices and recommended patterns
- Common pitfalls to avoid
- Core concepts and mental models
- Version-specific notes

#### 4d. Save to base install

Save to `~/agent-os/library-standards/[library-name]/`:

**version.yml:**
```yaml
library: [library-name]
current_major: [major-version]
current_minor: [minor-version]
last_updated: [today's date YYYY-MM-DD]
docs_source: [official docs URL]
llms_txt_url: [llms.txt URL if found, or null]
best_practices_source: [best practices page URL]
```

**v[X].x/best-practices.md:**

Use this format with conditional blocks for smart loading:

```markdown
# [Library Name] Best Practices

## Context

Standards for [Library]. Apply these patterns for [use cases].

<conditional-block context-check="core-concepts">
IF this Core Concepts section already read in current context:
  SKIP: Re-reading this section
ELSE:
  READ: The following concepts

## Core Concepts

### [Concept 1]

[Concise explanation]

- [Key point]
- [Key point]

\`\`\`[language]
// Example
\`\`\`

</conditional-block>

<conditional-block context-check="best-practices">
IF this Best Practices section already read in current context:
  SKIP: Re-reading this section
ELSE:
  READ: The following practices

## Best Practices

### [Practice 1]

...

</conditional-block>

<conditional-block context-check="common-pitfalls">
IF this Common Pitfalls section already read in current context:
  SKIP: Re-reading this section
ELSE:
  READ: The following pitfalls

## Common Pitfalls

### [Pitfall 1]

...

</conditional-block>
```

**Writing rules:**
- Concise — every word costs tokens
- Lead with rules, explain why second
- Code examples over prose
- Skip obvious/basic setup
- Under 80 lines per file

If `--libs-only` flag is set, skip to Step 8 after this step.

### Step 5: Identify Use-Case Standards Topics

If `--standards-only` flag is set, skip Steps 3-4 and start here.

Build a list of use-case-driven standards topics from these sources:

**1. Product docs** (if `agent-os/product/` exists):
- MVP features imply patterns (e.g., "auth" in roadmap implies auth flow standards)
- Tech stack choices imply conventions

**2. Selected libraries:**
- Each major library implies conventions and integration patterns
- Reuse content already fetched in Step 4

**3. Project type:**
- Determines folder structure and standard categories
- Use folder mapping from Step 1d

**4. Existing code** (if available):
- Scan 3-5 representative files per area for established patterns
- If no code exists, base entirely on web research + product goals

**5. Problem domain:**
- Architectural patterns implied by the product type (e.g., SaaS implies multi-tenancy patterns, e-commerce implies payment flow patterns)

Organize topics into appropriate folders based on project type from Step 1d.

### Step 6: Confirm Standards Plan with User

Use AskUserQuestion with the proposed standards list:

```
Based on your project, I'll create these standards:

**[folder]/**
- [name] — [one-sentence description]
- [name] — [one-sentence description]

**[folder]/**
- [name] — [one-sentence description]
...

I'll research best practices for each using official documentation.

Options:
1. Create all of these
2. Let me select which ones
3. Add more (describe in Other)
4. Skip standards creation — only install library docs
```

If option 2, present as multiSelect AskUserQuestion.
If option 3, add user-specified topics to the list.
If option 4, skip to Step 8.

### Step 7: Research & Generate Use-Case Standards

For each confirmed standard topic:

#### 7a. Research

- Reuse content from library standards already fetched in Step 4 where relevant
- WebSearch for use-case-specific best practices (e.g., "Next.js authentication patterns best practices 2026")
- WebFetch top 1-2 results
- Cap at 2-3 searches per topic

#### 7b. Analyze existing code (if applicable)

- Read 3-5 files in the relevant area
- Extract established patterns to incorporate
- If no code exists, base entirely on web research + project goals

**New project (no code):** Standards based on web research + product docs + project goals. More prescriptive. Notes in Context: "Recommended starting patterns."

**Existing project:** Blend observed patterns (prioritized) + web best practices. Notes in Context: "Based on patterns in the existing codebase."

#### 7c. Generate standards file

Write to `agent-os/standards/[folder]/[name].md`:
- Use standard format: markdown with `<conditional-block>` tags
- Concise, rule-first, code examples over prose
- Under 80 lines per file
- Check for existing files — if conflicts, ask user: overwrite, merge, or skip

### Step 8: Copy Library Standards to Project

Copy relevant library best-practices from `~/agent-os/library-standards/` into `agent-os/standards/` based on project type:

- Frontend libs (React, Vue, Angular, Svelte, CSS frameworks, etc.) → `standards/frontend/` (or equivalent folder for project type)
- Backend libs (Express, Django, database clients, etc.) → `standards/backend/` (or equivalent)
- Universal libs (validation, testing, utilities) → `standards/global/`

### Step 9: Update Standards Index

Auto-generate `agent-os/standards/index.yml` with all standards (library + use-case):

```yaml
# Standards Index - [Project Type]

[folder]:
  [standard-name]:
    description: [one-sentence description]
    source: [library | use-case]
  [standard-name]:
    description: [one-sentence description]
    source: [library | use-case]

[folder]:
  [standard-name]:
    description: [one-sentence description]
    source: [use-case]
```

### Step 10: Report Results

```
Standards initialized!

Project type: [detected type]

Library standards fetched: [N] libraries
  - [lib1] (via llms.txt) → ~/agent-os/library-standards/[lib1]/
  - [lib2] (via web search) → ~/agent-os/library-standards/[lib2]/

Project standards created:
  agent-os/standards/[folder]/
    - [standard1].md
    - [standard2].md
  ...

Standards index updated: agent-os/standards/index.yml

Next: Run /discover-standards to extract patterns from existing code.
```

## Command Flags

- `--confirm` — Require confirmation before refreshing outdated library standards
- `--no-refresh` — Skip library refresh, use existing standards even if outdated
- `--refresh [library]` — Force refresh a specific library (even if not outdated)
- `--libs-only` — Only fetch/update library standards, skip use-case standards creation
- `--standards-only` — Skip library fetching, only create use-case standards

## Library Standards Structure

The base install contains versioned library standards:

```
~/agent-os/library-standards/
├── [library]/
│   ├── version.yml
│   └── v[X].x/
│       └── best-practices.md
└── ...
```

Each `version.yml` contains:
```yaml
library: [library-name]
current_major: 1
current_minor: 17
last_updated: 2026-01-27
docs_source: https://docs.example.com
llms_txt_url: https://docs.example.com/llms.txt
best_practices_source: https://docs.example.com/best-practices
```

## Related Commands

- `/plan-product` — Set up product documentation (run first for better context)
- `/discover-standards` — Extract patterns from your codebase (run after to refine)
- `/inject-standards` — Load standards into context
