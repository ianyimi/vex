---
name: dev-spec
description: Use BEFORE any non-trivial code change — new features, adapters, API changes,
  anything touching multiple files. Triggers on "write a spec", "spec out X", "/dev-spec",
  or when the work is clearly substantial. Skip for typos and single-line tweaks.
harness_model_role: slow
---

# Dev Spec

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.
4. Run `harness context --for "<feature being specced>"` and read every file it prints.

## Steps
1. **Interview** — load `references/interview.md`; run its question phases. Use the structured
   question tool if available (`ask_user_question` / `AskUserQuestion`); else a numbered list.
2. **Explore** — check `.agent/dependencies/registry.md`; read dep source when relevant. For
   high-care projects read `docs/standards/naming-conventions.md` FIRST — before writing any
   code in the spec — then `anti-patterns.md`, `preferences.md`, then the domain files from
   `harness context`. Note existing patterns to mirror.
3. **Edge cases** — present design questions, edge cases, scope check. Confirm in/out of scope.
   Renaming/removing anything that exists? Load `.agent/skills/shared-references/cascade-checks.md`.
4. **Build order** — load `references/build-order.md`; order task groups by its rules.
5. **spec-tasks.md** — run `harness spec new "<slug>"`; fill spec-tasks.md with ordered task
   groups, each with `Why:` and `Verify:`. Show the developer. "Just the tasks"? Stop and wait.
6. **spec.md** — load `references/spec-format.md` + `references/code-rules.md`. ≤3 task groups:
   one pass. >3: subagent loop — one subagent per group with the project description
   (manifest.json), spec-tasks.md in full, `harness context --for "<group topic>"` output,
   naming-conventions.md, and anti-patterns.md. Stitch; review consistency, cross-references.
   **Subagent models** (`manifest.json#models`): `subagent_selection: "dynamic"` → YOU stay on
   the frontier tier, but request the cheapest adequate tier per subagent from `models.tiers`
   (boilerplate/pattern sections → cheap; ordinary sections → standard; frontier only for the
   genuinely novel one); `"uniform"` → let every subagent inherit the session model.
7. **Naming pass** — scan every file/function/type/variable name in the spec against
   naming-conventions.md; fix mismatches before presenting. Silent step.
8. **Review build order** — build+test runnable after every step? Every step tagged
   `[dev]`/`[agent]`? Files in declaration-before-consumer order?
9. **Present + update tasks** — spec path, agent/dev split, build-order summary; set frontmatter
   `touches:` to the paths it will change; run `harness tasks move "<task title>" --to in-progress`
   (on task-not-found: `harness tasks add "<spec title>" --to in-progress`).
