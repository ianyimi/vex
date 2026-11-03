---
"@vexcms/react": patch
---

The edit view's Publish button now shows its pending spinner while a publish is in flight —
`VersionPublishAction` passes `isPending` from its `useVexMutation` to the button, which it
previously never did.
