"use client";

import { buttonVariants, cn } from "@vexcms/react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "~/components/Container";

const TOUR_SHOTS = [
  {
    src: "/tour/dashboard.png",
    alt: "The admin panel's dashboard, listing every collection, the media collection and the site settings global.",
    caption: "Every collection and global, one click away.",
  },
  {
    src: "/tour/list-view.png",
    alt: "A collection list view with a saved view applied, showing sortable columns and pagination.",
    caption: "List view — search, sort, and saved views.",
  },
  {
    src: "/tour/edit-view-live-preview.png",
    alt: "A page's edit view beside a live preview of the rendered page.",
    caption: "Edit view — live preview of unsaved changes.",
  },
  {
    src: "/tour/media-library.png",
    alt: "The images media collection, listing each upload's alt text, type, size and storage.",
    caption: "Media — every upload in its own collection.",
  },
] as const;

/**
 * The tour's body: heading, the four admin screenshots and two next-step
 * links. A client component because `cn`/`buttonVariants` (and `Container`,
 * which calls `cn`) ship from `@vexcms/react`'s client bundle and can't be
 * called while the page renders on the server. It still prerenders to static
 * HTML at build time and reads nothing from Convex.
 */
export function TourContent() {
  return (
    <main id="main">
      <Container className="py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">See the admin panel</h1>
        <p className="mt-4 max-w-[46rem] text-muted-foreground">
          The live demo is temporarily unavailable. These screenshots show the same admin panel it
          runs.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {TOUR_SHOTS.map((shot, index) => (
            <figure key={shot.src}>
              <Image
                alt={shot.alt}
                className="h-auto w-full rounded-lg border"
                height={800}
                priority={index === 0}
                sizes="(min-width: 640px) 50vw, 100vw"
                src={shot.src}
                width={1280}
              />
              <figcaption className="mt-2 text-sm text-muted-foreground">{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className={cn(buttonVariants({ variant: "default" }))}
            href="https://docs.vexcms.dev/guides/quickstart/"
          >
            Read the quickstart
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="https://github.com/ianyimi/vex"
          >
            View on GitHub
          </Link>
        </div>
      </Container>
    </main>
  );
}
