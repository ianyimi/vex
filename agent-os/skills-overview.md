# Skills Overview — Research, Learning, and Debug Automation

This document describes three custom Claude Code skills created to automate the higher-level, repetitive research processes that happen before and during software development. Each skill is a `.md` file in `.claude/commands/` that acts as a prompt template — when invoked with `/skill-name`, Claude follows the instructions in that file as a structured agent process.

---

## What a Skill Is

A skill (also called a slash command) is a markdown file in `.claude/commands/<name>.md`. When you type `/<name>` in Claude Code, the contents of that file become the system instructions for that turn. The skill defines:

- **A goal** — what the agent is trying to produce
- **A process** — the phases the agent works through (usually: parse input → research → write output)
- **An output format** — what the deliverable looks like and where it's saved
- **Key principles** — guardrails on what the agent should and shouldn't do

Skills are designed to be invoked with freeform natural language after the command name. The agent parses the intent from the prompt rather than requiring structured flags.

---

## Anatomy of a Skill File

```markdown
# <Title> — <Short Description>

<One paragraph explaining what this skill does and why it exists.>

## Usage

/skill-name <freeform description>

## Goal

<What the deliverable is — e.g., a .md file, a suggested fix, a comparison table.>

## Process

### Phase 1: <Parse input>
### Phase 2: <Do research / explore>
### Phase 3: <Analyze / synthesize>
### Phase 4: <Write output>
### Phase 5: <Report back in the conversation>

## Key Principles

<Guardrails: what to always do, what to never do, how to handle edge cases.>
```

The output for all three of these skills is a `.md` file saved to disk. The path follows this logic:
- If an `agent-os/` folder exists in the working directory → save inside `agent-os/research/<type>/<slug>.md`
- Otherwise → save to `research/<type>/<slug>.md` from the current working directory

---

## Skill 1: `/learn` — Curated Doc Guide

**File:** `.claude/commands/learn.md`

### What it's for

When you've already decided which tools you're using and now need to read the docs before writing code. Instead of opening 15 browser tabs and not knowing where to start, this skill finds the exact pages and sections you need, puts them in the right reading order, and explains why each one matters for your specific feature.

### How to invoke

```
/learn <freeform description of what you're building and which tools you're using>
```

Examples:
- `/learn I'm building real-time presence using Convex and Liveblocks`
- `/learn setting up file uploads with Convex storage and Cloudflare R2`

### What it produces

A `.md` reading guide saved to `agent-os/research/docs/<topic-slug>.md`. The guide contains:

- **Overview** — the mental model for how the tools connect to accomplish the feature
- **Ordered reading list** — each entry has:
  - Exact URL (with anchor links to specific sections where possible)
  - What the page covers (one sentence)
  - Why it matters for this specific feature (one sentence)
  - What to focus on
  - When to stop reading and move to the next link
- **Integration points** — where one tool hands off to another
- **What to ignore** — adjacent doc sections that aren't needed for this feature
- **Assumptions** — any tools inferred or ambiguities noted

### How the process works

1. Parses the feature description and tool names from freeform input (infers missing context rather than asking)
2. Searches the web for official docs for each tool, targeting the specific sections relevant to the feature
3. Looks for integration guides between the tools
4. Orders the reading list from concepts → setup → core API → integration → edge cases
5. Writes the guide file and reports the path + any coverage gaps back in the conversation

### Design intent

The value is not in summarizing the docs — it's in curation and context. Five precise links with "here's why you need this right now" beats a full doc index. The skill cuts everything not directly needed for the stated feature.

---

## Skill 2: `/research` — Tool Comparison

**File:** `.claude/commands/research.md`

### What it's for

When you're deciding which tool, library, or service to use for a specific problem. Instead of reading every marketing page yourself, this skill researches the available options, surfaces their real limits and tradeoffs, and produces a structured comparison with a ranking table and a concrete recommendation.

### How to invoke

```
/research <freeform description of the problem or feature you need to build>
```

Examples:
- `/research auth solution for a Next.js app with SSO, magic links, and RBAC`
- `/research background job queue for Node.js — needs retries, scheduling, observability`

### What it produces

A `.md` comparison report saved to `agent-os/research/tools/<topic-slug>.md`. The report contains:

- **Summary** — state of the category and top picks in 2–3 sentences
- **Per-tool breakdown** — for 4–8 tools:
  - Open source status and license
  - Self-hostable (with parity notes)
  - Technical limits (rate limits, storage caps, data model restrictions, query limits)
  - Vendor lock-in risk
  - Pricing (free tier, paid tier model, ballpark at scale)
  - Ecosystem (SDK languages — not just TypeScript — framework adapters, community size)
  - DX (API ergonomics, docs quality, local dev experience)
  - Best for / watch out for
- **Ranking table** — all tools scored across all criteria on a ★★★/★★☆/★☆☆/✗ scale
- **Integration section** — how top candidates play with the existing stack
- **Concrete recommendation** — a decision, not a hedge

### Ranking criteria and priority order

The ranking weights adjust based on project type, but the default priority is:

| Priority | Criterion | Notes |
|----------|-----------|-------|
| 1 | Open source & self-hostable | Always ranks highest. MIT/Apache + self-hostable is the baseline to beat. |
| 2 | Technical limits | Rate limits, data model restrictions, storage caps, query complexity, concurrency. Disqualifying limits = ✗. |
| 3 | Vendor lock-in risk | Can you migrate? Is data exportable? How proprietary is the integration? |
| 4 | Pricing | Free tier generosity. Cost model predictability. Ballpark at expected scale. |
| 5 | Ecosystem & integrations | Multi-language SDK coverage (Go, Python, Rust — not just TS). Framework support for the stated stack. |
| 6 | DX / API ergonomics | API design quality, docs quality, local dev story. Important but downstream of the above. |

### How the process works

1. Parses the problem, project type, existing stack, and hard constraints from freeform input
2. Searches for tools in the category — includes established players, strong open-source options, self-hostable alternatives
3. Researches each tool across all six criteria using web search
4. Scores and ranks, adjusting weights based on inferred project type
5. Writes the report file and reports the top pick and runner-up back in the conversation

### Design intent

Honest over optimistic. Every tool has real limits — the report surfaces them. Open source is the default preference because it means no vendor lock-in and easier cloud deployment. The recommendation section makes a call rather than deferring to "it depends."

---

## Skill 3: `/debug` — Bug Research and Fix Suggestion

**File:** `.claude/commands/debug.md`

### What it's for

When you're stuck on a bug that you can't solve on your own and want to know if others have hit the same issue. The skill searches GitHub issues, Stack Overflow, and the broader web to find existing solutions, explains the root cause if found, and suggests a specific fix in the conversation.

### How to invoke

```
/debug <description of the bug and/or paste of the error message>
```

Examples:
- `/debug Convex mutation throwing "Value is not a valid Convex value" when I pass a Date object`
- `/debug better-auth session not persisting between page navigations — token is set but useSession returns null on reload`

### What it produces

Two things:

**1. A `.md` research report** saved to `agent-os/research/bugs/<slug>.md` containing:
- Root cause explanation (if found)
- Solutions ranked by confidence (High / Medium / Low)
  - Source link, version context, concrete code fix
- Dead ends — what was tried and ruled out (prevents re-investigating same paths)
- Related issues and further reading
- Exact search queries used (so you can continue manually if needed)

**2. A fix suggestion in the conversation:**
```
Bug research saved to: `<path>`
Root cause: <one sentence>
Suggested fix: <concrete change>
Confidence: High / Medium / Low — <why>
```

### Search strategy

1. **GitHub Issues** — exact error string search + repo-specific issue search. Checks comments, not just issue titles.
2. **Stack Overflow** — error message + symptom search. Notes answer dates (old answers may reference deprecated APIs).
3. **General web** — blog posts, framework forums, Reddit, Discord archives if indexed.
4. **Official changelog / migration guide** — catches version-mismatch bugs and removed APIs.

### Design intent

Root cause over workaround. Understanding *why* something breaks prevents it from happening again. The skill documents dead ends explicitly because knowing what didn't work is as valuable as knowing what did. Nothing is applied to the code without explicit user approval — the skill is research and suggestion only.

---

## Creating Similar Skills for a Specific Project

To create new skills following this same pattern, you need:

### 1. A clear trigger
What does the user type? What does the freeform input look like? The best skills accept natural language rather than structured flags — the agent infers structure from the description.

### 2. A defined deliverable
Every skill should produce a concrete artifact: a `.md` file, a code change, a report, a plan. Vague "here's what I found" responses aren't skills — they're conversations. A skill produces something durable.

### 3. A phased process
Break the work into phases that mirror how a human expert would approach the problem:
- Phase 1: Understand what's being asked (parse intent)
- Phase 2: Do the research / exploration (read code, search web, analyze)
- Phase 3: Synthesize (rank, filter, order)
- Phase 4: Write the output (create the file)
- Phase 5: Report back briefly (path + highlights only)

### 4. Guardrails in "Key Principles"
The last section tells the agent what to prioritize and what traps to avoid. This is where you encode project-specific preferences — e.g., "always check the existing codebase before suggesting a new pattern" or "prefer the existing auth system over introducing a new one."

### 5. Output path convention
Decide where output files go. For project-specific skills, a consistent folder structure (like `agent-os/research/`) means the outputs accumulate into a useful knowledge base rather than scattering across the filesystem.

---

## Quick Reference

| Skill | Invoke | Output | Best for |
|-------|--------|--------|----------|
| `/learn` | `/learn <feature + tools>` | `agent-os/research/docs/<slug>.md` | Curated doc reading list before writing code |
| `/research` | `/research <problem to solve>` | `agent-os/research/tools/<slug>.md` | Comparing tools/services before picking one |
| `/debug` | `/debug <error or symptom>` | `agent-os/research/bugs/<slug>.md` + inline fix suggestion | Finding solutions to bugs others have hit |
