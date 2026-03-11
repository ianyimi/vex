# Event Build Plan — March 27 Developer Event

## Target Demo Flow

Create a post → upload a hero image → write rich text content → save as draft → see it live in the preview pane → hit publish → invite a teammate → show RBAC in action

## Build Order (Priority Sequence)

### Tier 1 — Must Ship (part-time, ~10 days)

**1. Spec 06b — Create & Delete Mutations**
- adminCreate mutation with server-side Zod validation
- adminDelete mutation with cascade options
- Bulk delete support
- Wire into admin panel (create button, delete action on list/edit views)
- Non-negotiable — a CMS that can't create documents isn't a demo

**2. Spec 15 — Media Collections**
- defineMediaCollection() with auto-injected fields (storageId, filename, mimeType, size)
- upload() field type storing references
- FileStorageAdapter interface, Convex storage default implementation
- Admin UI: media library grid, upload dropzone, media picker popover
- Per-field MIME type and size restrictions
- Visual and demo-friendly — shows Convex file storage in action

**3. Spec 07 — Versioning & Drafts** (stretch for part-time)
- _status (draft/published), _draftSnapshot, _version, _hasDraft, _publishedAt
- vex_versions table with indexes by collection/document
- adminSaveDraft, adminPublish, adminUnpublish, adminRestoreVersion mutations
- Autosave with coalesced version records
- Version history panel in admin
- Add optional environmentId parameter for future enterprise compatibility

### Tier 2 — Full-time Stretch Goals (+2 features)

**4. Spec 17 — Rich Text Field (Lexical)**
- richtext() field type
- Model after @payloadcms/richtext-lexical (Lexical 0.41.0)
- Basic formatting: bold, italic, headings, lists, links, inline images
- Serialize to JSON (stored in Convex)
- @vexcms/richtext-lexical/html + /rsc rendering utilities
- Block embed support (integrates with blocks() field)
- Biggest perception shift — turns Vex from data tool into CMS

**5. Spec 10 — Live Preview**
- livePreview config per collection (url, breakpoints, reloadOnFields)
- LivePreviewPanel component with iframe
- postMessage protocol (init, refresh, ready)
- @vexcms/live-preview-react package (useRefreshOnSave hook)
- Origin validation
- Draft content queries with _vexIncludeDraft flag
- The "wow" moment in the demo — edit rich text, see it update live

### Tier 3 — If Somehow Ahead of Schedule (+2 more)

**6. Spec 09b — Custom Component Registration**
- admin.components.Field path strings on field config
- Build-time component resolution and componentMap.ts generation
- ui() field type for non-persisted display/action fields
- Shows extensibility — proves Vex isn't a walled garden

**7. Spec 18 — Team Management UI**
- Invite users by email (email send via Convex action)
- Role assignment during invite flow
- Pending invite table with revoke support
- User management table in admin panel
- Makes it feel like a real product, not a solo dev tool

## Completion Milestones

| Tier | Features Done | What You Can Demo |
|------|--------------|-------------------|
| Tier 1 (1-3) | CRUD + Media + Drafts | Core CMS lifecycle: create, upload, draft, publish |
| Tier 2 (4-5) | + Rich Text + Live Preview | Full editing experience with real-time preview |
| Tier 3 (6-7) | + Custom Components + Teams | Extensible platform with multi-user support |

## Notes

- RBAC (Spec 16) is deferred — important but invisible in a demo. Build after the event.
- Hooks (Spec XX) are deferred — extension point, not a demo feature.
- API Keys (Spec 19) and Scheduling (Spec 20) are deferred — quality-of-life, not demo material.
