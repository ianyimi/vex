---
"@vexcms/core": minor
---

Fix `vex generate`d document interfaces losing a field's literal type under `Omit`/`Pick`.
Every generated interface (`export interface PostsDocument extends VexDocument { ... }`)
inherited `VexDocument`'s own `[key: string]: unknown` catch-all index signature — harmless
for direct property access (`doc.status` still returned the literal union), but an index
signature widens `keyof` to `string` for that interface, so `Omit<PostsDocument, "body">
["status"]` degraded a literal union like `"draft" | "published"` to `unknown`.

Generated document interfaces now extend a new, closed `VexDocumentShape` (`_id`/
`_creationTime` only, no index signature) instead. `VexDocument` itself — and every other
type built on it (`TDocument`, `VexVersionDocument`, `VexMediaDocument`) — is unchanged and
still carries the permissive index signature every generic/pre-generation consumer needs
(`<T extends VexDocument>`/`<TData extends TDocument>` across `@vexcms/react`, a document
whose field names aren't statically known).

**BREAKING (type-level only, no runtime change):** a generated document is no longer
structurally assignable to a variable or parameter typed exactly `VexDocument`/`TDocument` —
TypeScript requires an explicit index signature for that direction of assignment, which a
closed interface no longer has. This was verified to have ZERO real call sites across
`@vexcms/core`, `@vexcms/react`, `@vexcms/next`, and both `apps/test`/`apps/www` (every
`<T extends VexDocument>` site in the admin panel receives its document generically, inferred
from loosely-typed runtime data, never a directly-typed concrete document) — a full
`pnpm typecheck` across the monorepo is clean. The two real sites that DID break were app-level
boundaries assigning a concrete generated document (`UserDocument`, `OrganizationDocument`)
into `VexApiAuth.user`/`.organization` (`Record<string, unknown>`-typed by design, for
`hasPermission`'s dynamic `user[access.userRolesField]` read) — fixed with an explicit
`as Record<string, unknown>` cast at that one boundary per app (`getUserOrgForVexApi` in
`apps/test`/`apps/www`'s own `auth/server.ts`), not a core change. If your own project assigns
a `vex generate`d document directly to `VexDocument`/`TDocument` (rather than letting a
generic parameter infer it), add the same cast at that boundary.

Run `vex generate` to regenerate `vex.types.ts` with the closed interfaces.
