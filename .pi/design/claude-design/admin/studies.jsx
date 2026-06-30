/* global React, Icon, FieldShell, TextInput, NumberInput, CheckInput, SelectInput,
   DateInput, UrlInput, RelTrigger, RelPickerPopover, RelSidePanel, RelInlineDrawer,
   TextCell, NumberCell, CheckCell, SelectCell, DateCell, UrlCell, RelCell, RelChip,
   AUTHORS, MEDIA, POSTS, STATUS_OPTS */

const SF = (props) => React.createElement("div", { style: { display: "contents" }, ...props });

/* ============================================================================
   Per-field-type studies — every field type gets its own artboard with:
     · all input states
     · all cell renderings
     · usage notes
   ============================================================================ */

function StateLabel({ children }) {
  return <div style={{ fontSize: 10, fontFamily: "var(--vex-font-mono)", color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{children}</div>;
}

function StudyHeader({ title, sub, lede }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>{title}</h2>
        {sub && <span style={{ fontSize: 12, fontFamily: "var(--vex-font-mono)", color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.6 }}>{sub}</span>}
      </div>
      {lede && <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "6px 0 0", maxWidth: 640 }}>{lede}</p>}
    </div>
  );
}

function StudyCard({ title, sub, children, padded = true }) {
  return (
    <div className="vex-card" style={{ borderRadius: 6 }}>
      <div className="vex-card-head">
        <h3>{title}</h3>
        {sub && <span className="sub" style={{ marginLeft: 8 }}>{sub}</span>}
      </div>
      <div className="vex-card-body" style={{ padding: padded ? 20 : 0 }}>
        {children}
      </div>
    </div>
  );
}

function InputGrid({ children, cols = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
      {children}
    </div>
  );
}

function CellRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderBottom: "1px solid var(--line-soft)" }}>
      <span style={{ width: 140, fontFamily: "var(--vex-font-mono)", fontSize: 11, color: "var(--fg-subtle)", flex: "0 0 auto" }}>{label}</span>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>{children}</div>
    </div>
  );
}

function ShellPage({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 28, background: "var(--page)", minHeight: "100%" }}>
      {children}
    </div>
  );
}

/* ============================================================================
   TEXT
   ============================================================================ */
function TextStudy() {
  return (
    <ShellPage>
      <StudyHeader title="Text field" sub="text" lede="Single-line and multiline strings. The most common field. States cover required/optional/error/disabled and a mono variant for slugs and identifiers." />
      <StudyCard title="Input" sub="All states the editor can render.">
        <InputGrid>
          <div>
            <StateLabel>Default</StateLabel>
            <FieldShell label="Title" type="text"><TextInput value="Reactive content, no rebuild step" /></FieldShell>
          </div>
          <div>
            <StateLabel>Empty + placeholder</StateLabel>
            <FieldShell label="Subtitle" type="text" optional><TextInput value="" placeholder="Optional one-liner" /></FieldShell>
          </div>
          <div>
            <StateLabel>Focused</StateLabel>
            <FieldShell label="Slug" type="text"><TextInput value="reactive-content" mono focused /></FieldShell>
          </div>
          <div>
            <StateLabel>Error</StateLabel>
            <FieldShell label="Slug" type="text" error="Slug already exists in this collection."><TextInput value="reactive-content" mono error /></FieldShell>
          </div>
          <div>
            <StateLabel>Multiline + char count</StateLabel>
            <FieldShell label="Excerpt" type="text" help="Shown in list previews and OG cards.">
              <TextInput value="A reactive CMS that ships in minutes — not afternoons." multiline charLimit={160} />
            </FieldShell>
          </div>
          <div>
            <StateLabel>Disabled</StateLabel>
            <FieldShell label="Document ID" type="text" help="Auto-generated. Cannot be changed.">
              <TextInput value="p_01" mono disabled />
            </FieldShell>
          </div>
        </InputGrid>
      </StudyCard>
      <StudyCard title="Cell" sub="How text values render inside the table." padded={false}>
        <CellRow label="default"><TextCell value="Reactive content, no rebuild step" /></CellRow>
        <CellRow label="empty"><TextCell value="" /></CellRow>
        <CellRow label="mono / slug">
          <span style={{ fontFamily: "var(--vex-font-mono)", fontSize: 12.5, color: "var(--fg-muted)" }}>vexcms-launch-2025</span>
        </CellRow>
        <CellRow label="truncated">
          <span style={{ display: "inline-block", maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--fg)" }}>
            How VexCMS ships reactive admin in minutes — and why every CMS should be built on a reactive backend
          </span>
        </CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* ============================================================================
   NUMBER
   ============================================================================ */
function NumberStudy() {
  return (
    <ShellPage>
      <StudyHeader title="Number field" sub="number" lede="Tabular numerals; stepper; optional prefix/suffix for currency and units. Cells right-align in tables." />
      <StudyCard title="Input">
        <InputGrid>
          <div>
            <StateLabel>Default + suffix</StateLabel>
            <FieldShell label="Read time" type="number"><NumberInput value={6} suffix="min" /></FieldShell>
          </div>
          <div>
            <StateLabel>Stepper-only</StateLabel>
            <FieldShell label="Display order" type="number"><NumberInput value={3} /></FieldShell>
          </div>
          <div>
            <StateLabel>Decimal + currency</StateLabel>
            <FieldShell label="Price" type="number"><NumberInput value={29.00} prefix="$" decimals={2} /></FieldShell>
          </div>
          <div>
            <StateLabel>Error · out of range</StateLabel>
            <FieldShell label="Read time" type="number" error="Must be between 1 and 60 minutes."><NumberInput value={120} suffix="min" error /></FieldShell>
          </div>
        </InputGrid>
      </StudyCard>
      <StudyCard title="Cell" padded={false}>
        <CellRow label="integer"><NumberCell value={4820} /></CellRow>
        <CellRow label="currency"><NumberCell value={29} prefix="$" decimals={2} /></CellRow>
        <CellRow label="empty"><NumberCell value={null} /></CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* ============================================================================
   CHECKBOX
   ============================================================================ */
function CheckStudy() {
  return (
    <ShellPage>
      <StudyHeader title="Checkbox field" sub="checkbox" lede="Single boolean, checkbox group, indeterminate state for bulk-select. Cells render as compact dot+label." />
      <StudyCard title="Input">
        <InputGrid>
          <div>
            <StateLabel>Single · on</StateLabel>
            <FieldShell label="Featured" type="checkbox"><CheckInput checked={true} label="Pin to homepage carousel" /></FieldShell>
          </div>
          <div>
            <StateLabel>Single · off</StateLabel>
            <FieldShell label="Comments" type="checkbox"><CheckInput checked={false} label="Allow comments on this post" /></FieldShell>
          </div>
          <div>
            <StateLabel>Group</StateLabel>
            <FieldShell label="Visibility" type="checkbox" help="Where this post can be discovered.">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <CheckInput checked={true} label="Public web" />
                <CheckInput checked={true} label="RSS feed" />
                <CheckInput checked={false} label="Newsletter digest" />
                <CheckInput checked={false} label="Internal only" />
              </div>
            </FieldShell>
          </div>
          <div>
            <StateLabel>Indeterminate (bulk select)</StateLabel>
            <FieldShell label="Tags" type="checkbox">
              <CheckInput indeterminate label="3 of 8 selected" />
            </FieldShell>
          </div>
        </InputGrid>
      </StudyCard>
      <StudyCard title="Cell" padded={false}>
        <CellRow label="true"><CheckCell value={true} label="Yes" /></CellRow>
        <CellRow label="false"><CheckCell value={false} label="No" /></CellRow>
        <CellRow label="custom labels">
          <CheckCell value={true} label="Featured" />
          <CheckCell value={false} label="Draft" />
        </CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* ============================================================================
   SELECT
   ============================================================================ */
function SelectStudy() {
  return (
    <ShellPage>
      <StudyHeader title="Select field" sub="select" lede="Single-choice from a fixed list. Status is the canonical example. Cells render as colored badges." />
      <StudyCard title="Input">
        <InputGrid>
          <div>
            <StateLabel>Default · status</StateLabel>
            <FieldShell label="Status" type="select"><SelectInput value="published" options={STATUS_OPTS} /></FieldShell>
          </div>
          <div>
            <StateLabel>Empty</StateLabel>
            <FieldShell label="Category" type="select" optional><SelectInput value="" placeholder="— Choose category" options={[{ value: "eng", label: "Engineering" }, { value: "prod", label: "Product" }]} /></FieldShell>
          </div>
          <div>
            <StateLabel>Open · with active</StateLabel>
            <FieldShell label="Status" type="select"><SelectInput value="scheduled" options={STATUS_OPTS} open /></FieldShell>
          </div>
          <div>
            <StateLabel>Disabled</StateLabel>
            <FieldShell label="Locale" type="select" help="Workspace locale is fixed.">
              <SelectInput value="en-US" disabled options={[{ value: "en-US", label: "English (US)" }]} />
            </FieldShell>
          </div>
        </InputGrid>
      </StudyCard>
      <StudyCard title="Cell" padded={false}>
        <CellRow label="status · all">
          <SelectCell value="draft" />
          <SelectCell value="published" />
          <SelectCell value="scheduled" />
          <SelectCell value="archived" />
        </CellRow>
        <CellRow label="empty"><SelectCell value="" /></CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* ============================================================================
   DATE
   ============================================================================ */
function DateStudy() {
  return (
    <ShellPage>
      <StudyHeader title="Date field" sub="date" lede="Date and date+time. Cells use absolute format with optional relative tag for recent values." />
      <StudyCard title="Input">
        <InputGrid>
          <div>
            <StateLabel>Default · date + time</StateLabel>
            <FieldShell label="Published at" type="date"><DateInput value="2025-04-08T09:14:00Z" showTime /></FieldShell>
          </div>
          <div>
            <StateLabel>Date only</StateLabel>
            <FieldShell label="Due date" type="date"><DateInput value="2025-05-01" /></FieldShell>
          </div>
          <div>
            <StateLabel>Empty</StateLabel>
            <FieldShell label="Archived at" type="date" optional><DateInput value="" placeholder="— Pick date" /></FieldShell>
          </div>
          <div>
            <StateLabel>Past · scheduled warning</StateLabel>
            <FieldShell label="Publish at" type="date" error="Scheduled time is in the past."><DateInput value="2024-12-30T08:00:00Z" showTime error /></FieldShell>
          </div>
        </InputGrid>
      </StudyCard>
      <StudyCard title="Cell" padded={false}>
        <CellRow label="absolute"><DateCell value="2025-04-08T09:14:00Z" /></CellRow>
        <CellRow label="with relative"><DateCell value="2025-04-08T09:14:00Z" withRelative /></CellRow>
        <CellRow label="empty"><DateCell value="" /></CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* ============================================================================
   URL
   ============================================================================ */
function UrlStudy() {
  return (
    <ShellPage>
      <StudyHeader title="URL field" sub="url" lede="External and internal links. Inputs show verification status; cells split host and path." />
      <StudyCard title="Input">
        <InputGrid>
          <div>
            <StateLabel>Verified (200)</StateLabel>
            <FieldShell label="Canonical URL" type="url"><UrlInput value="https://vexcms.dev/blog/why-vexcms-convex" verified /></FieldShell>
          </div>
          <div>
            <StateLabel>Empty</StateLabel>
            <FieldShell label="External link" type="url" optional><UrlInput value="" placeholder="https://example.com" /></FieldShell>
          </div>
          <div>
            <StateLabel>Broken (404 last check)</StateLabel>
            <FieldShell label="Source" type="url" error="404 — last checked 2 hours ago."><UrlInput value="https://example.com/old-link" verified={false} error /></FieldShell>
          </div>
          <div>
            <StateLabel>Internal · relative</StateLabel>
            <FieldShell label="Redirect to" type="url" help="Relative paths are kept site-relative."><UrlInput value="/changelog" internal /></FieldShell>
          </div>
        </InputGrid>
      </StudyCard>
      <StudyCard title="Cell" padded={false}>
        <CellRow label="external"><UrlCell value="https://vexcms.dev/blog/why-vexcms-convex" /></CellRow>
        <CellRow label="internal"><UrlCell value="/changelog" /></CellRow>
        <CellRow label="empty"><UrlCell value="" /></CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* ============================================================================
   RELATIONSHIP
   ============================================================================ */
function RelationshipStudy() {
  return (
    <ShellPage>
      <StudyHeader
        title="Relationship field"
        sub="relationship"
        lede="Convex schemas have first-class refs; the picker is the most-used surface in any CMS. Single, hasMany, and polymorphic — three pickers by context."
      />
      <StudyCard title="Input · trigger states">
        <InputGrid>
          <div>
            <StateLabel>Single · empty</StateLabel>
            <FieldShell label="Author" type="relationship" hideTypeChip>
              <RelTrigger value={null} kind="author" placeholder="— Pick author" />
            </FieldShell>
          </div>
          <div>
            <StateLabel>Single · selected</StateLabel>
            <FieldShell label="Author" type="relationship" hideTypeChip>
              <RelTrigger value="a_01" kind="author" />
            </FieldShell>
          </div>
          <div>
            <StateLabel>hasMany · 3 selected</StateLabel>
            <FieldShell label="Related posts" type="relationship" hideTypeChip>
              <RelTrigger value={["p_03", "p_05", "p_07"]} kind="post" multi />
            </FieldShell>
          </div>
          <div>
            <StateLabel>Cover image · selected</StateLabel>
            <FieldShell label="Cover image" type="relationship" hideTypeChip>
              <RelTrigger value="m_01" kind="media" />
            </FieldShell>
          </div>
        </InputGrid>
      </StudyCard>

      <StudyCard title="Pattern A · Inline popover" sub="Default. Best for single-ref or short hasMany.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <StateLabel>Trigger (closed)</StateLabel>
            <FieldShell label="Author" type="relationship" hideTypeChip>
              <RelTrigger value={null} kind="author" placeholder="— Pick author" />
            </FieldShell>
          </div>
          <div>
            <StateLabel>Picker · open · author</StateLabel>
            <RelPickerPopover kind="author" selected={["a_01"]} query="" />
          </div>
        </div>
      </StudyCard>

      <StudyCard title="Pattern B · Side panel" sub="For long hasMany. Slides from the right; persistent until dismissed." padded={false}>
        <div style={{ position: "relative", height: 460, overflow: "hidden" }}>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
            <FieldShell label="Author" type="relationship" hideTypeChip>
              <RelTrigger value="a_01" kind="author" />
            </FieldShell>
            <FieldShell label="Related posts" type="relationship" hideTypeChip help="hasMany — drag to reorder.">
              <RelTrigger value={["p_03", "p_05", "p_07"]} kind="post" multi />
            </FieldShell>
            <FieldShell label="Cover image" type="relationship" hideTypeChip>
              <RelTrigger value="m_01" kind="media" />
            </FieldShell>
          </div>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 360, background: "var(--surface)", borderLeft: "1px solid var(--line)", boxShadow: "var(--shadow-pop)" }}>
            <RelSidePanel kind="post" selected={["p_03", "p_05", "p_07"]} />
          </div>
        </div>
      </StudyCard>

      <StudyCard title="Pattern C · Inline drawer" sub="Polymorphic refs — pick a kind, then a doc. Keeps form context visible.">
        <FieldShell label="Featured target" type="relationship" hideTypeChip help="Polymorphic — can reference a post, a page, or a media item.">
          <RelInlineDrawer />
        </FieldShell>
      </StudyCard>

      <StudyCard title="Cell" padded={false}>
        <CellRow label="single · author"><RelCell value="a_01" kind="author" /></CellRow>
        <CellRow label="single · media"><RelCell value="m_01" kind="media" /></CellRow>
        <CellRow label="hasMany"><RelCell value={["p_03", "p_05", "p_07"]} kind="post" multi /></CellRow>
        <CellRow label="empty"><RelCell value={null} kind="author" /></CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* ============================================================================
   EMPTY STATES (unchanged set)
   ============================================================================ */
function EmptyStudies() {
  return (
    <ShellPage>
      <StudyHeader title="Empty states" lede="Each is a moment to point somewhere useful." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="vex-card" style={{ padding: 0 }}>
          <div className="vex-card-head"><h3>Empty collection</h3></div>
          <div className="vex-empty">
            <div className="ico"><Icon name="newspaper" size={18} /></div>
            <h3>No posts yet</h3>
            <p>This collection is empty. Create your first post — schema is already wired up.</p>
            <div className="actions">
              <button className="vex-btn outline"><Icon name="fileText" size={13} />View schema</button>
              <button className="vex-btn primary"><Icon name="plus" size={13} />New post</button>
            </div>
          </div>
        </div>

        <div className="vex-card" style={{ padding: 0 }}>
          <div className="vex-card-head"><h3>No search results</h3></div>
          <div className="vex-empty">
            <div className="ico"><Icon name="search" size={18} /></div>
            <h3>Nothing matches “onboarding”</h3>
            <p>Try a different term, clear active filters, or search across all collections.</p>
            <div className="actions">
              <button className="vex-btn outline">Clear filters</button>
              <button className="vex-btn primary"><Icon name="search" size={13} />Search everywhere</button>
            </div>
          </div>
        </div>

        <div className="vex-card" style={{ padding: 0 }}>
          <div className="vex-card-head"><h3>Picker — no relations</h3></div>
          <div style={{ padding: 28 }}>
            <div className="vex-popover lg" style={{ position: "static", boxShadow: "none", margin: "0 auto", width: 280 }}>
              <div className="vex-popover-search">
                <div className="vex-input-wrap has-leading">
                  <span className="leading"><Icon name="search" size={13} /></span>
                  <input className="vex-input sm" defaultValue="zzz" />
                </div>
              </div>
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-muted)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 4, background: "var(--page)", display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
                  <Icon name="search" size={14} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>No authors match “zzz”</div>
                <div style={{ fontSize: 11.5, marginTop: 2 }}>Or create a new one inline.</div>
                <button className="vex-btn primary sm" style={{ marginTop: 14 }}><Icon name="plus" size={11} />Create author</button>
              </div>
            </div>
          </div>
        </div>

        <div className="vex-card" style={{ padding: 0 }}>
          <div className="vex-card-head"><h3>First-run workspace</h3></div>
          <div className="vex-empty">
            <div className="ico"><Icon name="zap" size={18} /></div>
            <h3>Your workspace is ready</h3>
            <p>Start by defining a collection, or pick a template (blog, docs, marketing site) to scaffold one in one click.</p>
            <div className="actions">
              <button className="vex-btn outline">Browse templates</button>
              <button className="vex-btn primary"><Icon name="plus" size={13} />New collection</button>
            </div>
          </div>
        </div>
      </div>
    </ShellPage>
  );
}

/* ============================================================================
   UPLOAD — input states + cell, with media collection notes
   ============================================================================ */
function UploadStudy() {
  return (
    <ShellPage>
      <StudyHeader
        title="Upload field"
        sub="upload"
        lede="References a media collection by slug. Stores an array of media-document IDs (single uploads are arrays of one). Files arrive by drag-drop, file picker, or the media library."
      />
      <StudyCard title="Input · empty">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <StateLabel>Idle dropzone</StateLabel>
            <FieldShell label="Featured image" type="upload" hideTypeChip help="upload({ to: &quot;images&quot; })">
              <UploadEmpty />
            </FieldShell>
          </div>
          <div>
            <StateLabel>Drag active</StateLabel>
            <FieldShell label="Featured image" type="upload" hideTypeChip>
              <UploadEmpty dragActive />
            </FieldShell>
          </div>
        </div>
      </StudyCard>

      <StudyCard title="Input · filled">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <StateLabel>Single file</StateLabel>
            <FieldShell label="Featured image" type="upload" hideTypeChip>
              <UploadSingle id="img_03" />
            </FieldShell>
          </div>
          <div>
            <StateLabel>Multiple (array) · with max</StateLabel>
            <FieldShell label="Gallery" type="upload" hideTypeChip help="upload({ to: &quot;images&quot;, max: 5 }) — drag to reorder.">
              <UploadMulti ids={["img_01", "img_03", "img_06"]} max={5} />
            </FieldShell>
          </div>
        </div>
      </StudyCard>

      <StudyCard title="Input · transient & locked">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <StateLabel>Uploading</StateLabel>
            <FieldShell label="Cover" type="upload" hideTypeChip><UploadProgress pct={62} /></FieldShell>
          </div>
          <div>
            <StateLabel>Error · unsupported type</StateLabel>
            <FieldShell label="Cover" type="upload" hideTypeChip><UploadError /></FieldShell>
          </div>
          <div>
            <StateLabel>Missing alt warning</StateLabel>
            <FieldShell label="Logo" type="upload" hideTypeChip><UploadSingle id="img_02" /></FieldShell>
          </div>
          <div>
            <StateLabel>Read-only</StateLabel>
            <FieldShell label="Imported asset" type="upload" hideTypeChip><UploadReadonly /></FieldShell>
          </div>
        </div>
      </StudyCard>

      <StudyCard title="Cell" sub="How upload values render in the table." padded={false}>
        <CellRow label="single"><UploadCell ids={["img_01"]} /></CellRow>
        <CellRow label="multiple"><UploadCell ids={["img_01", "img_03", "img_06"]} /></CellRow>
        <CellRow label="empty"><UploadCell empty /></CellRow>
      </StudyCard>
    </ShellPage>
  );
}

/* Full media-library admin page (grid list view for a media collection) */
function MediaLibraryPage({ withSelection = false, withInspector = false, bulk = false }) {
  return (
    <SF>
      <Topbar
        crumbs={[
          { label: "Media" },
          { label: "Images", here: true, meta: String(IMAGES.length) },
        ]}
        actions={
          <>
            <button className="vex-btn outline sm"><Icon name="folder" size={12} />New folder</button>
            <button className="vex-btn primary sm"><Icon name="plus" size={12} />Upload</button>
          </>
        }
      />
      <div className="vex-page">
        <div className="vex-page-head">
          <div>
            <h1>Images</h1>
            <p className="sub">Media collection · <span className="mono">upload({ "{ to: \"images\" }" })</span> targets this. 218 MB used.</p>
          </div>
        </div>

        {bulk && (
          <div className="vex-bulkbar">
            <Icon name="check" size={13} strokeWidth={3} />
            <span><span className="count">1</span> selected</span>
            <div className="actions">
              <button className="vex-btn outline sm"><Icon name="folder" size={12} />Move</button>
              <button className="vex-btn outline sm" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}><Icon name="trash" size={12} />Delete</button>
              <button className="vex-btn ghost icon sm"><Icon name="x" size={13} /></button>
            </div>
          </div>
        )}

        <div className="vex-tablebar">
          <div className="vex-input-wrap has-leading" style={{ width: 280 }}>
            <span className="leading"><Icon name="search" size={13} /></span>
            <input className="vex-input sm" placeholder="Search images by filename or alt…" />
          </div>
          <button className="vex-btn outline sm"><Icon name="filter" size={12} />Type</button>
          <div className="grow"></div>
          <button className="vex-btn ghost sm"><Icon name="arrowUpDown" size={12} />Newest <Icon name="chevDown" size={11} /></button>
        </div>

        <MediaLibraryGrid withSelection={withSelection || bulk} withInspector={withInspector} />
      </div>
    </SF>
  );
}

Object.assign(window, {
  TextStudy, NumberStudy, CheckStudy, SelectStudy, DateStudy, UrlStudy, RelationshipStudy,
  UploadStudy, MediaLibraryPage,
  EmptyStudies,
  /* legacy aliases used by older index.html */
  FieldInputStudies: TextStudy, FieldCellStudies: TextStudy, RelationshipStudies: RelationshipStudy,
});
