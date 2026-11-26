# VexCMS agent skills

[Agent Skills](https://agentskills.io) for coding agents that work on VexCMS projects. Each skill
is one folder holding a `SKILL.md` that an agent loads when the task matches its description.
Install guide: https://docs.vexcms.dev/guides/agent-skills/

| #   | Skill                                                 | What it does                                                                                                                        |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 01  | [`vexcms-project-init`](vexcms-project-init/SKILL.md) | Scaffolds a new VexCMS project and runs it locally up to a signed-in admin, then offers to model the first collections and globals. |

```bash
# Install one skill for every coding agent on this machine
npx skills add ianyimi/vex --skill vexcms-project-init -g

# Or print it for the current agent without installing anything
npx skills use ianyimi/vex@vexcms-project-init
```

## Adding a skill

- Take the next number. Numbers set the order in this table and in the docs guide; they never
  appear in folder or skill names, because the name is also the slash command.
- Folder `skills/vexcms-<task>/`. The frontmatter `name` equals the folder name (lowercase letters,
  digits and single hyphens), plus a `description` that says what the skill does and when to use
  it (1024 characters at most) and `license: Apache-2.0`.
- One task per skill: a skill makes the agent do something. Background reading belongs in the
  docs, and a skill links the docs page rather than copying it.
- Keep `SKILL.md` under 500 lines. Detail that only some runs need goes in `references/*.md`, one
  level deep, linked from `SKILL.md` by relative path.
- Add the row here and in the table in `apps/docs/src/content/docs/guides/agent-skills.mdx`.
- Check that `npx skills add . --list`, run from the repo root, lists every skill in this table
  and nothing else.
- Validate it by running it: give an agent only the skill (`npx skills use ./skills/<name>`) in a
  throwaway project, note where it gets stuck, and fix the skill.
