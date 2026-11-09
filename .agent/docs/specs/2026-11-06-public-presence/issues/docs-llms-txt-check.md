title: Add a CI check that apps/docs' llms.txt outputs stay in sync with the sidebar
labels: good first issue, type: docs, area: docs

## Context

`apps/docs` serves `llms.txt`/`llms-full.txt`/`llms-small.txt` (via `starlight-llms-txt`) as an index
of the docs for AI coding agents, generated from the Starlight sidebar config in
`apps/docs/astro.config.mjs`. There's no check today that a new sidebar entry actually shows up in the
generated output, so a page can be added to the docs and silently missing from the llms.txt index.

## Scope

A small script (mirroring `scripts/check-packed-manifests.mjs`'s style — JSDoc, `--check` exits
non-zero on drift) that builds the docs site, reads the generated `llms.txt`, and asserts every page
listed in the sidebar config has a corresponding entry.

## Acceptance criteria

- [ ] The script fails when a sidebar entry is added without a matching docs page/llms.txt entry
      (negative test)
- [ ] The script passes against the current docs site
- [ ] Wired into `pnpm --filter docs build` or documented as a separate `pnpm` script, your choice —
      note the decision in the PR description

## Out of scope

Validating the llms.txt *content*, only that every sidebar page has an entry.
