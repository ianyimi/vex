"use client"

import type { BlockComponentProps } from "@vexcms/ui"

import { checkAdminAccess } from "@vexcms/core"
import { Menu, Settings, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useSession } from "~/auth/client"
import { buttonVariants } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import { access } from "~/vexcms/access"

export { headerBlock } from "./config"

export default function HeaderBlock({ block }: BlockComponentProps) {
  const {
    logoText,
    logoHref = "/",
    menuItems,
    actionButtons,
  } = block as {
    actionButtons?: Array<{ href: string; label: string; variant?: string }>
    logoHref?: string
    logoImage?: string
    logoText?: string
    menuItems?: Array<{ href: string; label: string }>
  }

  const { data: session } = useSession()
  let hasAdminAccess = false
  if (session?.user) {
    const userRoles = Array.isArray(session.user.role)
      ? (session.user.role as string[])
      : ([session.user.role].filter(Boolean) as string[])
    hasAdminAccess = checkAdminAccess({
      access,
      user: session.user,
      userRoles,
    })
  }

  const [menuState, setMenuState] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header>
      <nav className="fixed z-20 w-full px-2" data-state={menuState ? "active" : undefined}>
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled && "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <div className="flex items-center gap-3">
                <Link
                  aria-label="home"
                  className="flex items-center gap-2 text-lg font-semibold"
                  href={logoHref}
                >
                  {logoText ?? "Vex CMS"}
                </Link>
                {hasAdminAccess && (
                  <Link
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5 hidden lg:inline-flex")}
                    href="/admin"
                  >
                    <Settings className="size-3.5" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>

              <button
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                onClick={() => setMenuState(!menuState)}
              >
                <Menu className="m-auto size-6 duration-200 in-data-[state=active]:scale-0 in-data-[state=active]:rotate-180 in-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 scale-0 -rotate-180 opacity-0 duration-200 in-data-[state=active]:scale-100 in-data-[state=active]:rotate-0 in-data-[state=active]:opacity-100" />
              </button>

              <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                <ul className="flex gap-8 text-sm">
                  {(menuItems ?? []).map((item, index) => (
                    <li key={index}>
                      <Link
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        href={item.href}
                      >
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="hidden lg:flex lg:gap-3">
              {(actionButtons ?? []).map((button, index) => (
                <Link
                  className={cn(
                    buttonVariants({
                      size: "sm",
                      variant: (button.variant as "default" | "ghost" | "outline") ?? "default",
                    })
                  )}
                  href={button.href}
                  key={index}
                >
                  <span>{button.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile menu */}
            <div className="bg-background absolute top-[125%] z-10 mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 in-data-[state=active]:block md:flex-nowrap lg:m-0 lg:w-fit lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {(menuItems ?? []).map((item, index) => (
                    <li key={index}>
                      <Link
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        href={item.href}
                      >
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                {((actionButtons && actionButtons.length > 0) || hasAdminAccess) && (
                  <div className="mt-6 flex flex-col space-y-3">
                    {(actionButtons ?? []).map((button, index) => (
                      <Link
                        className={cn(
                          buttonVariants({
                            size: "sm",
                            variant:
                              (button.variant as "default" | "ghost" | "outline") ?? "default",
                          })
                        )}
                        href={button.href}
                        key={index}
                      >
                        <span>{button.label}</span>
                      </Link>
                    ))}
                    {hasAdminAccess && (
                      <Link
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" }),
                          "gap-1.5"
                        )}
                        href="/admin"
                      >
                        <Settings className="size-3.5" />
                        <span>Admin</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
