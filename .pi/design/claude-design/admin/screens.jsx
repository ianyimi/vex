/* global React, Icon, FieldShell, TextInput, NumberInput, CheckInput, SelectInput,
   DateInput, UrlInput, RelTrigger, RelPickerPopover, RelSidePanel, RelInlineDrawer,
   TextCell, NumberCell, CheckCell, SelectCell, DateCell, UrlCell, RelCell, RelChip,
   AUTHORS, MEDIA, POSTS, PAGES, COLLECTIONS, FIELD_TYPES, STATUS_OPTS,
   Sidebar, Topbar, VexWordmark */

const { useState: uPS, Fragment: PF } = React;

/* ============================================================================
   DASHBOARD
   ============================================================================ */
function DashboardView() {
  return (
    <PF>
      <Topbar
        crumbs={[{ label: "Workspace", here: true }]}
        actions={
          <>
            <span className="vex-live"><span className="pulse"></span><span>Convex · Live</span></span>
            <button className="vex-btn outline sm"><Icon name="refresh" size={12} />Sync</button>
            <button className="vex-btn primary sm"><Icon name="plus" size={12} />New document</button>
          </>
        }
      />
      <div className="vex-page">
        <div className="vex-page-head">
          <div>
            <h1>Good morning, Lena.</h1>
            <p className="sub">4 collections · 201 documents · 3 unsaved drafts.</p>
          </div>
        </div>

        {/* stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          <div className="vex-stat">
            <div className="lbl"><Icon name="database" size={11} />Documents</div>
            <div className="val">201</div>
            <div className="delta up">+14 this week</div>
          </div>
          <div className="vex-stat">
            <div className="lbl"><Icon name="newspaper" size={11} />Published posts</div>
            <div className="val">38</div>
            <div className="delta">9 drafts pending</div>
          </div>
          <div className="vex-stat">
            <div className="lbl"><Icon name="users" size={11} />Authors</div>
            <div className="val">8</div>
            <div className="delta">3 active today</div>
          </div>
          <div className="vex-stat">
            <div className="lbl"><Icon name="image" size={11} />Media</div>
            <div className="val">132</div>
            <div className="delta">218 MB used</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
          {/* recent activity */}
          <div className="vex-card">
            <div className="vex-card-head">
              <h3>Recent activity</h3>
              <span className="sub">Live</span>
              <span className="vex-live" style={{ marginLeft: "auto" }}><span className="pulse"></span><span>Subscribed</span></span>
            </div>
            <div style={{ padding: 0 }}>
              {[
                { who: "Lena Park",      action: "published",   what: "Why we built VexCMS on Convex", coll: "posts",   when: "2m ago", initials: "LP" },
                { who: "Marcus Field",   action: "edited",      what: "Reactive content, no rebuild step", coll: "posts", when: "14m ago", initials: "MF" },
                { who: "Yuki Tanaka",    action: "uploaded",    what: "hero-grid-dark.png",            coll: "media",   when: "31m ago", initials: "YT" },
                { who: "Lena Park",      action: "created",     what: "Schemas as the source of truth", coll: "posts",   when: "1h ago",  initials: "LP" },
                { who: "Priya Mehra",    action: "scheduled",   what: "Live preview with zero config", coll: "posts",    when: "3h ago",  initials: "PM" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ width: 24, height: 24, borderRadius: 9999, background: "var(--accent)", color: "var(--accent-on)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600, flex: "0 0 auto" }}>{row.initials}</span>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{row.who}</span>
                    <span style={{ color: "var(--fg-muted)" }}> {row.action} </span>
                    <span style={{ fontWeight: 500 }}>{row.what}</span>
                  </div>
                  <span className="vex-badge muted" style={{ fontFamily: "var(--vex-font-mono)" }}>{row.coll}</span>
                  <span style={{ fontFamily: "var(--vex-font-mono)", fontSize: 11, color: "var(--fg-subtle)", flex: "0 0 auto" }}>{row.when}</span>
                </div>
              ))}
            </div>
          </div>

          {/* quick links + drafts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="vex-card">
              <div className="vex-card-head"><h3>Pinned drafts</h3><span className="vex-badge muted" style={{ marginLeft: "auto" }}>3</span></div>
              <div>
                {POSTS.filter(p => p.status === "draft").slice(0, 3).map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
                    <Icon name="fileEdit" size={13} style={{ color: "var(--fg-subtle)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontSize: 10.5, color: "var(--fg-subtle)", fontFamily: "var(--vex-font-mono)" }}>posts · {p.slug}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="vex-card">
              <div className="vex-card-head"><h3>Schema</h3><span className="vex-badge brand" style={{ marginLeft: "auto", fontFamily: "var(--vex-font-mono)" }}>v0.1.0</span></div>
              <div className="vex-card-body" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                {COLLECTIONS.map(c => (
                  <div key={c.slug} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name={c.icon} size={13} style={{ color: "var(--fg-subtle)" }} />
                    <span style={{ flex: 1 }}>{c.label}</span>
                    <span style={{ fontFamily: "var(--vex-font-mono)", color: "var(--fg-subtle)", fontSize: 11 }}>{c.count} docs</span>
                  </div>
                ))}
                <div className="divider"></div>
                <button className="vex-btn ghost sm" style={{ justifyContent: "flex-start" }}>
                  <Icon name="plus" size={12} /> New collection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PF>
  );
}

/* ============================================================================
   COLLECTION LIST — Posts
   ============================================================================ */
function PostsListView({ withBulk = false, withFilters = true, withSearch = true, empty = false, density = "comfortable" }) {
  const rows = empty ? [] : POSTS;
  const selected = withBulk ? new Set(["p_01", "p_03"]) : new Set();
  return (
    <PF>
      <Topbar
        crumbs={[
          { label: "Workspace" },
          { label: "Posts", here: true, meta: `${rows.length}` },
        ]}
        actions={
          <>
            <button className="vex-btn ghost sm icon" title="View settings"><Icon name="settings" size={13} /></button>
            <button className="vex-btn outline sm"><Icon name="layout" size={12} />Columns</button>
            <button className="vex-btn primary sm"><Icon name="plus" size={12} />New post</button>
          </>
        }
      />
      <div className="vex-page">
        <div className="vex-page-head">
          <div>
            <h1>Posts</h1>
            <p className="sub">Long-form articles published to <span className="mono" style={{ color: "var(--accent-ink)" }}>vexcms.dev/blog</span>.</p>
          </div>
        </div>

        {/* tablebar */}
        <div className="vex-tablebar">
          {withSearch && (
            <div className="vex-input-wrap has-leading" style={{ width: 280 }}>
              <span className="leading"><Icon name="search" size={13} /></span>
              <input className="vex-input sm" placeholder="Search posts by title or slug…" />
            </div>
          )}
          {withFilters && (
            <>
              <button className="vex-btn outline sm">
                <Icon name="filter" size={12} />Status <span className="vex-badge brand" style={{ height: 18 }}>2</span>
              </button>
              <button className="vex-btn outline sm">
                <Icon name="users" size={12} />Author
              </button>
              <button className="vex-btn ghost sm">
                <Icon name="plus" size={12} />Filter
              </button>
            </>
          )}
          <div className="grow"></div>
          <button className="vex-btn ghost sm">
            <Icon name="arrowUpDown" size={12} />Updated <Icon name="chevDown" size={11} />
          </button>
        </div>

        {/* bulk bar */}
        {withBulk && (
          <div className="vex-bulkbar">
            <Icon name="check" size={13} strokeWidth={3} />
            <span><span className="count">{selected.size}</span> selected</span>
            <div className="actions">
              <button className="vex-btn outline sm">Change status</button>
              <button className="vex-btn outline sm">Change author</button>
              <button className="vex-btn outline sm" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}>
                <Icon name="trash" size={12} />Delete
              </button>
              <button className="vex-btn ghost icon sm"><Icon name="x" size={13} /></button>
            </div>
          </div>
        )}

        {/* table */}
        {rows.length === 0 ? (
          <div className="vex-empty">
            <div className="ico"><Icon name="newspaper" size={18} /></div>
            <h3>No posts yet</h3>
            <p>This collection is empty. Create your first post to start writing — schema is already wired up.</p>
            <div className="actions">
              <button className="vex-btn outline"><Icon name="fileText" size={13} />View schema</button>
              <button className="vex-btn primary"><Icon name="plus" size={13} />New post</button>
            </div>
          </div>
        ) : (
          <>
            <div className="vex-table-wrap">
              <table className="vex-table">
                <colgroup>
                  <col style={{ width: 38 }} />
                  <col />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 170 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 50 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="col-check">
                      <label className="vex-check"><input type="checkbox" /><span className="box"></span></label>
                    </th>
                    <th>
                      <span className="sort active">Title <Icon name="arrowUp" size={11} /></span>
                    </th>
                    <th><span className="sort">Status</span></th>
                    <th><span className="sort">Author</span></th>
                    <th><span className="sort">Featured</span></th>
                    <th><span className="sort" style={{ justifyContent: "flex-end" }}>Views</span></th>
                    <th><span className="sort">Updated <Icon name="chevDown" size={11} /></span></th>
                    <th className="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => (
                    <tr key={p.id} className={selected.has(p.id) ? "selected" : ""}>
                      <td className="col-check">
                        <label className="vex-check">
                          <input type="checkbox" defaultChecked={selected.has(p.id)} />
                          <span className="box" style={selected.has(p.id) ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : {}}>
                            {selected.has(p.id) && <Icon name="check" size={11} strokeWidth={3} />}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div className="cell-title">
                          <Icon name="fileText" size={13} />
                          <div style={{ minWidth: 0, overflow: "hidden" }}>
                            <div className="t" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                            <div className="s">/{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td><SelectCell value={p.status} /></td>
                      <td><RelCell value={p.author} kind="author" /></td>
                      <td><CheckCell value={p.featured} label={p.featured ? "Yes" : "—"} /></td>
                      <td className="cell-num">{p.views ? p.views.toLocaleString() : "—"}</td>
                      <td><DateCell value={p.updatedAt} /></td>
                      <td className="col-actions">
                        <span className="row-actions">
                          <button className="vex-btn ghost icon sm"><Icon name="more" size={13} /></button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="vex-pagination">
              <span>Showing 1–{rows.length} of {rows.length}</span>
              <div className="controls">
                <button className="vex-btn ghost sm icon" disabled><Icon name="chevLeft" size={12} /></button>
                <button className="vex-btn outline sm" style={{ background: "var(--accent-tint)", color: "var(--accent-ink)", borderColor: "transparent", minWidth: 28, padding: 0 }}>1</button>
                <button className="vex-btn ghost sm" style={{ minWidth: 28, padding: 0 }}>2</button>
                <button className="vex-btn ghost sm" style={{ minWidth: 28, padding: 0 }}>3</button>
                <button className="vex-btn ghost sm icon"><Icon name="chevRight" size={12} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </PF>
  );
}

/* ============================================================================
   COLLECTION EDIT — three layouts
   ============================================================================ */
function PostEditForm({ pickerOpen = false }) {
  const post = POSTS[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
      <FieldShell label="Title" type="text" required>
        <TextInput value={post.title} />
      </FieldShell>

      <FieldShell label="Slug" type="text" help="URL-safe identifier. Auto-derived from title.">
        <TextInput value={post.slug} mono />
      </FieldShell>

      <FieldShell label="Excerpt" type="text" optional help="Used in list previews and OG cards.">
        <TextInput value="A reactive CMS that ships in minutes — not afternoons. Why we built VexCMS on Convex." multiline charLimit={180} />
      </FieldShell>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FieldShell label="Status" type="select" required>
          <SelectInput value={post.status} options={STATUS_OPTS} />
        </FieldShell>
        <FieldShell label="Published at" type="date">
          <DateInput value={post.publishedAt} showTime />
        </FieldShell>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FieldShell label="Author" type="relationship" required>
          <div style={{ position: "relative" }}>
            <RelTrigger value={post.author} kind="author" />
            {pickerOpen && (
              <div style={{ position: "absolute", top: 36, left: 0, zIndex: 5 }}>
                <RelPickerPopover kind="author" selected={[post.author]} query="" />
              </div>
            )}
          </div>
        </FieldShell>
        <FieldShell label="Cover image" type="relationship">
          <RelTrigger value="m_01" kind="media" placeholder="— Pick image" />
        </FieldShell>
      </div>

      <FieldShell label="Related posts" type="relationship" help="hasMany — shown in the post footer.">
        <RelTrigger value={["p_03", "p_05", "p_07"]} kind="post" multi placeholder="— Add related posts" />
      </FieldShell>

      <FieldShell label="Canonical URL" type="url">
        <UrlInput value="https://vexcms.dev/blog/why-vexcms-convex" verified={true} />
      </FieldShell>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FieldShell label="Read time" type="number" help="Minutes.">
          <NumberInput value={6} suffix="min" />
        </FieldShell>
        <FieldShell label="Featured" type="checkbox" help="Pin to homepage carousel.">
          <CheckInput checked={post.featured} label="Mark as featured" />
        </FieldShell>
      </div>
    </div>
  );
}

/* Variation A: single column, 720px max */
function EditViewSingle({ pickerOpen }) {
  return (
    <PF>
      <Topbar
        crumbs={[
          { label: "Workspace" },
          { label: "Posts" },
          { label: "Why we built VexCMS on Convex", here: true, meta: "p_01" },
        ]}
        actions={
          <>
            <span style={{ fontSize: 11.5, color: "var(--fg-subtle)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--accent)" }}></span>
              Unsaved changes
            </span>
            <button className="vex-btn ghost sm">Discard</button>
            <button className="vex-btn outline sm"><Icon name="eye" size={12} />Preview</button>
            <button className="vex-btn primary sm"><Icon name="save" size={12} />Save</button>
          </>
        }
      />
      <div className="vex-page">
        <div className="vex-page-head" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>Why we built VexCMS on Convex</h1>
            <p className="sub">Updated <span style={{ color: "var(--fg)" }}>2 minutes ago</span> by Lena Park · <span className="mono">posts/p_01</span></p>
          </div>
          <div className="actions">
            <SelectCell value="published" />
          </div>
        </div>
        <PostEditForm pickerOpen={pickerOpen} />
      </div>
    </PF>
  );
}

/* Variation B: two-column with metadata sidebar */
function EditViewTwoCol() {
  const post = POSTS[0];
  return (
    <PF>
      <Topbar
        crumbs={[
          { label: "Workspace" },
          { label: "Posts" },
          { label: "Why we built VexCMS on Convex", here: true, meta: "p_01" },
        ]}
        actions={
          <>
            <button className="vex-btn ghost sm">Discard</button>
            <button className="vex-btn outline sm"><Icon name="eye" size={12} />Preview</button>
            <button className="vex-btn primary sm"><Icon name="save" size={12} />Save</button>
          </>
        }
      />
      <div className="vex-page" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28, alignItems: "flex-start" }}>
        <div>
          <div className="vex-page-head">
            <div>
              <h1>{post.title}</h1>
              <p className="sub">Updated 2 minutes ago by Lena Park</p>
            </div>
          </div>
          <PostEditForm />
        </div>
        <aside style={{ position: "sticky", top: 60, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="vex-card">
            <div className="vex-card-head"><h3>Status</h3></div>
            <div className="vex-card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SelectInput value={post.status} options={STATUS_OPTS} />
              <div style={{ fontSize: 11.5, color: "var(--fg-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Published</span><span style={{ color: "var(--fg)", fontFamily: "var(--vex-font-mono)" }}>Apr 8, 2025</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--fg-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Visibility</span><span style={{ color: "var(--fg)" }}>Public</span>
              </div>
            </div>
          </div>
          <div className="vex-card">
            <div className="vex-card-head"><h3>Document</h3></div>
            <div className="vex-card-body" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--fg-muted)" }}>
                <span>ID</span><span className="mono" style={{ color: "var(--fg)" }}>p_01</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--fg-muted)" }}>
                <span>Created</span><span style={{ color: "var(--fg)" }}>Apr 8, 2025</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--fg-muted)" }}>
                <span>Modified</span><span style={{ color: "var(--fg)" }}>2m ago</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--fg-muted)" }}>
                <span>Views</span><span className="mono" style={{ color: "var(--fg)" }}>4,820</span>
              </div>
              <div className="divider"></div>
              <button className="vex-btn ghost sm" style={{ justifyContent: "flex-start", color: "var(--bad)" }}>
                <Icon name="trash" size={12} /> Delete document
              </button>
            </div>
          </div>
        </aside>
      </div>
    </PF>
  );
}

/* Variation C: two-column with collapsed rail */
function EditViewCollapsedRail() {
  return (
    <PF>
      <Topbar
        crumbs={[
          { label: "Workspace" },
          { label: "Posts" },
          { label: "Why we built VexCMS on Convex", here: true, meta: "p_01" },
        ]}
        actions={
          <>
            <button className="vex-btn outline sm"><Icon name="eye" size={12} />Preview</button>
            <button className="vex-btn primary sm"><Icon name="save" size={12} />Save</button>
          </>
        }
      />
      <div className="vex-page" style={{ display: "grid", gridTemplateColumns: "1fr 56px", gap: 12 }}>
        <div>
          <div className="vex-page-head">
            <div>
              <h1>Why we built VexCMS on Convex</h1>
              <p className="sub">Updated 2 minutes ago by Lena Park</p>
            </div>
          </div>
          <PostEditForm />
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", paddingTop: 12, borderLeft: "1px solid var(--line)", paddingLeft: 8, marginLeft: 8 }}>
          {[
            { i: "info", t: "Status" },
            { i: "database", t: "Document" },
            { i: "users", t: "Collaborators" },
            { i: "fileText", t: "Versions" },
            { i: "settings", t: "Settings" },
          ].map((x, i) => (
            <button key={i} className="vex-btn ghost icon" title={x.t} style={{ width: 36, height: 36 }}>
              <Icon name={x.i} size={14} />
            </button>
          ))}
        </aside>
      </div>
    </PF>
  );
}

/* ============================================================================
   CREATE DOCUMENT MODAL
   ============================================================================ */
function CreateModal() {
  return (
    <div className="vex-overlay" style={{ position: "absolute", zIndex: 100 }}>
      <div className="vex-modal">
        <div className="vex-modal-head">
          <div style={{ width: 32, height: 32, borderRadius: 4, background: "var(--accent-tint)", color: "var(--accent-ink)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
            <Icon name="plus" size={16} />
          </div>
          <div className="text">
            <h2>Create post</h2>
            <p className="sub">Required fields only. The full schema opens after you save.</p>
          </div>
          <button className="close"><Icon name="x" size={14} /></button>
        </div>
        <div className="vex-modal-body">
          <FieldShell label="Title" type="text" required hideTypeChip>
            <TextInput value="" placeholder="Untitled post" />
          </FieldShell>
          <FieldShell label="Slug" type="text" hideTypeChip help="Auto-derived from title.">
            <TextInput value="" placeholder="untitled-post" mono />
          </FieldShell>
          <FieldShell label="Author" type="relationship" required hideTypeChip>
            <RelTrigger value="a_01" kind="author" />
          </FieldShell>
          <FieldShell label="Status" type="select" required hideTypeChip>
            <SelectInput value="draft" options={STATUS_OPTS} />
          </FieldShell>
        </div>
        <div className="vex-modal-foot">
          <span className="left">⏎ to create · esc to cancel</span>
          <button className="vex-btn ghost">Cancel</button>
          <button className="vex-btn primary"><Icon name="plus" size={12} />Create draft</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  DashboardView, PostsListView, PostEditForm,
  EditViewSingle, EditViewTwoCol, EditViewCollapsedRail,
  CreateModal,
});
