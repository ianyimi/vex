import { api } from "@convex/_generated/api";
import { notFound } from "next/navigation";

import { vex } from "~/lib/vex";

import { PostContent } from "./PostContent";

/**
 * One public post, resolved by slug.
 *
 * Dogfoods the `richtext` field end to end: `posts.body` is saved by the
 * Plate editor in the admin panel (`editor: plateEditor()` in
 * `vex.config.ts`) and rendered through `RichText` by `PostContent`, which
 * also subscribes to live preview so admin edits show up without a save.
 * Inline images need no URL resolution at render time — `useImageUpload.ts`
 * already stores the persisted media URL on each image node.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const initialData = await vex.query(api.posts.getBySlug, { slug });

  if (initialData.length === 0) {
    notFound();
  }

  return <PostContent initialData={initialData} slug={slug} />;
}
