/* global React, VexWordmark, Icon, COLLECTIONS */
/* Admin shell: Sidebar, Topbar, Layout */

const Frag = (props) => React.createElement("span", { style: { display: "contents" }, ...props });

function Sidebar({ activeKey = "dashboard", onNavigate, liveStatus = "connected", collapsed = false }) {
  const click = (key) => (e) => { e.preventDefault(); if (onNavigate) onNavigate(key); };
  const isCollection = COLLECTIONS.some(c => c.slug === activeKey);
  const navItem = (key, icon, label, count) => (
    <li
      key={key}
      className={"item" + (activeKey === key ? " active" : "")}
      onClick={click(key)}
      style={{ cursor: "pointer" }}
    >
      <Icon name={icon} size={14} />
      <span className="lbl">{label}</span>
      {count != null && <span className="count">{count}</span>}
    </li>
  );

  if (collapsed) {
    return (
      <aside className="vex-sidebar" style={{ width: 56 }}>
        <div className="vex-sidebar-head" style={{ justifyContent: "center", padding: "14px 0" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>V</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0" }}>
          {[
            { k: "dashboard", i: "layout" },
            { k: "posts",     i: "newspaper" },
            { k: "pages",     i: "fileText" },
            { k: "authors",   i: "users" },
            { k: "images",    i: "image" },
          ].map(x => (
            <button key={x.k} onClick={click(x.k)}
              className={"vex-btn ghost icon sm"}
              style={{ width: 36, height: 36, background: activeKey === x.k ? "var(--accent-tint)" : "transparent", color: activeKey === x.k ? "var(--accent-ink)" : "var(--fg-muted)" }}>
              <Icon name={x.i} size={15} />
            </button>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: 10, display: "flex", justifyContent: "center" }}>
          <div className="avatar" style={{ width: 28, height: 28, borderRadius: 9999, background: "var(--accent)", color: "var(--accent-on)", fontSize: 11, fontWeight: 600, display: "grid", placeItems: "center" }}>LP</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="vex-sidebar">
      <div className="vex-sidebar-head">
        <VexWordmark size={15} />
        <span className="ver">v0.1.0</span>
      </div>

      <div className="vex-sidebar-section">
        <div className="vex-sidebar-label"><span>Workspace</span></div>
        <ul className="vex-sidebar-nav">
          {navItem("dashboard", "layout", "Dashboard")}
          {navItem("inbox", "inbox", "Inbox", 3)}
        </ul>
      </div>

      <div className="vex-sidebar-section">
        <div className="vex-sidebar-label">
          <span>Collections</span>
          <button className="add" title="New collection"><Icon name="plus" size={12} /></button>
        </div>
        <ul className="vex-sidebar-nav">
          {COLLECTIONS.map(c =>
            <li key={c.slug}
              className={"item" + (activeKey === c.slug ? " active" : "")}
              onClick={click(c.slug)}
              style={{ cursor: "pointer" }}>
              <Icon name={c.icon} size={14} />
              <span className="lbl">{c.label}</span>
              <span className="count">{c.count}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="vex-sidebar-section">
        <div className="vex-sidebar-label">
          <span>Media</span>
          <button className="add" title="New media collection"><Icon name="plus" size={12} /></button>
        </div>
        <ul className="vex-sidebar-nav">
          <li className={"item" + (activeKey === "images" ? " active" : "")} onClick={click("images")} style={{ cursor: "pointer" }}>
            <Icon name="image" size={14} />
            <span className="lbl">Images</span>
            <span className="count">132</span>
          </li>
          <li className={"item" + (activeKey === "videos" ? " active" : "")} onClick={click("videos")} style={{ cursor: "pointer" }}>
            <Icon name="layers" size={14} />
            <span className="lbl">Videos</span>
            <span className="count">14</span>
          </li>
        </ul>
      </div>

      <div className="vex-sidebar-section">
        <div className="vex-sidebar-label"><span>System</span></div>
        <ul className="vex-sidebar-nav">
          {navItem("team", "users", "Team")}
          {navItem("settings", "settings", "Settings")}
          {navItem("docs", "helpCircle", "Docs")}
        </ul>
      </div>

      <div className="vex-sidebar-foot">
        <div className={"vex-live " + (liveStatus !== "connected" ? liveStatus : "")}>
          <span className="pulse"></span>
          {liveStatus === "connected" && <span>Convex · Live</span>}
          {liveStatus === "connecting" && <span>Connecting…</span>}
          {liveStatus === "error" && <span>Disconnected</span>}
        </div>
        <div className="vex-userchip">
          <div className="avatar">LP</div>
          <div className="text">
            <div className="name">Lena Park</div>
            <div className="email">lena@vexcms.dev</div>
          </div>
          <Icon name="chevsUpDown" size={12} style={{ color: "var(--fg-subtle)" }} />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ crumbs = [], actions = null }) {
  return (
    <div className="vex-topbar">
      <button className="trigger" title="Toggle sidebar">
        <Icon name="panelLeft" size={16} />
      </button>
      <div className="vex-crumbs">
        {crumbs.map((c, i) => (
          <Frag key={i}>
            {i > 0 && <span className="sep"><Icon name="chevRight" size={12} /></span>}
            {c.here
              ? <span className="here">{c.label}</span>
              : <a href="#" onClick={(e) => e.preventDefault()}>{c.label}</a>}
            {c.meta && <span className="meta">{c.meta}</span>}
          </Frag>
        ))}
      </div>
      <div className="spacer"></div>
      <div className="actions">
        {actions || (
          <>
            <div className="vex-input-wrap has-leading" style={{ width: 220, position: "relative" }}>
              <span className="leading"><Icon name="search" size={14} /></span>
              <input className="vex-input sm" placeholder="Search…" style={{ height: 28 }} />
              <span className="kbd" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>⌘K</span>
            </div>
            <button className="vex-btn ghost icon sm" title="Notifications"><Icon name="bell" size={14} /></button>
          </>
        )}
      </div>
    </div>
  );
}

/* Flexible layout: pass either {sidebar, page} OR {children}. */
function AdminLayout({ sidebar, page, children, dark = false }) {
  const sb = sidebar || <Sidebar />;
  return (
    <div className={"vex-admin" + (dark ? " dark" : "")} style={{ height: "100%" }}>
      <div className="vex-shell" style={{ height: "100%" }}>
        {sb}
        <div className="vex-main">
          {page || children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, AdminLayout });
