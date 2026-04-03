# Architecture Comparison: Two Valid Approaches

## 🎯 The Question

Where should columnDef code live?

---

## Option 1: Framework-Agnostic Core (RECOMMENDED) ⭐

**See:** `.rebuild/FRAMEWORK-AGNOSTIC-CORE.md`

### Structure

```
packages/core/src/fields/
  text/
    config.ts          # Field factory + type definition
    helpers.ts         # Field-specific helpers
    schemaValueType.ts # Convex schema converter
    index.ts           # Re-exports

packages/react/src/admin/columns/
  text.tsx             # React Table columnDef (uses core helpers)

packages/svelte/src/admin/columns/
  text.ts              # Svelte Table columnDef (uses same core helpers)
```

### Pros

✅ **Truly framework-agnostic** - Core has ZERO framework code
✅ **Multi-framework support** - Easy to add Svelte, Vue, SolidJS packages
✅ **Table library flexibility** - React uses React Table, Svelte uses Svelte Table
✅ **Code reuse** - All frameworks use same helper functions
✅ **Type safety** - `defineFrameworkComponents` validates completeness
✅ **Clean dependencies** - Core has no React or Table dependencies

### Cons

⚠️ **More files** - Column logic split between core (helpers) and framework (columnDefs)
⚠️ **Slight duplication** - Each framework implements similar column patterns (but uses shared helpers)

### When to Choose

- ✅ You plan to support multiple frameworks (Svelte, Vue, etc.)
- ✅ You want core to be usable in any context (Node.js, Deno, Bun, etc.)
- ✅ You want maximum flexibility for framework-specific table libraries
- ✅ You value clean dependency boundaries

---

## Option 2: Colocated ColumnDefs with Optional Dependencies

**Note:** This approach was considered but not chosen. Documented here for reference.

### Structure

```
packages/core/
  exports:
    "." - Main export (NO React imports)
    "./columns" - Column exports (React imports)

  src/fields/
    text.ts              # Field factory
    text/columnDef.tsx   # React Table columnDef (COLOCATED)

  peerDependencies:
    react: optional
    @tanstack/react-table: optional
```

### Pros

✅ **Full colocation** - All field-related code in one folder
✅ **Less duplication** - ColumnDef code written once in core
✅ **Simpler for single-framework** - If only supporting React, fewer files

### Cons

⚠️ **React-specific** - ColumnDefs tied to React Table (hard to support Svelte)
⚠️ **Optional dependencies** - More complex package.json setup
⚠️ **Framework lock-in** - Core assumes React Table ColumnDef signature
⚠️ **Multi-entry complexity** - Need to carefully manage import paths

### When to Choose

- ✅ You only plan to support React (no Svelte, Vue plans)
- ✅ You strongly prefer complete colocation
- ✅ You're comfortable with optional peer dependencies
- ✅ You don't mind core having React Table types

---

## 📊 Side-by-Side Comparison

| Factor | Framework-Agnostic ⭐ | Colocated ColumnDefs |
|--------|----------------------|---------------------|
| **Framework support** | React, Svelte, Vue, Solid, etc. | React only |
| **Table library** | Any (React Table, Svelte Table, etc.) | React Table only |
| **Core dependencies** | None (zod, convex) | Optional (react, @tanstack/react-table) |
| **Colocation** | Helpers in core, columnDefs in framework | Full colocation in core |
| **Code reuse** | High (all frameworks use helpers) | Medium (columnDefs not reusable) |
| **Type safety** | defineFrameworkComponents validation | Optional peer dep checking |
| **Complexity** | More files, cleaner separation | Fewer files, optional deps |
| **Future-proof** | Easy to add frameworks | Hard to add non-React frameworks |

---

## 🎯 Recommendation

**For VexCMS:** Use **Framework-Agnostic Core** (Option 1)

### Reasons:

1. **Future plans matter** - Even if you only build React package now, you may want Svelte/Vue later
2. **Clean boundaries** - Core should be usable in any JavaScript runtime
3. **Community contributions** - Others can build Svelte/Vue packages without forking core
4. **Table library flexibility** - React Table might not be the best choice forever
5. **Philosophical consistency** - VexCMS is framework-agnostic at its core

### Implementation Strategy:

**Week 1-2: Core Field Types + Helpers**
```typescript
// packages/core/src/fields/text/config.ts
export interface TextFieldDef { /* ... */ }
export function text(options) { /* ... */ }

// packages/core/src/fields/text/helpers.ts
export function getTextFieldLabel(field, fieldKey) { /* ... */ }
export function formatTextCellValue(value) { /* ... */ }

// packages/core/src/fields/text/schemaValueType.ts
export function textToValueType(field) { /* ... */ }

// NO columnDef code in core
```

**Week 5-6: React Column Factories**
```typescript
// packages/react/src/admin/columns/text.tsx
import { getTextFieldLabel, formatTextCellValue } from '@vexcms/core/fields/text'

export function createTextColumn(fieldKey, field) {
  return {
    accessorKey: fieldKey,
    header: getTextFieldLabel(field, fieldKey),  // Core helper
    cell: ({ getValue }) => <span>{formatTextCellValue(getValue())}</span>
  }
}
```

**Future: Svelte Package**
```typescript
// packages/svelte/src/admin/columns/text.ts
import { getTextFieldLabel, formatTextCellValue } from '@vexcms/core/fields/text'

export function createTextColumn(fieldKey, field) {
  return {
    accessorKey: fieldKey,
    header: getTextFieldLabel(field, fieldKey),  // Same core helper!
    cell: (info) => formatTextCellValue(info.getValue())  // Svelte rendering
  }
}
```

---

## 📝 Decision Matrix

**Choose Framework-Agnostic (Option 1) if:**
- [ ] You might support Svelte/Vue/Solid in the future
- [ ] You want core to work in any JavaScript runtime
- [ ] You value clean dependency boundaries
- [ ] You want community to build framework packages easily

**Choose Colocated ColumnDefs (Option 2) if:**
- [ ] You are CERTAIN you'll only ever support React
- [ ] You strongly prefer all field code in one place
- [ ] You're comfortable with optional peer dependencies
- [ ] You don't mind core having React Table types

---

## ✅ Final Answer

For a CMS that aims to be framework-agnostic and community-friendly:

**Framework-Agnostic Core is the right choice.**

It's slightly more work upfront (writing helpers + column factories) but pays dividends in:
- Flexibility
- Clean architecture
- Future extensibility
- Community contributions

The colocation benefit of Option 2 is outweighed by the framework lock-in and dependency complexity.
