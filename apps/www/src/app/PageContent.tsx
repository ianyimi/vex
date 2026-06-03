"use client"
import Link from "next/link"

import type { Page, PageBlock } from "~/vex.types.ts"

/**
 * Props for the `PageContent` component.
 *
 * @example
 * ```tsx
 * <PageContent page={{ _id: "abc123", title: "About Us", slug: "about-us", blocks: [...] }} />
 * ```
 */
export interface PageContentProps {
  /** The page document to render. */
  page: Page;
}

/**
 * Renders a public-facing page with title and block-based content.
 *
 * Displays the page `title` as the heading and iterates over `page.blocks`
 * to render each section. Each block is dispatched to its own renderer
 * based on `blockType`.
 *
 * @param props.page - The page document to render.
 */
export default function PageContent({ page }: PageContentProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Admin link section */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <Link
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          href="/admin"
        >
          Go to Admin
        </Link>
      </section>

      {/* Hero section */}
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-32">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{page.title}</h1>
      </section>

      {/* Blocks content section */}
      {page.blocks && page.blocks.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-20">
          {page.blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </section>
      )}
    </main>
  )
}

/**
 * Dispatches a page block to its specific renderer based on `blockType`.
 *
 * Each block type (Hero, Feature, CTA, etc.) has its own rendering logic.
 * Unknown block types render a placeholder warning.
 *
 * @param block - A single block item from the page's blocks array.
 * @returns The rendered React node for this block.
 */
function BlockRenderer({ block }: { block: PageBlock }) {
  switch (block.blockType) {
    case "hero":
      return <HeroBlockRenderer block={block} />
    case "feature":
      return <FeatureBlockRenderer block={block} />
    case "cta":
      return <CtaBlockRenderer block={block} />
    case "testimonial":
      return <TestimonialBlockRenderer block={block} />
    case "stats":
      return <StatsBlockRenderer block={block} />
    case "logo-cloud":
      return <LogoCloudBlockRenderer block={block} />
    case "faq":
      return <FaqBlockRenderer block={block} />
    case "pricing":
      return <PricingBlockRenderer block={block} />
    case "content":
      return <ContentBlockRenderer block={block} />
    default:
      return (
        <div className="rounded-lg border border-dashed border-red-300 p-6 text-center text-sm text-muted-foreground">
          Unknown block type: <code className="font-mono text-xs">{(block as { blockType: string }).blockType}</code>
        </div>
      )
  }
}

/**
 * Renders a Hero block — big headline, subtitle, and CTA buttons.
 */
function HeroBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "hero" }> }) {
  return (
    <section className="py-16 text-center">
      {block.badge && (
        <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {block.badge}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{block.title}</h2>
      {block.subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{block.subtitle}</p>
      )}
      <div className="mt-8 flex justify-center gap-4">
        {block.primaryCtaLabel && (
          <Link
            href={block.primaryCtaHref ?? "#"}
            className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {block.primaryCtaLabel}
          </Link>
        )}
        {block.secondaryCtaLabel && (
          <Link
            href={block.secondaryCtaHref ?? "#"}
            className="inline-flex items-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            {block.secondaryCtaLabel}
          </Link>
        )}
      </div>
      {block.showImage && block.image && (
        <div className="mt-12">
          <img src={block.image} alt={block.title} className="mx-auto max-w-full rounded-lg" />
        </div>
      )}
    </section>
  )
}

/**
 * Renders a Feature block — single feature card with icon, title, and description.
 */
function FeatureBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "feature" }> }) {
  return (
    <section className="py-12">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {block.icon && <span className="mb-2 text-2xl">{block.icon}</span>}
        <h3 className="text-xl font-semibold">{block.title}</h3>
        {block.description && <p className="mt-2 text-muted-foreground">{block.description}</p>}
        {block.linkLabel && (
          <Link href={block.linkHref ?? "#"} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            {block.linkLabel} →
          </Link>
        )}
      </div>
    </section>
  )
}

/**
 * Renders a CTA block — call-to-action section with heading and button.
 */
function CtaBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "cta" }> }) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    ghost: "text-primary hover:bg-primary/10",
  }
  const buttonClass = variantClasses[(block.variant?.[0] ?? "default") as keyof typeof variantClasses] ?? variantClasses.default

  return (
    <section className="py-16 text-center">
      <h3 className="text-2xl font-bold">{block.title}</h3>
      {block.description && <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{block.description}</p>}
      {block.buttonLabel && (
        <Link
          href={block.buttonHref ?? "#"}
          className={`mt-6 inline-flex items-center rounded-md px-6 py-3 text-sm font-medium ${buttonClass}`}
        >
          {block.buttonLabel}
        </Link>
      )}
    </section>
  )
}

/**
 * Renders a Testimonial block — customer quote with author info.
 */
function TestimonialBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "testimonial" }> }) {
  return (
    <section className="py-12">
      <blockquote className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-lg italic">&ldquo;{block.quote}&rdquo;</p>
        <footer className="mt-4 flex items-center gap-3">
          {block.authorAvatar && (
            <img src={block.authorAvatar} alt={block.authorName} className="h-10 w-10 rounded-full" />
          )}
          <div>
            <cite className="not-italic font-semibold">{block.authorName}</cite>
            {block.authorRole && <p className="text-sm text-muted-foreground">{block.authorRole}</p>}
          </div>
        </footer>
      </blockquote>
    </section>
  )
}

/**
 * Renders a Stats block — row of key metrics.
 */
function StatsBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "stats" }> }) {
  return (
    <section className="py-16">
      {block.title && <h3 className="mb-8 text-center text-2xl font-bold">{block.title}</h3>}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {block.stats?.map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Renders a Logo Cloud block — grid of logos.
 */
function LogoCloudBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "logo-cloud" }> }) {
  return (
    <section className="py-12">
      {block.title && <h3 className="mb-6 text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">{block.title}</h3>}
      <div className="flex flex-wrap items-center justify-center gap-8">
        {block.logos?.map((logo: { name: string; image: string; link?: string }, i: number) => (
          logo.link ? (
            <a key={i} href={logo.link} target="_blank" rel="noopener noreferrer">
              <img src={logo.image} alt={logo.name} className="h-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0" />
            </a>
          ) : (
            <img key={i} src={logo.image} alt={logo.name} className="h-8 opacity-60 grayscale" />
          )
        ))}
      </div>
    </section>
  )
}

/**
 * Renders a FAQ block — accordion of questions and answers.
 */
function FaqBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "faq" }> }) {
  return (
    <section className="py-12">
      {block.title && <h3 className="mb-6 text-2xl font-bold">{block.title}</h3>}
      <div className="space-y-4">
        {block.questions?.map((q: { question: string; answer: string }, i: number) => (
          <details key={i} className="rounded-lg border bg-card p-4">
            <summary className="cursor-pointer font-semibold">{q.question}</summary>
            <p className="mt-2 text-muted-foreground">{q.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/**
 * Renders a Pricing block — pricing card with plan details and CTA.
 */
function PricingBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "pricing" }> }) {
  return (
    <section className="py-12">
      <div className={`rounded-lg border bg-card p-6 shadow-sm ${block.highlighted ? "border-primary ring-2 ring-primary/20" : ""}`}>
        {block.badge && (
          <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{block.badge}</span>
        )}
        <h3 className="text-xl font-bold">{block.planName}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold">{block.price}</span>
          {block.period && <span className="text-muted-foreground">{block.period}</span>}
        </div>
        {block.description && <p className="mt-2 text-sm text-muted-foreground">{block.description}</p>}
        {block.features && block.features.length > 0 && (
          <ul className="mt-6 space-y-2">
            {block.features.map((feature: string, i: number) => (
              <li key={i} className="text-sm">✓ {feature}</li>
            ))}
          </ul>
        )}
        {block.ctaLabel && (
          <Link
            href={block.ctaHref ?? "#"}
            className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-6 py-3 text-sm font-medium ${block.highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-input bg-background hover:bg-accent"}`}
          >
            {block.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  )
}

/**
 * Renders a Content block — free-form prose text.
 */
function ContentBlockRenderer({ block }: { block: Extract<PageBlock, { blockType: "content" }> }) {
  const alignClass = block.align?.[0] === "center" ? "text-center" : "text-left"
  const widthClass =
    block.maxWidth?.[0] === "full"
      ? "max-w-none"
      : block.maxWidth?.[0] === "wide"
        ? "max-w-4xl"
        : "max-w-2xl prose prose-neutral dark:prose-invert"

  return (
    <section className={`py-8 ${alignClass}`}>
      <div className={`mx-auto ${widthClass} whitespace-pre-line`}>{block.body}</div>
    </section>
  )
}
