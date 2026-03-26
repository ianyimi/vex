/**
 * Framework-agnostic site metadata object.
 * Consumers (Next.js, TanStack Start, etc.) map this to their framework's metadata format.
 */
export interface SiteMetadata {
  title: string;
  description: string;
  ogImage?: string;
  twitterHandle?: string;
}

/**
 * Build site metadata by merging site-wide defaults with per-page overrides.
 *
 * Resolution order (per-page wins over site-wide):
 * - title: page.metaTitle → page.title → site.metaTitle → site.name → "Untitled"
 * - description: page.metaDescription → site.metaDescription → site.description → ""
 * - ogImage: page.ogImage → site.ogImage → undefined
 * - twitterHandle: site.twitterHandle → undefined
 *
 * @param props.site - Site settings fields (from globals)
 * @param props.page - Optional per-page overrides
 * @param props.titleSuffix - Optional suffix appended to title (e.g. " | My Site")
 * @returns Framework-agnostic metadata object
 */
export function buildSiteMetadata(props: {
  site: {
    name?: string;
    metaTitle?: string;
    metaDescription?: string;
    description?: string;
    ogImage?: string;
    twitterHandle?: string;
  };
  page?: {
    title?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
  titleSuffix?: string;
}): SiteMetadata {
  const title =
    props.page?.metaTitle ||
    props.page?.title ||
    props.site.metaTitle ||
    props.site.name ||
    "Untitled";

  const description =
    props.page?.metaDescription ||
    props.site.metaDescription ||
    props.site.description ||
    "";

  const ogImage = props.page?.ogImage || props.site.ogImage || undefined;

  const twitterHandle = props.site.twitterHandle || undefined;

  // Append title suffix if provided, unless:
  // - The title already ends with the suffix
  // - The title equals the site name (avoids "My Site | My Site" on home page)
  let finalTitle = title;
  if (
    props.titleSuffix &&
    !title.endsWith(props.titleSuffix) &&
    title !== props.site.name
  ) {
    finalTitle = title + props.titleSuffix;
  }

  return {
    title: finalTitle,
    description,
    ogImage,
    twitterHandle,
  };
}
