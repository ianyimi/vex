---
"@vexcms/core": patch
---

Correct `mediaApi`'s parameter documentation: the four `@param props.*` tags
referenced a binding that doesn't exist (the options object is destructured
inline) and claimed defaults (`internalQueryGeneric`/`internalMutationGeneric`)
that were never implemented — `query` and `mutation` are required. Descriptions
now live as property JSDoc on the options type, matching the real signature.
