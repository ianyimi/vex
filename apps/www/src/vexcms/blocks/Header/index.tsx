"use client"

import type { BlockComponentProps } from "@vexcms/react"

import {
  buttonVariants,
  cn,
  Separator,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  useCanAccessAdminPanel,
} from "@vexcms/react"
import { Menu, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import type { HeaderBlock } from "~/vex.types"

import { BrandMark } from "~/components/BrandMark"
import { Container } from "~/components/Container"
import { MediaImage } from "~/components/MediaImage"

export { headerBlock } from "./config"

/** Past this many nav items the bar would crowd at `md`, so the Sheet holds
 *  on until `lg`. The bar never wraps to two lines and never shrinks its type. */
const NAV_CROWD_THRESHOLD = 7

/** Scroll distance at which the bar takes its background and rule. */
const SCROLL_THRESHOLD = 8

/**
 * Site header — a rule that appears when you scroll.
 *
 * Transparent over the hero at rest; past 8px it takes
 * `bg-background/70 backdrop-blur-md` and a bottom border and loses 8px of
 * height. The scroll listener is passive and rAF-throttled, and is the only
 * scroll listener on the page.
 */
export default function HeaderBlockRenderer({ block }: BlockComponentProps) {
  const { actionButtons, logoHref, logoImage, logoText, menuItems } = block as HeaderBlock

  const pathname = usePathname()
  // Same predicate the `/admin` route runs server-side, so this link can never
  // offer a destination that redirects to `/unauthorized`. Reading a role off
  // the session by hand was the previous approach and never matched: roles are
  // stored in `access.userRolesField` ("roles"), not better-auth's scalar
  // `user.role`, so the button rendered for nobody.
  const canAccessAdmin = useCanAccessAdminPanel()

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const handleScroll = () => {
      if (frame) {return}
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setIsScrolled(window.scrollY > SCROLL_THRESHOLD)
      })
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  const items = menuItems ?? []
  const actions = actionButtons ?? []
  const isCrowded = items.length >= NAV_CROWD_THRESHOLD
  // The whole bar switches at one breakpoint: `md` normally, `lg` when the nav
  // is crowded. Tailwind needs both class sets written out literally.
  const navClass = isCrowded ? "hidden lg:flex" : "hidden md:flex"
  const triggerClass = isCrowded ? "lg:hidden" : "md:hidden"

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,height] duration-[180ms] ease-[var(--ease-emphasized)]",
        isScrolled
          ? "h-14 border-b border-border bg-background/70 backdrop-blur-md"
          : "h-14 border-b border-transparent md:h-16"
      )}
    >
      <Container className="flex h-full items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link
            aria-label={logoText ?? "Home"}
            className="flex shrink-0 items-center gap-2 text-foreground"
            href={logoHref ?? "/"}
          >
            {logoImage?.length ? (
              <MediaImage
                alt={logoText ?? ""}
                className="h-5 w-auto"
                height={20}
                value={logoImage}
                width={96}
              />
            ) : (
              <>
                <BrandMark className="size-4 text-primary" />
                {logoText ? (
                  <span className="text-[15px] font-extrabold tracking-[-0.03em]">{logoText}</span>
                ) : null}
              </>
            )}
          </Link>

          {items.length > 0 ? (
            <nav className={cn("items-center gap-1", navClass)}>
              {items.map((item) => {
                const isCurrent = pathname === item.href
                return (
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "rounded-sm px-2.5 py-1.5 text-sm transition-colors duration-[180ms] ease-[var(--ease-emphasized)] active:translate-y-px",
                      isCurrent
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    href={item.href}
                    key={`${item.label}-${item.href}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {actions.length > 0 ? (
            <div className={cn("items-center gap-2", navClass)}>
              {actions.map((action) => (
                <Link
                  className={cn(
                    buttonVariants({
                      size: "sm",
                      variant:
                        (action.variant?.[0]) ??
                        "default",
                    }),
                    "active:translate-y-px"
                  )}
                  href={action.href}
                  key={`${action.label}-${action.href}`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}

          {/* Template affordance, not part of the marketing design: a signed-in
              admin gets a direct route to the panel even when the seeded nav
              does not list one. */}
          {canAccessAdmin ? (
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                navClass,
                "gap-1.5 active:translate-y-px"
              )}
              href="/admin"
            >
              <Settings className="size-3.5" />
              Admin
            </Link>
          ) : null}

          {items.length > 0 || actions.length > 0 ? (
            <Sheet onOpenChange={setIsMenuOpen} open={isMenuOpen}>
              <SheetTrigger
                aria-label="Open menu"
                className={cn(buttonVariants({ size: "icon-sm", variant: "ghost" }), triggerClass)}
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent className="rounded-lg border-border bg-background" side="top">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav className="flex flex-col px-2 pt-2">
                  {items.map((item) => (
                    <Link
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-sm px-3 text-[15px] transition-colors duration-[180ms] active:translate-y-px",
                        pathname === item.href
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      href={item.href}
                      key={`sheet-${item.label}-${item.href}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {actions.length > 0 ? (
                  <>
                    <Separator className="my-4" />
                    <div className="flex flex-col gap-2 px-2 pb-2">
                      {actions.map((action) => (
                        <Link
                          className={cn(
                            buttonVariants({
                              size: "default",
                              variant:
                                (action.variant?.[0]) ?? "default",
                            }),
                            "w-full"
                          )}
                          href={action.href}
                          key={`sheet-${action.label}-${action.href}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </Container>
    </header>
  )
}
