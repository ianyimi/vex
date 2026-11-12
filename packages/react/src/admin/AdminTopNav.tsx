"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode, type RefAttributes } from "react";
import { Button, Skeleton, SidebarTrigger, VexLink, UserDisplay, Icon } from "../ui";
import { ChevronLeft, ChevronRight, LucideProps } from "lucide-react";
import {
  IconName,
  vexConvexApi,
  buildGetArgs,
  type CollectionConfig,
  type MediaCollectionConfig,
} from "@vexcms/core";
import { adminHref } from "./adminHref";
import { useVexConfig, useVexAccess } from "../config/VexConfigContext";
import { COVERING_ROUTE_LINK_ATTRIBUTE, useFrameworkComponents } from "../config/useFrameworkComponents";
import { useLastUncoveredValue } from "../config/useLastUncoveredValue";
import { useVexAuth } from "../auth/VexAuthContext";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "../utils/cn";

/**
 * Breadcrumb separator icon between crumb links. Points toward the sidebar
 * (`ChevronRight` when the sidebar sits on the left, `ChevronLeft` otherwise)
 * so the chevron visually leads back to the collapsed nav.
 *
 * @param props - Whether the sidebar is on the left, plus the remaining
 *   `lucide-react` SVG props forwarded to the rendered chevron icon.
 * @returns The chevron icon (`ChevronRight` or `ChevronLeft`) for this position.
 */
export function Divider(props: { left: boolean } & LucideProps & RefAttributes<SVGSVGElement>) {
  const { left, ...svgProps } = props;
  if (left) {
    return <ChevronRight {...svgProps} />;
  }
  return <ChevronLeft {...svgProps} />;
}

/**
 * Link back out to the site this admin panel manages, rendered in `AdminTopNav`'s bar so it
 * stays visible even when the sidebar is collapsed. Moved here from `AdminLayout.tsx` — the
 * bar itself moved out of `AdminLayout` entirely.
 *
 * `href` is hardcoded to `"/"` rather than a configured site URL: the panel is mounted under
 * `config.basePath` inside the host app, so the site it manages is always at the root.
 *
 * `nativeButton={false}` is required whenever `render` supplies an anchor — Base UI then emits
 * `aria-disabled` instead of the `disabled` attribute, which is what `buttonVariants` actually
 * styles.
 *
 * @param props - Component props
 * @param props.className - Optional class override for positioning (e.g. `"ml-auto"`)
 * @returns <ViewSiteButton className="ml-auto" />
 */
function ViewSiteButton({ className }: { className?: string }) {
  return (
    <Button
      nativeButton={false}
      render={<VexLink href="/" />}
      size="icon-lg"
      variant="outline"
      icon="ExternalLink"
      iconPosition="center"
      className={className}
    >
      <span className="sr-only">View site</span>
    </Button>
  );
}

/**
 * Reconstructs the current admin URL from the same route pieces `AdminTopNav` already
 * derives for its breadcrumbs, plus the current query — used ONLY as the sign-in
 * redirect target (below), so signing back in lands on exactly the page and state the
 * visitor left (list filter/sort/search/view, active tab, …). If the new identity can't
 * see that page or view, the page itself handles it the same way it handles any URL
 * (redirect, not-found, fallback to the default view). The query comes from
 * `FrameworkComponents.useSearchParams` (SSR-safe), never `window.location`, so the
 * server render and hydration agree.
 *
 * @param props - The same `basePath`/active-route pieces `AdminTopNav`'s body computes,
 *   plus `search`, the current query string without its leading `?` (`""` for none).
 * @returns The current admin URL, via `adminHref`, with the query appended.
 */
function buildCurrentAdminHref(props: {
  basePath: string;
  activeDocID?: string;
  activeCollection: CollectionConfig | MediaCollectionConfig | undefined;
  isCollections: boolean;
  isGlobals: boolean;
  search: string;
}): string {
  const query = props.search ? `?${props.search}` : "";
  if (props.activeCollection) {
    return `${
      props.activeDocID
        ? adminHref(
            { type: "document", slug: props.activeCollection.slug, id: props.activeDocID },
            props.basePath,
          )
        : adminHref({ type: "collection", slug: props.activeCollection.slug }, props.basePath)
    }${query}`;
  }
  if (props.isCollections) {
    return `${adminHref({ type: "collections" }, props.basePath)}${query}`;
  }
  if (props.isGlobals) {
    return `${
      props.activeDocID
        ? adminHref({ type: "global", slug: props.activeDocID }, props.basePath)
        : adminHref({ type: "globals" }, props.basePath)
    }${query}`;
  }
  return `${adminHref({ type: "dashboard" }, props.basePath)}${query}`;
}

/**
 * Sign-in/out control, rendered at the header's opposite edge from the sidebar-trigger /
 * crumbs / `ViewSiteButton` cluster — a sign-in/out control in the
 * admin top bar, meaningful since anonymous admin access is possible via `anonRole`.
 * Shows its label ("Sign in"/"Sign out") with the icon to its RIGHT (not icon-only
 * like `ViewSiteButton`/`SidebarTrigger`, since there is no icon universally
 * recognizable for "sign in"/"sign out" the way there is for "view site"/"toggle sidebar").
 *
 * Renders nothing when `FrameworkComponents.auth` is not configured (default today) — the
 * host app opts in by providing `signInHref`/`signOut`, same pattern as `useNavigate` /
 * `navigationBlocker`.
 *
 * "Signed out" covers BOTH no session (`user === null`) and an anonymous session
 * (`user.isAnonymous === true` — Better Auth's `anonymous()` plugin convention,
 * matching `@vexcms/better-auth`'s own `anonRoleDatabaseHook`): an anonymous admin
 * session has no real account to sign out of, so it shows "Sign in", never "Sign out".
 * The signed-in/out determination itself comes from `useVexAuth()`, the SAME
 * server-resolved `{ user, organization }` every other RBAC-aware component in this
 * tree reads — already correct on first paint, no client-only flash.
 *
 * Uses `Button`'s own `isPending` (not a manual icon swap) for the sign-out pending
 * state — hides the label+icon via `invisible` and overlays a spinner WITHOUT changing
 * the button's size, so the control never shifts WHILE signing out. The "Sign in"/"Sign
 * out" labels themselves are different widths, but the control sits ALONE at the bar's
 * far edge next to an empty flex-1 spacer (see {@link AdminTopNav}'s own return) — only
 * the spacer's own width changes as a result, never any other rendered element's position.
 *
 * @param props.className - Positioning class (`"mr-2"`/none), mirroring `ViewSiteButton`.
 * @param props.currentHref - Current admin URL, passed to `signInHref` as the return-to
 *   target (see {@link buildCurrentAdminHref}).
 * @returns The labeled button for the current auth state, or `null` with no adapter configured.
 */
function AuthControl(props: { className?: string; currentHref: string }): ReactNode {
  const { auth } = useFrameworkComponents();
  const { user } = useVexAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  if (!auth) return null;
  const isSignedOut = !user || user.isAnonymous === true;
  if (isSignedOut) {
    return (
      <Button
        nativeButton={false}
        render={
          <VexLink
            href={auth.signInHref(props.currentHref)}
            // Opens the app's sign-in modal over the admin — not a navigation away from
            // it, so an unsaved-changes guard lets it through.
            {...{ [COVERING_ROUTE_LINK_ATTRIBUTE]: "" }}
          />
        }
        variant="outline"
        size="lg"
        icon="LogIn"
        iconPosition="right"
        className={props.className}
      >
        Sign in
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="lg"
      icon="LogOut"
      iconPosition="right"
      isPending={isSigningOut}
      className={props.className}
      onClick={() => {
        setIsSigningOut(true);
        void auth.signOut().finally(() => setIsSigningOut(false));
      }}
    >
      Sign out
    </Button>
  );
}

/**
 * Shows the signed-in caller to the right of {@link AuthControl}'s sign-in/out button, via
 * the reusable `UserDisplay` (`ui/UserDisplay.tsx`). Resolves `name`/`email`/`image` from
 * the SAME `useVexAuth()` the control itself reads, so the two never disagree about who is
 * signed in, and resolves `fallbackIcon` from `config.access.userCollectionSlug`'s own
 * `admin.icon` — when the user has no avatar image, the chip falls back to the SAME icon
 * the user collection's dashboard card/sidebar entry already shows, before `UserDisplay`'s
 * own generic single-user icon.
 *
 * Renders nothing for every signed-out shape `AuthControl` treats as signed out
 * (`user === null` or `user.isAnonymous === true`), and nothing again if neither a `name`
 * nor an `email` string is present on the user doc (`UserDisplay`'s own contract).
 *
 * @param props.className - Positioning class, mirroring `AuthControl`'s own `className` prop.
 * @returns The signed-in user's avatar + name/email, or `null`.
 */
function CurrentUserDisplay(props: { className?: string }): ReactNode {
  const { user } = useVexAuth();
  const config = useVexConfig();
  const access = useVexAccess();
  if (!user || user.isAnonymous === true) return null;
  const userCollection = config.collections.find((c) => c.slug === access?.userCollectionSlug);
  return (
    <UserDisplay
      name={typeof user.name === "string" ? user.name : undefined}
      email={typeof user.email === "string" ? user.email : undefined}
      image={typeof user.image === "string" ? user.image : undefined}
      fallbackIcon={userCollection?.admin.icon}
      className={cn("text-muted-foreground", props.className)}
    />
  );
}

/** One breadcrumb link: label, href, and an optional leading icon (collection crumbs only). */
interface Crumb {
  key: string;
  href: string;
  label: string;
  icon?: IconName;
}

/**
 * Builds every crumb EXCEPT the document-title one — shared by every path (the document crumb
 * is a separate, Suspense-wrapped piece appended/prepended by {@link AdminTopNav} itself).
 * Globals crumbs are fully config-driven (a global's `label` IS its page title, spec 35/D16 —
 * no doc fetch needed there at all).
 *
 * @param props.basePath - The admin mount path, prefixed onto every crumb's `href`.
 * @param props.activeCollection - The collection resolved from the current route, if any.
 * @param props.isGlobals - Whether the current route is under the globals section.
 * @param props.activeGlobal - The active global's slug/label, when `isGlobals` and a specific
 *   global is selected.
 * @returns The "Home" crumb, plus a collection crumb, or a "Globals" crumb (and an active
 *   global's own crumb when one is selected) — whichever branch applies.
 */
function buildBaseCrumbs(props: {
  basePath: string;
  activeCollection: CollectionConfig | MediaCollectionConfig | undefined;
  isCollections: boolean;
  isGlobals: boolean;
  activeGlobal: { slug: string; label: string } | undefined;
}): Crumb[] {
  const crumbs: Crumb[] = [
    { key: "home", href: adminHref({ type: "dashboard" }, props.basePath), label: "Home" },
  ];
  if (props.activeCollection) {
    crumbs.push({
      key: "collection",
      href: adminHref({ type: "collection", slug: props.activeCollection.slug }, props.basePath),
      label: props.activeCollection.labels.plural,
      icon: props.activeCollection.admin.icon,
    });
  } else if (props.isCollections) {
    crumbs.push({ key: "collections", href: adminHref({ type: "collections" }, props.basePath), label: "Collections" });
  } else if (props.isGlobals) {
    crumbs.push({ key: "globals", href: adminHref({ type: "globals" }, props.basePath), label: "Globals" });
    if (props.activeGlobal) {
      crumbs.push({
        key: "global",
        href: adminHref({ type: "global", slug: props.activeGlobal.slug }, props.basePath),
        label: props.activeGlobal.label,
      });
    }
  }
  return crumbs;
}

/**
 * Renders one crumb link (no divider — the caller interleaves `Divider`s between calls).
 *
 * @param props.crumb - The crumb to render (href, label, optional icon).
 * @param props.isLast - Whether this is the final crumb, styled as the active/current page.
 * @returns The crumb's link element, with its icon (if any) and label.
 */
function CrumbLink(props: { crumb: Crumb; isLast: boolean }): ReactNode {
  return (
    <VexLink
      href={props.crumb.href}
      className={cn("flex items-center gap-1", props.isLast ? "text-primary" : "hover:text-primary/90")}
    >
      {props.crumb.icon && (
        <span>
          <Icon name={props.crumb.icon} size={16} />
        </span>
      )}
      <span>{props.crumb.label}</span>
    </VexLink>
  );
}

/**
 * The `<Suspense>`-wrapped document-title crumb — `useSuspenseQuery` on the EXACT SAME
 * `vexConvexApi.get` key the active edit view's own data component prefetches
 * (`CollectionEditViewData`/`MediaCollectionEditViewData`), via the shared `buildGetArgs`
 * helper both call — before `buildGetArgs` existed, this built its own `{id, collection,
 * drafts}` object with `drafts: props.collection.versions.drafts`, a CONCRETE `false` for a
 * non-versioned collection, while a sibling caller OMITTED `drafts` entirely for the same
 * case; TanStack Query's key hashing treats `{drafts: false}` and `{}` as different keys, so
 * the two "identical" queries never deduped — the crumb silently never resolved (reported:
 * "media edit crumb never shows"). `buildGetArgs` is now the one place that decides when
 * `drafts` is present at all, so every caller's key matches byte-for-byte.
 * Correct on first paint because `NextAdminPage` now renders `AdminTopNav` as a TRUE
 * DESCENDANT of its own `HydrationBoundary`, alongside the edit view itself — not a sibling
 * of it inside `AdminLayout`, which is what made every earlier attempt at this hang or
 * mismatch. Two components suspending on the identical TanStack Query key share the SAME
 * underlying promise (dedup), so both resolve together within the same SSR streaming pass.
 *
 * Returns ONLY the link (no divider) — {@link AdminTopNav} positions the divider itself as a
 * separate, statically-rendered item in its own flat nav array (a divider rendered INSIDE this
 * Suspense boundary ended up on the wrong side of the crumb once
 * the whole array was reversed for a right-side sidebar — an array of INDIVIDUAL items has to
 * stay flat for `.reverse()` to produce the same order the original single-array
 * implementation did; a divider nested inside a 2-item fragment does not reverse the same way).
 *
 * @param props.collection - The active collection/media collection the document belongs to.
 * @param props.documentId - The document's id, used to fetch it for its title.
 * @param props.basePath - The admin mount path, prefixed onto the crumb's `href`.
 * @returns The document's crumb link once the fetch resolves, or `null` when the document no
 *   longer exists (so the crumb trail simply omits it rather than showing a stale/broken link).
 */
function AdminTopNavDocCrumb(props: {
  collection: CollectionConfig | MediaCollectionConfig;
  documentId: string;
  basePath: string;
}): ReactNode {
  const { data: doc } = useSuspenseQuery(
    convexQuery(vexConvexApi.get, buildGetArgs({ id: props.documentId, collection: props.collection })),
  );
  useEffect(() => {
    if (doc) document.title = `${doc[props.collection.admin.useAsTitle] as string} · Admin`;
  }, [doc, props.collection]);
  if (!doc) return null;
  const crumb: Crumb = {
    key: "document",
    href: adminHref({ type: "document", slug: props.collection.slug, id: doc._id as string }, props.basePath),
    label: doc[props.collection.admin.useAsTitle] as string,
  };
  return <CrumbLink crumb={crumb} isLast />;
}

/**
 * Admin top bar: breadcrumb trail, sidebar trigger, and "View site" link.
 *
 * Rendered by `NextAdminPage` itself — NOT by `AdminLayout` (which keeps only the sidebar
 * and the main column frame) —
 * specifically so the document-title crumb lives inside the SAME `HydrationBoundary`
 * `NextAdminPage` wraps its own view content in, as a true descendant, not a layout-level
 * sibling. `NextAdminPage` renders this on EVERY branch (dashboard, list, edit, globals,
 * media, not-found), passing the SAME `activeSlug`/`activeDocID` it already derives from the
 * route params server-side — no more `usePathname()` parsing, no more `mounted` gate (the
 * cause of the pre-existing "document crumb never shows" bug this move also fixes, alongside a
 * genuine `drafts`-key mismatch bug found and fixed in the same investigation).
 *
 * Vertical sizing: `min-h-[67px]` with `items-center`, no `py-*`. `67px` is tuned so the
 * gap from the "Sign out"/"Sign in" control's own bottom edge to this bar's `border-b`
 * (measures ~15.5px) matches the gap from `CollectionEditView`/`GlobalEditView`'s
 * document-title header's OWN `border-b` down to the TOP of its Preview/Save/Unpublish
 * button row (also ~15.5px) — the developer's explicit comparison, both real rendered box
 * edges (not a text glyph's ink-top, which earlier attempts matched instead and read
 * visibly bigger than the button row despite a numerically close gap). The auth button
 * here and that button row are the SAME height (36px, `size="lg"`), so under the SAME
 * `min-h-*` + `items-center` centering technique a shared gap also yields a shared total
 * height — this bar and the title header both measure 67px. Horizontal padding stays
 * `px-6`, unchanged, matching `NextAdminPage`'s own content wrapper
 * (`className="min-h-0 flex-1 p-6 pt-0"`) on BOTH sides, not just visually approximate it —
 * a mismatched padding here is a recurring trap: `px-4` (16px) once looked "close enough"
 * at a glance but was a real, measurable 8px off from the content's own 24px — verify any
 * future bar-padding change against `getBoundingClientRect()`, not eyeballing.
 * `AdminLayout`'s and `AdminSidebar`'s own `SidebarHeader` carry the SAME `min-h-[67px]`, so
 * the two headers' `border-b` lines land at the same y — one continuous divider across
 * sidebar and main column. That header's OWN horizontal padding (`px-4`, 16px each side) is
 * NOT mirrored from this bar's `px-6` (24px) — it is sized against the sidebar header's own
 * content instead: "VexCMS Admin"'s RENDERED TEXT left edge (measured via
 * `Range.getBoundingClientRect()` on the text node, not the container's own box) lines up
 * with "Collections"'s own rendered text edge one level down (`SidebarGroup`'s `p-2` (8px)
 * plus `SidebarGroupLabel`'s own `px-2` (8px) puts that text 16px in from the sidebar's
 * edge — `SidebarGroupLabel`'s CONTAINER box sits at only 8px; measuring the container
 * instead of the text here was a bug in an earlier pass of this same change), and the
 * `ThemeToggle`'s right inset is set to match that SAME 16px, not this bar's 24px.
 *
 * Publishes its OWN measured rendered height as `--vex-topbar-h` on `document.documentElement`
 * (a `ResizeObserver` on the `<header>` itself, same pattern `DataTable.tsx` already uses for
 * `--vex-table-header-h`) — the single source any `position: fixed`/`position: absolute`
 * overlay that must start exactly at this bar's bottom border (`ListViewPeek`'s desktop
 * panel; not the mobile bottom-sheet shape, whose `top-10` is a deliberate decorative reveal
 * strip, unrelated to this bar's real height) reads via `top-[var(--vex-topbar-h,67px)]`,
 * instead of a hardcoded pixel guess that silently goes stale the next time this bar's own
 * height changes (measured regression: a prior height change left the peek's title row
 * clipped behind this bar until the hardcoded guess was manually, separately updated).
 *
 * @param props.activeSlug - The active collection/media-collection slug, `"collections"` for
 *   the collections-only index route, `"globals"` for any globals route, or `undefined` on
 *   the dashboard.
 * @param props.activeDocID - The active document id (edit routes) or global slug (global edit,
 *   same convention `adminHref`/`AppSidebar` already use), or `undefined` otherwise.
 * @returns The sticky top bar.
 */
export default function AdminTopNav(props: { activeSlug?: string; activeDocID?: string }) {
  const topbarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    const measure = () => document.documentElement.style.setProperty("--vex-topbar-h", `${el.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const config = useVexConfig();
  const side = config.admin.sidebar.side;
  const isLeft = side === "left";
  const isCollections = props.activeSlug === "collections";
  const isGlobals = props.activeSlug === "globals";
  const allCollections = config.collections.concat(config.mediaCollections);
  const activeCollection = allCollections.find((c) => c.slug === props.activeSlug);
  const activeGlobal =
    isGlobals && props.activeDocID
      ? config.globals.find((g) => g.slug === props.activeDocID)
      : undefined;
  const hasDocSlot = !!(activeCollection && props.activeDocID && !isGlobals);

  const baseCrumbs = buildBaseCrumbs({
    basePath: config.basePath,
    activeCollection,
    isCollections,
    isGlobals,
    activeGlobal,
  });
  const pageTitle = baseCrumbs.at(-1)?.label ?? "Admin";
  useEffect(() => {
    if (hasDocSlot) return;
    document.title = `${pageTitle} · Admin`;
  }, [pageTitle, hasDocSlot]);
  // The current query, appended to the sign-in return URL. Under a covering route (the
  // sign-in modal itself) the URL is the modal's — keep the admin page's own query.
  const frameworkComponents = useFrameworkComponents();
  const search = useLastUncoveredValue(frameworkComponents.useSearchParams?.().toString() ?? "");
  const currentHref = buildCurrentAdminHref({
    basePath: config.basePath,
    activeDocID: props.activeDocID,
    activeCollection,
    isCollections,
    isGlobals,
    search,
  });

  // Built FLAT, in logical order (Home → Collection → [Document]), exactly like the
  // pre-move implementation's own `crumbs.flatMap(...)` — then `.reverse()`d as ONE array
  // for a right-side sidebar (this must stay a single flat list of
  // individual link/divider items for `.reverse()` to put them in the same order the
  // original did; grouping the document crumb with its own divider into one nested unit
  // reverses differently). The last base crumb ("Collection") is only styled `isLast`
  // (active/orange) when there's no document crumb to take over that role.
  const items: ReactNode[] = baseCrumbs.flatMap((crumb, i) => {
    const link = (
      <CrumbLink key={crumb.key} crumb={crumb} isLast={!hasDocSlot && i === baseCrumbs.length - 1} />
    );
    return i === 0 ? [link] : [<Divider key={`div-${crumb.key}`} left={isLeft} size={18} />, link];
  });
  if (hasDocSlot) {
    items.push(
      <Divider key="div-doc" left={isLeft} size={18} />,
      <Suspense key="doc" fallback={<Skeleton className="h-4 w-20 rounded" />}>
        <AdminTopNavDocCrumb
          collection={activeCollection!}
          documentId={props.activeDocID!}
          basePath={config.basePath}
        />
      </Suspense>,
    );
  }
  const nav = isLeft ? items : items.slice().reverse();

  const crumbsEl = (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto text-lg" suppressHydrationWarning>
      {nav}
    </div>
  );

  return (
    <header ref={topbarRef} className="bg-background sticky top-0 z-100 flex min-h-[67px] shrink-0 items-center gap-2 border-b px-6">
      {side === "right" && <AuthControl currentHref={currentHref} />}
      {side === "right" && <CurrentUserDisplay className="ml-2" />}
      {side === "right" && <div className="flex-1" />}
      {side === "right" ? (
        <>
          <ViewSiteButton className="mr-2" />
          {crumbsEl}
          {/* `-mr-2`: the 32px icon button's 16px icon sits 8px inside its box — pulling the
              box out by that inset puts the visible ICON on the content column's edge, the way
              `AuthControl`'s bordered button already lines up on the opposite side. */}
          <SidebarTrigger side={side} size="icon" className="-mr-2 hover:text-primary/90 transition-colors duration-300" />
        </>
      ) : (
        <>
          {/* `-ml-2`: see the right-side branch above. */}
          <SidebarTrigger side={side} size="icon" className="-ml-2 hover:text-primary/90 transition-colors duration-300" />
          {crumbsEl}
          <ViewSiteButton className="ml-2" />
        </>
      )}
      {side !== "right" && <div className="flex-1" />}
      {side !== "right" && <CurrentUserDisplay className="mr-2" />}
      {side !== "right" && <AuthControl className="ml-2" currentHref={currentHref} />}
    </header>
  );
}
