/* global React, Icon, FieldShell, StateLabel */
/* Upload field + media library UI — designed to match the rest of the field system.
   Stores an array of media-document IDs (per spec); single uploads are arrays of one. */

const { useState: uUS } = React;

/* ──────────────────────────────────────────────────────────────
   Sample media — two collections: images (alt, caption) + videos (alt, duration)
   Each doc mirrors the generated shape: alt, filename, mimeType, size, width, height.
   ────────────────────────────────────────────────────────────── */
const IMAGES = [
  { id: "img_01", filename: "hero-grid-dark.png",    mimeType: "image/png",  size: 248000,  width: 1920, height: 1080, alt: "Dark dashboard grid hero", caption: "Homepage hero", tone: "#1A1714" },
  { id: "img_02", filename: "ember-glyph.svg",       mimeType: "image/svg+xml", size: 4100,  width: 256,  height: 256,  alt: "Ember bolt glyph", caption: "", tone: "#2A1206" },
  { id: "img_03", filename: "team-offsite-2025.jpg", mimeType: "image/jpeg", size: 1468000, width: 2400, height: 1600, alt: "Team at the 2025 offsite", caption: "Lisbon offsite", tone: "#26201A" },
  { id: "img_04", filename: "schema-diagram.png",    mimeType: "image/png",  size: 92000,   width: 1200, height: 800,  alt: "Schema relationship diagram", caption: "", tone: "#101418" },
  { id: "img_05", filename: "founder-portrait.jpg",  mimeType: "image/jpeg", size: 612000,  width: 1600, height: 1600, alt: "Founder portrait", caption: "About page", tone: "#221A16" },
  { id: "img_06", filename: "feature-realtime.png",  mimeType: "image/png",  size: 184000,  width: 1600, height: 900,  alt: "Realtime feature illustration", caption: "", tone: "#0E1A18" },
  { id: "img_07", filename: "og-default.png",        mimeType: "image/png",  size: 142000,  width: 1200, height: 630,  alt: "Default OG card", caption: "Social share", tone: "#1C140E" },
  { id: "img_08", filename: "blog-convex-cover.jpg", mimeType: "image/jpeg", size: 820000,  width: 2000, height: 1125, alt: "Convex blog cover", caption: "", tone: "#181410" },
];

function fmtBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}
function mimeShort(m) {
  return (m.split("/")[1] || m).toUpperCase().replace("SVG+XML", "SVG").replace("JPEG", "JPG");
}
function imgById(id) { return IMAGES.find(i => i.id === id); }

/* ──────────────────────────────────────────────────────────────
   Thumbnail — colored tile w/ checkerboard + dimension chip.
   Stands in for a real <img>; uses the doc's tone for variety.
   ────────────────────────────────────────────────────────────── */
function Thumb({ doc, size = 64, radius = 3, showMeta = false }) {
  const isVector = doc && doc.mimeType.includes("svg");
  return (
    <div
      className="vex-imgph"
      style={{
        width: size, height: size, borderRadius: radius, flex: "0 0 auto",
        background: doc ? doc.tone : "var(--raised)",
        position: "relative", overflow: "hidden",
      }}
    >
      <span style={{ position: "relative", display: "grid", placeItems: "center", width: "100%", height: "100%", color: "rgba(255,255,255,.5)" }}>
        <Icon name={isVector ? "type" : "image"} size={Math.max(14, size * 0.26)} />
      </span>
      {showMeta && doc && (
        <span style={{
          position: "absolute", bottom: 3, right: 3,
          fontFamily: "var(--vex-font-mono)", fontSize: 8.5, letterSpacing: 0.2,
          color: "rgba(255,255,255,.82)", background: "rgba(0,0,0,.45)",
          padding: "1px 4px", borderRadius: 2,
        }}>{doc.width}×{doc.height}</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   UPLOAD FIELD INPUT — all states
   ══════════════════════════════════════════════════════════════ */

/* Empty — dropzone + browse link */
function UploadEmpty({ dragActive = false, label = "Browse media library" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        className="vex-dropzone"
        data-active={dragActive ? "true" : undefined}
      >
        <div className="ico"><Icon name="image" size={18} /></div>
        <div className="title">{dragActive ? "Drop to upload" : "Drag an image here"}</div>
        <div className="sub">PNG, JPG, SVG, WebP · up to 10 MB</div>
        <button className="vex-btn outline sm" type="button" style={{ marginTop: 4 }}>
          <Icon name="image" size={12} /> Choose file
        </button>
      </div>
      <button className="vex-btn ghost sm" type="button" style={{ alignSelf: "flex-start" }}>
        <Icon name="folder" size={12} /> {label}
      </button>
    </div>
  );
}

/* A single selected media row — thumbnail + meta + actions */
function UploadItemRow({ doc, onlyOne = false }) {
  return (
    <div className="vex-upload-item">
      <span className="grip"><Icon name="drag" size={13} /></span>
      <Thumb doc={doc} size={44} />
      <div className="meta">
        <div className="name">{doc.filename}</div>
        <div className="sub">{mimeShort(doc.mimeType)} · {fmtBytes(doc.size)} · {doc.width}×{doc.height}</div>
      </div>
      <div className="alt">
        <span className="alt-lbl">ALT</span>
        <span className="alt-val">{doc.alt || <em style={{ color: "var(--bad)" }}>Missing</em>}</span>
      </div>
      <div className="acts">
        <button className="vex-btn ghost icon sm" type="button" title="Replace"><Icon name="refresh" size={13} /></button>
        <button className="vex-btn ghost icon sm" type="button" title="Remove"><Icon name="x" size={13} /></button>
      </div>
    </div>
  );
}

/* Filled single */
function UploadSingle({ id = "img_03" }) {
  const doc = imgById(id);
  return (
    <div className="vex-upload-list">
      <UploadItemRow doc={doc} onlyOne />
    </div>
  );
}

/* Filled multi (array) with add tile + count */
function UploadMulti({ ids = ["img_01", "img_03", "img_06"], max }) {
  const docs = ids.map(imgById).filter(Boolean);
  const atMax = max && docs.length >= max;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="vex-upload-list">
        {docs.map(d => <UploadItemRow key={d.id} doc={d} />)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className={"vex-btn outline sm" + (atMax ? " disabled" : "")} type="button" disabled={atMax}>
          <Icon name="plus" size={12} /> Add image
        </button>
        <button className="vex-btn ghost sm" type="button" disabled={atMax}>
          <Icon name="folder" size={12} /> Browse library
        </button>
        {max && (
          <span style={{ marginLeft: "auto", fontFamily: "var(--vex-font-mono)", fontSize: 11, color: atMax ? "var(--warn)" : "var(--fg-subtle)" }}>
            {docs.length}/{max}
          </span>
        )}
      </div>
    </div>
  );
}

/* Uploading — progress tile alongside any existing */
function UploadProgress({ pct = 62, filename = "team-offsite-2025.jpg" }) {
  return (
    <div className="vex-upload-list">
      <div className="vex-upload-item uploading">
        <Thumb doc={null} size={44} />
        <div className="meta">
          <div className="name">{filename}</div>
          <div className="sub">Uploading… {pct}%</div>
          <div className="vex-progress"><span style={{ width: pct + "%" }}></span></div>
        </div>
        <div className="acts">
          <button className="vex-btn ghost icon sm" type="button" title="Cancel"><Icon name="x" size={13} /></button>
        </div>
      </div>
    </div>
  );
}

/* Error tile */
function UploadError({ filename = "raw-scan.tiff" }) {
  return (
    <div className="vex-upload-list">
      <div className="vex-upload-item error">
        <div className="vex-imgph" style={{ width: 44, height: 44, borderRadius: 3, flex: "0 0 auto", display: "grid", placeItems: "center", background: "var(--bad-bg)", border: "1px solid var(--bad)", color: "var(--bad)" }}>
          <Icon name="alertCircle" size={18} />
        </div>
        <div className="meta">
          <div className="name">{filename}</div>
          <div className="sub" style={{ color: "var(--bad)" }}>Upload failed · unsupported type</div>
        </div>
        <div className="acts">
          <button className="vex-btn ghost sm" type="button"><Icon name="refresh" size={12} /> Retry</button>
          <button className="vex-btn ghost icon sm" type="button" title="Dismiss"><Icon name="x" size={13} /></button>
        </div>
      </div>
    </div>
  );
}

/* Read-only */
function UploadReadonly({ id = "img_05" }) {
  const doc = imgById(id);
  return (
    <div className="vex-upload-list readonly">
      <div className="vex-upload-item" style={{ opacity: 0.85 }}>
        <Thumb doc={doc} size={44} />
        <div className="meta">
          <div className="name">{doc.filename}</div>
          <div className="sub">{mimeShort(doc.mimeType)} · {fmtBytes(doc.size)} · {doc.width}×{doc.height}</div>
        </div>
        <span className="vex-badge muted" style={{ marginLeft: "auto" }}>Read-only</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   UPLOAD FIELD CELL — table rendering
   ══════════════════════════════════════════════════════════════ */
function UploadCell({ ids = ["img_01"], empty = false }) {
  if (empty || !ids || ids.length === 0) return <span style={{ color: "var(--fg-subtle)" }}>—</span>;
  const docs = ids.map(imgById).filter(Boolean);
  const first = docs[0];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Thumb doc={first} size={26} radius={2} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5 }}>{first.filename}</span>
      {docs.length > 1 && <span className="vex-badge muted" style={{ fontFamily: "var(--vex-font-mono)" }}>+{docs.length - 1}</span>}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   MEDIA PICKER — modal grid (select existing or upload new)
   ══════════════════════════════════════════════════════════════ */
function MediaPicker({ collection = "images", multi = false, selected = ["img_01"], query = "" }) {
  const items = IMAGES;
  return (
    <div className="vex-modal" style={{ maxWidth: 720, width: "100%" }}>
      <div className="vex-modal-head" style={{ alignItems: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: "var(--accent-tint)", color: "var(--accent-ink)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
          <Icon name="image" size={16} />
        </div>
        <div className="text">
          <h2>Select from {collection}</h2>
          <p className="sub">{multi ? "Pick one or more — order is preserved." : "Pick an image, or upload a new one."}</p>
        </div>
        <button className="close"><Icon name="x" size={14} /></button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 20px 12px" }}>
        <div className="vex-input-wrap has-leading" style={{ flex: 1 }}>
          <span className="leading"><Icon name="search" size={13} /></span>
          <input className="vex-input sm" defaultValue={query} placeholder={`Search ${collection}…`} />
        </div>
        <button className="vex-btn outline sm"><Icon name="filter" size={12} /> Type</button>
        <button className="vex-btn primary sm"><Icon name="plus" size={12} /> Upload new</button>
      </div>

      <div style={{ padding: "0 20px", maxHeight: 360, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {/* upload-new tile first */}
          <button className="vex-media-tile add" type="button">
            <div className="thumb" style={{ display: "grid", placeItems: "center", color: "var(--fg-subtle)", border: "1px dashed var(--line-bold)", background: "transparent" }}>
              <div style={{ textAlign: "center" }}>
                <Icon name="plus" size={18} />
                <div style={{ fontSize: 10.5, marginTop: 4 }}>Upload</div>
              </div>
            </div>
          </button>
          {items.map(doc => {
            const isSel = selected.includes(doc.id);
            return (
              <button key={doc.id} className={"vex-media-tile" + (isSel ? " selected" : "")} type="button">
                <div className="thumb" style={{ background: doc.tone }}>
                  <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", color: "rgba(255,255,255,.5)" }}>
                    <Icon name={doc.mimeType.includes("svg") ? "type" : "image"} size={22} />
                  </span>
                  {isSel && (
                    <span className="check"><Icon name="check" size={12} strokeWidth={3} /></span>
                  )}
                  <span className="dim">{doc.width}×{doc.height}</span>
                </div>
                <div className="fname">{doc.filename}</div>
                <div className="fmeta">{mimeShort(doc.mimeType)} · {fmtBytes(doc.size)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="vex-modal-foot">
        <span className="left">{multi ? `${selected.length} selected` : "1 selected"}</span>
        <button className="vex-btn ghost">Cancel</button>
        <button className="vex-btn primary">{multi ? `Select ${selected.length}` : "Select"}</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MEDIA LIBRARY PAGE — grid list view for a media collection
   ══════════════════════════════════════════════════════════════ */
function MediaLibraryGrid({ withSelection = false, withInspector = false }) {
  const selected = withSelection ? new Set(["img_03"]) : new Set();
  return (
    <div style={{ display: withInspector ? "grid" : "block", gridTemplateColumns: withInspector ? "1fr 300px" : undefined, gap: 20 }}>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
          {IMAGES.map(doc => {
            const isSel = selected.has(doc.id);
            return (
              <div key={doc.id} className={"vex-media-card" + (isSel ? " selected" : "")}>
                <div className="thumb" style={{ background: doc.tone }}>
                  <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", color: "rgba(255,255,255,.5)" }}>
                    <Icon name={doc.mimeType.includes("svg") ? "type" : "image"} size={26} />
                  </span>
                  <label className="pick">
                    <input type="checkbox" defaultChecked={isSel} />
                    <span className="box">{isSel && <Icon name="check" size={10} strokeWidth={3} />}</span>
                  </label>
                  <span className="dim">{doc.width}×{doc.height}</span>
                </div>
                <div className="body">
                  <div className="fname">{doc.filename}</div>
                  <div className="fmeta">{mimeShort(doc.mimeType)} · {fmtBytes(doc.size)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {withInspector && (
        <aside className="vex-card" style={{ alignSelf: "start", position: "sticky", top: 12 }}>
          <div className="thumb" style={{ aspectRatio: "3 / 2", background: IMAGES[2].tone, display: "grid", placeItems: "center", color: "rgba(255,255,255,.5)", borderBottom: "1px solid var(--line)" }}>
            <Icon name="image" size={30} />
          </div>
          <div className="vex-card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{IMAGES[2].filename}</div>
              <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--vex-font-mono)", marginTop: 2 }}>{IMAGES[2].width}×{IMAGES[2].height} · {fmtBytes(IMAGES[2].size)} · {mimeShort(IMAGES[2].mimeType)}</div>
            </div>
            <FieldShell label="Alt text" type="text" hideTypeChip required>
              <input className="vex-input" defaultValue={IMAGES[2].alt} />
            </FieldShell>
            <FieldShell label="Caption" type="text" hideTypeChip>
              <input className="vex-input" defaultValue={IMAGES[2].caption} placeholder="Optional caption" />
            </FieldShell>
            <div className="divider"></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="vex-btn outline sm" style={{ flex: 1 }}><Icon name="refresh" size={12} /> Replace</button>
              <button className="vex-btn outline sm" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}><Icon name="trash" size={12} /></button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

Object.assign(window, {
  IMAGES, fmtBytes, mimeShort, imgById, Thumb,
  UploadEmpty, UploadSingle, UploadMulti, UploadProgress, UploadError, UploadReadonly,
  UploadCell, MediaPicker, MediaLibraryGrid, UploadItemRow,
});
