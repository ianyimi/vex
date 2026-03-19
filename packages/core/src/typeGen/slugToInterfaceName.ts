/**
 * Convert a slug string to a PascalCase interface name.
 *
 * @param props.slug - The slug to convert (e.g., "blog-posts", "new_block", "media")
 * @returns PascalCase string (e.g., "BlogPosts", "NewBlock", "Media")
 */
export function slugToInterfaceName(props: { slug: string }): string {
  return props.slug
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
    .join("");
}
