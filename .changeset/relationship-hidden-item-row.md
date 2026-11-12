---
"@vexcms/react": patch
---

Relationship and upload item rows now render a neutral locked row (`Lock` icon, muted "Hidden {label}" text, and an `Info` tooltip button naming the denied `resource/action`) instead of the raw `VexAccessError` message in red, for a target document the viewer may not read. Non-access errors still render their raw message as before. The shared row lives in `access/AccessDeniedItemRow.tsx`, used by both `fields/relationship/FilledInput.tsx` and `fields/upload/FilledInput.tsx`.
