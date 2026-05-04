/* global React, Icon, AdminLayout, Sidebar, Topbar, VexWordmark,
   DashboardView, PostsListView, EditViewSingle, EditViewTwoCol, EditViewCollapsedRail, CreateModal,
   POSTS, AUTHORS, COLLECTIONS */

const { useState: pPS, Fragment: PFrag } = React;

/* Live-ish prototype: nav between dashboard / posts / edit, with a working modal toggle. */
function VexPrototype() {
  const [route, setRoute] = pPS({ view: "dashboard" });
  const [modal, setModal] = pPS(false);

  const go = (view, opts = {}) => setRoute({ view, ...opts });

  let page = null;
  if (route.view === "dashboard") page = <DashboardView />;
  else if (route.view === "posts") page = <PostsListView />;
  else if (route.view === "edit") page = <EditViewSingle />;
  else if (route.view === "edit-twocol") page = <EditViewTwoCol />;

  // Patch sidebar nav to call go()
  const sb = (
    <Sidebar
      activeKey={route.view === "edit" || route.view === "edit-twocol" ? "posts" : route.view}
      onNavigate={(key) => go(key)}
    />
  );

  // Top "New" button → modal (we re-route inside the page when needed)
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setModal(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <AdminLayout sidebar={sb} page={
        <div style={{ position: "relative", height: "100%" }}>
          {/* override clicks: title row in posts → edit; "New post" → modal */}
          <div onClickCapture={(e) => {
            const t = e.target.closest("[data-go]");
            if (t) {
              e.preventDefault();
              e.stopPropagation();
              const v = t.getAttribute("data-go");
              if (v === "modal") setModal(true);
              else go(v);
            }
          }}>
            {/* Inject prototype-only click targets */}
            <ProtoNav route={route} go={go} openModal={() => setModal(true)} />
            {page}
          </div>
        </div>
      } />
      {modal && <div onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}><CreateModal /></div>}
    </div>
  );
}

/* Tiny floating breadcrumb for the prototype, so users can jump between views. */
function ProtoNav({ route, go, openModal }) {
  const items = [
    { v: "dashboard",    l: "Dashboard" },
    { v: "posts",        l: "Posts list" },
    { v: "edit",         l: "Edit · single col" },
    { v: "edit-twocol",  l: "Edit · two col" },
  ];
  return (
    <div style={{
      position: "absolute", top: 8, right: 16, zIndex: 50,
      display: "flex", alignItems: "center", gap: 4, padding: 4,
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: 8, boxShadow: "var(--shadow-2)", fontSize: 11
    }}>
      <span style={{ fontFamily: "var(--vex-font-mono)", color: "var(--fg-subtle)", padding: "0 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Demo</span>
      {items.map(it => (
        <button key={it.v}
          onClick={() => go(it.v)}
          style={{
            padding: "5px 10px", borderRadius: 5, border: "none",
            background: route.view === it.v ? "var(--accent-tint)" : "transparent",
            color: route.view === it.v ? "var(--accent-ink)" : "var(--fg-muted)",
            fontWeight: route.view === it.v ? 600 : 500, cursor: "pointer", fontSize: 11
          }}>
          {it.l}
        </button>
      ))}
      <div style={{ width: 1, height: 16, background: "var(--line)", margin: "0 4px" }}></div>
      <button onClick={openModal} className="vex-btn primary sm" style={{ height: 26 }}>
        <Icon name="plus" size={11} />New
      </button>
    </div>
  );
}

window.VexPrototype = VexPrototype;
