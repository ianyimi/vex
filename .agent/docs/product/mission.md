# Mission

VexCMS is a type-safe, Payload-style headless CMS built natively on Convex. Developers define
collections and fields in TypeScript; VexCMS generates the Convex schema, types,
queries/mutations, and a real-time admin panel. The immediate target for v0.1.0 is being good
enough to migrate the two maprios apps off Payload/MongoDB; after that, npm launch (M5-M8:
CLI polish, docs site, brand, release).

Work happens on the `rebuild` branch (checked out at `vex.git/dev`); it will be promoted to
master once the first real migration is ready. `master` is historical — never port from it
directly; re-implement against the rebuild architecture (HKT adapters, framework-agnostic
core, colocated types).
