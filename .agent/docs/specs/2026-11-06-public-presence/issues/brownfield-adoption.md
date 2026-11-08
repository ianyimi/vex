title: Brownfield adoption
labels: planned, type: feature, area: core

## Context

VexCMS today assumes it owns every table it manages. A team with an existing, hand-written Convex app
has no way to bring VexCMS in without a data migration.

## Scope

Let a collection bind to a Convex table VexCMS did not create: keep the table's existing index names,
opt out of auto-generated indexes, and avoid writing any reserved `vex_`-prefixed field unless the
table is explicitly opted into versioning. Pairs with an introspection command that generates a
starting `defineCollection` from an existing `defineTable` validator.

## Acceptance criteria

- [ ] An existing Convex table with production data can be adopted as a collection with zero data
      migration
- [ ] `vex` can introspect an existing schema file and generate a starting collection definition
- [ ] Existing hand-written Convex functions against the adopted table keep working unmodified

## Out of scope

Adopting tables owned by a Convex component.
