# Guide — Write a Docs Guide for a Completed Feature

Write an MDX guide page for a feature that has already been implemented. Reads the actual implementation and JSDoc, then writes a guide that shows how to use the feature — including customization points like adapters, plugins, and framework integrations.

## Usage

```
/guide <feature or topic>
```

**Examples:**
- `/guide auth adapter`
- `/guide storage adapter`
- `/guide custom field components`
- `/guide defineFrameworkAdapter`
- `/guide text field`

---

## Instructions

### Phase 1: Locate the implementation

1. Find the relevant source files in `packages/` for the named feature
2. Read the exported functions, types, and interfaces
3. Read their JSDoc — this is the primary source for what the guide documents
4. Find any existing guides in `apps/docs/src/content/docs/guides/` to understand the established structure and tone

### Phase 2: Identify the guide's audience and scope

Determine from the feature what kind of guide this is:

- **Usage guide** — shows how to use a built-in feature (e.g., "how to configure a text field")
- **Adapter guide** — shows how to implement a customization interface (e.g., "how to build a storage adapter")
- **Framework guide** — shows how to integrate VexCMS with a specific framework (e.g., "using VexCMS with Next.js")
- **Integration guide** — shows how to wire a third-party service in (e.g., "auth with Better Auth")

The guide type determines the structure. Adapter and framework guides must show a complete working example from scratch.

### Phase 3: Write the guide

Save to `apps/docs/src/content/docs/guides/<slug>.mdx`.

**Structure:**

```mdx
---
title: <Title>
description: <One sentence — shown in search results and link previews>
---

## Overview

One paragraph: what this is, when you'd use it, and what you'll have at the end.

## Prerequisites

Bullet list of what the reader needs before starting (packages installed, config in place, etc.).
Omit this section if there are no prerequisites.

## <Step 1 heading>

Numbered steps for setup or configuration. Each step has:
- What to do (one sentence)
- The code to write (code block with filename comment at top)
- What it produces or enables (one sentence after the block)

## <Step 2 heading>

...

## Complete example

A single, self-contained code block showing the full working result.
This is the most important part — readers scan to here first.

## Next steps

2–3 bullet links to related guides or API reference pages.
```

**Code block rules:**
- Always include a filename comment as the first line: `// packages/react/src/adapter.ts`
- Use realistic names (not `foo`, `bar`, `MyThing`)
- Show only what's relevant to the guide — don't paste entire files
- TypeScript for all VexCMS code

**Tone:**
- Direct and technical — this is a developer docs site, not a marketing page
- No filler ("In this guide, we will..."). Start with the first piece of information.
- Explain *why* when the reason isn't obvious. Skip *why* when it is.

### Phase 4: Report back

Output the file path and a one-line summary of what the guide covers.

## Key Principles

- **Read the code first.** Never describe how something works based on the feature name alone. The JSDoc and types are the source of truth — the guide explains those, not your assumptions.
- **Complete examples are mandatory.** Every adapter and framework guide must have a full working example. A guide that only shows fragments is useless.
- **Don't explain TypeScript basics.** Readers are developers. Explain VexCMS concepts, not language features.
- **No stubs or TODOs in guides.** If a part of the feature isn't implemented yet, note it as "coming in a future release" — don't leave placeholder sections.
