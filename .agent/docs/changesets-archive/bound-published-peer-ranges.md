---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"@vexcms/better-auth": patch
"@vexcms/cli": patch
"@vexcms/file-storage-convex": patch
"@vexcms/richtext-plate": patch
"create-vexcms": patch
---

Publish `peerDependencies` as ranges instead of exact versions.

`peerDependencies` previously inherited exact versions from the pnpm catalog, so
installing alongside a newer `convex`, `lucide-react`, or `@tanstack/react-table`
produced a peer conflict. Peers now resolve from a dedicated `peers` catalog of
deliberate ranges, and `@vexcms/core` is peered as a compatible range rather
than an exact version. `dependencies` are now published as exact versions instead of ranges
(`nanoid: 5.1.16`, not `^5.1.11`), so an install cannot silently pick up a
different transitive tree than the one tested.

`@vexcms/next` now declares `next >=15.0.0`, correcting a `>=14.0.0` claim that
never held — the admin page awaits `params`, which requires Next 15 typings.
