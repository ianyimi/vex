import type { Metadata } from "next";

/**
 * Builds a Next.js `Metadata` object with unconditional title/description, a
 * conditional OG image, `metadataBase`, and a canonical link.
 *
 * Generalizes what Step 1 fixed by hand in `apps/www/src/lib/metadata.ts`:
 * title and description are set regardless of whether an OG image resolved —
 * only the `openGraph.images` entry is conditional on `props.imageUrl`. The
 * original gated the whole `openGraph` block on the image, so a page without
 * one published no OG title or description at all.
 *
 * This FORMATS metadata; it does not read Convex. Resolving which title and
 * description win is the caller's job, because only the caller knows the
 * page/site precedence rules.
 *
 * @param props - Metadata inputs.
 * @returns A `Metadata` object for a page's `generateMetadata` or static
 *   `metadata` export.
 */
export function vexMetadata(props: {
  description?: string;
  /** Absolute OG image URL. Omit to emit `openGraph` without an image. */
  imageUrl?: string;
  /** The page's path (e.g. `/about`), used for the canonical link. */
  path: string;
  /** The site's absolute origin, used for `metadataBase`. */
  siteUrl: string;
  title: string;
}): Metadata {
  return {
    alternates: { canonical: props.path },
    description: props.description,
    metadataBase: new URL(props.siteUrl),
    // `openGraph` is ALWAYS emitted. Gating the whole block on an image is the
    // defect Step 1 fixed in `apps/www/src/lib/metadata.ts`: a page with no
    // uploaded image published no `og:title` and no `og:description` at all.
    // Only `images` is conditional.
    openGraph: {
      description: props.description,
      title: props.title,
      ...(props.imageUrl === undefined || props.imageUrl === ""
        ? {}
        : { images: [{ url: props.imageUrl }] }),
    },
    title: props.title,
  };
}
