# Content model — after the checkpoint

Goal: the user's first collections and globals are defined, registered, generated and
typechecking, and each one shows up in `/admin`. Keep `pnpm vex:dev` and `pnpm dev` running from
step 7.

The field API changes between alphas. Before writing a field, read its page for the installed
version: `https://docs.vexcms.dev/fields/<type>/` (`text`, `textarea`, `richtext`, `number`,
`checkbox`, `date`, `select`, `relationship`, `upload`, `array`, `group`, `blocks`, and the rest
in the docs sidebar). `@vexcms/core` in `package.json` shows the installed version.

## 1. Ask what the content is — **Ask**

Ask in one message:

- What does the site publish or store? (For example: blog posts with authors and tags, a product
  catalog, events.)
- For each kind of item: which fields an editor fills in, which ones are required, which point to
  other items (a relationship), and which are images or files (an upload).
- One-off settings such as the site name, contact email or social links → a global, not a
  collection.
- Should any of it have drafts and published versions? (`versions: { drafts: true }`)

Propose the model as a short table (collection or global → field → field type → required) and get
a yes before writing any file.

## 2. Write it the way the project already does

Copy the shape of the files the scaffold already has: `src/vexcms/collections/users.ts` on a bare
project, `src/vexcms/collections/pages.ts` and `src/vexcms/globals/siteSettings.ts` on the
marketing starter.

- **Slug constant**: add `TABLE_SLUG_<NAME>` to `src/db/constants/index.ts`, in the same style as
  `TABLE_SLUG_IMAGES`.
- **Collection**: `src/vexcms/collections/<camelCaseName>.ts` exports a `defineCollection({ … })`
  from `@vexcms/core`. Export it from `src/vexcms/collections/index.ts`.
- **Global**: `src/vexcms/globals/<camelCaseName>.ts` exports a `defineGlobal({ … })`. Export it
  from `src/vexcms/globals/index.ts` (on a bare project, create the folder and its `index.ts`).
  Guide: https://docs.vexcms.dev/guides/globals/.
- **Register**: add each collection to `collections: [...]` and each global to `globals: [...]` in
  `src/vex.config.ts`.
- **Rich text**: a `richtext()` field needs an editor adapter, or the admin panel shows a
  configuration error in place of the editor. Install `@vexcms/richtext-plate` at the same version
  as `@vexcms/core` in `package.json` (`pnpm add @vexcms/richtext-plate@<that version>`) and set
  `editor: plateEditor()` (imported from `@vexcms/richtext-plate`) in the `defineConfig({ … })`
  of `src/vex.config.ts`. Details: https://docs.vexcms.dev/fields/richtext/.
- **Access**: `src/auth/access.ts` gives the `admin` role every permission (`"*": true`), so admins
  can edit the new content without changes. The `user` role, which also covers signed-out
  visitors (`anonRole`), is denied anything not listed. Only when signed-in non-admin users need
  the new content, add the collection to `resources` and give `user` a rule. Guide:
  https://docs.vexcms.dev/guides/access-control/.
- **Generated files**: `convex/vex.schema.ts`, `src/vex.types.ts` and `convex/_generated/` are
  generated. Never edit them; change the config instead.

## 3. Check

- `pnpm vex:dev` regenerates the schema and types on save. Without it running, use
  `pnpm vex:generate` once.
- `pnpm typecheck` reports no errors in the files you wrote or changed. Run it once before step 2
  as well: an error that's already there comes from the scaffold. Report it to the user and
  leave it alone; fixing it isn't part of this task.
- **User**: ask them to reload `/admin`, confirm each new collection and global is in the sidebar,
  and create one document in each.

## 4. Showing the content on the site — only when asked

Reading content in the Next.js app is its own task and isn't part of project init. Point the user
to https://docs.vexcms.dev/guides/local-api/ (queries) and
https://docs.vexcms.dev/guides/caching-and-seo/ (prerendering and revalidation); add
https://docs.vexcms.dev/guides/live-preview/ for page-like content.
