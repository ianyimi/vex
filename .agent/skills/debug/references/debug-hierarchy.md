# Debug Hierarchy — project fragile areas

> Ordered most-fragile-first. The debug skill checks intersecting areas before generic
> exploration. Maintained by the sync-spec skill: when a debugging session uncovers a recurring
> fragile area, append it here (keep ≤ 15 entries; prune superseded ones).

1. (populated per-project — example: "auth session refresh — races token rotation; check
   `session.ts` timestamps first")

## Global fallbacks (every project)
- Recent dependency bumps — `git log -10 -- package.json bun.lock pnpm-lock.yaml`
- Generated files edited by hand — anything `harness doctor` flags as drifted
- Environment — `harness env check` before chasing "works on my machine"
