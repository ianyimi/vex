# Admin design — update bundle

Drop the contents of this `admin/` folder into:

    .pi/design/claude-design/admin/

Straight, structure-matched replacement (same filenames, `vexcms-design.html` entry).

## Latest revision — Create-media-document flow

The upload field is a **relationship to a media collection**. New UI covers
selecting an existing media document AND creating a new one from the same page.

**`upload.jsx`** — added:
- `MediaFieldValue` — resolved media doc shown inline on the collection edit page:
  thumbnail + name + MIME/size/dimensions + alt, expandable metadata grid
  (storageId, MIME, size, dimensions, media collection, storage adapter),
  plus alt-missing warning + Edit / open / remove. Collapsed + expanded variants.
- `MediaModalLibrary` / `MediaModalUploadEmpty` / `MediaModalCreateForm` — the
  tabbed modal opened by the field's **Edit** action:
  - **Library** tab — search + grid of the related media collection.
  - **Upload new** tab — dropzone → metadata form. Captures the create-args from
    `createMediaDocumentArgs`: required **name** (filename) + **file**, optional
    **alt** + **caption**, read-only auto-derived **mimeType / size / dimensions /
    storageId**, and **adapter-declared fields** (`adapterFields`) rendered under a
    "From the <adapter> adapter" divider (example: Credit optional, License required).
  - Uploading state with progress bar.
- `ADAPTER_FIELDS` — example adapter-field config driving the extra inputs.

**`studies.jsx`** — added `MediaModalStudy` (library / choose-file / details /
uploading) and the "Resolved value on the edit page" section in `UploadStudy`.

**`admin.css`** — new classes: `.vex-mediaval*` (inline field value + metadata grid),
`.vex-derived` (read-only detected metadata), `.vex-adapter-sep` (adapter-fields divider).

**`vexcms-design.html`** — new artboards under **Create media document**
(Library tab; Create in edit-page context) alongside the existing **Media picker**.

### Field mapping (media document)
System fields: `alt, filename, mimeType, size, storageId, deleted, convexUrl, width, height`.
Create args (`createMediaDocumentArgs`): `collectionSlug, storageId, fileName, mimeType,
size, alt?, adapterFields?`. User provides file + name; the rest is auto-derived or
adapter-driven.
