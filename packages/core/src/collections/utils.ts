/**
 * Converts a collection slug to a PascalCase identifier for use in type names.
 *
 * Splits on underscores and hyphens and capitalizes each segment.
 *
 * @param props - Input props.
 * @param props.slug - The collection slug, e.g. `"blog_posts"`, `"authors"`.
 * @returns PascalCase string, e.g. `"BlogPosts"`, `"Authors"`.
 *
 * @example
 * ```ts
 * slugToPascalCase({ slug: "blog_posts" }) // → "BlogPosts"
 * slugToPascalCase({ slug: "authors" })    // → "Authors"
 */
export function slugToPascalCase(props: { slug: string }): string {
  return props.slug
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}
