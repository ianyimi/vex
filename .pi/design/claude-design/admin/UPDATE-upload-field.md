# Admin design — update bundle

Drop the contents of this `admin/` folder into:

    .pi/design/claude-design/admin/

It overwrites the previous export and is a straight, structure-matched replacement
(same filenames, same `vexcms-design.html` entry point).

## What changed in this revision

**New — Upload field + media subsystem** (from Spec 32):
- `upload.jsx` — **NEW FILE**. All upload-field + media UI:
  - `UploadEmpty` (dropzone: idle + drag-active), `UploadSingle`, `UploadMulti`
    (array with `max` + reorder), `UploadProgress`, `UploadError`, `UploadReadonly`
  - `UploadCell` — table thumbnail cell (single / `+N` / empty)
  - `MediaPicker` — modal grid, single + multi-select, upload-new tile
  - `MediaLibraryGrid` — media-collection grid + asset inspector rail
  - Sample media data (`IMAGES`) mirroring the generated media-doc shape
    (`alt`, `filename`, `mimeType`, `size`, `width`, `height`, `caption`)
- `studies.jsx` — added `UploadStudy` (input states + cell) and `MediaLibraryPage`
  (full in-shell media library: toolbar, grid, bulk bar, inspector).
- `shell.jsx` — sidebar gains a dedicated **Media** section (Images / Videos),
  matching the spec's separation of `mediaCollections` from `collections`.
- `admin.css` — new component classes: `.vex-dropzone`, `.vex-upload-list`,
  `.vex-upload-item`, `.vex-progress`, `.vex-media-tile`, `.vex-media-card`.
- `primitives.jsx` — removed the old single `media` collection (now its own section).
- `vexcms-design.html` — new artboard sections: **Upload field**, **Media picker**
  (single + multi), **Media library** (grid / inspector / bulk).

**Field studies reorganized** — each field type now has its own artboard
(input states + cell renderings together): `study-text`, `study-number`,
`study-check`, `study-select`, `study-date`, `study-url`, `study-rel`, `study-upload`.

**Token note:** the upload/media classes consume the same `.vex-admin` tokens as
the rest of the admin CSS — no new variables. When porting to React, map them
through the same shadcn token table in the parent `README.md`. Suggested new
shadcn-side additions if you build these as components:
- dropzone border → `--border-strong`; drag-active → `--accent` + `--accent` bg tint
- media-tile/card selected ring → `--primary`
- progress fill → `--primary`
