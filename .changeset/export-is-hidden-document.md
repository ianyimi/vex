---
"@vexcms/core": patch
"@vexcms/react": patch
---

`isHiddenDocument` is now exported from `@vexcms/core` — a generic `isHiddenDocument<T>(value: T | HiddenDocument): value is HiddenDocument` type predicate that narrows a populated `Doc | HiddenDocument` union both ways (to `HiddenDocument` in the `true` branch, back to `T` in the `false` branch, no cast needed on either side).

Previously this guard was declared privately five times — once in `@vexcms/core`'s own `populateDocs` (`db/populate.ts`), and once each in `@vexcms/react`'s relationship/upload `Cell.tsx`/`Display.tsx` — every copy typed `value: unknown`, so consumers outside the library (example apps rendering a populated field) couldn't reuse it and had to hand-write their own `ACCESS_DENIED` guard instead. All five private copies now import the shared `@vexcms/core` export.
