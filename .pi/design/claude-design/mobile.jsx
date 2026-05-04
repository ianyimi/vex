/* global React, Icon, AdminLayout, Sidebar, Topbar, VexWordmark,
   DashboardView, PostsListView, EditViewSingle, EditViewTwoCol,
   POSTS, AUTHORS, COLLECTIONS, STATUS_OPTS,
   SelectCell, RelCell, DateCell */

const { useState: mPS, Fragment: MF } = React;

/* Mobile collection list — single-column cards instead of table */
function MobilePostsList() {
  return (
    <div style={{ background: "var(--page)", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* mobile topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <button className="vex-btn ghost icon sm"><Icon name="menu" size={15} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Posts</div>
          <div style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>10 documents</div>
        </div>
        <button className="vex-btn ghost icon sm"><Icon name="search" size={14} /></button>
        <button className="vex-btn primary icon sm"><Icon name="plus" size={14} /></button>
      </div>

      {/* filter chips */}
      <div style={{ display: "flex", gap: 6, padding: "10px 14px", overflowX: "auto", borderBottom: "1px solid var(--line)" }}>
        <button className="vex-btn outline sm" style={{ background: "var(--accent-tint)", color: "var(--accent-ink)", borderColor: "transparent", whiteSpace: "nowrap" }}>All <span style={{ opacity: 0.7 }}>10</span></button>
        <button className="vex-btn outline sm" style={{ whiteSpace: "nowrap" }}>Published <span style={{ color: "var(--fg-subtle)" }}>5</span></button>
        <button className="vex-btn outline sm" style={{ whiteSpace: "nowrap" }}>Drafts <span style={{ color: "var(--fg-subtle)" }}>3</span></button>
        <button className="vex-btn outline sm" style={{ whiteSpace: "nowrap" }}>Scheduled <span style={{ color: "var(--fg-subtle)" }}>2</span></button>
      </div>

      {/* cards */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {POSTS.slice(0, 6).map(p => (
          <div key={p.id} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <Icon name="fileText" size={14} style={{ color: "var(--fg-subtle)", marginTop: 2, flex: "0 0 auto" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.35 }}>{p.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--fg-subtle)", fontFamily: "var(--vex-font-mono)", marginTop: 2 }}>/{p.slug}</div>
              </div>
              <SelectCell value={p.status} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--fg-subtle)" }}>
              <RelCell value={p.author} kind="author" />
              <span style={{ color: "var(--line-strong)" }}>·</span>
              <DateCell value={p.updatedAt} relative />
              {p.featured && (<><span style={{ color: "var(--line-strong)" }}>·</span><span className="vex-badge brand">Featured</span></>)}
            </div>
          </div>
        ))}
      </div>

      {/* fab */}
      <div style={{ position: "absolute", bottom: 20, right: 20 }}>
        <button className="vex-btn primary" style={{ width: 48, height: 48, borderRadius: 9999, padding: 0, boxShadow: "var(--shadow-3)" }}>
          <Icon name="plus" size={18} />
        </button>
      </div>
    </div>
  );
}

/* Mobile edit — stacked form */
function MobileEdit() {
  const post = POSTS[0];
  return (
    <div style={{ background: "var(--page)", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <button className="vex-btn ghost icon sm"><Icon name="chevLeft" size={15} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>
          <div style={{ fontSize: 10, color: "var(--fg-subtle)" }}>posts · saved 2m ago</div>
        </div>
        <button className="vex-btn outline sm">Preview</button>
        <button className="vex-btn primary sm">Save</button>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <FieldShell label="Title" type="text" hideTypeChip><TextInput value={post.title} /></FieldShell>
        <FieldShell label="Slug" type="text" hideTypeChip><TextInput value={post.slug} mono /></FieldShell>
        <FieldShell label="Status" type="select" hideTypeChip><SelectInput value={post.status} options={STATUS_OPTS} /></FieldShell>
        <FieldShell label="Author" type="relationship" hideTypeChip><RelTrigger value={post.author} kind="author" /></FieldShell>
        <FieldShell label="Excerpt" type="text" hideTypeChip>
          <TextInput value="A reactive CMS that ships in minutes." multiline charLimit={160} />
        </FieldShell>
      </div>
    </div>
  );
}

/* Tablet: nav becomes icon-only rail */
function TabletList() {
  return (
    <AdminLayout
      sidebar={<Sidebar collapsed activeKey="posts" />}
      page={<PostsListView />}
    />
  );
}

Object.assign(window, { MobilePostsList, MobileEdit, TabletList });
