/* global React, Icon, FIELD_TYPES, AUTHORS, MEDIA, POSTS, PAGES */
/* Field components — Input + Cell renderers for each of 7 field types */

const { useState: useFState, useRef: useFRef, useEffect: useFEffect } = React;

/* ──────────────────────────────────────────────────────────────
   FieldShell — wraps any input with label/help/error
   ────────────────────────────────────────────────────────────── */
function FieldShell({ label, type, required, optional, help, error, children, hideTypeChip }) {
  return (
    <div className="vex-field">
      {(label || type) && (
        <div className="vex-field-label">
          {label && <span>{label}</span>}
          {required && <span className="req">*</span>}
          {optional && <span className="opt">Optional</span>}
          {!hideTypeChip && type && (
            <span className="type">{FIELD_TYPES[type]?.label || type}</span>
          )}
        </div>
      )}
      {children}
      {help && !error && <div className="vex-field-help">{help}</div>}
      {error && <div className="vex-field-error"><Icon name="alertCircle" size={11} /> {error}</div>}
    </div>
  );
}

/* ── TEXT ─────────────────────────────────────────────────────── */
function TextInput({ value = "", placeholder = "Untitled", state = "default", multiline = false, mono = false, charLimit, error, focused, disabled }) {
  const isInvalid = state === "invalid" || error;
  const isDisabled = state === "disabled" || disabled;
  const isFocused = focused;
  const cls = "vex-input " + (isInvalid ? "invalid " : "") + (mono ? "mono " : "") + (isFocused ? "is-focused " : "");
  if (multiline) {
    return (
      <textarea
        className={"vex-textarea " + (isInvalid ? "invalid" : "") + (isFocused ? " is-focused" : "")}
        defaultValue={value}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={3}
      />
    );
  }
  return (
    <div style={{ position: "relative" }}>
      <input
        className={cls}
        defaultValue={value}
        placeholder={placeholder}
        disabled={isDisabled}
      />
      {charLimit && (
        <span
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontFamily: "var(--vex-font-mono)", fontSize: 10.5, color: "var(--fg-subtle)",
            pointerEvents: "none",
          }}
        >
          {String(value).length}/{charLimit}
        </span>
      )}
    </div>
  );
}
function TextCell({ value }) {
  return <span style={{ color: "var(--fg)" }}>{value}</span>;
}

/* ── NUMBER ───────────────────────────────────────────────────── */
function NumberInput({ value = 0, placeholder = "0", state = "default", suffix, prefix, decimals, error, focused, disabled }) {
  const isInvalid = state === "invalid" || error;
  const isDisabled = state === "disabled" || disabled;
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && (
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--vex-font-mono)", fontSize: 11, color: "var(--fg-subtle)", pointerEvents: "none" }}>{prefix}</span>
      )}
      <input
        type="number"
        className={"vex-input mono " + (isInvalid ? "invalid" : "") + (focused ? " is-focused" : "")}
        defaultValue={decimals != null ? Number(value).toFixed(decimals) : value}
        placeholder={placeholder}
        disabled={isDisabled}
        style={{ paddingRight: suffix ? 44 : undefined, paddingLeft: prefix ? 22 : undefined }}
      />
      {suffix && (
        <span
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontFamily: "var(--vex-font-mono)", fontSize: 11, color: "var(--fg-subtle)",
            pointerEvents: "none", letterSpacing: "0.04em",
          }}
        >
          {suffix}
        </span>
      )}
      <div style={{
        position: "absolute", right: suffix ? 38 : 6, top: 4, bottom: 4,
        display: "flex", flexDirection: "column", gap: 0,
      }}>
        <button className="vex-btn ghost" style={{ height: 11, width: 18, padding: 0, minWidth: 0 }}>
          <Icon name="chevUp" size={10} />
        </button>
        <button className="vex-btn ghost" style={{ height: 11, width: 18, padding: 0, minWidth: 0 }}>
          <Icon name="chevDown" size={10} />
        </button>
      </div>
    </div>
  );
}
function NumberCell({ value, prefix = "", suffix = "", decimals }) {
  if (value === null || value === undefined || value === "") return <span style={{ color: "var(--fg-subtle)", fontFamily: "var(--vex-font-mono)", fontSize: 12.5 }}>—</span>;
  const n = Number(value);
  const formatted = decimals !== undefined
    ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toLocaleString();
  return <span className="cell-num" style={{ fontFamily: "var(--vex-font-mono)", fontSize: 12.5, fontFeatureSettings: '"tnum" 1' }}>{prefix}{formatted}{suffix && " " + suffix}</span>;
}

/* ── CHECKBOX ─────────────────────────────────────────────────── */
function CheckInput({ checked = false, label = "Featured post", help, state = "default", indeterminate, disabled }) {
  const isIndet = state === "indeterminate" || indeterminate;
  const isDisabled = state === "disabled" || disabled;
  return (
    <label className={"vex-check" + (isIndet ? " indeterminate" : "")}>
      <input type="checkbox" defaultChecked={checked} disabled={isDisabled} />
      <span className="box"><Icon name="check" size={11} strokeWidth={3} /></span>
      <span>{label}</span>
    </label>
  );
}
function CheckCell({ value, label }) {
  if (value) {
    return <span className="vex-cell-bool t"><span className="dot"></span>{label || "Yes"}</span>;
  }
  return <span className="vex-cell-bool f"><span className="dot"></span>{label || "—"}</span>;
}

/* ── SELECT ───────────────────────────────────────────────────── */
function SelectInput({ value, placeholder = "Select…", options = [], open = false, state = "default", error, disabled, focused }) {
  const isInvalid = state === "invalid" || error;
  const isDisabled = state === "disabled" || disabled;
  return (
    <div style={{ position: "relative" }}>
      <button className={"vex-trigger" + (isInvalid ? " invalid" : "") + (focused ? " is-focused" : "")} type="button" disabled={isDisabled}>
        {value ? (
          <span className="v">{options.find(o => o.value === value)?.label || value}</span>
        ) : (
          <span className="v placeholder">{placeholder}</span>
        )}
        <Icon name="chevDown" size={14} className="chev" />
      </button>
      {open && (
        <div
          className="vex-popover"
          style={{ position: "absolute", top: 36, left: 0, right: 0, zIndex: 5 }}
        >
          {options.map(o => (
            <div key={o.value} className={"vex-menu-item" + (o.value === value ? " active" : "")}>
              {o.dot && <span style={{ width: 6, height: 6, borderRadius: 9999, background: o.dot }}></span>}
              <span className="lbl">{o.label}</span>
              {o.value === value && <span className="check"><Icon name="check" size={12} /></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const STATUS_OPTS = [
  { value: "draft",     label: "Draft",     dot: "var(--fg-subtle)" },
  { value: "published", label: "Published", dot: "var(--ok)" },
  { value: "scheduled", label: "Scheduled", dot: "var(--warn)" },
  { value: "archived",  label: "Archived",  dot: "var(--bad)" },
];
function SelectCell({ value, options = STATUS_OPTS }) {
  const opt = options.find(o => o.value === value);
  if (!opt) return <span className="vex-badge muted">—</span>;
  const variant = ({
    draft: "draft",
    published: "success",
    scheduled: "warn",
    archived: "muted",
  })[value] || "muted";
  return <span className={"vex-badge " + variant}><span className="dot"></span>{opt.label}</span>;
}

/* ── DATE ─────────────────────────────────────────────────────── */
function DateInput({ value = "", placeholder = "Pick a date", showTime = false, state = "default", error, disabled, focused }) {
  const isInvalid = state === "invalid" || error;
  const isDisabled = state === "disabled" || disabled;
  return (
    <button className={"vex-trigger" + (isInvalid ? " invalid" : "") + (focused ? " is-focused" : "")} type="button" disabled={isDisabled} style={{ width: "100%" }}>
      <Icon name="calendar" size={14} style={{ color: "var(--fg-subtle)" }} />
      {value ? (
        <span className="v" style={{ fontFamily: "var(--vex-font-mono)", fontSize: 12.5 }}>
          {value}{showTime && " · 14:30"}
        </span>
      ) : (
        <span className="v placeholder">{placeholder}</span>
      )}
      <Icon name="chevDown" size={14} className="chev" />
    </button>
  );
}
function relTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const ms = Date.now() - d.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days/7)}w ago`;
  if (days < 365) return `${Math.round(days/30)}mo ago`;
  return `${Math.round(days/365)}y ago`;
}
function DateCell({ value, withRelative = true }) {
  if (!value) return <span style={{ color: "var(--fg-subtle)" }}>—</span>;
  const d = new Date(value);
  const fmt = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <span className="vex-cell-date">
      <span>{fmt}</span>
      {withRelative && <span className="rel">{relTime(value)}</span>}
    </span>
  );
}

/* ── URL ──────────────────────────────────────────────────────── */
function UrlInput({ value = "", placeholder = "https://", state = "default", verified = null, error, disabled, focused, internal }) {
  const isInvalid = state === "invalid" || error;
  const isDisabled = state === "disabled" || disabled;
  return (
    <div className="vex-input-wrap has-leading has-trailing">
      <span className="leading"><Icon name={internal ? "fileText" : "link"} size={14} /></span>
      <input
        type="url"
        className={"vex-input mono " + (isInvalid ? "invalid" : "") + (focused ? " is-focused" : "")}
        defaultValue={value}
        placeholder={placeholder}
        disabled={isDisabled}
      />
      <span className="trailing">
        {verified === true && <span style={{ color: "var(--ok)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}><Icon name="check" size={11} strokeWidth={3} /> 200</span>}
        {verified === false && <span style={{ color: "var(--bad)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}><Icon name="alertCircle" size={11} /> 404</span>}
        {verified === "loading" && <span style={{ color: "var(--fg-subtle)", fontSize: 11 }}>checking…</span>}
        {verified === null && value && (
          <button className="vex-btn ghost icon sm" style={{ pointerEvents: "auto" }} title="Open">
            <Icon name="externalLink" size={12} />
          </button>
        )}
      </span>
    </div>
  );
}
function UrlCell({ value }) {
  if (!value) return <span style={{ color: "var(--fg-subtle)" }}>—</span>;
  let host = value, path = "";
  try {
    const u = new URL(value.startsWith("http") ? value : "https://" + value);
    host = u.host;
    path = u.pathname === "/" ? "" : u.pathname;
  } catch (e) {}
  return (
    <span className="vex-cell-url">
      <Icon name="link" size={11} />
      <span className="host">{host}</span>
      {path && <span className="path">{path}</span>}
    </span>
  );
}

/* ── RELATIONSHIP ─────────────────────────────────────────────── */
/* Cell — single value (chip) or hasMany (chip stack) */
function RelCell({ value, kind = "author", hasMany = false }) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <span className="vex-cell-rel empty">— Unset</span>;
  }
  const items = Array.isArray(value) ? value : [value];
  const resolved = items.map(id => {
    if (kind === "author") return AUTHORS.find(a => a.id === id);
    if (kind === "media")  return MEDIA.find(m => m.id === id);
    if (kind === "post")   return POSTS.find(p => p.id === id);
    if (kind === "page")   return PAGES.find(p => p.id === id);
    return null;
  }).filter(Boolean);

  if (resolved.length === 0) return <span className="vex-cell-rel empty">— Unset</span>;

  if (hasMany && resolved.length > 1) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
        <RelChip item={resolved[0]} kind={kind} />
        <span className="vex-badge muted" style={{ fontFamily: "var(--vex-font-mono)" }}>+{resolved.length - 1}</span>
      </span>
    );
  }
  return <RelChip item={resolved[0]} kind={kind} />;
}
function RelChip({ item, kind }) {
  if (!item) return null;
  if (kind === "author") {
    return (
      <span className="vex-cell-rel">
        <span className="icn" style={{ width: 16, height: 16, borderRadius: 9999, background: "var(--accent)", color: "var(--accent-on)", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 600, letterSpacing: "-0.01em" }}>{item.initials}</span>
        <span className="lbl">{item.name}</span>
      </span>
    );
  }
  if (kind === "media") {
    return (
      <span className="vex-cell-rel">
        <span className="icn"><Icon name="image" size={11} /></span>
        <span className="lbl">{item.filename}</span>
      </span>
    );
  }
  return (
    <span className="vex-cell-rel">
      <span className="icn"><Icon name="fileText" size={11} /></span>
      <span className="lbl">{item.title || item.filename || item.name}</span>
    </span>
  );
}

Object.assign(window, {
  FieldShell, TextInput, TextCell, NumberInput, NumberCell,
  CheckInput, CheckCell, SelectInput, SelectCell, STATUS_OPTS,
  DateInput, DateCell, UrlInput, UrlCell, RelCell, RelChip, relTime,
});
