# Shared media session — shot list and capture checklist

> One recording session for every frozen image of the UI that ships at launch (cross-spec
> decision 7): this spec's step 8 (4 feature clips), public-presence step 16 (demo MP4, hero GIF,
> 4 fixed-size screenshots) and launch-infrastructure step 10's `/tour` recapture (4 PNGs).
> Developer-run (board row LK-8). Sources: this spec's step 8, public-presence spec step 16,
> launch-infrastructure spec step 10. Nothing here is post copy: the clips are silent and the
> posts that describe them are the developer's own text (Design Decision 11).

## Preconditions

- [ ] Board: QP-6 (admin views) and QP-7 (www pages) are `done`. Recording earlier ships pre-fix screens.
- [ ] Your `apps/www` dev server is running on `:3030` against the Convex dev deployment (P-024: attach, never start a second one).
- [ ] Re-seed the dev deployment so the recorded content is the seeded copy: `pnpm --filter www exec convex run seed:reinit`.
- [ ] Browser: a clean profile (no extensions, bookmarks bar hidden), 100% zoom, light theme unless a shot says otherwise. Hide desktop notifications.
- [ ] Two signed-in sessions ready for the RBAC clip: an admin and a restricted role (two browser profiles, or one normal + one private window).
- [ ] An empty scratch directory for the scaffold takes (`create-vexcms-to-deployed`, the demo take). Its dev server is the fresh scaffold's own first run, not `apps/www`/`apps/test`.

## Order (fewest setup switches)

1. `/tour` screenshots (admin only, no recording).
2. Public-presence fixed-size screenshots (admin + live preview + mobile + PH gallery).
3. Clip `real-time-admin-and-live-preview`.
4. Clip `access-control-hooks-validation`.
5. Clip `one-config-schema-and-types` (editor + terminal + admin).
6. Scaffold takes: clip `create-vexcms-to-deployed`, then the public-presence demo take (scaffold → publish).

## Shot list

### `/tour` recapture — 1280×800 PNG, same filenames (launch-infrastructure step 10)

| File | Shows | From |
|---|---|---|
| `dashboard.png` | Collections and globals overview with live document counts | `:3030/admin` |
| `list-view.png` | A collection list view with a saved view applied: sortable columns, pagination | `:3030/admin/collections/<slug>` with a saved view selected |
| `edit-view-live-preview.png` | A document edit view with the live-preview pane open | an existing page's edit view, preview pane open |
| `media-library.png` | The media library grid: search, pagination | `:3030/admin` media collection |

The captions and alt text on `/tour` (`apps/www/src/app/tour/page.tsx`) describe exactly these; keep each shot matching its caption, so the page needs no edit.

### Public-presence step 16 — screenshots

| File (`apps/www/public/brand/`) | Size | Shows |
|---|---|---|
| `screenshot-admin-1280x800.png` | 1280×800 | The admin panel |
| `screenshot-live-preview-1280x800.png` | 1280×800 | Edit view + live preview side by side |
| `screenshot-admin-mobile-390x844.png` | 390×844 | The admin on a phone (devtools responsive mode or a real device) |
| `screenshot-producthunt-1270x760.png` | 1270×760 | A polished hero-style shot, not a raw admin screen (PH gallery, `sources.md` §2.3) |

### Public-presence step 16 — demo take (30–60 s MP4 + looping GIF)

One continuous take, scaffold to publish:

1. Terminal, empty directory: the scaffold command (public-presence step 17's quick start if it has landed; otherwise `pnpm create vexcms@alpha demo-site`).
2. Open the app; sign up; land in `/admin` as the auto-promoted admin.
3. Add one field to an existing collection in `vex.config.ts`; save; `vex dev`'s watcher regenerates the schema.
4. In the admin, create a document, fill the new field, open live preview side by side.
5. Edit the field; the preview updates without a reload.
6. Publish; the public page renders it.
7. Cut to the published page as an anonymous visitor.

### This spec's 4 clips — silent H.264 MP4, ≤ 60 s, ≤ 10 MB (`apps/www/public/launch/`)

| File | Shows | From |
|---|---|---|
| `real-time-admin-and-live-preview.mp4` | A document open in the admin with the live-preview pane open; edit a field; the preview updates with no manual refresh | `:3030/admin`, an existing page/post edit view; preview iframe on that document's public route |
| `one-config-schema-and-types.mp4` | A collection's `defineCollection` call in the editor; `pnpm --filter www exec vex generate` in a terminal; the generated `Post`/`Page` type; the admin form rendering the same fields | editor on `apps/www/src/vexcms/collections/*.ts`, a terminal, `:3030/admin` |
| `access-control-hooks-validation.mp4` | The `access.ts` matrix for one resource; a restricted role attempting a write and getting the server-enforced rejection (toast/error); an admin doing the same write successfully | editor on `apps/www/src/auth/access.ts`, `:3030/admin` under the two sessions |
| `create-vexcms-to-deployed.mp4` | `pnpm create vexcms …` scaffolding end to end in a terminal, then the scaffolded site open in a browser | terminal in the scratch directory, the scaffold's own dev server |

Each clip has no audio and no captions, so the post you write for that day describes what the clip shows.

## Encode

Clips (once per raw capture):

```bash
ffmpeg -i in.mov -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -vf scale=1280:-2 -t 60 apps/www/public/launch/<slug>.mp4
```

Over 10 MB: re-encode with `scale=960:-2`.

Demo GIF (public-presence step 16):

```bash
ffmpeg -y -i vexcms-demo.mp4 -vf "fps=12,scale=720:-1:flags=lanczos,palettegen" /tmp/vexcms-palette.png
ffmpeg -y -i vexcms-demo.mp4 -i /tmp/vexcms-palette.png \
  -lavfi "fps=12,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  apps/www/public/brand/vexcms-demo.gif
```

Over 10 MB: drop to `fps=10` or `scale=600`.

## Place

- [ ] 4 clips → `apps/www/public/launch/<slug>.mp4`
- [ ] 4 `/tour` PNGs → `apps/www/public/tour/` (overwrite), then `cp apps/www/public/tour/*.png apps/test/public/tour/`. Copying into `apps/test` waits for the board's `apps/test/**` lock and M committed (rule 9). If M isn't committed yet, leave the copy for the agent to do then.
- [ ] Demo MP4, GIF and 4 screenshots → `apps/www/public/brand/` (public-presence step 16 then zips the media kit, adds the `/brand` CTA actions and swaps the README hero; that's the PP session's work)

## Checks (the LK agent runs these when you tick LK-8; listed so you can self-check)

```bash
for f in apps/www/public/launch/*.mp4; do
  echo "$f"
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f"   # ≤ 60
  ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$f"               # prints nothing
  ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$f"  # h264
  stat -f%z "$f"                                                                                 # ≤ 10485760
  curl -sI "http://localhost:3030/launch/$(basename "$f")" | head -1                             # 200
done
sips -g pixelWidth -g pixelHeight apps/www/public/tour/*.png   # 1280 × 800 each
diff -r apps/www/public/tour apps/test/public/tour              # prints nothing
```

Then open `:3030/tour` and confirm the new screenshots show. Public-presence step 16's own Verify covers its files.
