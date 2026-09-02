---
name: harness-config
description: View or change harness toggles from the chat input — dynamic vs uniform subagent
  model selection, the advisor on/off, model tier ids, commit mode, importance. Triggers on
  "/harness-config", "turn off the advisor", "use uniform models", "set the cheap tier to X".
harness_model_role: smol
---

# Harness Config

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness install`.

## Steps

1. **No arguments** → run `harness config` and present the table of keys, current values, and
   allowed literals.
2. **Arguments given** → translate them to the CLI verbatim:
   - `/harness-config get <key>` → `harness config get <key>`
   - `/harness-config set <key> <value>` → `harness config set <key> <value>`
   - Natural language ("turn the advisor off", "make subagents uniform") → resolve to the
     matching key/value, CONFIRM the exact command with the user, then run it.
3. Relay the command's output. When a `set` auto-ran `harness sync` (bridge-affecting keys:
   `models.advisor`, `models.tiers.*`), say what the sync changed — e.g. the advisor model in
   `.omp/config.yml`. Remind the user that OMP picks up config changes on its next session.

## Keys (from `harness config`)

`models.subagent_selection` (dynamic | uniform) · `models.advisor` (true | false) ·
`models.tiers.frontier|standard|cheap` (model ids) · `workflow.commit_mode`
(message-only | agent-commits) · `workflow.importance` (high | medium | low)
