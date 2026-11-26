# Notes platform: Automerge for offline, and backends for "billions of notes"

> Research only, 2026-11-21. Context: an Obsidian replacement built on Convex (self-hosted)
> with a web app and an Expo app over Tailscale. The reference vault is `The Lab v2`: 864 notes,
> 12,411 tasks, 2,463 wikilinks, 16.5 MB of markdown, synced today by LiveSync (CouchDB, E2E).

## Question

1. Can Automerge, wired to Convex as in
   [Going local-first with Automerge and Convex](https://stack.convex.dev/automerge-and-convex),
   give the platform offline editing? What does it change in the rest of the design?
2. Which backend could hold millions to billions of notes and links, so vexcms could add it
   later?

## Answer

### 1. Automerge: viable for note bodies; not a full offline solution

- **Web works today:**
  - `automerge-repo` 2.x with the IndexedDB storage adapter.
  - `automerge-codemirror` 0.2.0 binding a CodeMirror 6 markdown editor.
  - Convex's official `@convex-dev/automerge-sync` component (beta, Apache-2.0, 8★; its README
    still has TODO placeholders).
- **Automerge 3** (July 2025) cut memory use by more than 10x. That fixes the main reason
  earlier versions were unsuitable for a vault this size.
- **Expo/Hermes is the weak link.** Hermes has no `WebAssembly`, and wasm3-based polyfills fail
  on Automerge's reference types. The viable paths are:
  - **(a) Run Automerge inside the editor WebView.** WebViews support wasm, and a CodeMirror
    editor on mobile will be a WebView or DOM component anyway. Recommended.
  - **(b) Third-party native Rust/JSI bindings** (`react-native-automerge-generated`, from
    MindooDB). Requires a dev build and the new architecture.
  - **(c) Use Yjs instead.** It's pure JS, so it runs in Hermes.
- **Offline reads of views (dashboards, task lists, backlinks) are not covered by Automerge.**
  Those are Convex query results, and the Convex client has no persistent offline store. Offline
  dashboards need a separate local read cache or replica, whichever CRDT you pick.
- **Recommended split:**
  - Note bodies are Automerge docs (one per note), holding only `{ text }`.
  - Frontmatter stays inside the text, so offline property edits merge like any other text.
  - Everything derived (links, tasks, properties, search, embeddings) is computed on the server
    from the materialized text and stays server-authoritative.
  - Non-body state (types, views, plugin config, agent threads) stays in plain Convex mutations,
    which need a connection.
- **Main alternative:** `trestleinc/replicate` (Apache-2.0, 245★). It is Yjs on Convex with a
  client SQLite replica (OPFS on web, op-sqlite on React Native) and has an Expo example. It
  covers offline *reads* of structured rows, which Automerge doesn't. Spike both before deciding.

### 2. Backend for the original scale

- **One vault never needs billions of notes; "billions" only happens across tenants.**
  - Convex Cloud caps a deployment at 1–8 TB.
  - Its committer is single-threaded, and Funrun scaled function execution, not the database.
  - Self-hosted Convex is single-node by design.
- **Convex can still reach billions in aggregate** with one deployment per tenant: Business and
  Enterprise plans have unlimited deployments.
- **A shared multi-tenant store at billions:** the proven pattern is Postgres sharded by tenant
  (Notion: 200B+ entities on about 480 logical shards; Figma), plus:
  - a CDC-fed search tier (ParadeDB `pg_search` or OpenSearch);
  - a vector tier (Qdrant or Milvus);
  - a sync tier (Zero 1.0, which is Postgres-native and self-hostable).
  - No graph database is needed: links are an adjacency table keyed by `(vault_id, …)`.
- **Fit with vexcms:** this matches the prior recommendation in `db-adapter-feasibility.md`
  (make the second backend Supabase/Postgres). Citus is the Postgres-native way to shard it.
  Automerge helps here: its change log is append-only bytes keyed by doc ID, so it is portable
  across backends.

## What Automerge changes elsewhere in the design

| Area | Without CRDT | With Automerge |
|---|---|---|
| Write path | `notes.save(body)` mutation; derived tables updated transactionally | Client pushes change bytes; a debounced action (V8 runtime) materializes the text and rebuilds derived rows. Views trail the body by seconds |
| Server-side writers (templates, renames, agents, plugins) | Overwrite the string | Must emit Automerge splices through one `applyNoteEdit` action; overwriting would clobber concurrent offline edits |
| Link rename | Batched string rewrite | Batched splices that merge with offline edits |
| Daily notes | Unique by path | Two devices offline can each create `2026-11-21` as different docs. Needs deterministic or claimed IDs for path-keyed notes, or server-side duplicate-path merging (append and flag) |
| Agents | Write to notes and can clobber the user | Each agent is an actor: edits merge with typing, history shows who changed what, revert by inverse change |
| History | Needs a separate versions table | Heads/history included; time travel per note |
| Storage | Text only | Full op history; Automerge has no history GC. Storage is a multiple of the text size [INFERENCE: measure in the spike] |
| E2E encryption | LiveSync has it today | Lost: server-side indexing and agents need plaintext. Keyhive is alpha (`automerge-repo-keyhive` 0.8.0-alpha.1). Rely on Tailscale (WireGuard) in transit plus disk encryption |
| Server CPU | Convex V8 | Automerge in V8 costs up to ~200 ms per wasm load (base64 escape hatch). Self-hosted `"use node"` actions run on a local node executor with open bugs: a wedged executor stalls all Node actions until restart ([#565](https://github.com/convex/convex-backend/issues/565)), memory grows with each push ([#597](https://github.com/convex/convex-backend/issues/597)), env vars come back undefined under concurrency ([#492](https://github.com/get-convex/convex-backend/issues/492)). Prefer debounced V8-runtime actions for materialization, or have clients (trusted, single user) submit the materialized text with their heads |
| Mobile | Plain Convex client | Automerge lives in the editor WebView; storage via WebView IndexedDB or bridged to expo-sqlite |
| Sync scope | Query subscriptions | Sync a working set (open, pinned, recent, today's logs), not all 864+ docs. Automerge's modeling guide says "hundreds of docs fine", while thousands of fine-grained docs had high sync overhead |

## Sources

- Convex × Automerge post: https://stack.convex.dev/automerge-and-convex
- Component: https://github.com/get-convex/automerge-sync
- Automerge 3: https://automerge.org/blog/automerge-3 ; memory caveats for Text:
  https://github.com/automerge/automerge-repo/issues/425
- automerge-repo 3.0 alpha / Subduction / Keyhive: https://automerge.org/blog/2026-november/
- Modeling guidance: https://automerge.org/docs/cookbook/modeling-data/
- Storage adapters: https://automerge.org/docs/reference/repositories/storage/
- CodeMirror binding: https://github.com/automerge/automerge-codemirror
- React Native failure modes: https://dev.to/finloop/how-to-not-run-automerge-in-react-native-40gm ,
  https://github.com/automerge/automerge/discussions/893
- Native RN bindings: https://mindoodb.com/en/get-started/react-native/ ,
  https://www.npmjs.com/package/react-native-automerge-generated
- Yjs on Convex: https://github.com/trestleinc/replicate ; Yjs CodeMirror:
  https://github.com/yjs/y-codemirror.next
- ProseMirror sync (OT, rich text): https://github.com/get-convex/prosemirror-sync
- Concave (Convex reimplementation, embedded RN runtime, alpha):
  https://docs.concave.dev/deploy/react-native
- Convex limits: https://docs.convex.dev/production/state/limits
- Convex Funrun: https://stack.convex.dev/horizontally-scaling-functions
- Self-hosting: https://stack.convex.dev/self-hosted-develop-and-deploy
- Notion sharding: https://www.notion.com/blog/sharding-postgres-at-notion ,
  https://www.notion.com/blog/the-great-re-shard
- Figma: https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale
- Discord/Scylla: https://discord.com/blog/how-discord-stores-trillions-of-messages
- Zero 1.0: https://www.infoq.com/news/2026/06/zero-version-1
- ParadeDB at 1B rows: https://www.paradedb.com/blog/benchmarker-iteration
- Prior repo research: `db-adapter-feasibility.md`, `runtime-dynamic-fields-options.md`,
  `spacetimedb-vs-convex-port-feasibility.md`

## Open questions

- Does `@convex-dev/automerge-sync` sync per doc or support a vault-wide change feed?
  Read `src/component/lib.ts` before relying on it.
- Is WKWebView IndexedDB durable enough as the mobile store, or should storage bridge to
  expo-sqlite?
- Measured Automerge history overhead on real Lab v2 edit patterns.
