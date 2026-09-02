import type { BlockComponentProps } from "@vexcms/react"

import { buttonVariants, cn } from "@vexcms/react"
import { icons } from "lucide-react"
import Link from "next/link"

import type { FooterBlock } from "~/vex.types"

import { BrandMark } from "~/components/BrandMark"
import { Container } from "~/components/Container"
import { MediaImage } from "~/components/MediaImage"

export { footerBlock } from "./config"

/**
 * Site footer — one rule, one row of links, one line of law.
 *
 * Deliberately not a four-column sitemap: `links` is a flat array with no
 * group field, so column headings would be content the CMS cannot store. A
 * single wrapping row is the shape the data actually has.
 */
export default function FooterBlockRenderer({ block }: BlockComponentProps) {
  const { copyright, links, logoImage, logoText, socialLinks } = block as FooterBlock

  const items = links ?? []
  const socials = socialLinks ?? []

  return (
    <footer className="py-12 md:py-14">
      <Container>
        <div
          className={cn(
            "flex flex-col items-start justify-between gap-8 md:flex-row md:gap-12",
            // The rule only exists to separate the links from the legal line.
            items.length > 0 && "border-b border-border pb-8"
          )}
        >
          <div className="flex shrink-0 items-center gap-2 text-foreground">
            {logoImage?.length ? (
              <MediaImage alt={logoText ?? ""} className="h-5 w-auto" height={20} value={logoImage} width={96} />
            ) : (
              <>
                <BrandMark className="size-4 text-primary" />
                {logoText ? (
                  <span className="text-[15px] font-extrabold tracking-[-0.03em]">{logoText}</span>
                ) : null}
              </>
            )}
          </div>

          {items.length > 0 ? (
            <ul className="grid w-full grid-cols-2 gap-x-7 gap-y-2 md:flex md:w-auto md:max-w-[640px] md:flex-wrap md:justify-end">
              {items.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link
                    className="text-sm text-muted-foreground transition-colors duration-[180ms] ease-[var(--ease-emphasized)] hover:text-foreground"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col items-start justify-between gap-5 pt-5 md:flex-row md:items-center">
          {copyright ? (
            <p className="text-[13px] text-muted-foreground">
              © {new Date().getFullYear()} {copyright}
            </p>
          ) : null}

          {socials.length > 0 ? (
            <ul className="flex items-center gap-2">
              {socials.map((social) => {
                // An unresolvable lucide name must not render an empty square —
                // fall back to the platform name as a text link.
                const Glyph = social.icon ? icons[social.icon as keyof typeof icons] : undefined
                return (
                  <li key={`${social.platform}-${social.href}`}>
                    <Link
                      aria-label={social.platform}
                      className={cn(
                        Glyph
                          ? cn(
                              buttonVariants({ size: "icon-sm", variant: "ghost" }),
                              "border border-border"
                            )
                          : "text-[13px] text-muted-foreground hover:text-foreground",
                        "transition-colors duration-[180ms] ease-[var(--ease-emphasized)] active:translate-y-px"
                      )}
                      href={social.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {Glyph ? <Glyph className="size-4" /> : social.platform}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </Container>
    </footer>
  )
}
