/* global React, Icon, FieldShell, TextInput, TextCell, NumberInput, NumberCell,
   CheckInput, CheckCell, SelectInput, SelectCell, STATUS_OPTS, DateInput, DateCell,
   UrlInput, UrlCell, RelCell, RelChip, AUTHORS, MEDIA, POSTS, PAGES, FIELD_TYPES, COLLECTIONS */

const { useState: useSState, useRef: useSRef, useEffect: useSEffect, Fragment: SFrag } = React;

/* ============================================================================
   RELATIONSHIP PICKER — POPOVER (PRIMARY PATTERN)
   ============================================================================ */
function RelPickerPopover({ kind = "author", multi = false, polymorphic = false, query = "", selected = [], width = 380 }) {
  const items = kind === "author" ? AUTHORS : kind === "media" ? MEDIA : kind === "post" ? POSTS : PAGES;
  const filtered = query
    ? items.filter(i => JSON.stringify(i).toLowerCase().includes(query.toLowerCase()))
    : items;
  return (
    <div className="vex-popover lg" style={{ width, padding: 0 }}>
      <div className="vex-popover-search">
        <div className="vex-input-wrap has-leading">
          <span className="leading"><Icon name="search" size={13} /></span>
          <input className="vex-input sm" defaultValue={query} placeholder={`Search ${kind}…`} autoFocus />
        </div>
      </div>
      {polymorphic && (
        <div className="vex-popover-section" style={{ display: "flex", gap: 4, padding: 6, borderBottom: "1px solid var(--line)" }}>
          {[
            { k: "post", lbl: "Posts" },
            { k: "page", lbl: "Pages" },
            { k: "media", lbl: "Media" },
          ].map(t => (
            <button key={t.k} className={"vex-btn sm " + (kind === t.k ? "" : "ghost")} style={kind === t.k ? { background: "var(--accent-tint)", color: "var(--accent-ink)" } : {}}>
              <Icon name={FIELD_TYPES[t.k === "post" ? "text" : t.k === "page" ? "text" : "text"]?.icon || "fileText"} size={11} />
              {t.lbl}
            </button>
          ))}
        </div>
      )}
      <div className="vex-popover-section" style={{ maxHeight: 280, overflowY: "auto", padding: 4 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: "var(--fg-muted)" }}>
            No {kind}s match "{query}"
          </div>
        ) : (
          filtered.slice(0, 6).map(item => {
            const isSel = selected.includes(item.id);
            return (
              <div key={item.id} className={"vex-menu-item" + (isSel ? " active" : "")}>
                {multi && (
                  <span className="vex-check" style={{ pointerEvents: "none" }}>
                    <span className="box" style={isSel ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : {}}>
                      {isSel && <Icon name="check" size={10} strokeWidth={3} />}
                    </span>
                  </span>
                )}
                {kind === "author" && (
                  <>
                    <span style={{ width: 22, height: 22, borderRadius: 9999, background: "var(--accent)", color: "var(--accent-on)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>{item.initials}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--vex-font-mono)" }}>@{item.handle}</div>
                    </div>
                  </>
                )}
                {kind === "media" && (
                  <>
                    <div className="vex-imgph" style={{ width: 32, height: 32, borderRadius: 2 }}>
                      <span className="lbl" style={{ fontSize: 8, padding: "1px 3px" }}>{item.w}×{item.h}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, fontFamily: "var(--vex-font-mono)" }}>{item.filename}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{item.size}</div>
                    </div>
                  </>
                )}
                {(kind === "post" || kind === "page") && (
                  <>
                    <Icon name={kind === "post" ? "newspaper" : "fileText"} size={14} style={{ color: "var(--fg-subtle)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--vex-font-mono)" }}>{item.slug}</div>
                    </div>
                    <SelectCell value={item.status} />
                  </>
                )}
                {!multi && isSel && <Icon name="check" size={13} style={{ color: "var(--accent)" }} />}
              </div>
            );
          })
        )}
      </div>
      <div className="vex-popover-foot">
        <span>{filtered.length} {kind}{filtered.length === 1 ? "" : "s"}</span>
        <span className="keys">
          <span className="kbd">↑↓</span> nav <span className="kbd">↵</span> select <span className="kbd">esc</span> close
        </span>
      </div>
    </div>
  );
}

/* The trigger that opens the picker (mimics input look) */
function RelTrigger({ value, kind = "author", multi = false, placeholder = "— Select author", state = "default" }) {
  const items = kind === "author" ? AUTHORS : kind === "media" ? MEDIA : kind === "post" ? POSTS : PAGES;
  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
  const isMulti = multi && Array.isArray(value) && !isEmpty;
  return (
    <button
      className={"vex-trigger" + (state === "invalid" ? " invalid" : "")}
      type="button"
      disabled={state === "disabled"}
      style={{
        width: "100%",
        minHeight: 32,
        height: isMulti ? "auto" : 32,
        alignItems: isMulti ? "flex-start" : "center",
        padding: isMulti ? "5px 30px 5px 8px" : undefined,
        overflow: "hidden",
        position: "relative"
      }}
    >
      {isEmpty ? (
        <>
          <Icon name="layers" size={13} style={{ color: "var(--fg-subtle)" }} />
          <span className="v placeholder">{placeholder}</span>
        </>
      ) : isMulti ? (
        <div className="v" style={{ display: "flex", gap: 4, flexWrap: "wrap", minWidth: 0, flex: 1, alignItems: "center" }}>
          {value.map(id => {
            const item = items.find(i => i.id === id);
            if (!item) return null;
            return <RelChip key={id} item={item} kind={kind} />;
          })}
        </div>
      ) : (
        <RelCell value={value} kind={kind} />
      )}
      <Icon name="chevDown" size={14} className="chev" style={isMulti ? { position: "absolute", right: 8, top: 9 } : undefined} />
    </button>
  );
}

/* ============================================================================
   ALTERNATIVE PATTERNS — SIDE PANEL + INLINE DRAWER
   ============================================================================ */
function RelSidePanel({ kind = "author", selected = [], width = 320 }) {
  const items = kind === "author" ? AUTHORS : kind === "media" ? MEDIA : POSTS;
  return (
    <div style={{ width, height: "100%", background: "var(--surface)", borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="layers" size={14} style={{ color: "var(--accent)" }} />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Pick {kind}</h3>
        <button className="vex-btn ghost icon sm" style={{ marginLeft: "auto" }}><Icon name="x" size={13} /></button>
      </div>
      <div style={{ padding: 12, borderBottom: "1px solid var(--line)" }}>
        <div className="vex-input-wrap has-leading">
          <span className="leading"><Icon name="search" size={13} /></span>
          <input className="vex-input sm" placeholder={`Search ${kind}…`} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 4 }}>
        {items.slice(0, 8).map(item => {
          const isSel = selected.includes(item.id);
          return (
            <div key={item.id} className={"vex-menu-item" + (isSel ? " active" : "")} style={{ padding: "8px 10px" }}>
              {kind === "author" ? (
                <>
                  <span style={{ width: 24, height: 24, borderRadius: 9999, background: "var(--accent)", color: "var(--accent-on)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>{item.initials}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--vex-font-mono)" }}>@{item.handle}</div>
                  </div>
                </>
              ) : (
                <>
                  <Icon name={kind === "media" ? "image" : "fileText"} size={14} style={{ color: "var(--fg-subtle)" }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{item.title || item.filename}</span>
                </>
              )}
              {isSel && <Icon name="check" size={12} style={{ color: "var(--accent)" }} />}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <button className="vex-btn outline" style={{ flex: 1 }}>Cancel</button>
        <button className="vex-btn primary" style={{ flex: 1 }}>Select 1</button>
      </div>
    </div>
  );
}

function RelInlineDrawer({ kind = "author", selected = [] }) {
  const items = kind === "author" ? AUTHORS : POSTS;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line-bold)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", background: "var(--raised)", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
        <Icon name="layers" size={13} style={{ color: "var(--accent)" }} />
        <span style={{ fontWeight: 500 }}>Inline picker</span>
        <span style={{ color: "var(--fg-subtle)", marginLeft: "auto" }}>{items.length} {kind}s</span>
      </div>
      <div style={{ padding: 8 }}>
        <div className="vex-input-wrap has-leading" style={{ marginBottom: 6 }}>
          <span className="leading"><Icon name="search" size={13} /></span>
          <input className="vex-input sm" placeholder={`Search ${kind}…`} />
        </div>
        {items.slice(0, 4).map(item => {
          const isSel = selected.includes(item.id);
          return (
            <div key={item.id} className={"vex-menu-item" + (isSel ? " active" : "")}>
              {kind === "author" ? (
                <>
                  <span style={{ width: 20, height: 20, borderRadius: 9999, background: "var(--accent)", color: "var(--accent-on)", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 600 }}>{item.initials}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{item.name}</span>
                </>
              ) : (
                <>
                  <Icon name="newspaper" size={13} style={{ color: "var(--fg-subtle)" }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{item.title}</span>
                </>
              )}
              {isSel && <Icon name="check" size={12} style={{ color: "var(--accent)" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { RelPickerPopover, RelTrigger, RelSidePanel, RelInlineDrawer });
